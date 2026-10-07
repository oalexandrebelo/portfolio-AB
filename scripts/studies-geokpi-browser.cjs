const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {brotliDecompressSync}=require('node:zlib');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.AB_TEST_ORIGIN||'https://alexandrebelo.com.br';
const code=process.env.AB_STUDY_TEST_CODE;
const local=process.env.AB_LOCAL_UI_ROOT;
if(!code||code.length<20)throw new Error('Informe AB_STUDY_TEST_CODE no ambiente, nunca no código.');
let count=0;const passed=[];function check(value,label){assert.ok(value,label);count++;passed.push(label);}
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[];
 const makeContext=async()=>{const c=await browser.newContext({viewport:{width:1440,height:1080}});
  if(local){
   const text=fs.readFileSync(path.join(local,'lib/estudos/census.generated.ts'),'utf8');
   const encoded=JSON.parse(text.match(/CENSUS_B64=("[^"]+")/)[1]);const census=JSON.parse(brotliDecompressSync(Buffer.from(encoded,'base64')));
   // Somente instrumentação local: acrescenta a fonte pública IBGE e troca assets próprios.
   // O formulário e a autorização continuam usando o servidor real sem interferência.
   await c.addInitScript(census=>{let data;Object.defineProperty(window,'AB_GEO',{configurable:true,get(){return data;},set(value){data={...value,census};}});},census);
   await c.route('**/study-assets/map.js',r=>r.fulfill({path:path.join(local,'public/study-assets/map.js'),contentType:'text/javascript'}));
   await c.route('**/study-assets/map.css',r=>r.fulfill({path:path.join(local,'public/study-assets/map.css'),contentType:'text/css'}));
  }
  return c;
 };
 const login=async(p)=>{await p.locator('[name=password]').fill(code);const [r]=await Promise.all([p.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/estudos/acessar')),p.locator('button[type=submit]').click()]);check(r.status()===303,'senha correta gera redirecionamento');await p.locator('[data-tab=mapa]').waitFor();check(new URL(p.url()).pathname==='/estudos/sinop','senha seleciona exclusivamente Sinop');};
 try{
  for(const entry of [origin+'/estudos/sinop',origin+'/blog',origin.replace('://','://www.')+'/estudos/sinop']){
   const c=await makeContext(),p=await c.newPage();await p.goto(entry);if(entry.endsWith('/blog'))await p.getByRole('link',{name:'Estudos',exact:true}).click();await login(p);await c.close();
  }
  const context=await makeContext(),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|React|TypeError|ReferenceError/i.test(m.text()))errors.push(m.text().slice(0,250));});
  await page.goto(origin+'/estudos');await page.locator('[name=password]').fill('INVALID-CREDENTIAL-FOR-GEOKPI');
  const [wrong]=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'),page.locator('button[type=submit]').click()]);check(wrong.status()===401,'senha incorreta bloqueada');await login(page);
  await page.locator('[data-tab=mapa]').click();await page.waitForFunction(()=>!!document.querySelector('iframe')?.contentWindow?.__AB_GEO_KPI);
  const frame=page.frames().find(f=>new URL(f.url()||'about:blank').pathname==='/estudos/sinop/mapa');assert.ok(frame);
  await frame.waitForFunction(()=>window.__AB_MAP_READY===true);
  check(await frame.locator('.geo-workspace').count()===1,'workspace integrado dentro do estudo');
  check(await frame.evaluate(()=>window.__AB_GEO_KPI.rows.length===329),'329 setores de Sinop');
  check(await frame.locator('.kpi-strip').first().innerText().then(s=>s.includes('66.569')&&s.includes('190.451')),'totais do recorte censitário Sinop');
  check(await frame.locator('canvas').count()>0,'MapCN renderiza geometrias no canvas');console.log('RANK_SINOP '+JSON.stringify((await frame.locator('.rank-row').allTextContents()).slice(0,3)));
  check(await frame.locator('.contribution .track i').evaluateAll(nodes=>nodes.some(n=>n.getBoundingClientRect().width>5)),'barras usam larguras CSS numéricas válidas');
  const id=await frame.locator('.rank-row').nth(2).getAttribute('data-sector');await frame.locator('.rank-row').nth(2).click();
  check(await frame.locator('.inspector>code').innerText()===id,'ranking seleciona o mesmo setor no inspetor');
  check(await frame.evaluate(id=>window.__AB_GEO_KPI.selected===id,id),'seleção compartilhada pelos gráficos');
  await frame.locator('#metric').selectOption('density');check(await frame.locator('.map-legend>b').innerText().then(s=>s.includes('Densidade')),'legenda acompanha o KPI do mapa');
  await frame.locator('#metric').selectOption('score');await frame.locator('#city').selectOption('sorriso');await frame.waitForFunction(()=>window.__AB_GEO_KPI.rows.length===141);
  check(await frame.locator('.kpi-strip').first().innerText().then(s=>s.includes('34.515')&&s.includes('103.010')),'totais do recorte censitário Sorriso');
  console.log('RANK_SORRISO '+JSON.stringify((await frame.locator('.rank-row').allTextContents()).slice(0,3)));await frame.locator('#city').selectOption('regiao');await frame.waitForFunction(()=>window.__AB_GEO_KPI.rows.length===470);check(true,'470 setores na comparação');
  await frame.locator('#search').fill('ZZZ-SEM-RESULTADO-VALIDADO');await frame.waitForFunction(()=>window.__AB_GEO_KPI.rows.length===0);check(await frame.locator('.inspector').innerText().then(s=>s.includes('Nenhum setor')),'filtro vazio sem dados inventados');
  await frame.locator('#search').fill('');await frame.locator('#city').selectOption('sinop');await frame.locator('#metric').selectOption('score');
  await frame.locator('#profile').selectOption('residencial');await frame.waitForFunction(()=>window.__AB_GEO_KPI.rows[0]?.profile==='residencial');check(true,'pesos mudam com a tese de entrada');
  const price=frame.locator('#p-arpu');await price.fill('159');await price.press('Enter');await frame.waitForFunction(()=>window.__AB_GEO_KPI.parameters.arpu===159);check(true,'alteração de ARPU recalcula o modelo');
  await frame.locator('.sensitivity button[data-price="139"][data-takeup="0.35"]').click();await frame.waitForFunction(()=>window.__AB_GEO_KPI.parameters.arpu===139&&window.__AB_GEO_KPI.parameters.penetration===.35);
  check(await frame.locator('#metric').inputValue()==='npv','matriz de sensibilidade aplica premissas ao mapa');
  check(await frame.locator('.map-legend>b').innerText().then(s=>s.includes('VPL')),'mapa econômico usa a mesma simulação');
  await price.fill('99999');await price.press('Enter');check(await price.getAttribute('aria-invalid')==='true','entrada fora de faixa é rejeitada');check(await frame.evaluate(()=>window.__AB_GEO_KPI.parameters.arpu===139),'valor inválido não contamina cálculos');await price.fill('139');await price.press('Enter');
  check(await frame.locator('.kpi-register tbody tr').count()===20,'20 KPIs documentados e qualificados');
  const [download]=await Promise.all([page.waitForEvent('download'),frame.getByRole('button',{name:'Exportar análise ↗',exact:true}).click()]);check(download.suggestedFilename().endsWith('.json'),'exportação de premissas e indicadores');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(750);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'sem overflow horizontal no dashboard móvel');
  check(await frame.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'sem overflow horizontal no infográfico móvel');
  if(!local)check(await frame.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+8),'iframe cobre todo o conteúdo móvel');
  const cross=await context.request.post(origin+'/estudos/acessar',{headers:{origin:'https://invalid.example','sec-fetch-site':'cross-site'},form:{password:code}});check(cross.status()===403,'origem externa continua bloqueada');
  await context.request.post(origin+'/estudos/sair',{headers:{origin,'sec-fetch-site':'same-origin'}});
  const noSession=await context.request.get(origin+'/estudos/sinop/mapa');check(noSession.status()===401,'mapa bloqueado depois de sair');
  check(!(await noSession.text()).includes('window.AB_GEO='),'nenhum payload geográfico sem sessão');
  check(errors.length===0,'sem erros JavaScript ou CSP');
  const output=process.env.AB_TEST_OUTPUT;if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'geokpi-browser.json'),JSON.stringify({mode:local?'assets locais sobre autorização real':'produção',at:new Date().toISOString(),checks:count,passed,errors},null,2));}
  console.log(JSON.stringify({mode:local?'local com dados públicos novos':'produção',checks:count,passed,errors}));await context.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error('GeoKPI: '+e.message);process.exitCode=1;});
