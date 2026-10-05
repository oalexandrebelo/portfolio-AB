import {authenticate,boundedForm,configuration,consumeAttempt,cookie,cookieValue,createCsrf,createSession,CSRF_COOKIE,responseHeaders,sameOrigin,SESSION_COOKIE,SESSION_SECONDS,validateCsrf,validateSession} from "./security";
import {gateway} from "./ui";
import {openStudy} from "./vault";
import {distributedAttempt} from "./storage";
type Context={params:Promise<{path?:string[]}>};
function unavailable():Response {const html=gateway("","O acesso está temporariamente indisponível.",true);return new Response(html,{status:503,headers:responseHeaders(html)});}
function redirect(path:string,headers=responseHeaders()):Response{headers.set("Location",path);return new Response(null,{status:303,headers});}
export async function GET(request:Request,context:Context):Promise<Response>{
 try{
  const r=configuration(),path=(await context.params).path??[],session=validateSession(cookieValue(request,SESSION_COOKIE),r);
  if(!path.length&&session)return redirect("/estudos/"+session.slug);
  if(path.length>=1&&path.length<=2&&session&&session.slug===path[0]){
   const variant=path[1]??"";
   if(["","relatorio","estudo.md","painel.html"].includes(variant)){
    const b=openStudy(session),body=variant==="relatorio"?b.report:variant==="estudo.md"?b.markdown:b.dashboard,headers=responseHeaders(variant==="estudo.md"?undefined:body);
    if(variant==="estudo.md"){headers.set("Content-Type","text/markdown; charset=utf-8");headers.set("Content-Disposition",`attachment; filename="AB_estudo_${session.slug}.md"`);}
    if(variant==="painel.html")headers.set("Content-Disposition",`attachment; filename="AB_estudo_${session.slug}_interativo.html"`);
    return new Response(body,{status:200,headers});
   }
  }
  // Mesma tela para nome inexistente ou estudo não autorizado: não enumera o catálogo.
  const token=createCsrf(r),html=gateway(token),headers=responseHeaders(html);headers.append("Set-Cookie",cookie(CSRF_COOKIE,token,1200));
  return new Response(html,{status:path.length?401:200,headers});
 }catch{console.error("estudos: indisponivel; verificar configuracao e integridade");return unavailable();}
}
export async function POST(request:Request,context:Context):Promise<Response>{
 if(!sameOrigin(request))return new Response("Solicitação não autorizada.",{status:403,headers:responseHeaders()});
 const path=(await context.params).path??[];
 if(path.length===1&&path[0]==="sair"){const headers=responseHeaders();headers.append("Set-Cookie",cookie(SESSION_COOKIE,"",0));headers.append("Set-Cookie",cookie(CSRF_COOKIE,"",0));return redirect("/estudos",headers);}
 if(path.length!==1||path[0]!=="acessar")return new Response("Método não permitido.",{status:405,headers:responseHeaders()});
 try{
  const r=configuration();
  const denied=(status:number,message:string,retry=0)=>{const token=createCsrf(r),html=gateway(token,message),headers=responseHeaders(html);headers.append("Set-Cookie",cookie(CSRF_COOKIE,token,1200));if(retry)headers.set("Retry-After",String(retry));return new Response(html,{status,headers});};
  if(!consumeAttempt(request,r))return denied(429,"Muitas tentativas. Aguarde um minuto antes de tentar novamente.",60);
  let form:URLSearchParams;try{form=await boundedForm(request);}catch{return new Response("Solicitação inválida.",{status:400,headers:responseHeaders()});}
  if(form.getAll("csrf").length!==1||form.getAll("password").length!==1||!validateCsrf(form.get("csrf")??"",cookieValue(request,CSRF_COOKIE),r))return denied(403,"A tela de acesso expirou. Insira sua senha novamente.");
  const attempt=await distributedAttempt(request,r);if(!attempt.allowed)return denied(429,"Muitas tentativas. Aguarde alguns segundos antes de tentar novamente.",attempt.retryAfter);
  const e=authenticate((form.get("password")??"").trim(),r);if(!e)return denied(401,"Senha inválida ou acesso indisponível. Confira a senha recebida.");
  openStudy(e);const headers=responseHeaders();headers.append("Set-Cookie",cookie(SESSION_COOKIE,createSession(e,r),SESSION_SECONDS));headers.append("Set-Cookie",cookie(CSRF_COOKIE,"",0));return redirect("/estudos/"+e.slug,headers);
 }catch{console.error("estudos: validacao indisponivel; nenhum conteudo liberado");return unavailable();}
}
export async function HEAD(request:Request,context:Context):Promise<Response>{const r=await GET(request,context);return new Response(null,{status:r.status,headers:r.headers});}
