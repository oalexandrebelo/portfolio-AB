import {readFile,writeFile} from 'node:fs/promises';
async function patch(file,changes){let text=await readFile(file,'utf8');for(const [before,after] of changes){if(!text.includes(before))throw new Error('PATCH_ANCHOR: '+file);text=text.replace(before,after);}await writeFile(file,text);}
await patch('study-map/charts.tsx',[
 ["width:percent(c.contribution===null?0:c.contribution/Math.max(.001,c.weight*100))","width:String(c.contribution===null?0:c.contribution/Math.max(.001,c.weight*100)*100)+'%'"],
 ["width:percent(row.counts[k]/max)","width:String(row.counts[k]/max*100)+'%'"],
]);
await patch('study-map/workspace.tsx',[
 ["width:percent((c.contribution??0)/100)","width:String(c.contribution??0)+'%'"],
 ["Os 329 setores de Sinop somam 66.569 DPO e 190.451 pessoas. Os 141 de Sorriso somam 34.515 DPO e 103.010 pessoas.","Os {data.census.totals.sinop.sectors} setores de Sinop somam {num(data.census.totals.sinop.homes)} DPO e {num(data.census.totals.sinop.people)} pessoas. Os {data.census.totals.sorriso.sectors} de Sorriso somam {num(data.census.totals.sorriso.homes)} DPO e {num(data.census.totals.sorriso.people)} pessoas."],
 ["<ContributionBars row={row}/>","<p className=\"fine\">DPO imputados no Censo: {percent(row.imputedShare)}. Domicílios particulares totais: {num(row.privateHomes)}. A diferença para ocupados inclui categorias distintas, não novas vendas.</p><ContributionBars row={row}/>"],
]);
await patch('scripts/studies-map-install.mjs',[
 ["execFileSync(process.execPath,['study-map/analytics.test.mjs'],{stdio:'inherit'});","execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','study-map/tsconfig.json'],{stdio:'inherit'});\nexecFileSync(process.execPath,['study-map/analytics.test.mjs'],{stdio:'inherit'});"],
]);
await patch('study-map/analytics.mjs',[
 ['Fluxo operacional incremental nominal constante, 120 meses, sem valor terminal.','Fluxo operacional incremental sem reajustes de preços e custos, 120 meses, sem valor terminal.']
]);
console.log('Ajustes pontuais aplicados a quatro arquivos; nenhum dado privado ou configuração de acesso foi alterado.');
