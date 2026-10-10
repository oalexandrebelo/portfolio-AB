/* Ensaio Chromium → HTTPS → handlers reais → HTTPS → PostgREST → PostgreSQL.
 * Credenciais e registros são efêmeros de teste; não acessa produção.
 */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const https=require('node:https'),http=require('node:http');
const {fork,spawn,execFileSync}=require('node:child_process');
const {randomUUID,randomBytes,scryptSync,createHmac}=require('node:crypto');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),canonical='https://alexandrebelo.com.br';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function listen(server){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));}
function close(server){if(!server)return Promise.resolve();server.closeAllConnections?.();return new Promise(r=>server.close(r));}
async function child(){
 const {GET,POST,HEAD}=require('../.allinone-test/lib/allinone/handler.js');let origin;
 const server=https.createServer({key:fs.readFileSync(process.env.AIO_TEST_TLS_KEY),cert:fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS)},async(req,res)=>{
  try{
   const u=new URL(req.url,origin);
   const assets={'/allinone-assets/app.js':['app.js','text/javascript'],'/allinone-assets/state.js':['state.js','text/javascript'],'/allinone-assets/app.css':['app.css','text/css']};
   if(assets[u.pathname]){const [file,type]=assets[u.pathname];res.writeHead(200,{'content-type':type});res.end(fs.readFileSync(path.join(root,'public/allinone-assets',file)));return;}
   if(u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
   const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
   // Única adaptação do host local; CSRF, cookies e autorização continuam no código real.
   if(headers.get('origin')===origin)headers.set('origin',canonical);
   if(headers.get('referer')?.startsWith(origin+'/'))headers.set('referer',canonical+headers.get('referer').slice(origin.length));
   const chunks=[];for await(const c of req)chunks.push(c);
   const request=new Request(canonical+u.pathname+u.search,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
   const action={GET,POST,HEAD}[req.method],ctx={params:Promise.resolve({path:u.pathname.slice('/allinone'.length).split('/').filter(Boolean)})};
   const result=action?await action(request,ctx):new Response(null,{status:405});
   res.statusCode=result.status;for(const [k,v] of result.headers)if(k!=='set-cookie')res.setHeader(k,v);
   res.setHeader('set-cookie',result.headers.getSetCookie());res.end(Buffer.from(await result.arrayBuffer()));
  }catch{res.writeHead(500,{'content-type':'application/json'});res.end('{"error":"TEST_SERVER_FAILURE"}');}
 });
 origin='https://127.0.0.1:'+await listen(server);process.send({origin});
 process.on('message',async m=>{if(m==='stop'){await close(server);process.exit(0);}});
}
async function main(){
 const database=process.env.AIO_TEST_DATABASE_URL||'',u=new URL(database);
 if(!['postgres:','postgresql:'].includes(u.protocol)||!['127.0.0.1','localhost'].includes(u.hostname)||!u.pathname.endsWith('_test'))throw Error('EXCLUSIVAMENTE_BANCO_LOCAL_DE_TESTE');
 const transport=process.env.AIO_POSTGREST_DATABASE_URL||'',tu=new URL(transport);
 if(tu.hostname!==u.hostname||tu.pathname!==u.pathname||tu.username!=='ab_aio_test_transport')throw Error('TEST_TRANSPORT_ROLE');
 const bin=process.env.AIO_POSTGREST_BIN;if(!bin||!fs.existsSync(bin))throw Error('POSTGREST_BIN_REQUIRED');
 const pg=text=>execFileSync('psql',[database,'-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{input:text,encoding:'utf8',timeout:15000});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aio-e2e-')),output=process.env.AIO_TEST_OUTPUT||path.join(os.tmpdir(),'aio-e2e-evidence');
 const tenant=randomUUID(),other=randomUUID(),actor=randomUUID();let browser,proxy,app,postgrest,drop=false,delay=null;const passed=[],errors=[];
 const check=(ok,label)=>{assert.ok(ok,label);passed.push(label);};
 try{
  pg(`INSERT INTO ab_aio.tenants(id,name,legal_key,timezone) VALUES('${tenant}','Teste A','${tenant}','America/Sao_Paulo'),('${other}','Teste B','${other}','America/Cuiaba');INSERT INTO ab_aio.actors VALUES('${actor}','Ator efêmero',true);INSERT INTO ab_aio.memberships VALUES('${tenant}','${actor}','editor',true),('${other}','${actor}','editor',true);INSERT INTO ab_aio.clients(id,tenant_id,name) SELECT gen_random_uuid(),'${tenant}','Referência de teste '||g FROM generate_series(1,125)g;INSERT INTO ab_aio.clients(id,tenant_id,name,updated_at) VALUES(gen_random_uuid(),'${tenant}','Cliente Antigo Alvo',now()-interval '1 year'),(gen_random_uuid(),'${other}','Cliente exclusivo B',now());`);
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(tmp,'key.pem'),'-out',path.join(tmp,'cert.pem'),'-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore'});
  const jwtKey=randomBytes(32).toString('hex');
  const reserve=http.createServer();const port=await listen(reserve);await close(reserve);
  postgrest=spawn(bin,[],{env:{...process.env,PGRST_DB_URI:transport,PGRST_DB_SCHEMAS:'public',PGRST_DB_ANON_ROLE:'anon',PGRST_JWT_SECRET:jwtKey,PGRST_SERVER_HOST:'127.0.0.1',PGRST_SERVER_PORT:String(port),PGRST_DB_POOL:'4'},stdio:['ignore','ignore','pipe']});
  let pglog='';postgrest.stderr.on('data',c=>pglog=(pglog+c.toString()).slice(-10000));
  let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:'+port+'/');if(r.status<500){ready=true;break;}}catch{}await wait(100);}if(!ready)throw Error('POSTGREST_START: '+pglog);
  const p=Buffer.from(JSON.stringify({role:'service_role',exp:Math.floor(Date.now()/1000)+900})).toString('base64url'),header=Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
  const jwt=header+'.'+p+'.'+createHmac('sha256',jwtKey).update(header+'.'+p).digest('base64url');
  proxy=https.createServer({key:fs.readFileSync(path.join(tmp,'key.pem')),cert:fs.readFileSync(path.join(tmp,'cert.pem'))},async(req,res)=>{
   try{const chunks=[];for await(const c of req)chunks.push(c);const bytes=Buffer.concat(chunks);let data;try{data=JSON.parse(bytes);}catch{data={};}
    const r=await fetch('http://127.0.0.1:'+port+req.url.replace(/^\/rest\/v1/,''),{method:req.method,headers:{authorization:req.headers.authorization||'','content-type':'application/json'},body:bytes,signal:AbortSignal.timeout(10000)});const text=await r.text();
    if(drop&&req.url.endsWith('/ab_aio_command')&&r.ok){drop=false;res.destroy();return;}
    if(delay&&req.url.endsWith('/ab_aio_list')&&data.p_resource==='clients'){const hold=delay;delay=null;hold.enter();await hold.wait;}
    res.writeHead(r.status,{'content-type':r.headers.get('content-type')||'application/json'});res.end(text);
   }catch{res.destroy();}
  });
  const apiOrigin='https://127.0.0.1:'+await listen(proxy);
  const code=randomBytes(32).toString('base64url'),salt=randomBytes(16).toString('hex');
  const auth={version:1,sessionKey:randomBytes(32).toString('hex'),admins:[{id:actor,name:'AB · ensaio integrado',role:'owner',salt,hash:scryptSync(code,salt,32).toString('hex'),tenants:[tenant,other],studies:[]}],tenants:[{id:tenant,key:'TEST_A',label:'Teste A'},{id:other,key:'TEST_B',label:'Teste B'}]};
  app=fork(__filename,['--child'],{env:{...process.env,AB_ALLINONE_AUTH:JSON.stringify(auth),AB_ALLINONE_SUPABASE_URL:apiOrigin,AB_ALLINONE_SERVICE_KEY:jwt,AB_ALLINONE_INVENTORY:'',NODE_EXTRA_CA_CERTS:path.join(tmp,'cert.pem'),AIO_TEST_TLS_KEY:path.join(tmp,'key.pem')},stdio:['ignore','ignore','pipe','ipc']});
  app.stderr.on('data',c=>{if(!c.toString().includes('ExperimentalWarning'))errors.push(c.toString());});
  const origin=await Promise.race([new Promise(resolve=>app.once('message',m=>resolve(m.origin))),wait(10000).then(()=>{throw Error('TEST_APP_START');})]);
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1500,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/allinone');await page.locator('#code').fill(code);await page.locator('button[type=submit]').click();await page.locator('[data-view=projects]').waitFor();
  const nav=async view=>{await page.locator('[data-view='+view+']').click();await page.locator('[data-action=new]').waitFor();await page.waitForFunction(()=>!document.querySelector('[data-action=new]').disabled);};
  const create=async(view,fields)=>{await nav(view);await page.locator('[data-action=new]').click();await page.locator('#editor[open]').waitFor();for(const [key,value]of Object.entries(fields)){const el=page.locator('#record-form [name='+key+']');if(await el.evaluate(x=>x.tagName)==='SELECT')await el.selectOption(value);else await el.fill(String(value));}const [r]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/command')&&r.request().method()==='POST'),page.locator('#save-record').click()]);const result=await r.json();assert.equal(r.status(),200,view+': '+JSON.stringify(result));await page.locator('#editor').waitFor({state:'hidden'});check(result.tenant_id===tenant&&result.version===1,'CRUD real: '+view);return result;};
  const client=await create('clients',{name:'Cliente UI completo',email:'teste@example.invalid'});
  const project=await create('projects',{name:'Projeto UI real',client_id:client.id,state:'building'});
  await create('tasks',{title:'Entrega com vínculo',project_id:project.id,state:'in_progress'});
  await create('deals',{title:'Proposta consistente',client_id:client.id,project_id:project.id,amount_minor:'129,99',stage:'PROPOSAL'});
  await create('ledger_entries',{title:'Receita declarada de teste',project_id:project.id,direction:'income',amount_minor:'129,99',status:'recorded',recorded_date:'2026-10-10',evidence_ref:'ensaio-integrado'});
  await create('domains',{name:'teste.example',project_id:project.id});
  await create('harness_runs',{project_id:project.id,commit_sha:'a'.repeat(40),status:'PASSED',total_assertions:1,passed_assertions:1,failed_assertions:0,execution_time_ms:30,source_ref:'ensaio-local'});
  await create('llm_usage',{project_id:project.id,provider:'TEST',model_name:'modelo-de-teste',event_id:randomUUID(),prompt_tokens:100,completion_tokens:20,latency_ms:30,occurred_at:new Date().toISOString()});
  await create('affiliate_events',{project_id:project.id,platform:'AMAZON',event_id:randomUUID(),commission_minor:'1,99',status:'provisional',occurred_at:new Date().toISOString(),source_ref:'extrato-sintetico'});
  await create('documents',{project_id:project.id,title:'Evidência de teste',kind:'evidence',status:'received',external_ref:'arquivo-local'});
  check(pg(`SELECT amount_minor FROM ab_aio.ledger_entries WHERE tenant_id='${tenant}';`).trim()==='12999','Centavos persistidos sem perda');
  const cost=JSON.parse(pg(`SELECT public.ab_aio_overview('${actor}','${tenant}');`));check(cost.llm.unpriced===1&&cost.llm.tokens==='120','Telemetria com preço desconhecido e tokens reconciliados');
  await nav('projects');await page.locator('[data-action=new]').click();await page.locator('#editor[open]').waitFor();const target=page.locator('[data-reference-query=client_id]');await target.fill('Cliente Antigo Alvo');await page.locator('[data-action=lookup-reference][data-field=client_id]').click();await page.waitForFunction(()=>[...document.querySelector('select[name=client_id]').options].some(o=>o.text==='Cliente Antigo Alvo'));check(true,'Busca encontra referência fora dos primeiros 100');await page.locator('[data-action=close-dialog]').click();
  // Resposta real antiga chega depois de mudar a organização durante abertura do editor.
  let release,enter;const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r);delay={enter,wait:gate};await page.locator('[data-action=new]').click();await Promise.race([entered,wait(5000).then(()=>{throw Error('DELAY_NOT_REACHED');})]);await page.locator('#tenant').selectOption(other);release();await wait(400);check(await page.locator('#editor[open]').count()===0,'Editor tardio de outro escopo é descartado');await page.locator('#tenant').selectOption(tenant);await wait(300);
  // O PostgreSQL confirma; o proxy de teste perde o ACK. Não há banco simulado.
  await nav('clients');await page.locator('[data-action=new]').click();await page.locator('#editor[open]').waitFor();await page.locator('[name=name]').fill('Teste ACK perdido');drop=true;
  const [lost]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/command')),page.locator('#save-record').click()]);const loss=await lost.json();check(lost.status()===503&&loss.uncertain===true,'Commit sem ACK gera resultado incerto');
  await page.locator('#pending-command').waitFor();check(await page.locator('#editor-fields [name=name]').isDisabled(),'Intenção incerta congela campos');check(pg(`SELECT count(*) FROM ab_aio.clients WHERE tenant_id='${tenant}' AND name='Teste ACK perdido';`).trim()==='1','ACK perdido não é rollback');
  await page.locator('[data-action=close-dialog]').click();await page.locator('[data-action=reconcile-command]').click();await page.waitForFunction(()=>document.querySelector('#pending-command').hidden);check(pg(`SELECT count(*) FROM ab_aio.clients WHERE tenant_id='${tenant}' AND name='Teste ACK perdido';`).trim()==='1','Recibo reconcilia sem duplicação');
  await page.locator('[data-view=central]').click();await wait(300);fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'central-connected.png'),fullPage:true});await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Layout conectado sem overflow móvel');await page.screenshot({path:path.join(output,'central-connected-mobile.png'),fullPage:true});check(errors.length===0,'Sem erro JavaScript no ensaio conectado');
  const report={suite:'ALLinONE-R2/E2E',at:new Date().toISOString(),checks:passed.length,passed,errors,mode:'HTTPS local; handlers e transporte reais; PostgREST 16.4; PostgreSQL 17; dados e identidade efêmeros; nenhuma produção',status:'passed'};fs.writeFileSync(path.join(output,'e2e.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{
  if(browser)await browser.close();if(app){app.send('stop');await Promise.race([new Promise(r=>app.once('exit',r)),wait(3000)]);app.kill();}await close(proxy);if(postgrest){postgrest.kill();await Promise.race([new Promise(r=>postgrest.once('exit',r)),wait(3000)]);}
  const tables=['audit_log','outbox','command_receipts','tasks','deals','ledger_entries','domains','harness_runs','llm_usage','affiliate_events','documents','projects','clients','memberships'];pg('BEGIN;'+tables.map(t=>`DELETE FROM ab_aio.${t} WHERE tenant_id IN('${tenant}','${other}');`).join('')+`DELETE FROM ab_aio.actors WHERE id='${actor}';DELETE FROM ab_aio.tenants WHERE id IN('${tenant}','${other}');COMMIT;`);fs.rmSync(tmp,{recursive:true,force:true});
 }
}
(process.argv.includes('--child')?child():main()).catch(e=>{console.error('AIO_E2E_FAILED',e.message);process.exitCode=1;});
