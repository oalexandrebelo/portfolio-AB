import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const pin='d160bd767bc6388618720c6038a4dd9948c97362';
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('SOURCE_HTTP_'+r.status);return Buffer.from(await r.arrayBuffer());}
const registry=await get('https://raw.githubusercontent.com/AnmolSaini16/mapcn/'+pin+'/public/r/map.json');
if(createHash('sha1').update('blob '+registry.length+'\0').update(registry).digest('hex')!=='686e2dbad6b0e0dcbad593700131e31f64485bf3')throw new Error('MAPCN_INTEGRITY');
const parsed=JSON.parse(registry.toString()),source=parsed.files[0].content;
if(!source.includes('https://unpkg.com/maplibre-gl@'))throw new Error('MAPCN_WORKER_ANCHOR');
await mkdir('study-map/vendor',{recursive:true});
await writeFile('study-map/vendor/map.tsx',source.replace(/`https:\/\/unpkg\.com\/maplibre-gl@\$\{MapLibreGL\.getVersion\(\)\}\/dist\/maplibre-gl-worker\.mjs`/,'"/study-assets/maplibre-gl-worker.mjs"'));
const license=await get('https://raw.githubusercontent.com/AnmolSaini16/mapcn/'+pin+'/LICENSE');await writeFile('study-map/vendor/LICENSE-mapcn.txt',license);
await writeFile('study-map/vendor/provenance.json',JSON.stringify({project:'MapCN',commit:pin,registryBlobSha:'686e2dbad6b0e0dcbad593700131e31f64485bf3',modifications:['Web Worker hospedado na mesma origem'],license:'MIT'},null,2));
const geo=await get('https://sb-5118uj7zo2pl.vercel.run/geo.json');
if(createHash('sha256').update(geo).digest('hex')!=='586eb69402da061f3c9e61685e6565e7a93f3a06b57cad117e195f09b73b0b71')throw new Error('GEO_INTEGRITY');
await writeFile('private-studies/sinop/geo.json',geo);
execFileSync('node',['scripts/studies-access-configure.mjs'],{stdio:'inherit'});
let handler=await readFile('lib/estudos/handler.ts','utf8');
if(!handler.includes('enhanceDashboard')){
 handler="import {enhanceDashboard,mapResponse} from './map';\n"+handler;
 handler=handler.replace('const variant=path[1]??"";', 'const variant=path[1]??"";\n   if(variant==="mapa"&&session.slug==="sinop")return mapResponse(session.slug);');
 handler=handler.replace('b.markdown:b.dashboard,headers=responseHeaders', 'b.markdown:variant===""?enhanceDashboard(b.dashboard,session.slug):b.dashboard,headers=responseHeaders');
 handler=handler.replace('if(variant==="estudo.md"){', 'if(variant==="")headers.set("Content-Security-Policy",(headers.get("Content-Security-Policy")??"").replace("frame-src \'none\'","frame-src \'self\'"));\n    if(variant==="estudo.md"){');
 await writeFile('lib/estudos/handler.ts',handler);
}
let test=await readFile('scripts/studies-verify.mjs','utf8');
if(!test.includes('enhanceDashboard')){
 test=test.replace("const {openStudy}=require('../.studies-test/lib/estudos/vault.js');", "const {openStudy}=require('../.studies-test/lib/estudos/vault.js');\nconst {enhanceDashboard}=require('../.studies-test/lib/estudos/map.js');");
 test=test.replace('===openStudy(entry).dashboard','===enhanceDashboard(openStudy(entry).dashboard,entry.slug)');await writeFile('scripts/studies-verify.mjs',test);
}
const pkg=JSON.parse(await readFile('package.json','utf8'));
pkg.scripts.prebuild='node scripts/studies-map-install.mjs && tsc -p tsconfig.studies.json && node scripts/studies-verify.mjs && node scripts/studies-map-test.mjs';
await writeFile('package.json',JSON.stringify(pkg,null,2)+'\n');
execFileSync('npm',['install','--prefix','study-map','--package-lock-only','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
console.log('Fonte, lockfile, dados cifrados, acesso e integração preparados.');
