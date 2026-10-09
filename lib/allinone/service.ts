import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import type {Admin,Auth} from './auth';
import {moduleGates,validateCommand,isResource} from './contracts';
export class Failure extends Error{constructor(public code:string,public status:number,public uncertain=false){super(code);}}
const Asset=z.object({name:z.string().min(1).max(180),provider:z.enum(['repository','hosting']),external_id:z.string().max(100),reference:z.string().max(500),branch:z.string().max(150).optional(),visibility:z.enum(['public','private']).optional()}).strict();
const Inventory=z.object({schema:z.literal(1),capturedAt:z.string().datetime({offset:true}),scope:z.string().max(500),assets:z.array(Asset).max(500)}).strict();
export function inventory(){
 const raw=process.env.AB_ALLINONE_INVENTORY;
 if(!raw)return {schema:1,capturedAt:null,scope:'Inventário não cadastrado.',assets:[]};
 if(raw.length>100000)throw new Failure('INVENTORY_CONFIGURATION',503);
 return Inventory.parse(JSON.parse(raw));
}
export function databaseConfigured(){return Boolean(process.env.AB_ALLINONE_SUPABASE_URL&&process.env.AB_ALLINONE_SERVICE_KEY);}
function tenantFor(admin:Admin,id:string){if(!z.string().uuid().safeParse(id).success||!admin.tenants.includes(id))throw new Failure('ACCESS_DENIED',403);return id;}
async function rpc(name:'ab_aio_list'|'ab_aio_overview'|'ab_aio_command',params:Record<string,unknown>){
 if(!databaseConfigured())throw new Failure('DATABASE_NOT_CONNECTED',503);
 const root=new URL(process.env.AB_ALLINONE_SUPABASE_URL!);
 if(root.protocol!=='https:'||root.username||root.password||root.pathname!=='/'||root.search||root.hash)throw new Failure('DATABASE_CONFIGURATION',503);
 let response:Response;
 try{response=await fetch(new URL('/rest/v1/rpc/'+name,root),{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000),headers:{'content-type':'application/json',apikey:process.env.AB_ALLINONE_SERVICE_KEY!,authorization:'Bearer '+process.env.AB_ALLINONE_SERVICE_KEY!},body:JSON.stringify(params)});}catch{throw new Failure('DATABASE_UNAVAILABLE',503,name==='ab_aio_command');}
 const reader=response.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
 if(!reader)throw new Failure('DATABASE_RESPONSE',502);
 try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>2000000){await reader.cancel();throw new Failure('DATABASE_RESPONSE_LIMIT',502);}chunks.push(r.value);}}finally{reader.releaseLock();}
 let value:Record<string,unknown>;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Failure('DATABASE_RESPONSE',502);}
 if(!response.ok){
  const code=String(value.code??''),message=String(value.message??'');
  if(code==='42501')throw new Failure('ACCESS_DENIED',403);
  if(message==='VERSION_CONFLICT'||message==='IDEMPOTENCY_CONFLICT')throw new Failure(message,409);
  if(code==='P0002')throw new Failure('RECORD_NOT_FOUND',404);
  if(['23503','23505','23514','23502','22023','22P02','22007','22008'].includes(code))throw new Failure('RECORD_INVALID',422);
  throw new Failure('DATABASE_UNAVAILABLE',503,name==='ab_aio_command');
 }
 return value;
}
export function bootstrap(admin:Admin,c:Auth){
 const data=admin.role==='owner'?inventory():{schema:1,capturedAt:null,scope:'Inventário global reservado ao proprietário.',assets:[]};
 return {schema:1,release:'AB-ALLinONE/1.0',actor:{id:admin.id,name:admin.name,role:admin.role},tenants:c.tenants.filter(t=>admin.tenants.includes(t.id)),studies:admin.studies.map(slug=>({slug})),inventory:data,database:{configured:databaseConfigured(),mode:databaseConfigured()?'configured_not_yet_verified':'inventory_only',message:databaseConfigured()?'A leitura verificará a conexão e as permissões.':'Banco administrativo não conectado. Nenhuma alteração é salva; consulta do inventário disponível.'},gates:moduleGates,capabilities:{metadata:true,transactional:databaseConfigured(),payments:false,fiscalIssuance:false,dnsWrites:false,domainPurchase:false,remoteExecution:false}};
}
export async function overview(admin:Admin,tenant:string){return rpc('ab_aio_overview',{p_actor:admin.id,p_tenant:tenantFor(admin,tenant)});}
export async function list(admin:Admin,tenant:string,resource:string,before:string|null,beforeId:string|null){
 if(!isResource(resource)&&resource!=='audit_log')throw new Failure('RESOURCE_INVALID',400);
 if(Boolean(before)!==Boolean(beforeId)||(before&&!z.string().datetime({offset:true}).safeParse(before).success)||(beforeId&&!z.string().uuid().safeParse(beforeId).success))throw new Failure('CURSOR_INVALID',400);
 return rpc('ab_aio_list',{p_actor:admin.id,p_tenant:tenantFor(admin,tenant),p_resource:resource,p_before:before,p_before_id:beforeId,p_limit:100});
}
export async function command(admin:Admin,input:unknown,commandId:string){
 if(admin.role==='viewer')throw new Failure('ACCESS_DENIED',403);
 if(!z.string().uuid().safeParse(commandId).success)throw new Failure('IDEMPOTENCY_KEY_REQUIRED',400);
 let v:ReturnType<typeof validateCommand>;try{v=validateCommand(input);}catch{throw new Failure('RECORD_INVALID',422);}
 tenantFor(admin,v.tenant_id);
 return rpc('ab_aio_command',{p_actor:admin.id,p_tenant:v.tenant_id,p_resource:v.resource,p_command:commandId,p_id:v.id,p_version:v.version,p_data:v.data});
}
export function failureResponse(error:unknown){const failure=error instanceof Failure?error:new Failure('INTERNAL_ERROR',500);return {status:failure.status,body:{error:failure.code,uncertain:failure.uncertain,request_id:randomUUID()}};}
