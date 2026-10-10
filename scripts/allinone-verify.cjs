const assert=require('node:assert/strict');
const {randomBytes,scryptSync}=require('node:crypto');
const fs=require('node:fs');
const auth=require('../.allinone-test/lib/allinone/auth.js');
const contracts=require('../.allinone-test/lib/allinone/contracts.js');
const service=require('../.allinone-test/lib/allinone/service.js');
const {GET,POST}=require('../.allinone-test/lib/allinone/handler.js');
const study=require('../.allinone-test/lib/estudos/security.js');
let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++;};
const origin='https://alexandrebelo.com.br',context=(...path)=>({params:Promise.resolve({path})});
async function main(){
 const old={auth:process.env.AB_ALLINONE_AUTH,url:process.env.AB_ALLINONE_SUPABASE_URL,key:process.env.AB_ALLINONE_SERVICE_KEY,inventory:process.env.AB_ALLINONE_INVENTORY};
 const code=randomBytes(32).toString('base64url'),salt=randomBytes(16).toString('hex');
 const actor={id:'20000000-0000-4000-8000-000000000001',name:'Identidade de teste',salt,hash:scryptSync(code,salt,32).toString('hex'),role:'owner',tenants:['10000000-0000-4000-8000-000000000001'],studies:[]};
 const c={version:1,sessionKey:randomBytes(32).toString('hex'),admins:[actor],tenants:[{id:actor.tenants[0],key:'TEST',label:'Organização de teste'}]};
 try{
  process.env.AB_ALLINONE_AUTH=JSON.stringify(c);delete process.env.AB_ALLINONE_SUPABASE_URL;delete process.env.AB_ALLINONE_SERVICE_KEY;delete process.env.AB_ALLINONE_INVENTORY;
  check(auth.configuration().admins[0].id===actor.id,'CONFIG');
  check((await auth.authenticate(code,c)).id===actor.id,'AUTH_VALID');check(await auth.authenticate(code+'x',c)===null,'AUTH_WRONG');check(await auth.authenticate('short',c)===null,'AUTH_SHORT');
  const session=auth.createSession(actor,c,1000);check(auth.validateSession(session,c,1000).id===actor.id,'SESSION_VALID');check(auth.validateSession(session,c,1000+auth.TTL)===null,'SESSION_EXPIRES');check(auth.validateSession(session+'x',c,1000)===null,'SESSION_TAMPER');
  check(auth.validateSession(session,{...c,admins:[{...actor,tenants:[]}]},1000)===null,'PERMISSION_CHANGE_REVOKES');
  const sr={sessionKey:randomBytes(32),studies:[]};const st=study.createSession({slug:'fixture',revision:1,enabled:true,accessHash:'0'.repeat(64),dataKey:'1'.repeat(64)},sr,1000);check(auth.validateSession(st,c,1000)===null,'STUDY_TOKEN_NOT_ADMIN');
  const token=auth.createCsrf(c,'login',1000);check(auth.validateCsrf(token,token,c,'login',1000),'CSRF_VALID');check(!auth.validateCsrf(token,token,c,actor.id,1000),'CSRF_SUBJECT');check(!auth.validateCsrf(token,token,c,'login',2800),'CSRF_EXPIRED');check(!auth.validateCsrf(token,token+'x',c,'login',1000),'CSRF_COOKIE');
  check(auth.sameOrigin(new Request(origin,{headers:{origin}}),true),'ORIGIN_VALID');check(!auth.sameOrigin(new Request(origin,{headers:{origin:'https://outside.example','sec-fetch-site':'cross-site'}}),true),'ORIGIN_FOREIGN');check(!auth.sameOrigin(new Request(origin,{headers:{origin:'null'}}),false),'NULL_ORIGIN_NO_CSRF');
  check(auth.getCookie(new Request(origin,{headers:{cookie:auth.COOKIE+'=a; '+auth.COOKIE+'=b'}}),auth.COOKIE)==='','DUPLICATE_COOKIE');
  const req=new Request(origin,{headers:{'x-vercel-forwarded-for':'fixture-'+randomBytes(8).toString('hex')}});for(let i=0;i<5;i++)check(auth.consumeAttempt(req,c,1000),'RATE_ALLOWED');check(!auth.consumeAttempt(req,c,1000),'RATE_LIMIT');check(auth.consumeAttempt(req,c,61000),'RATE_RESET');
  const q={tenant_id:actor.tenants[0],resource:'projects',data:{name:'Projeto real de teste'}};check(contracts.validateCommand(q).data.state==='discovery','DEFAULTS');
  for(const invalid of [{...q,tenant_id:'invalid'},{...q,resource:'tenants'},{...q,data:{name:'X',tenant_id:actor.tenants[0]}},{...q,id:actor.id,version:null},{...q,data:{name:''}},{tenant_id:actor.tenants[0],resource:'deals',data:{title:'X',amount_minor:-1}},{tenant_id:actor.tenants[0],resource:'domains',data:{name:'https://outside.example/path'}}]){assert.throws(()=>contracts.validateCommand(invalid));checks++;}
  check(service.bootstrap(actor,c).database.mode==='inventory_only','NO_DATABASE_READONLY');check(service.bootstrap(actor,c).capabilities.payments===false,'NO_PAYMENT_EXECUTOR');
  await assert.rejects(()=>service.command(actor,q,randomBytes(16).toString('hex')),e=>e.code==='IDEMPOTENCY_KEY_REQUIRED');checks++;
  await assert.rejects(()=>service.command(actor,q,'30000000-0000-4000-8000-000000000001'),e=>e.code==='DATABASE_NOT_CONNECTED');checks++;
  await assert.rejects(()=>service.command({...actor,role:'viewer'},q,'30000000-0000-4000-8000-000000000001'),e=>e.code==='ACCESS_DENIED');checks++;
  await assert.rejects(()=>service.overview(actor,'10000000-0000-4000-8000-000000000002'),e=>e.code==='ACCESS_DENIED');checks++;
  let r=await GET(new Request(origin+'/allinone'),context());const html=await r.text();check(r.status===200&&html.includes('type="password"'),'ANONYMOUS_GATE');check(!html.includes('Identidade de teste'),'NO_IDENTITY_LEAK');
  r=await GET(new Request(origin+'/allinone/api/bootstrap'),context('api','bootstrap'));check(r.status===401,'ANONYMOUS_API');
  const csrf=auth.createCsrf(c);r=await POST(new Request(origin+'/allinone/login',{method:'POST',headers:{origin,cookie:auth.CSRF_COOKIE+'='+csrf,'x-vercel-forwarded-for':'test-login'},body:new URLSearchParams({csrf,code})}),context('login'));check(r.status===303&&r.headers.get('location')==='/allinone','LOGIN_REDIRECT');
  const set=r.headers.getSetCookie().find(s=>s.startsWith(auth.COOKIE+'='));check(set.includes('HttpOnly')&&set.includes('Secure'),'COOKIE_FLAGS');
  r=await GET(new Request(origin+'/allinone/api/bootstrap',{headers:{cookie:set.split(';')[0]}}),context('api','bootstrap'));check(r.status===200&&(await r.json()).actor.id===actor.id,'AUTHORIZED_BOOTSTRAP');
  const expired='invalid';r=await POST(new Request(origin+'/allinone/api/command',{method:'POST',headers:{origin,cookie:set.split(';')[0],'content-type':'application/json','x-csrf-token':expired},body:JSON.stringify(q)}),context('api','command'));check(r.status===403,'WRITE_CSRF');
  const adminCsrf=auth.createCsrf(c,actor.id);r=await POST(new Request(origin+'/allinone/api/command',{method:'POST',headers:{origin,cookie:set.split(';')[0]+'; '+auth.CSRF_COOKIE+'='+adminCsrf,'content-type':'application/json','x-csrf-token':adminCsrf,'idempotency-key':'30000000-0000-4000-8000-000000000001'},body:JSON.stringify(q)}),context('api','command'));check(r.status===503,'NO_FALSE_SAVE');
  r=await POST(new Request(origin+'/allinone/logout',{method:'POST',headers:{origin,cookie:set.split(';')[0]+'; '+auth.CSRF_COOKIE+'='+adminCsrf},body:new URLSearchParams({csrf:adminCsrf})}),context('logout'));check(r.status===303&&r.headers.getSetCookie().some(s=>s.startsWith(auth.COOKIE+'=;')),'LOGOUT');
  const js=fs.readFileSync('public/allinone-assets/app.js','utf8');check(!/localStorage|sessionStorage/.test(js),'NO_BROWSER_DATABASE');check(!js.includes('AB-gXp'),'NO_EMBEDDED_CREDENTIAL');
  check(fs.readFileSync('allinone/migrations/001_core.sql','utf8').includes('FORCE ROW LEVEL SECURITY'),'RLS_REQUIRED');
 }finally{for(const [key,value] of Object.entries({AB_ALLINONE_AUTH:old.auth,AB_ALLINONE_SUPABASE_URL:old.url,AB_ALLINONE_SERVICE_KEY:old.key,AB_ALLINONE_INVENTORY:old.inventory})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
 if(process.env.VERCEL_ENV==='production'&&process.env.AB_ALLINONE_AUTH){const c=auth.configuration();check(c.admins.length>0,'PRODUCTION_CONFIGURATION');service.inventory();}
 console.log(JSON.stringify({suite:'AB-ALLinONE/security-contracts',checks,status:'passed',databaseIntegration:'separate PostgreSQL suite'}));
}
main().catch(e=>{console.error('ALLINONE_TEST_FAILED:',e.message);process.exitCode=1;});
