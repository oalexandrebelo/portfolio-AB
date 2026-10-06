import {readFile} from 'node:fs/promises';
// Verificação local e reproduzível. Nenhuma dependência de servidores temporários ou mutação de código.
const source=await readFile('study-map/vendor/map.tsx','utf8');
const license=await readFile('study-map/vendor/LICENSE-mapcn.txt','utf8');
const provenance=JSON.parse(await readFile('study-map/vendor/provenance.json','utf8'));
const geo=JSON.parse(await readFile('private-studies/sinop/geo.json','utf8'));
if(provenance.commit!=='d160bd767bc6388618720c6038a4dd9948c97362'||!source.includes('/study-assets/maplibre-gl-worker.mjs')||!license.includes('MIT'))throw new Error('MAPCN_SOURCE_INVALID');
if(geo.schema!==1||geo.slug!=='sinop'||typeof geo.data!=='string'||Buffer.from(geo.data,'base64').length<29)throw new Error('GEO_ENVELOPE_INVALID');
console.log('MapCN, licença e envelope cartográfico verificados localmente.');
