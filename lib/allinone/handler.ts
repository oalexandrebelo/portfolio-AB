import {configuration,authenticate,createSession,validateSession,createCsrf,validateCsrf,getCookie,cookie,sameOrigin,consumeAttempt,COOKIE,CSRF_COOKIE,TTL} from './auth';
import {login,shell,responseHeaders} from './ui';
import {bootstrap,overview,list,command,Failure,failureResponse} from './service';
import {configuration as studyConfiguration,createSession as studySession,cookie as studyCookie,SESSION_COOKIE,SESSION_SECONDS} from '../estudos/security';
import {openStudy} from '../estudos/vault';
type Context={params:Promise<{path?:string[]}>};
function json(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:responseHeaders('','application/json; charset=utf-8')});}
function redirect(path:string,headers=responseHeaders()){headers.set('Location',path);return new Response(null,{status:303,headers});}
async function bounded(req:Request,max=16384){const length=req.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>max))throw new Failure('BODY_LIMIT',413);const reader=req.body?.getReader();if(!reader)throw new Failure('BODY_INVALID',400);let n=0;const chunks:Uint8Array[]=[];try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>max){await reader.cancel();throw new Failure('BODY_LIMIT',413);}chunks.push(r.value);}}finally{reader.releaseLock();}return Buffer.concat(chunks).toString('utf8');}
export async function GET(req:Request,context:Context):Promise<Response>{
 try{
  const c=configuration(),p=(await context.params).path??[],a=validateSession(getCookie(req,COOKIE),c),url=new URL(req.url);
  if(!a){if(p[0]==='api')return json({error:'AUTH_REQUIRED'},401);const old=getCookie(req,CSRF_COOKIE),token=validateCsrf(old,old,c)?old:createCsrf(c),html=login(token),h=responseHeaders(html);h.append('Set-Cookie',cookie(CSRF_COOKIE,token,1800));return new Response(html,{status:200,headers:h});}
  if(!p.length){const token=createCsrf(c,a.id),html=shell(token),h=responseHeaders(html);h.append('Set-Cookie',cookie(CSRF_COOKIE,token,1800));return new Response(html,{headers:h});}
  if(p.length===2&&p[0]==='api'){
   if(p[1]==='bootstrap')return json(bootstrap(a,c));
   if(p[1]==='overview')return json(await overview(a,url.searchParams.get('tenant')??''));
   if(p[1]==='list')return json(await list(a,url.searchParams.get('tenant')??'',url.searchParams.get('resource')??'',url.searchParams.get('before'),url.searchParams.get('before_id')));
  }
  if(['login','logout','abrir-estudo'].includes(p[0])&&p.length===1)return redirect('/allinone');
  return json({error:'NOT_FOUND'},404);
 }catch(error){if(error instanceof Failure){const r=failureResponse(error);return json(r.body,r.status);}const html=login('','Central temporariamente indisponível. Nenhum conteúdo administrativo foi liberado.',true);return new Response(html,{status:503,headers:responseHeaders(html)});}
}
export async function POST(req:Request,context:Context):Promise<Response>{
 try{
  const c=configuration(),p=(await context.params).path??[],a=validateSession(getCookie(req,COOKIE),c),type=req.headers.get('content-type')??'';
  if(p.length===1&&p[0]==='login'){
   if(!consumeAttempt(req,c)){const token=createCsrf(c),html=login(token,'Muitas tentativas. Aguarde um minuto.'),h=responseHeaders(html);h.set('Retry-After','60');h.append('Set-Cookie',cookie(CSRF_COOKIE,token,1800));return new Response(html,{status:429,headers:h});}
   if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(type))throw new Failure('BODY_INVALID',400);
   const f=new URLSearchParams(await bounded(req,2048)),valid=f.getAll('csrf').length===1&&validateCsrf(f.get('csrf')??'',getCookie(req,CSRF_COOKIE),c);
   const denied=(message:string,status:number)=>{const t=createCsrf(c),html=login(t,message),h=responseHeaders(html);h.append('Set-Cookie',cookie(CSRF_COOKIE,t,1800));return new Response(html,{status,headers:h});};
   if(!valid||!sameOrigin(req,valid))return denied('A página expirou ou a origem não é autorizada. Use este formulário novamente.',403);
   if(f.getAll('code').length!==1)return denied('Informe uma credencial administrativa válida.',400);
   const admin=await authenticate((f.get('code')??'').trim(),c);if(!admin)return denied('Credencial administrativa inválida. Senhas de estudos não abrem a gestão.',401);
   const h=responseHeaders();h.append('Set-Cookie',cookie(COOKIE,createSession(admin,c),TTL));h.append('Set-Cookie',cookie(CSRF_COOKIE,'',0));return redirect('/allinone',h);
  }
  if(!a)throw new Failure('AUTH_REQUIRED',401);
  if(p.length===2&&p[0]==='api'&&p[1]==='command'){
   const token=req.headers.get('x-csrf-token')??'',valid=validateCsrf(token,getCookie(req,CSRF_COOKIE),c,a.id);
   if(!valid||!sameOrigin(req,valid))throw new Failure('CSRF_EXPIRED',403);
   if(!/^application\/json(?:;|$)/i.test(type))throw new Failure('BODY_INVALID',400);
   let input:unknown;try{input=JSON.parse(await bounded(req));}catch{throw new Failure('BODY_INVALID',400);}
   return json(await command(a,input,req.headers.get('idempotency-key')??''));
  }
  if(p.length===1&&['logout','abrir-estudo'].includes(p[0])){
   if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(type))throw new Failure('BODY_INVALID',400);
   const f=new URLSearchParams(await bounded(req,2048)),valid=f.getAll('csrf').length===1&&validateCsrf(f.get('csrf')??'',getCookie(req,CSRF_COOKIE),c,a.id);
   if(!valid||!sameOrigin(req,valid))throw new Failure('CSRF_EXPIRED',403);
   if(p[0]==='logout'){const h=responseHeaders();h.append('Set-Cookie',cookie(COOKIE,'',0));h.append('Set-Cookie',cookie(CSRF_COOKIE,'',0));return redirect('/allinone',h);}
   const slug=f.get('slug')??'';if(f.getAll('slug').length!==1||!a.studies.includes(slug))throw new Failure('ACCESS_DENIED',403);
   const sr=studyConfiguration(),e=sr.studies.find(x=>x.slug===slug&&x.enabled);if(!e)throw new Failure('STUDY_UNAVAILABLE',404);openStudy(e);
   const h=responseHeaders();h.append('Set-Cookie',studyCookie(SESSION_COOKIE,studySession(e,sr),SESSION_SECONDS));return redirect('/estudos/'+e.slug,h);
  }
  return json({error:'METHOD_NOT_ALLOWED'},405);
 }catch(error){const r=failureResponse(error);return json(r.body,r.status);}
}
export async function HEAD(req:Request,context:Context){const r=await GET(req,context);return new Response(null,{status:r.status,headers:r.headers});}
