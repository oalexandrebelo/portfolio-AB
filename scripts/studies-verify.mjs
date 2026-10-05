import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const s=require('../.studies-test/lib/estudos/security.js');
const {GET,POST}=require('../.studies-test/lib/estudos/handler.js');
const {openStudy}=require('../.studies-test/lib/estudos/vault.js');
let stage='unitarios',count=0;
function check(value,label){if(!value)throw new Error(label);count++;}
const context=(...path)=>({params:Promise.resolve({path})});
const origin='https://alexandrebelo.com.br';
function diagnostic(error){if(error)console.error('estudos: storage retornou status '+(/^[0-9]{3}$/.test(String(error.statusCode))?error.statusCode:'indisponivel')+' e classe '+(/^[A-Za-z]{1,48}$/.test(error.name??'')?error.name:'desconhecida'));}
async function verify(){
 const r={sessionKey:randomBytes(32),studies:[]};
 const password='AB-'+randomBytes(18).toString('base64url');
 const e={slug:'teste',revision:1,accessHash:s.digest(password,r),dataKey:randomBytes(32).toString('hex'),enabled:true};
 r.studies=[e];
 check(s.authenticate(password,r)===e,'AUTH_POSITIVE');
 check(s.authenticate(password+'x',r)===null,'AUTH_NEGATIVE');
 check(s.authenticate('curta',r)===null,'AUTH_LENGTH');
 const now=Math.floor(Date.now()/1000),session=s.createSession(e,r,now);
 check(s.validateSession(session,r,now)===e,'SESSION_VALID');
 check(s.validateSession(session,r,now+s.SESSION_SECONDS)===null,'SESSION_EXPIRED');
 check(s.validateSession(session+'.',r,now)===null,'SESSION_TAMPER');
 check(s.validateSession(session,{...r,studies:[{...e,revision:2}]},now)===null,'SESSION_REVISION');
 check(s.validateSession(session,{...r,studies:[{...e,enabled:false}]},now)===null,'SESSION_DISABLED');
 const csrf=s.createCsrf(r,now);
 check(s.validateCsrf(csrf,csrf,r,now),'CSRF_VALID');
 check(!s.validateCsrf(csrf,csrf+'x',r,now),'CSRF_MISMATCH');
 check(!s.validateCsrf(csrf,csrf,r,now+1200),'CSRF_EXPIRED');
 check(!s.validateCsrf(session,session,r,now),'TOKEN_DOMAIN_SEPARATION');
 check(s.sameOrigin(new Request(origin+'/estudos/acessar',{headers:{origin,'sec-fetch-site':'same-origin'}})),'ORIGIN_VALID');
 check(!s.sameOrigin(new Request(origin+'/estudos/acessar',{headers:{origin:'https://example.org','sec-fetch-site':'cross-site'}})),'ORIGIN_DENIED');
 check(s.cookieValue(new Request(origin,{headers:{cookie:s.SESSION_COOKIE+'=a; '+s.SESSION_COOKIE+'=b'}}),s.SESSION_COOKIE)==='','DUPLICATE_COOKIE');
 const form=await s.boundedForm(new Request(origin,{method:'POST',body:new URLSearchParams({password,csrf})}));
 check(form.get('password')===password,'BOUNDED_FORM');
 let rejected=false;try{await s.boundedForm(new Request(origin,{method:'POST',body:new URLSearchParams({password:'x'.repeat(2100)})}));}catch{rejected=true;}
 check(rejected,'OVERSIZED_FORM');
 const headers=s.responseHeaders('<script>0;</script>');
 check(headers.get('cache-control').includes('no-store'),'NO_STORE');
 check(headers.get('content-security-policy').includes("'sha256-"),'CSP_HASH');
 check(headers.get('x-robots-tag').includes('noindex'),'NO_INDEX');
 const blog=await readFile('app/blog/page.tsx','utf8');
 check(blog.includes('href="/estudos"')&&blog.includes('Estudos'),'BLOG_LINK');
 console.log('estudos: verificacoes unitarias aprovadas:',count);
 if(process.env.VERCEL_ENV!=='production'&&!process.env.AB_STUDIES_REGISTRY){console.log('estudos: sem configuracao privada neste ambiente; nao testa conteudo real.');return;}
 stage='configuracao-e-integridade';
 const real=s.configuration();check((process.env.CRON_SECRET??'').length>=32,'CRON_CONFIGURATION');
 const enabled=real.studies.filter(x=>x.enabled);check(enabled.length>0,'REGISTRY_EMPTY');
 for(const entry of enabled){const b=openStudy(entry);check(b.dashboard.length>100&&b.report.length>100&&b.markdown.length>100,'VAULT_CONTENT');}
 const entry=enabled[0];
 let response=await GET(new Request(origin+'/estudos'),context());check(response.status===200,'GATEWAY_STATUS');
 const gateway=await response.text();check(gateway.includes('type="password"')&&!gateway.includes('window.REPORT_BODY'),'GATEWAY_PRIVATE');
 for(const part of ['', '/relatorio','/estudo.md','/painel.html']){
  response=await GET(new Request(origin+'/estudos/'+entry.slug+part),context(entry.slug,...part.split('/').filter(Boolean)));
  check(response.status===401,'ANONYMOUS_DENIED');
 }
 const validSession=s.createSession(entry,real),authorizedHeaders={cookie:s.SESSION_COOKIE+'='+validSession};
 response=await GET(new Request(origin+'/estudos/'+entry.slug,{headers:authorizedHeaders}),context(entry.slug));
 check(response.status===200,'AUTHORIZED_STATUS');check((await response.text())===openStudy(entry).dashboard,'AUTHORIZED_CONTENT');
 response=await GET(new Request(origin+'/estudos/outro-projeto',{headers:authorizedHeaders}),context('outro-projeto'));
 check(response.status===401,'CROSS_STUDY_DENIED');
 stage='storage-sdk-import';
 const {createClient}=await import('@supabase/supabase-js');
 stage='storage-client';
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 stage='storage-bucket';
 const bucket='ab-estudos-ratelimit';let info=await db.storage.getBucket(bucket);
 if(info.error){diagnostic(info.error);const made=await db.storage.createBucket(bucket,{public:false,fileSizeLimit:1024,allowedMimeTypes:['application/octet-stream']});diagnostic(made.error);check(!made.error||/already exists/i.test(made.error.message),'BUCKET_CREATE');info=await db.storage.getBucket(bucket);}
 diagnostic(info.error);check(!info.error&&info.data.public===false,'BUCKET_PRIVATE');
 stage='storage-atomicity';
 const path='build-check/'+randomBytes(16).toString('hex')+'.bin';
 try{
  const trials=await Promise.all(Array.from({length:6},()=>db.storage.from(bucket).upload(path,new Uint8Array([1]),{upsert:false,contentType:'application/octet-stream'})));
  check(trials.filter(x=>!x.error).length===1,'ATOMIC_EXCLUSION');
  check(trials.filter(x=>x.error&&/already exists/i.test(x.error.message)).length===5,'ATOMIC_DUPLICATES');
 }finally{const clean=await db.storage.from(bucket).remove([path]);check(!clean.error,'ATOMIC_CLEANUP');}
 stage='fluxo-senha-redirecionamento';
 // Credencial efemera usada somente neste processo de teste, nunca publicada nem registrada.
 const previous=process.env.AB_STUDIES_REGISTRY,testPassword='AB-'+randomBytes(18).toString('base64url');
 process.env.AB_STUDIES_REGISTRY=JSON.stringify(real.studies.map(x=>x.slug===entry.slug?{...x,accessHash:s.digest(testPassword,real)}:x));
 try{
  async function submit(value,ip){const t=s.createCsrf(real);return POST(new Request(origin+'/estudos/acessar',{method:'POST',headers:{origin,'sec-fetch-site':'same-origin','x-vercel-forwarded-for':ip,cookie:s.CSRF_COOKIE+'='+t},body:new URLSearchParams({password:value,csrf:t})}),context('acessar'));}
  const ip='build-'+randomBytes(16).toString('hex');
  response=await submit('AB-'+randomBytes(18).toString('base64url'),ip+'-wrong');check(response.status===401,'POST_WRONG_PASSWORD');
  response=await submit(testPassword,ip+'-valid');check(response.status===303,'POST_VALID_REDIRECT');
  check(response.headers.get('location')==='/estudos/'+entry.slug,'POST_CORRECT_DESTINATION');
  const set=response.headers.getSetCookie().find(x=>x.startsWith(s.SESSION_COOKIE+'='));
  check(!!set&&set.includes('HttpOnly')&&set.includes('Secure')&&set.includes('SameSite=Strict'),'SESSION_FLAGS');
  response=await GET(new Request(origin+'/estudos/'+entry.slug,{headers:{cookie:set.split(';')[0]}}),context(entry.slug));check(response.status===200,'POST_TO_CONTENT');
  response=await POST(new Request(origin+'/estudos/sair',{method:'POST',headers:{origin,'sec-fetch-site':'same-origin',cookie:set.split(';')[0]}}),context('sair'));
  check(response.status===303&&response.headers.getSetCookie().some(x=>x.startsWith(s.SESSION_COOKIE+'=;')&&x.includes('Max-Age=0')),'LOGOUT');
 }finally{process.env.AB_STUDIES_REGISTRY=previous;}
 console.log('estudos: integridade, isolamento, bucket privado e fluxo de acesso aprovados. Verificacoes:',count);
}
verify().catch(error=>{const code=/^[A-Z_]{3,64}$/.test(error?.message??'')?error.message:(/^[A-Z_]{3,64}$/.test(error?.code??'')?error.code:'INTERNAL');console.error('estudos: verificacao reprovada na etapa '+stage+' ('+code+'); publicacao interrompida sem expor dados.');process.exitCode=1;});
