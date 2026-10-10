/* Teste local do código real. Não conecta a produção nem injeta segredos de usuário. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const https=require('node:https');
const {execFileSync}=require('node:child_process');
const {randomBytes,randomUUID,scryptSync}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const auth=require('../.allinone-test/lib/allinone/auth.js');
const handler=require('../.allinone-test/lib/allinone/handler.js');
const canonical='https://alexandrebelo.com.br';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aio-browser-'));
const output=process.env.AIO_TEST_OUTPUT||path.join(os.tmpdir(),'aio-browser-evidence');
const saved={...process.env};
let browser,server,origin;const passed=[],errors=[];
function check(value,label){assert.ok(value,label);passed.push(label);}
async function main(){
 const code=randomBytes(32).toString('base64url'),salt=randomBytes(16).toString('hex');
 const admin={id:'20000000-0000-4000-8000-000000000001',name:'AB · validação local',salt,hash:scryptSync(code,salt,32).toString('hex'),role:'owner',tenants:['10000000-0000-4000-8000-000000000001'],studies:['sinop']};
 process.env.AB_ALLINONE_AUTH=JSON.stringify({version:1,sessionKey:randomBytes(32).toString('hex'),admins:[admin],tenants:[{id:admin.tenants[0],key:'TEST',label:'Organização de teste'}]});
 process.env.AB_ALLINONE_INVENTORY=JSON.stringify({schema:1,capturedAt:new Date().toISOString(),scope:'Fixture de interface local contendo apenas o repositório público desta aplicação; não é inventário de produção.',assets:[{name:'portfolio-AB',provider:'repository',external_id:'1014925106',reference:'https://github.com/oalexandrebelo/portfolio-AB',branch:'main',visibility:'public'}]});
 delete process.env.AB_ALLINONE_SUPABASE_URL;delete process.env.AB_ALLINONE_SERVICE_KEY;
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(tmp,'key.pem'),'-out',path.join(tmp,'cert.pem'),'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
 server=https.createServer({key:fs.readFileSync(path.join(tmp,'key.pem')),cert:fs.readFileSync(path.join(tmp,'cert.pem'))},async(req,res)=>{
  try{
   const u=new URL(req.url,origin);
   const assets={'/allinone-assets/state.js':['public/allinone-assets/state.js','text/javascript'],'/allinone-assets/app.js':['public/allinone-assets/app.js','text/javascript'],'/allinone-assets/app.css':['public/allinone-assets/app.css','text/css']};
   if(assets[u.pathname]){const [file,type]=assets[u.pathname];res.writeHead(200,{'content-type':type});res.end(fs.readFileSync(file));return;}
   if(!u.pathname.startsWith('/allinone')){res.writeHead(404);res.end();return;}
   const headers=new Headers();for(const [k,v] of Object.entries(req.headers)){if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);}
   // Adaptação do endereço do servidor local de teste; a autorização continua no handler real.
   if(headers.get('origin')===origin)headers.set('origin',canonical);
   if(headers.get('referer')?.startsWith(origin+'/'))headers.set('referer',canonical+headers.get('referer').slice(origin.length));
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request(canonical+u.pathname+u.search,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
   const context={params:Promise.resolve({path:u.pathname.slice('/allinone'.length).split('/').filter(Boolean)})};
   const action=handler[req.method];const response=action?await action(request,context):new Response(null,{status:405});
   res.statusCode=response.status;for(const [key,value] of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
   const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
   res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){res.writeHead(500,{'content-type':'text/plain'});res.end('TEST_SERVER_ERROR');console.error(error.message);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='https://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1500,height:1100}});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/status of (401|403|503)/.test(m.text()))errors.push(m.text());});
 check((await context.request.get(origin+'/allinone/api/bootstrap')).status()===401,'API anônima negada');
 await page.goto(origin+'/allinone');check(await page.locator('#code').count()===1,'Formulário administrativo sem dados privados');
 await page.locator('#code').fill('estudo-invalido-nao-e-admin-123456');
 let post=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'),page.locator('button[type=submit]').click()]);check(post[0].status()===401,'Código desconhecido não autoriza gestão');
 await page.locator('#code').fill(code);post=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'),page.locator('button[type=submit]').click()]);check(post[0].status()===303,'Credencial administrativa cria sessão');
 await page.locator('[data-view=inventory]').waitFor();await page.waitForTimeout(200);
 check((await page.locator('#notice').innerText()).includes('não conectado'),'Ausência de banco explícita');
 const cookies=await context.cookies(),session=cookies.find(c=>c.name===auth.COOKIE);check(session?.httpOnly&&session.secure,'Cookie Secure HttpOnly');check(!cookies.some(c=>c.name==='__Host-ab_study'),'Sessões de estudos não são reutilizadas');
 for(const view of ['central','inventory','projects','tasks','studies','clients','deals','ledger_entries','domains','harness_runs','llm_usage','affiliate_events','documents','integrations','audit_log','reconciliation']){
  await page.locator('[data-view='+view+']').click();await page.waitForTimeout(40);check((await page.locator('#content').innerText()).length>100,'Módulo renderizado: '+view);
 }
 await page.locator('[data-view=inventory]').click();await page.locator('#search').fill('portfolio');check(await page.locator('tbody tr').count()===1,'Busca usa o catálogo recebido');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=export-inventory]').click()]);check(download.suggestedFilename().endsWith('.json'),'Exportação de inventário');
 await page.locator('[data-view=projects]').click();check(await page.locator('[data-action=new]').isDisabled(),'Gravação indisponível não oferece falso sucesso');
 const originalCsrf=await page.locator('meta[name=aio-csrf]').getAttribute('content');const second=await context.newPage();await second.goto(origin+'/allinone');check(await second.locator('meta[name=aio-csrf]').getAttribute('content')===originalCsrf,'Abrir outra aba preserva CSRF válido');await second.close();
 const denied=await context.request.post(origin+'/allinone/api/command',{headers:{origin,'x-csrf-token':originalCsrf,'idempotency-key':randomUUID()},data:{tenant_id:admin.tenants[0],resource:'projects',data:{name:'Não deve ser salvo'}}});
 check(denied.status()===503,'Comando real sem banco retorna indisponibilidade');
 await page.locator('[data-view=central]').click();await page.waitForTimeout(100);fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'central-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Sem overflow horizontal no celular');
 await page.locator('#mobile-nav').click();check(await page.locator('#mobile-nav').getAttribute('aria-expanded')==='true','Menu móvel abre');await page.locator('[data-view=integrations]').click();check(!await page.locator('body').evaluate(e=>e.classList.contains('nav-open')),'Menu móvel fecha ao navegar');
 await page.screenshot({path:path.join(output,'integracoes-mobile.png'),fullPage:true});
 await page.setViewportSize({width:1500,height:1100});const logout=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'),page.locator('form[action="/allinone/logout"] button').click()]);check(logout[0].status()===303,'Encerramento de sessão');check((await context.request.get(origin+'/allinone/api/bootstrap')).status()===401,'API bloqueada após sair');
 check(errors.length===0,'Sem erro de execução ou CSP na interface');
 const report={suite:'AB-ALLinONE/browser',at:new Date().toISOString(),mode:'local HTTPS; código real; credencial e organização efêmeras; banco administrativo desconectado',checks:passed.length,passed,errors};fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(e=>{console.error('ALLINONE_BROWSER_FAILED:',e.message);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(tmp,{recursive:true,force:true});for(const k of ['AB_ALLINONE_AUTH','AB_ALLINONE_SUPABASE_URL','AB_ALLINONE_SERVICE_KEY','AB_ALLINONE_INVENTORY']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}});
