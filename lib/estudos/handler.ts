import {enhanceDashboard,mapResponse} from './map';
import {authenticate,boundedForm,configuration,consumeAttempt,cookie,cookieValue,createCsrf,createSession,CSRF_COOKIE,responseHeaders,sameOrigin,SESSION_COOKIE,SESSION_SECONDS,validateCsrf,validateSession} from "./security";
import type {Registry} from "./security";
import {gateway} from "./ui";
import {openStudy} from "./vault";
type Context={params:Promise<{path?:string[]}>};
function unavailable():Response {const html=gateway("","O acesso está temporariamente indisponível.",true);return new Response(html,{status:503,headers:responseHeaders(html)});}
function redirect(path:string,headers=responseHeaders()):Response{headers.set("Location",path);return new Response(null,{status:303,headers});}
function accessPage(request:Request,r:Registry,status=200,message="",retry=0):Response{
 // Outra aba não deve invalidar um formulário ainda válido.
 const old=cookieValue(request,CSRF_COOKIE),token=validateCsrf(old,old,r)?old:createCsrf(r);
 const html=gateway(token,message),headers=responseHeaders(html);
 headers.append("Set-Cookie",cookie(CSRF_COOKIE,token,1200));
 if(retry)headers.set("Retry-After",String(retry));
 return new Response(html,{status,headers});
}
export async function GET(request:Request,context:Context):Promise<Response>{
 try{
  const r=configuration(),path=(await context.params).path??[],session=validateSession(cookieValue(request,SESSION_COOKIE),r);
  if(path.length===1&&["acessar","sair"].includes(path[0]))return redirect("/estudos");
  if(!path.length&&session)return redirect("/estudos/"+session.slug);
  if(path.length>=1&&path.length<=2&&session&&session.slug===path[0]){
   const variant=path[1]??"";
   if(variant==="mapa"&&session.slug==="sinop")return mapResponse(session.slug);
   if(["","relatorio","estudo.md","painel.html"].includes(variant)){
    const b=openStudy(session),body=variant==="relatorio"?b.report:variant==="estudo.md"?b.markdown:variant===""?enhanceDashboard(b.dashboard,session.slug):b.dashboard,headers=responseHeaders(variant==="estudo.md"?undefined:body);
    if(variant==="")headers.set("Content-Security-Policy",(headers.get("Content-Security-Policy")??"").replace("frame-src 'none'","frame-src 'self'"));
    if(variant==="estudo.md"){headers.set("Content-Type","text/markdown; charset=utf-8");headers.set("Content-Disposition",`attachment; filename="AB_estudo_${session.slug}.md"`);}
    if(variant==="painel.html")headers.set("Content-Disposition",`attachment; filename="AB_estudo_${session.slug}_interativo.html"`);
    return new Response(body,{status:200,headers});
   }
  }
  // Não enumera projetos: qualquer link sem autorização mostra o mesmo formulário.
  return accessPage(request,r,path.length?401:200);
 }catch{console.error("estudos: indisponivel; verificar configuracao e integridade");return unavailable();}
}
export async function POST(request:Request,context:Context):Promise<Response>{
 try{
  const r=configuration(),path=(await context.params).path??[];
  if(path.length===1&&path[0]==="sair"){
   const session=validateSession(cookieValue(request,SESSION_COOKIE),r);
   if(!sameOrigin(request,!!session))return accessPage(request,r,403,"Abra a tela de acesso novamente para encerrar a sessão.");
   const headers=responseHeaders();headers.append("Set-Cookie",cookie(SESSION_COOKIE,"",0));headers.append("Set-Cookie",cookie(CSRF_COOKIE,"",0));return redirect("/estudos",headers);
  }
  if(path.length!==1||path[0]!=="acessar")return accessPage(request,r,405,"Abra a tela de acesso e informe a senha recebida.");
  if(!consumeAttempt(request,r))return accessPage(request,r,429,"Muitas tentativas. Aguarde um minuto antes de tentar novamente.",60);
  let form:URLSearchParams;try{form=await boundedForm(request);}catch{return accessPage(request,r,400,"Solicitação inválida. Cole a senha na tela de acesso.");}
  const csrfVerified=form.getAll("csrf").length===1&&form.getAll("password").length===1&&validateCsrf(form.get("csrf")??"",cookieValue(request,CSRF_COOKIE),r);
  // Formulários com no-referrer enviam Origin: null. Só aceitar com desafio assinado válido.
  if(!sameOrigin(request,csrfVerified))return accessPage(request,r,403,"A tela de acesso expirou ou a origem não foi reconhecida. Recarregue esta página e tente novamente.");
  if(!csrfVerified)return accessPage(request,r,403,"A tela de acesso expirou. Insira sua senha novamente.");
  const e=authenticate((form.get("password")??"").trim(),r);
  if(!e)return accessPage(request,r,401,"Senha inválida ou acesso indisponível. Confira a senha recebida.");
  openStudy(e);
  const headers=responseHeaders();headers.append("Set-Cookie",cookie(SESSION_COOKIE,createSession(e,r),SESSION_SECONDS));headers.append("Set-Cookie",cookie(CSRF_COOKIE,"",0));
  // O destino vem exclusivamente da credencial, nunca de um parâmetro enviado pelo navegador.
  return redirect("/estudos/"+e.slug,headers);
 }catch{console.error("estudos: validacao indisponivel; nenhum conteudo liberado");return unavailable();}
}
export async function HEAD(request:Request,context:Context):Promise<Response>{const r=await GET(request,context);return new Response(null,{status:r.status,headers:r.headers});}
