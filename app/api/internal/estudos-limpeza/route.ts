import {safeEqual} from "@/lib/estudos/security";
import {purgeExpired} from "@/lib/estudos/storage";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request:Request):Promise<Response>{
 const secret=process.env.CRON_SECRET??"",headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
 if(secret.length<32||!safeEqual(request.headers.get("authorization")??"","Bearer "+secret))return new Response(null,{status:401,headers});
 try{return Response.json(await purgeExpired(),{headers});}catch{console.error("estudos: limpeza do limitador indisponivel");return new Response(null,{status:503,headers});}
}
