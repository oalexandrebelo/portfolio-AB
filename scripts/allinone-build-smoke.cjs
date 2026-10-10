'use strict';
// Executa o build já produzido em loopback. Não usa nenhum segredo ou serviço produtivo.
const {spawn}=require('node:child_process');
const {randomBytes}=require('node:crypto');
const net=require('node:net');
const assert=require('node:assert/strict');
const path=require('node:path');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const env={...process.env};
 for(const key of Object.keys(env))if(key.startsWith('AB_ALLINONE_')||key.startsWith('AB_STUDIES_')||key.includes('SUPABASE')||key==='MEDIUM_API_TOKEN')delete env[key];
 env.BLOG_ADMIN_KEY=randomBytes(32).toString('hex');env.NEXT_TELEMETRY_DISABLED='1';
 const child=spawn(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
 let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',x=>log=(log+x.toString()).slice(-10000));
 const origin='http://127.0.0.1:'+port,passed=[];
 try{
  let ready=false;for(let i=0;i<100;i++){try{const r=await fetch(origin+'/allinone');if(r.status===503){ready=true;break;}}catch{}if(child.exitCode!==null)break;await wait(100);}
  assert.ok(ready,'Next indisponível: '+log);
  for(const endpoint of ['/allinone','/allinone/api/bootstrap','/estudos']){
   const r=await fetch(origin+endpoint);assert.equal(r.status,503,endpoint);passed.push(endpoint+' falha fechado sem configuração');
  }
  const id='30000000-0000-4000-8000-000000000001';
  for(const [method,endpoint]of [['GET','/api/blog/posts'],['POST','/api/blog/posts'],['GET','/api/blog/posts/'+id],['PATCH','/api/blog/posts/'+id],['DELETE','/api/blog/posts/'+id],['POST','/api/blog/medium']]){
   const denied=await fetch(origin+endpoint,{method});assert.equal(denied.status,401,method+endpoint+' sem autorização');
   const configuredMissing=await fetch(origin+endpoint,{method,headers:{'x-admin-key':env.BLOG_ADMIN_KEY}});
   assert.equal(configuredMissing.status,503,method+endpoint+' sem banco');assert.equal((await configuredMissing.json()).error,'BLOG_DATABASE_NOT_CONFIGURED');
   passed.push(method+' '+endpoint+': 401 sem identidade; 503 sem banco');
  }
  for(const endpoint of ['/allinone-assets/app.js','/allinone-assets/state.js','/allinone-assets/app.css']){
   const r=await fetch(origin+endpoint);assert.equal(r.status,200);passed.push(endpoint+' entregue como asset genérico');
  }
  console.log(JSON.stringify({suite:'ALLinONE-R2/Next-build-smoke',mode:'Next start local após build integral; sem credenciais produtivas',checks:passed.length,passed,status:'passed'}));
 }finally{child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),wait(3000)]);if(child.exitCode===null)child.kill('SIGKILL');}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
