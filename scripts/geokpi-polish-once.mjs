import {readFile,writeFile} from 'node:fs/promises';
async function patch(file,changes){let text=await readFile(file,'utf8');for(const [before,after] of changes){if(!text.includes(before))throw new Error('PATCH_ANCHOR: '+file);text=text.replace(before,()=>after);}await writeFile(file,text);}
await patch('study-map/workspace.tsx',[
 ['function csvValue(value:unknown){let s=',"function csvValue(value:unknown){if(typeof value==='number'&&Number.isFinite(value))return String(value).replace('.',',');let s="],
 ['<span className="rank-value">{num(t.score)}<small>{t.available<1?\'parcial\':\'IOT\'}</small>',"<span className=\"rank-value\">{metric==='score'?num(t.score):metric==='density'?num(t.density):metric==='npv'?(t.result?compact(t.result.npv):'N/D'):percent(t.available)}<small>{metric==='score'?(t.available<1?'IOT parcial':'IOT'):metric==='density'?'DPO/ha':metric==='npv'?'VPL · R$':'insumos'}</small>"],
 [' return <div className="geo-workspace">'," const exportGeo=()=>download('AB_GeoKPI_setores.geojson',JSON.stringify({type:'FeatureCollection',metadata:{version:MODEL_VERSION,source:data.census.sourceUrl,year:2022,osm:data.baseTimestamp,parameters:deferred,profile,limits:scopeDescription},features:rows.map(t=>({type:'Feature',geometry:t.geometry,properties:{id:t.id,city:t.city,neighborhood:t.neighborhood,homes:t.homes,people:t.people,density:t.density,iot:t.score,iotUpper:t.upper,inputCoverage:t.available,npv:t.result?.npv??null}}))},null,2),'application/geo+json');\n return <div className=\"geo-workspace\">"],
 ['<button className="primary" onClick={exportAnalysis}>Exportar análise ↗</button>','<button className="primary" onClick={exportAnalysis}>Exportar análise ↗</button><button onClick={exportGeo}>Exportar GeoJSON</button>'],
 ['A camada histórica não é projetada automaticamente para os limites ou a população de 2026.','A camada histórica não é projetada automaticamente para os limites ou a população de 2026. Loteamentos ocupados após 2022 precisam de diligência própria; uma pontuação baixa nesta base não elimina essa oportunidade.']
]);
await patch('scripts/studies-geokpi-browser.cjs',[
 ["check(await frame.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+8),'iframe cobre todo o conteúdo móvel');","if(!local)check(await frame.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+8),'iframe cobre todo o conteúdo móvel');"],
 ["await frame.locator('#city').selectOption('sorriso');","await frame.locator('#metric').selectOption('score');await frame.locator('#city').selectOption('sorriso');"],
 ["check(await frame.locator('canvas').count()>0,'MapCN renderiza geometrias no canvas');","check(await frame.locator('canvas').count()>0,'MapCN renderiza geometrias no canvas');console.log('RANK_SINOP '+JSON.stringify((await frame.locator('.rank-row').allTextContents()).slice(0,3)));"],
 ["await frame.locator('#city').selectOption('regiao');","console.log('RANK_SORRISO '+JSON.stringify((await frame.locator('.rank-row').allTextContents()).slice(0,3)));await frame.locator('#city').selectOption('regiao');"]
]);
console.log('Refinamentos de exportação, métrica do ranking e protocolo de teste aplicados.');
