import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {brotliCompressSync,constants} from 'node:zlib';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'study-map/package.json'));
const {unzipSync}=require('fflate'),shapefile=require('shapefile');
const SOURCE='https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/setores/shp/UF/MT/MT_setores_CD2022.zip';
const SHA='6c83cf0d0e2cdff4e70c4c4fbf9937c19ba9d8deef6dfea1e4d04c900f4444e0';
const cache=path.join(root,'node_modules/.cache/ab-census/mt.zip');
const digest=b=>createHash('sha256').update(b).digest('hex');
let bytes;
try{bytes=await readFile(cache);if(digest(bytes)!==SHA)bytes=undefined;}catch{}
if(!bytes){
 for(let attempt=0;attempt<2;attempt++){
  try{const r=await fetch(SOURCE,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error('CENSUS_HTTP_'+r.status);if(Number(r.headers.get('content-length'))>35000000)throw new Error('CENSUS_SIZE');bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>35000000||digest(bytes)!==SHA)throw new Error('CENSUS_SOURCE_CHANGED');break;}
  catch(e){if(attempt===1)throw e;await new Promise(r=>setTimeout(r,1500));}
 }
 await mkdir(path.dirname(cache),{recursive:true});await writeFile(cache,bytes);
}
const files=unzipSync(bytes),prefix='MT_setores_CD2022';
const ab=x=>x.buffer.slice(x.byteOffset,x.byteOffset+x.byteLength);
const source=await shapefile.open(ab(files[prefix+'.shp']),ab(files[prefix+'.dbf']),{encoding:'utf-8'});
const features=[];
for(;;){const next=await source.read();if(next.done)break;const f=next.value,p=f.properties;
 if(!['Sinop','Sorriso'].includes(p.NM_MUN)||p.NM_DIST!==p.NM_MUN||p.SITUACAO!=='Urbana')continue;
 if(!['Polygon','MultiPolygon'].includes(f.geometry.type))throw new Error('CENSUS_GEOMETRY');
 const numeric=k=>p[k]===null||p[k]===undefined?null:Number.isFinite(Number(p[k]))?Number(p[k]):null;
 const coords=f.geometry.coordinates.flat(f.geometry.type==='Polygon'?1:2),xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
 const bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 const homes=numeric('v0007'),people=numeric('v0001'),area=numeric('AREA_KM2');
 if(area===null||area<=0||homes!==null&&homes<0||people!==null&&people<0)throw new Error('CENSUS_RANGE');
 features.push({type:'Feature',geometry:f.geometry,properties:{id:p.CD_SETOR,city:p.NM_MUN==='Sinop'?'sinop':'sorriso',municipality:p.CD_MUN,district:p.CD_DIST,neighborhood:p.NM_BAIRRO||null,areaHa:area*100,people,homes,totalHomes:numeric('v0002'),privateHomes:numeric('v0003'),meanResidents:numeric('v0005'),imputedShare:numeric('v0006'),bbox,center:[(bbox[0]+bbox[2])/2,(bbox[1]+bbox[3])/2]}});
}
features.sort((a,b)=>a.properties.id.localeCompare(b.properties.id));
if(features.length!==470||new Set(features.map(f=>f.properties.id)).size!==470)throw new Error('CENSUS_COHORT_CHANGED');
const totals=Object.fromEntries(['sinop','sorriso'].map(city=>{const fs=features.filter(f=>f.properties.city===city);return[city,{sectors:fs.length,people:fs.reduce((s,f)=>s+(f.properties.people??0),0),homes:fs.reduce((s,f)=>s+(f.properties.homes??0),0)}]}));
if(totals.sinop.homes!==66569||totals.sorriso.homes!==34515)throw new Error('CENSUS_TOTALS_CHANGED');
const value={schema:1,referenceYear:2022,release:'2024-11-13',sourceUrl:SOURCE,sha256:SHA,crs:'SIRGAS 2000; coordenadas geográficas originais',scope:'Setores urbanos do distrito-sede no Censo 2022. Não é população municipal total nem estimativa de 2026.',variables:{people:'v0001',homes:'v0007: Domicílios Particulares Ocupados (DPPO + DPIO)',privateHomes:'v0003',imputedShare:'v0006: fração de DPO imputados',areaHa:'AREA_KM2 × 100'},totals,collection:{type:'FeatureCollection',features}};
const json=JSON.stringify(value),packed=brotliCompressSync(Buffer.from(json),{params:{[constants.BROTLI_PARAM_QUALITY]:9}}).toString('base64');
const output=path.join(root,'lib/estudos/census.generated.ts');
await writeFile(output+'.tmp','// Gerado no build a partir da fonte pública IBGE verificada. Nunca importar no cliente.\nexport const CENSUS_B64='+JSON.stringify(packed)+';\n');await rename(output+'.tmp',output);
console.log('censo: fonte íntegra; '+features.length+' setores; '+Buffer.byteLength(json)+' bytes; '+JSON.stringify(totals));
