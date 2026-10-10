'use strict';
const assert = require('node:assert/strict');
const {randomBytes, scryptSync, createHmac} = require('node:crypto');
const auth = require('../../.allinone-test/lib/allinone/auth.js');
const {decodeDatabaseResponse} = require('../../.allinone-test/lib/allinone/transport.js');
const {validateRecord} = require('../../.allinone-test/lib/allinone/service.js');
const {readText} = require('../../.allinone-test/lib/allinone/io.js');
const {POST, GET} = require('../../.allinone-test/lib/allinone/handler.js');
const {minorToInput, inputToMinor, CommandIntent} = require('../../public/allinone-assets/state.js');
let checks = 0;
const passed = [];
const check = (value, label) => { assert.ok(value, label); checks++; };
async function rejected(operation, code, uncertain) {
  await assert.rejects(operation, error => error.code === code && (uncertain === undefined || error.uncertain === uncertain));
  checks++;
}
const tenant = '10000000-0000-4000-8000-000000000001';
const id = '30000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const row = {id, tenant_id: tenant, version: 1, created_at:'2026-10-10T00:00:00+00:00', updated_at:'2026-10-10T00:00:00+00:00', name:'Cliente de teste', document:null, email:null, notes:'', is_active:true};
const decode = response => decodeDatabaseResponse(response, true, value => validateRecord(value, 'clients', tenant, id, 1));
const response = (body, status=200) => new Response(body, {status, headers:{'content-type':'application/json'}});
(async () => {
  // Injeção explícita de falhas de transporte; não é uma implementação simulada do aplicativo.
  check((await decode(response(JSON.stringify(row)))).id === id, 'VALIDATED_ACK');
  for (const malformed of ['null', '{}', '[]', '<html>', JSON.stringify({...row, tenant_id:other}), JSON.stringify({...row, version:2}), JSON.stringify({...row, id:other})]) {
    await rejected(() => decode(response(malformed)), 'DATABASE_RESPONSE_INVALID', true);
  }
  const broken = new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"id":'));c.error(new Error('injected_disconnect'));}});
  await rejected(() => decode(new Response(broken,{headers:{'content-type':'application/json'}})), 'DATABASE_RESPONSE_INVALID', true);
  await rejected(() => decode(response('x'.repeat(2_000_001))), 'DATABASE_RESPONSE_INVALID', true);
  await rejected(() => decode(new Response('{}',{headers:{'content-type':'text/html'}})), 'DATABASE_RESPONSE_INVALID', true);
  await rejected(() => decodeDatabaseResponse(response('{}',503),false,x=>x), 'DATABASE_RESPONSE_INVALID', false);
  await rejected(() => decode(response(JSON.stringify({code:'23514', message:'check constraint'}),400)), 'RECORD_INVALID', false);
  await rejected(() => decode(response(JSON.stringify({code:'P0001', message:'VERSION_CONFLICT'}),409)), 'VERSION_CONFLICT', false);
  await rejected(() => decode(response(JSON.stringify({code:'23514', message:'RECORD_FINALIZED'}),400)), 'RECORD_FINALIZED', false);
  passed.push('resposta interrompida, inválida, grande, cross-tenant e versão incorreta nunca confirmam gravação');

  await rejected(() => readText(new ReadableStream({start(c){c.enqueue(new Uint8Array([255]));c.close();}}),10,100), 'BODY_ENCODING');
  await rejected(() => readText(new ReadableStream({}),10,10), 'BODY_TIMEOUT');
  await rejected(() => readText(new ReadableStream({start(c){c.enqueue(new Uint8Array(11));c.close();}}),10,100), 'BODY_LIMIT');
  const controller = new AbortController(); controller.abort();
  await rejected(() => readText(new ReadableStream({}),10,100,controller.signal), 'BODY_ABORTED');
  passed.push('corpo limitado em bytes, UTF-8, prazo e cancelamento');

  const old = process.env.AB_ALLINONE_AUTH;
  const code = randomBytes(32).toString('base64url'), salt = randomBytes(16).toString('hex');
  const actor = {id:'20000000-0000-4000-8000-000000000001', name:'Teste', salt, hash:scryptSync(code,salt,32).toString('hex'), role:'owner', tenants:[tenant], studies:[]};
  const config = {version:1,sessionKey:randomBytes(32).toString('hex'),admins:[actor],tenants:[{id:tenant,key:'TEST',label:'Teste'}]};
  try {
    process.env.AB_ALLINONE_AUTH=JSON.stringify(config);
    const salt2=randomBytes(16).toString('hex');
    const ambiguous={...config,admins:[actor,{...actor,id:'20000000-0000-4000-8000-000000000002',salt:salt2,hash:scryptSync(code,salt2,32).toString('hex')}]};
    await rejected(()=>auth.authenticate(code,ambiguous),'AUTH_AMBIGUOUS');
    const simultaneous=await Promise.allSettled([auth.authenticate(code,config),auth.authenticate(code,config),auth.authenticate(code,config)]);
    check(simultaneous.filter(r=>r.status==='fulfilled').length===2,'KDF_ADMISSION_TWO');
    check(simultaneous.some(r=>r.status==='rejected'&&r.reason.code==='AUTH_BUSY'),'KDF_REJECTS_NO_QUEUE');
    const token=auth.createCsrf(config,actor.id), session=auth.createSession(actor,config), origin='https://alexandrebelo.com.br';
    const request = new Request(origin+'/allinone/api/command',{method:'POST',headers:{origin,cookie:auth.COOKIE+'='+session+'; '+auth.CSRF_COOKIE+'='+token,'x-csrf-token':token,'content-type':'application/json'},body:'x'.repeat(16385)});
    const r=await POST(request,{params:Promise.resolve({path:['api','command']})});
    check(r.status===413,'OVERSIZE_STAYS_413');
    const duplicate=new Request(origin+'/allinone/api/overview?tenant='+tenant+'&tenant='+other,{headers:{cookie:auth.COOKIE+'='+session}});
    check((await GET(duplicate,{params:Promise.resolve({path:['api','overview']})})).status===400,'AMBIGUOUS_QUERY_REJECTED');
    process.env.AB_ALLINONE_AUTH='malformed';
    const unavailable=await GET(new Request(origin+'/allinone/api/bootstrap'),{params:Promise.resolve({path:['api','bootstrap']})});
    check(unavailable.status===503&&unavailable.headers.get('content-type').includes('application/json'),'CONFIG_FAILURE_JSON');
    const p=Buffer.from(JSON.stringify({sub:'login',iat:1000,exp:2800,nonce:''})).toString('base64url');
    const h=createHmac('sha256',Buffer.from(config.sessionKey,'hex')).update('ab-allinone:v1:csrf\0'+p).digest('base64url');
    check(!auth.validateCsrf(p+'.'+h,p+'.'+h,config,'login',1000),'SIGNED_MALFORMED_NONCE_REJECTED');
  } finally { if(old===undefined)delete process.env.AB_ALLINONE_AUTH;else process.env.AB_ALLINONE_AUTH=old; }
  passed.push('ambiguidade de identidade, admissão KDF, erro 413, query duplicada e configuração inválida');

  for(let i=0;i<600;i++){
    const minor=Number((BigInt(i)*987654321123n)%9000000000001n);
    check(inputToMinor(minorToInput(minor))===minor,'EXACT_CENTS_ROUNDTRIP');
  }
  for(const value of ['-1','NaN','1e3','12.345','90.000,00','90000000000,01']){assert.throws(()=>inputToMinor(value));checks++;}
  const intent=new CommandIntent();const payload={tenant_id:tenant,resource:'clients',data:{name:'Teste'}};
  const key=intent.prepare(payload);intent.sent();intent.failed(true);
  assert.throws(()=>intent.prepare({...payload,data:{name:'Outra intenção'}}));checks++;
  check(intent.prepare(payload)===key,'SAME_KEY_AFTER_UNKNOWN');
  intent.reconcile('not_observed');check(intent.state==='unknown','ABSENCE_NOT_ROLLBACK');
  intent.sent();intent.committed();assert.throws(()=>intent.sent());checks++;
  passed.push('600 roundtrips monetários exatos e máquina de reconciliação sem nova intenção implícita');
  console.log(JSON.stringify({suite:'ALLinONE-R2',checks,passed,production:false,status:'passed'}));
})().catch(error=>{console.error('R2_FAILED',error);process.exitCode=1;});
