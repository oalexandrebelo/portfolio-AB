import {build} from 'esbuild';
import {mkdir,copyFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'../public/study-assets');
await mkdir(out,{recursive:true});
await build({absWorkingDir:root,entryPoints:['index.tsx'],outfile:path.join(out,'map.js'),bundle:true,minify:true,sourcemap:false,format:'iife',platform:'browser',target:['es2022'],jsx:'automatic',alias:{'@/lib/utils':path.join(root,'utils.ts')},define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',metafile:true}).then(async result=>{const inputs=Object.keys(result.metafile.inputs);if(!inputs.some(x=>x.endsWith('vendor/map.tsx')))throw new Error('MAPCN_NOT_BUNDLED');console.log('mapa: componente MapCN real incluído; '+Object.keys(result.metafile.outputs).length+' saídas.');});
for(const name of ['maplibre-gl-worker.mjs','maplibre-gl-shared.mjs'])await copyFile(path.join(root,'node_modules/maplibre-gl/dist',name),path.join(out,name));
const css=await readFile(path.join(out,'map.css'),'utf8');if(!css.includes('maplibregl-map'))throw new Error('MAP_CSS_MISSING');
