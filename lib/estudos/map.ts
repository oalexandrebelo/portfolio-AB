import {createDecipheriv,createHash} from 'node:crypto';
import {brotliDecompressSync} from 'node:zlib';
import envelope from '../../private-studies/sinop/geo.json';
import {responseHeaders} from './security';
import {censusData} from './census';
let cache:{fingerprint:string;value:unknown}|undefined;
export function mapData(slug:string):unknown{
 if(slug!=='sinop'||envelope.slug!==slug||envelope.schema!==1)throw new Error('MAP_UNAVAILABLE');
 const key=process.env.AB_STUDIES_GEO_KEY??'';if(!/^[a-f0-9]{64}$/.test(key))throw new Error('MAP_CONFIGURATION');
 const fingerprint=createHash('sha256').update(key).digest('hex');if(cache?.fingerprint===fingerprint)return cache.value;
 const bytes=Buffer.from(envelope.data,'base64');if(bytes.length<29||bytes.length>1500000)throw new Error('MAP_INVALID');
 const cipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),bytes.subarray(0,12));cipher.setAAD(Buffer.from('ab-study-map:v1:'+slug));cipher.setAuthTag(bytes.subarray(12,28));
 const text=brotliDecompressSync(Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]),{maxOutputLength:3000000}).toString('utf8');
 const value=JSON.parse(text);if(value.schema!==1||value.collection?.type!=='FeatureCollection'||!Array.isArray(value.collection.features)||value.collection.features.length>10000)throw new Error('MAP_INVALID');
 value.census=censusData();cache={fingerprint,value};return value;
}
export function mapResponse(slug:string):Response{
 const json=JSON.stringify(mapData(slug)).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
 // Mede o conteúdo, nunca o viewport, para evitar crescimento recursivo do iframe.
 const resize="(()=>{const root=document.getElementById('map-root');if(!root||window.parent===window)return;let pending=0;const measure=()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{try{const frame=window.frameElement;if(frame)frame.style.height=Math.min(20000,Math.max(600,Math.ceil(root.getBoundingClientRect().height)+4))+'px';}catch{}});};new ResizeObserver(measure).observe(root);window.addEventListener('load',measure);measure();})();";
 const html='<!doctype html><html lang="pt-BR" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Inteligência territorial e oportunidades | AB Estudos</title><link rel="stylesheet" href="/study-assets/map.css"></head><body><div id="map-root"></div><noscript>Ative o JavaScript para explorar o mapa. O estudo técnico continua disponível na navegação principal.</noscript><script>window.AB_GEO='+json+';</script><script defer src="/study-assets/map.js"></script><script>'+resize+'</script></body></html>';
 const headers=responseHeaders(html),base=headers.get('Content-Security-Policy')??'';
 headers.set('Content-Security-Policy',base.replace('script-src ',"script-src 'self' ").replace("style-src 'unsafe-inline'","style-src 'self' 'unsafe-inline'").replace("connect-src 'none'","connect-src 'self' https://*.cartocdn.com").replace("img-src 'self' data:","img-src 'self' data: blob: https://*.cartocdn.com").replace("frame-ancestors 'none'","frame-ancestors 'self'")+"; worker-src 'self' blob:");
 headers.set('X-Frame-Options','SAMEORIGIN');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), fullscreen=(self)');
 return new Response(html,{status:200,headers});
}
export function enhanceDashboard(raw:string,slug:string):string{
 if(slug!=='sinop')return raw;
 if(raw.includes('data-tab="mapa"'))return raw;
 const anchor='<button data-tab="executivo" type="button"><span>01</span>Visão executiva</button>';
 if(!raw.includes(anchor)||!raw.includes('const renderers={')||!raw.includes('textContent={executivo:'))throw new Error('MAP_DASHBOARD_ANCHOR');
 const frame='<div class="titleline"><div><div class="eyebrow">TERRITÓRIO / KPIs / CAPITAL</div><h1>Mapa de oportunidades</h1><p class="subtitle">Limites censitários, priorização explicável e simulação por bloco.</p></div><a href="/estudos/'+slug+'/mapa" target="_blank" rel="noopener">Expandir painel ↗</a></div><iframe title="Mapa de calor e oportunidades" src="/estudos/'+slug+'/mapa" style="display:block;width:100%;height:1950px;border:1px solid #2c3b4b;border-radius:8px;background:#111820" allow="fullscreen" allowfullscreen loading="eager"></iframe>';
 let html=raw.replace(anchor,anchor+'<button data-tab="mapa" type="button"><span>↗</span>Mapa de oportunidades</button>');
 html=html.replace('const renderers={','const renderers={mapa:()=>'+JSON.stringify(frame)+',');
 return html.replace('textContent={executivo:',"textContent={mapa:'Mapa de oportunidades',executivo:");
}
