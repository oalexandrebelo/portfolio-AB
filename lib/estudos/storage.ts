import { createHmac } from "node:crypto";
import type { Registry } from "./security";
export const RATE_BUCKET = "ab-estudos-ratelimit";
export async function storageCall(path: string, method: string, body?: unknown, raw = false): Promise<Response> {
  const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""), key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (u.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname) || key.length < 30) throw new Error("RATE_CONFIGURATION");
  return fetch(u.origin + "/storage/v1" + path, { method, headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": raw ? "application/octet-stream" : "application/json", "x-upsert": "false" }, body: body === undefined ? undefined : raw ? new Uint8Array([1]) : JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(3500) });
}
function duplicate(r: Response, value: unknown): boolean {
  if (![400,409].includes(r.status) || !value || typeof value !== "object") return false;
  const e = value as {code?: string; error?: string; message?: string};
  return ["ResourceAlreadyExists","KeyAlreadyExists","already_exists","Duplicate"].some(s => s === e.code || s === e.error) || e.message === "The resource already exists" || e.message === "Asset Already Exists";
}
// Reservas atômicas compartilhadas por todas as instâncias: duas por janela fixa de dez segundos.
export async function distributedAttempt(request: Request, r: Registry, now = Date.now()): Promise<{allowed: boolean; retryAfter: number}> {
  const ip = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim().slice(0,80);
  const day = new Date(now).toISOString().slice(0,10), pseudonym = createHmac("sha256",r.sessionKey).update("ab-studies:rate:v1\0"+day+"\0"+ip).digest("hex").slice(0,32);
  const window = Math.floor(now/10000), retryAfter = Math.max(1,Math.ceil(((window+1)*10000-now)/1000));
  for(let slot=0;slot<2;slot++){
    const response=await storageCall(`/object/${RATE_BUCKET}/${day}/${pseudonym}-${window}-${slot}.bin`,"POST",1,true);
    if(response.ok){await response.arrayBuffer();return {allowed:true,retryAfter:0};}
    const detail:unknown=await response.json().catch(()=>null);if(!duplicate(response,detail))throw new Error("RATE_UNAVAILABLE");
  }
  return {allowed:false,retryAfter};
}
export async function purgeExpired(now=Date.now()): Promise<{removed:number;more:boolean}> {
  const today=new Date(now).toISOString().slice(0,10),started=Date.now();let removed=0;
  const response=await storageCall(`/object/list/${RATE_BUCKET}`,"POST",{prefix:"",limit:100,offset:0,sortBy:{column:"name",order:"asc"}});
  if(!response.ok)throw new Error("PURGE_UNAVAILABLE");const roots:unknown=await response.json();if(!Array.isArray(roots))throw new Error("PURGE_INVALID");
  for(const row of roots){
    const day=row?.name;if(typeof day!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(day)||day>=today)continue;
    while(removed<5000&&Date.now()-started<35000){
      const list=await storageCall(`/object/list/${RATE_BUCKET}`,"POST",{prefix:day+"/",limit:500,offset:0,sortBy:{column:"name",order:"asc"}});
      if(!list.ok)throw new Error("PURGE_UNAVAILABLE");const data:unknown=await list.json();if(!Array.isArray(data))throw new Error("PURGE_INVALID");
      const names=data.filter(x=>typeof x?.name==="string"&&/^[a-f0-9]{32}-\d+-[01]\.bin$/.test(x.name)).map(x=>day+"/"+x.name);if(!names.length)break;
      const deleted=await storageCall(`/object/${RATE_BUCKET}`,"DELETE",{prefixes:names});if(!deleted.ok)throw new Error("PURGE_UNAVAILABLE");await deleted.arrayBuffer();removed+=names.length;
    }
    if(removed>=5000||Date.now()-started>=35000)return {removed,more:true};
  }
  return {removed,more:roots.length===100};
}
