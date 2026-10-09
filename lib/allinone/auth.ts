import {createHash,createHmac,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {z} from 'zod';
const derive=promisify(scrypt);
const AdminSchema=z.object({id:z.string().uuid(),name:z.string().min(1).max(100),salt:z.string().regex(/^[a-f0-9]{32}$/),hash:z.string().regex(/^[a-f0-9]{64}$/),role:z.enum(['owner','editor','viewer']),tenants:z.array(z.string().uuid()).max(32),studies:z.array(z.string().regex(/^[a-z0-9-]{1,64}$/)).max(32)}).strict();
const ConfigSchema=z.object({version:z.literal(1),sessionKey:z.string().regex(/^[a-f0-9]{64}$/),admins:z.array(AdminSchema).min(1).max(32),tenants:z.array(z.object({id:z.string().uuid(),key:z.string().max(80),label:z.string().max(100)}).strict()).max(32)}).strict();
export type Admin=z.infer<typeof AdminSchema>;
export type Auth=z.infer<typeof ConfigSchema>;
export const COOKIE='__Host-ab_aio',CSRF_COOKIE='__Host-ab_aio_csrf',TTL=28800;
export function configuration():Auth{
 const c=ConfigSchema.parse(JSON.parse(process.env.AB_ALLINONE_AUTH??'null'));
 if(new Set(c.admins.map(a=>a.id)).size!==c.admins.length||new Set(c.tenants.map(t=>t.id)).size!==c.tenants.length||c.admins.some(a=>a.tenants.some(id=>!c.tenants.some(t=>t.id===id))))throw new Error('ADMIN_CONFIGURATION');
 return c;
}
const equal=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
function signature(p:string,purpose:string,c:Auth){return createHmac('sha256',Buffer.from(c.sessionKey,'hex')).update('ab-allinone:v1:'+purpose+'\0'+p).digest('base64url');}
function encode(v:object,purpose:string,c:Auth){const p=Buffer.from(JSON.stringify(v)).toString('base64url');return p+'.'+signature(p,purpose,c);}
function decode(t:string,purpose:string,c:Auth):Record<string,unknown>|null{
 if(t.length>2048||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]{43}$/.test(t))return null;const [p,h]=t.split('.');if(!equal(h,signature(p,purpose,c)))return null;
 try{const v:unknown=JSON.parse(Buffer.from(p,'base64url').toString());return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;}catch{return null;}
}
export async function authenticate(code:string,c:Auth):Promise<Admin|null>{
 if(code.length<24||code.length>128)return null;let found:Admin|null=null;
 for(const a of c.admins){const v=await derive(code,a.salt,32) as Buffer;if(equal(v.toString('hex'),a.hash))found=a;}return found;
}
const revision=(a:Admin)=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
export function createSession(a:Admin,c:Auth,now=Math.floor(Date.now()/1000)){return encode({aud:'ab-allinone',sub:a.id,rev:revision(a),iat:now,exp:now+TTL,nonce:randomBytes(18).toString('base64url')},'session',c);}
export function validateSession(token:string,c:Auth,now=Math.floor(Date.now()/1000)):Admin|null{
 const v=decode(token,'session',c);if(!v||v.aud!=='ab-allinone'||!Number.isSafeInteger(v.iat)||!Number.isSafeInteger(v.exp)||(v.iat as number)>now+30||(v.exp as number)<=now||(v.exp as number)-(v.iat as number)!==TTL||typeof v.nonce!=='string'||!/^[-_A-Za-z0-9]{24}$/.test(v.nonce))return null;
 const a=c.admins.find(x=>x.id===v.sub);return a&&equal(String(v.rev),revision(a))?a:null;
}
export function createCsrf(c:Auth,subject='login',now=Math.floor(Date.now()/1000)){return encode({sub:subject,iat:now,exp:now+1800,nonce:randomBytes(24).toString('base64url')},'csrf',c);}
export function validateCsrf(token:string,cookie:string,c:Auth,subject='login',now=Math.floor(Date.now()/1000)){
 if(!equal(token,cookie))return false;const v=decode(token,'csrf',c);return !!v&&v.sub===subject&&Number.isSafeInteger(v.iat)&&Number.isSafeInteger(v.exp)&&(v.iat as number)<=now+30&&(v.exp as number)>now&&(v.exp as number)-(v.iat as number)===1800;
}
export function getCookie(req:Request,name:string){const list=(req.headers.get('cookie')??'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(name+'='));return list.length===1?list[0].slice(name.length+1):'';}
export const cookie=(name:string,value:string,age:number)=>`${name}=${value}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;
export function sameOrigin(req:Request,csrfValid:boolean){
 try{const u=new URL(req.url),allowed=new Set(['alexandrebelo.com.br','www.alexandrebelo.com.br',process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL]);if(u.protocol!=='https:'||u.port||!allowed.has(u.hostname))return false;
 const site=req.headers.get('sec-fetch-site');if(site&&!['same-origin','none'].includes(site))return false;const origin=req.headers.get('origin');if(origin&&origin!=='null')return origin===u.origin;
 const referer=req.headers.get('referer');return csrfValid&&(!referer||new URL(referer).origin===u.origin);
 }catch{return false;}
}
const attempts=new Map<string,{count:number;expires:number}>();
export function consumeAttempt(req:Request,c:Auth,now=Date.now()){
 for(const [k,v] of attempts)if(v.expires<=now)attempts.delete(k);
 const ip=(req.headers.get('x-vercel-forwarded-for')??req.headers.get('x-forwarded-for')??'unknown').split(',')[0].slice(0,100),id=signature(ip,'limit',c),old=attempts.get(id);
 if(old)return ++old.count<=5;if(attempts.size>=4096)return false;attempts.set(id,{count:1,expires:now+60000});return true;
}
