import {readFile,writeFile} from 'node:fs/promises';
async function replace(file,before,after){const value=await readFile(file,'utf8');if(value.split(before).length!==2)throw new Error('REVIEW_ANCHOR '+file);await writeFile(file,value.replace(before,()=>after));}
await replace('lib/allinone/handler.ts',"if(!p.length){const token=createCsrf(c,a.id),html=shell(token),h=responseHeaders(html);", "if(!p.length){const prior=getCookie(req,CSRF_COOKIE),token=validateCsrf(prior,prior,c,a.id)?prior:createCsrf(c,a.id),html=shell(token),h=responseHeaders(html);");
await replace('public/allinone-assets/app.js',"F('sha256','SHA-256 verificado')","F('sha256','SHA-256 informado')");
await replace('public/allinone-assets/app.js',"$('#editor-error').textContent=error.message;", "$('#editor-error').textContent=error.message+(state.editor?.fingerprint?' Comando: '+state.editor.command+'. Ao repetir sem mudar os campos, este identificador é preservado.':'');");
const css='\n/* Revisão de navegação, métricas e estados sem estilos inline. */\n.sidebar nav{min-height:0;overflow-y:auto;scrollbar-width:thin}.sidebar-bottom{flex-shrink:0}.brand,.sidebar-caption{flex-shrink:0}progress{display:block;width:100%;height:7px;margin-top:8px;appearance:none;border:0;border-radius:2px;overflow:hidden;background:#243244}progress::-webkit-progress-bar{background:#243244}progress::-webkit-progress-value{background:#729cba}progress::-moz-progress-bar{background:#729cba}.configuration-panel{margin-top:22px}.table-shell td a{margin-right:8px}\n';
await writeFile('public/allinone-assets/app.css',(await readFile('public/allinone-assets/app.css','utf8'))+css);
const pkg=JSON.parse(await readFile('package.json','utf8'));
if(pkg.scripts.prebuild.includes('allinone'))throw new Error('ALREADY_REVIEWED');
pkg.scripts.prebuild+=' && tsc -p tsconfig.allinone.json && node --check public/allinone-assets/app.js && node scripts/allinone-verify.cjs';
pkg.scripts['test:allinone']='tsc -p tsconfig.allinone.json && node scripts/allinone-verify.cjs';
await writeFile('package.json',JSON.stringify(pkg,null,2)+'\n');
await writeFile('.gitignore',(await readFile('.gitignore','utf8'))+'\n# Saídas administrativas locais; sem credenciais versionadas\n/.allinone-test/\n/.allinone-private/\n/allinone-evidence/\n');
console.log('Revisão administrativa aplicada. Nenhuma chave ou cadastro foi alterado.');
