import {configuration,authenticate,createSession,validateSession,createCsrf,validateCsrf,getCookie,cookie,sameOrigin,consumeAttempt,COOKIE,CSRF_COOKIE,TTL} from './auth';
import {login,shell,responseHeaders} from './ui';
import {bootstrap,overview,list,lookup,receipt,command,Failure,failureResponse} from './service';
import {configuration as studyConfiguration,createSession as studySession,cookie as studyCookie,SESSION_COOKIE,SESSION_SECONDS} from '../estudos/security';
import {openStudy} from '../estudos/vault';
import {boundedRequest as bounded} from './io';
type Context={params:Promise<{path?:string[]}>};
function json(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:responseHeaders('','application/json; charset=utf-8')});}
function redirect(path:string,headers=responseHeaders()){headers.set('Location',path);return new Response(null,{status:303,headers});}
function failure(error:unknown){const r=failureResponse(error),h=responseHeaders('','application/json; charset=utf-8');h.set('X-Request-ID',r.body.request_id);return new Response(JSON.stringify(r.body),{status:r.status,headers:h});}
export async function GET(req:Request,context:Context):Promise<Response>{
 try{
  const c=configuration(),p=(await context.params).path??[],a=validateSession(getCookie(req,COOKIE),c),url=new URL(req.url);
  if(!a){if(p[0]==='api')return json({error:'AUTH_REQUIRED'},401);const old=getCookie(req,CSRF_COOKIE),token=validateCsrf(old,old,c)?old:createCsrf(c),html=login(token),h=responseHeaders(html);h.append('Set-Cookie',cookie(CSRF_COOKIE,token,1800));return new Response(html,{status:200,headers:h});}
  if(!p.length){const prior=getCookie(req,CSRF_COOKIE),token=validateCsrf(prior,prior,c,a.id)?prior:createCsrf(c,a.id),html=shell(token),h=responseHeaders(html);h.append('Set-Cookie',cookie(CSRF_COOKIE,token,1800));return new Response(html,{headers:h});}
  if(p.length===2&&p[0]==='api'){
   for(const key of ['tenant','resource','before','before_id','query','command'])if(url.searchParams.getAll(key).length>1)throw new Failure('QUERY_INVALID',400);
   if(p[1]==='bootstrap')return json(bootstrap(a,c));
   if(p[1]==='lookup')return json(await lookup(a,url.searchParams.get('tenant')??'',url.searchParams.get('resource')??'',url.searchParams.get('query')??''));
   if(p[1]==='receipt')return json(await receipt(a,url.searchParams.get('tenant')??'',url.searchParams.get('command')??''));
   if(p[1]==='overview')return json(await overview(a,url.searchParams.get('tenant')??''));
   if(p[1]==='list')return json(await list(a,url.searchParams.get('tenant')??'',url.searchParams.get('resource')??'',url.searchParams.get('before'),url.searchParams.get('before_id')));
  }
  if(['login','logout','abrir-estudo'].includes(p[0])&&p.length===1)return redirect('/allinone');
  return json({error:'NOT_FOUND'},404);
 }catch(error){if(error instanceof Failure)return failure(error);const html=login('','Central temporariamente indisponível. Nenhum conteúdo administrativo foi liberado.',true);return new Response(html,{status:503,headers:responseHeaders(html)});}
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
   const text=await bounded(req);let input:unknown;try{input=JSON.parse(text);}catch{throw new Failure('BODY_INVALID',400);}
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
 }catch(error){return failure(error);}
}
export async function HEAD(req:Request,context:Context){const r=await GET(req,context);return new Response(null,{status:r.status,headers:r.headers});}
