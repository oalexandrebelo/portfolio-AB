import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCipheriv,randomBytes,createHash} from 'node:crypto';
import {brotliCompressSync} from 'node:zlib';
// Coleta editorial, nunca executada por requisição de um visitante.
const source=process.argv[2],destination=process.argv[3];
if(!source||!destination||!/^([a-f0-9]{64})$/.test(process.env.AB_STUDIES_GEO_KEY??''))throw new Error('GEO_CONFIGURATION');
const raw=JSON.parse(await readFile(source,'utf8'));
if(!Array.isArray(raw.elements)||raw.remark)throw new Error('GEO_INCOMPLETE_SOURCE');
const groups={educacao:['school','university','college','kindergarten','childcare','language_school','music_school','library'],saude:['hospital','clinic','doctors','dentist','pharmacy','nursing_home'],servicos:['bank','post_office','fuel','car_rental','car_wash','marketplace','driving_school'],consumo:['restaurant','fast_food','cafe','pub','bar','ice_cream','food_court'],comunidade:['townhall','courthouse','police','fire_station','community_centre','social_centre','arts_centre','events_venue','conference_centre','cinema']};
const features=[],ids=new Set();
for(const e of raw.elements){
 const category=Object.entries(groups).find(([,values])=>values.includes(e.tags?.amenity))?.[0],p=e.center??e,id=e.type+'/'+e.id;
 if(!category||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||ids.has(id))continue;
 const city=p.lat>-12?'sinop':'sorriso';
 if(!((city==='sinop'&&p.lat>=-11.92&&p.lat<=-11.80&&p.lon>=-55.56&&p.lon<=-55.45)||(city==='sorriso'&&p.lat>=-12.58&&p.lat<=-12.49&&p.lon>=-55.78&&p.lon<=-55.66)))continue;
 ids.add(id);features.push({type:'Feature',id,geometry:{type:'Point',coordinates:[p.lon,p.lat]},properties:{id,name:String(e.tags.name||e.tags.brand||e.tags.amenity).slice(0,160),category,amenity:e.tags.amenity,city,position:e.type==='node'?'coordenada OSM':'centro da geometria OSM'}});
}
if(features.length<2||features.length>10000)throw new Error('GEO_SAMPLE_INVALID');
const data={schema:1,source:'OpenStreetMap / Overpass',sourceUrl:'https://overpass-api.de/api/interpreter',license:'ODbL 1.0 — © OpenStreetMap contributors',capturedAt:new Date().toISOString(),baseTimestamp:raw.osm3s?.timestamp_osm_base,method:'Registros amenity em duas janelas urbanas. Peso unitário por registro. Coordenadas de áreas usam centro da geometria. Não equivalem a empresas únicas, clientes, renda ou demanda. Sem verificação de campo.',bounds:{sinop:[-55.56,-11.92,-55.45,-11.80],sorriso:[-55.78,-12.58,-55.66,-12.49]},rawCount:raw.elements.length,collection:{type:'FeatureCollection',features}};
const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(process.env.AB_STUDIES_GEO_KEY,'hex'),iv);
cipher.setAAD(Buffer.from('ab-study-map:v1:sinop'));
const bytes=Buffer.concat([cipher.update(brotliCompressSync(Buffer.from(JSON.stringify(data)))),cipher.final()]);
const box=JSON.stringify({schema:1,slug:'sinop',data:Buffer.concat([iv,cipher.getAuthTag(),bytes]).toString('base64')});
await mkdir(new URL('.', 'file://'+destination),{recursive:true});
await writeFile(destination,box,{mode:0o600});
console.log(JSON.stringify({features:features.length,byCity:Object.fromEntries(['sinop','sorriso'].map(c=>[c,features.filter(f=>f.properties.city===c).length])),bytes:box.length,sha256:createHash('sha256').update(box).digest('hex')}));
