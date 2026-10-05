import {createDecipheriv,createHash} from "node:crypto";
import {brotliDecompressSync} from "node:zlib";
import {ENVELOPES} from "./envelopes";
import type {Entry} from "./security";
type Bundle={schema:number;slug:string;dashboard:string;report:string;markdown:string;body:string};
const cache=new Map<string,Readonly<Bundle>>();
export function openStudy(e:Entry): Readonly<Bundle> {
  const chunks=ENVELOPES[e.slug];if(!chunks)throw new Error("STUDY_UNAVAILABLE");
  const cacheKey=e.slug+":"+createHash("sha256").update(e.dataKey).digest("hex"),old=cache.get(cacheKey);if(old)return old;
  const packed=Buffer.from(chunks.join(""),"base64");if(packed.length<29||packed.length>2000000)throw new Error("STUDY_INVALID");
  const decipher=createDecipheriv("aes-256-gcm",Buffer.from(e.dataKey,"hex"),packed.subarray(0,12));decipher.setAAD(Buffer.from("ab-study:v1:"+e.slug));decipher.setAuthTag(packed.subarray(12,28));
  const bytes=brotliDecompressSync(Buffer.concat([decipher.update(packed.subarray(28)),decipher.final()]),{maxOutputLength:5000000});const b=JSON.parse(bytes.toString("utf8")) as Bundle;
  if(b.schema!==2||b.slug!==e.slug||![b.dashboard,b.report,b.markdown,b.body].every(v=>typeof v==="string"&&v.length>100))throw new Error("STUDY_INVALID");
  for(const [name,value] of Object.entries({REPORT_BODY:b.body,REPORT_MD:b.markdown,REPORT_HTML:b.report})){
    const marker="window."+name+"=null;";if(!b.dashboard.includes(marker))throw new Error("STUDY_INVALID");
    b.dashboard=b.dashboard.replace(marker,"window."+name+"="+JSON.stringify(value).replaceAll("<","\\u003c").replaceAll("\u2028","\\u2028").replaceAll("\u2029","\\u2029")+";");
  }
  if(cache.size>=4)cache.delete(cache.keys().next().value as string);cache.set(cacheKey,Object.freeze(b));return b;
}
