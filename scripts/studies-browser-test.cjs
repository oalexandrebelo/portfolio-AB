const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://alexandrebelo.com.br';
const password=process.env.AB_STUDY_TEST_CODE;
if(!password||password.length<20)throw new Error('Configure AB_STUDY_TEST_CODE fora do código.');
const dir=process.env.AB_TEST_OUTPUT||'/tmp/ab-studies-evidence';
const checks=[];
const check=(value,name)=>{assert.ok(value,name);checks.push(name);};
async function login(page){
 await page.locator('[name=password]').fill(password);
 const [post]=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'),page.locator('button[type=submit]').click()]);
 check(post.status()===303,'login retorna 303');
 await page.waitForURL(url=>url.pathname==='/estudos/sinop');
 await page.waitForFunction(()=>!!window.PRECOMPUTED);
 check(await page.locator('[name=password]').count()===0,'conteúdo liberado após senha');
}
(async()=>{
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  for(const entry of ['/estudos','/estudos/sinop','/estudos/acessar','www','blog','home']){
   const context=await browser.newContext(),page=await context.newPage();
   try{
    if(entry==='www')await page.goto('https://www.alexandrebelo.com.br/estudos/sinop');
    else if(entry==='home'){
     await page.goto(origin);await page.locator('a[href="/blog"]').first().click();await page.getByRole('link',{name:'Estudos',exact:true}).click();
    }else if(entry==='blog'){
     await page.goto(origin+'/blog');await page.getByRole('link',{name:'Estudos',exact:true}).click();
    }else await page.goto(origin+entry);
    check(await page.locator('[name=password]').count()===1,'formulário por '+entry);
    await login(page);check(new URL(page.url()).pathname==='/estudos/sinop','destino Sinop por '+entry);
   }finally{await context.close();}
  }
  const context=await browser.newContext({viewport:{width:1560,height:1040}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|Refused|violates/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto(origin+'/estudos');
   await page.locator('[name=password]').fill('invalid-credential-not-a-real-code');
   const [wrong]=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'),page.locator('button[type=submit]').click()]);
   check(wrong.status()===401,'senha incorreta bloqueada');check(await page.locator('.error').count()===1,'erro no formulário sem página branca');
   await login(page);
   await page.locator('[data-tab=mapa]').click();
   await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__AB_MAP_READY===true);
   const frame=page.frames().find(f=>new URL(f.url()).pathname==='/estudos/sinop/mapa');check(!!frame,'mapa autenticado dentro do dashboard');
   await frame.waitForTimeout(1800);
   check(await frame.locator('.metrics article strong').first().innerText()==='101','recorte Sinop 101 registros');
   const size=await frame.locator('canvas').boundingBox();check(size&&size.width>250&&size.height>300,'canvas dimensionado');
   check(await frame.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(17, 24, 32)','CSS do mapa aplicado');
   await frame.locator('#city').selectOption('sorriso');
   await frame.waitForTimeout(900);
   check(await frame.locator('.metrics article strong').first().innerText()==='212','recorte Sorriso 212 registros');
   await frame.locator('#search').fill('zzz-sem-registro');check(await frame.locator('.metrics article strong').first().innerText()==='0','busca vazia sem dados fabricados');
   await frame.getByRole('button',{name:'Restaurar recorte'}).click();
   await frame.getByLabel('Mapa de calor',{exact:true}).uncheck();check(!(await frame.getByLabel('Mapa de calor',{exact:true}).isChecked()),'calor pode ser desligado');
   await frame.getByLabel('Mapa de calor',{exact:true}).check();
   await frame.locator('tbody button').first().click();check(await frame.locator('.source-link').count()===1,'inspeção abre fonte do objeto');
   const [download]=await Promise.all([page.waitForEvent('download'),frame.getByRole('button',{name:'Exportar recorte'}).click()]);
   check(download.suggestedFilename().endsWith('.geojson'),'exportação GeoJSON');
   await page.screenshot({path:path.join(dir,'map-desktop.png'),fullPage:true});
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1200);
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'dashboard sem overflow horizontal mobile');
   check(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'mapa sem overflow horizontal mobile');
   check(await frame.evaluate(()=>parseFloat(window.frameElement.style.height)>=document.getElementById('map-root').getBoundingClientRect().height),'altura responsiva do iframe');
   await page.screenshot({path:path.join(dir,'map-mobile.png'),fullPage:true});
   const other=await context.request.get(origin+'/estudos/estudo-inexistente/mapa');check(other.status()===401,'sessão não libera outro estudo');
   const foreign=await context.request.post(origin+'/estudos/acessar',{headers:{origin:'https://evil.example','sec-fetch-site':'cross-site'},form:{password,csrf:'invalido'}});check(foreign.status()===403,'POST externo rejeitado');
   const logout=await context.request.post(origin+'/estudos/sair',{headers:{origin,'sec-fetch-site':'same-origin'},maxRedirects:0});check(logout.status()===303,'encerramento de sessão');
   const blocked=await context.request.get(origin+'/estudos/sinop/mapa');check(blocked.status()===401,'mapa bloqueado após sair');
   check(errors.length===0,'sem erros JavaScript ou CSP nos estudos');
  }finally{await context.close();}
  const anonymous=await browser.newContext();try{for(const variant of ['', '/mapa','/relatorio','/estudo.md','/painel.html']){const r=await anonymous.request.get(origin+'/estudos/sinop'+variant);check(r.status()===401,'anônimo bloqueado '+variant);check(!(await r.text()).includes('window.AB_GEO='),'dados não entregues anonimamente '+variant);}}finally{await anonymous.close();}
  const result={at:new Date().toISOString(),origin,checks:checks.length,passed:checks};fs.writeFileSync(path.join(dir,'checks.json'),JSON.stringify(result,null,2),{mode:0o600});
  console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error('Teste de navegador reprovado: '+e.message);process.exitCode=1;});
