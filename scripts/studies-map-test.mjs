import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),s=require('../.studies-test/lib/estudos/security.js');
const {GET,POST}=require('../.studies-test/lib/estudos/handler.js');
let count=0;const check=(v,label)=>{assert.ok(v,label);count++;};
const old={key:process.env.AB_STUDIES_SESSION_KEY,registry:process.env.AB_STUDIES_REGISTRY,codes:process.env.AB_STUDIES_ACCESS_CODES};
const passwords=[randomBytes(24).toString('base64url'),randomBytes(24).toString('base64url')],key=randomBytes(32).toString('hex');
const entries=passwords.map((p,i)=>({slug:'fixture-'+i,revision:1,accessHash:'0'.repeat(63)+i,dataKey:randomBytes(32).toString('hex'),enabled:true}));
const context=(...path)=>({params:Promise.resolve({path})}),origin='https://alexandrebelo.com.br';
try{
 process.env.AB_STUDIES_SESSION_KEY=key;process.env.AB_STUDIES_REGISTRY=JSON.stringify(entries);process.env.AB_STUDIES_ACCESS_CODES=JSON.stringify(Object.fromEntries(entries.map((e,i)=>[e.slug,passwords[i]])));
 const r=s.configuration();
 for(let i=0;i<2;i++){const e=s.authenticate(passwords[i],r);check(e?.slug===entries[i].slug,'PASSWORD_SELECTS_STUDY');const token=s.createSession(e,r);check(s.validateSession(token,r)?.slug===e.slug,'SESSION_SCOPE');check(s.validateSession(token,{...r,studies:r.studies.map(x=>({...x,accessHash:randomBytes(32).toString('hex')}))})===null,'PASSWORD_ROTATION_REVOKES');}
 check(s.authenticate('wrong-password-credential',r)===null,'WRONG_PASSWORD');
 const csrf=s.createCsrf(r);for(const host of ['alexandrebelo.com.br','www.alexandrebelo.com.br']){const url='https://'+host;check(s.sameOrigin(new Request(url+'/estudos/acessar',{headers:{origin:url,'sec-fetch-site':'same-origin'}})),'CANONICAL_ORIGIN');}
 check(s.sameOrigin(new Request(origin+'/estudos/acessar',{headers:{origin:'null','sec-fetch-site':'same-origin'}}),true),'LEGACY_NULL_VALID_CSRF');
 check(!s.sameOrigin(new Request(origin+'/estudos/acessar',{headers:{origin:'null'}})),'NULL_WITHOUT_CSRF_REJECTED');
 check(!s.sameOrigin(new Request(origin+'/estudos/acessar',{headers:{origin:'https://evil.example','sec-fetch-site':'cross-site'}}),true),'FOREIGN_WITH_TOKEN_REJECTED');
 check(!s.sameOrigin(new Request('https://evil.example/estudos/acessar',{headers:{origin:'https://evil.example'}}),true),'UNKNOWN_HOST_REJECTED');
 check(!s.validateCsrf(csrf,csrf+'x',r),'CSRF_TAMPER');
 const headers=s.responseHeaders();check(headers.get('Referrer-Policy')==='same-origin','BROWSER_POST_ORIGIN');check(headers.get('Cache-Control').includes('no-store'),'PRIVATE_CACHE');
 for(const path of [[],['sinop'],['fixture-0','mapa'],['outro','relatorio']]){const result=await GET(new Request(origin+'/estudos/'+path.join('/')),context(...path));check([200,401].includes(result.status),'DIRECT_GATEWAY');check((await result.text()).includes('type="password"'),'FORM_BEFORE_DATA');}
 for(const p of ['acessar','sair']){const result=await GET(new Request(origin+'/estudos/'+p),context(p));check(result.status===303&&result.headers.get('location')==='/estudos','ACTION_LINK_RECOVERY');}
 const post=await POST(new Request(origin+'/estudos/acessar',{method:'POST',headers:{origin,cookie:s.CSRF_COOKIE+'='+csrf},body:new URLSearchParams({csrf,password:'wrong-password-credential'})}),context('acessar'));check(post.status===401,'INVALID_PASSWORD_HTTP');
}finally{for(const [name,value] of Object.entries({AB_STUDIES_SESSION_KEY:old.key,AB_STUDIES_REGISTRY:old.registry,AB_STUDIES_ACCESS_CODES:old.codes})){if(value===undefined)delete process.env[name];else process.env[name]=value;}}
const ui=await readFile('study-map/index.tsx','utf8');check(ui.includes("from './vendor/map'"),'REAL_MAPCN_IMPORT');check(ui.includes("type:'heatmap'"),'HEATMAP_LAYER');
if(process.env.VERCEL_ENV==='production'){
 const r=s.configuration(),codes=JSON.parse(process.env.AB_STUDIES_ACCESS_CODES??'{}');
 for(const [slug,password] of Object.entries(codes))check(s.authenticate(password,r)?.slug===slug,'DEPLOYED_CREDENTIAL_MATCHES');
 const {mapData}=require('../.studies-test/lib/estudos/map.js');const geo=mapData('sinop');
 check(geo.collection.features.length>0,'GEO_DECRYPTS');check(geo.collection.features.every(f=>f.geometry.type==='Point'&&f.geometry.coordinates.every(Number.isFinite)),'GEO_COORDINATES');
 check(new Set(geo.collection.features.map(f=>f.properties.id)).size===geo.collection.features.length,'GEO_IDS_UNIQUE');
}
console.log('estudos: mapa, credenciais, origem e isolamento verificados: '+count);
