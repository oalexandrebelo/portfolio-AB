"""Transformação de revisão executada uma vez sobre fontes verificadas; remover após integração."""
from pathlib import Path
import hashlib
import json
root=Path.cwd()
expected={
 'lib/allinone/ui.ts':'d7ad0f392e3d741853d6bf47010a07d85fa34f4eb89fa30a163c044ed9b8dd29',
 'public/allinone-assets/app.js':'22aae41fa3aeeeaf036d6d40814cd7cddec049c698a68550746cdd6c79008d66',
 'public/allinone-assets/app.css':'c8d7bb3566567f15ca0e2845c2ede0b590f0045568010efdb077db8e0902677c',
 'scripts/allinone-browser.cjs':'920c909d276c6fbab09a860c4d320e47cc13fa3dbaf5be03ca8a00061f009280',
 'lib/allinone/contracts.ts':'7f38b9cf628764c74fbe54c66cfaf841eaead869b4a2d4f2273e432cd7bbf7d2',
 'package.json':'80d99b76c3e07f710f77ae549b1f8dbf9ceb80ab32f00f62229e614f7b406b53'
}
for name,digest in expected.items():
 if hashlib.sha256((root/name).read_bytes()).hexdigest()!=digest: raise RuntimeError('Fonte divergente: '+name)
p=root/'lib/allinone/ui.ts';s=p.read_text()
s=s.replace('<div id="notice" role="status" aria-live="polite"></div>','<div id="notice" role="status" aria-live="polite"></div><div id="pending-command" role="status" aria-live="polite" hidden></div>')
s=s.replace('<script defer src="/allinone-assets/app.js"></script>','<script defer src="/allinone-assets/state.js"></script><script defer src="/allinone-assets/app.js"></script>')
p.write_text(s)
p=root/'public/allinone-assets/app.js';s=p.read_text()
s=s.replace(' const modules=',' const {minorToInput,inputToMinor,CommandIntent}=globalThis.ABAllinoneState;\n const modules=')
s=s.replace("['audit_log','⏱','Auditoria']","['audit_log','⏱','Auditoria'],['reconciliation','⤴','Reconciliação']")
s=s.replace('saving:false};','saving:false,loading:false,hasMore:false,editorEpoch:0,startEpoch:0,pending:null};')
s=s.replace('const errorText={',"const errorText={DATABASE_RESPONSE_INVALID:'A resposta do servidor não pôde ser validada. Uma gravação enviada pode ter sido confirmada: consulte o recibo ou repita exatamente o mesmo comando.',TRANSACTION_RETRY:'A transação foi recusada por concorrência ou limite. Repita o mesmo comando.',RECORD_FINALIZED:'O lançamento foi finalizado. Não altere seu valor ou identidade; registre uma correção separada ou cancele com justificativa.',EVENT_FINALIZED:'Evento confirmado ou estornado: identidade e valor não podem ser reescritos.',AUTH_BUSY:'Verificação de acesso ocupada. Aguarde alguns segundos.',")
a=s.index(' async function api(');b=s.index(' function notice(',a)
s=s[:a]+''' async function api(path,init={}){
  const mutating=init.method==='POST',timeout=AbortSignal.timeout(12000);
  const signal=init.signal?AbortSignal.any([init.signal,timeout]):timeout;
  let r,data;
  try{r=await fetch('/allinone/api/'+path,{cache:'no-store',credentials:'same-origin',...init,signal});data=await r.json();}
  catch(cause){if(cause.name==='AbortError'&&!mutating)throw cause;const e=new Error(mutating?'Resposta não confirmada. Não crie outra intenção antes de reconciliar este comando.':'A leitura falhou. Atualize a página.');e.uncertain=mutating;throw e;}
  if(!data||typeof data!=='object'||Array.isArray(data)){const e=new Error('Resposta inválida do servidor.');e.uncertain=mutating;throw e;}
  if(!r.ok){const e=new Error(errorText[data.error]||'Não foi possível concluir esta operação.');e.code=data.error;e.uncertain=typeof data.uncertain==='boolean'?data.uncertain:mutating&&r.status>=500;throw e;}
  if(mutating&&(!data.id||!data.tenant_id||!Number.isInteger(data.version))){const e=new Error('Confirmação de gravação inválida. Consulte o recibo do comando.');e.uncertain=true;throw e;}
  return data;
 }
'''+s[b:]
s=s.replace('if(!state.dbReady)return html+empty',"if(state.loading&&!state.dbReady)return html+empty('Verificando organização','Aguardando o banco antes de habilitar alterações.');\n  if(!state.dbReady)return html+empty")
s=s.replace("state.records.length===100?'<button","state.hasMore?'<button")
s=s.replace('total ${fmt(state.total)}','total ${fmt(state.total)} · listagem mutável, não exportação completa')
s=s.replace("state.view==='integrations'?renderIntegrations():renderRecords()","state.view==='integrations'?renderIntegrations():state.view==='reconciliation'?renderReconciliation():renderRecords()")
a=s.index(' async function load(');b=s.index(' function download(',a)
s=s[:a]+''' function renderReconciliation(){return heading('Reconciliação de comandos','Consulte o recibo por organização e identidade. Ausência de recibo não prova que uma chamada em andamento falhou.')+'<section class="panel"><label for="receipt-command">Identificador do comando</label><div class="filterbar"><input id="receipt-command" maxlength="36" placeholder="UUID do comando informado no erro"><button data-action="lookup-receipt" type="button">Consultar recibo</button></div><p id="receipt-result" role="status" class="fine">A consulta não executa novamente a alteração.</p></section>';}
 function pendingNotice(){
  const el=$('#pending-command');if(!state.pending){el.hidden=true;el.replaceChildren();return;}
  el.hidden=false;el.className='notice';el.innerHTML='<strong>Resultado de gravação não confirmado</strong><p>Comando <code>'+esc(state.pending.intent.id)+'</code>. A intenção foi preservada; não gere outra chave para tentar a mesma operação.</p><button type="button" data-action="reconcile-command">Consultar recibo</button> <button type="button" data-action="retry-command">Repetir a mesma intenção</button>';
 }
 async function reconcilePending(){
  const pending=state.pending;if(!pending||state.saving)return;
  try{const result=await api('receipt?tenant='+encodeURIComponent(pending.tenant)+'&command='+pending.intent.id);pending.intent.reconcile(result.state);
   if(result.state==='committed'){state.pending=null;toast('Gravação reconciliada com recibo confirmado.');if($('#editor').open)$('#editor').close();state.editor=null;await load();}
   else toast('Recibo ainda não observado. A operação pode estar em andamento. Repetir a mesma intenção conserva a chave.');
  }catch(e){toast(e.message);}finally{pendingNotice();}
 }
 async function sendIntent(edit){
  if(state.saving)return;state.saving=true;edit.intent.sent();$('#save-record').disabled=true;
  for(const field of $('#editor-fields').querySelectorAll('input,select,textarea,button'))field.disabled=true;
  try{await api('command',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':csrf(),'idempotency-key':edit.intent.id},body:edit.intent.payload});edit.intent.committed();if(state.pending===edit)state.pending=null;
   if($('#editor').open)$('#editor').close();state.editor=null;toast('Registro confirmado pelo banco.');
   state.saving=false;if(state.tenant===edit.tenant)navigate(edit.resource);else await load();
  }catch(error){edit.intent.failed(Boolean(error.uncertain));if(error.uncertain)state.pending=edit;else if(state.pending===edit)state.pending=null;
   const message=error.message+' Comando: '+edit.intent.id;$('#editor-error').textContent=message;$('#editor-error').hidden=false;toast(message);
  }finally{state.saving=false;$('#save-record').disabled=false;$('#save-record').textContent='Salvar registro';
   if(edit.intent.state!=='unknown')for(const field of $('#editor-fields').querySelectorAll('input,select,textarea,button'))field.disabled=false;
   pendingNotice();}
 }
 async function load(next=false){const generation=++state.generation,tenant=state.tenant,view=state.view;
  state.abort?.abort();state.abort=new AbortController();const signal=state.abort.signal;state.loading=true;
  try{if(!state.boot.database.configured){state.dbReady=false;notice(state.boot.database.message);return;}
   const ov=await api('overview?tenant='+encodeURIComponent(tenant),{signal});if(generation!==state.generation)return;state.overview=ov;state.dbReady=true;
   if(schemas[view]||view==='audit_log'){const r=state.records.at(-1),cursor=next&&r?'&before='+encodeURIComponent(r.updated_at)+'&before_id='+encodeURIComponent(r.id):'';const data=await api('list?tenant='+encodeURIComponent(tenant)+'&resource='+view+cursor,{signal});if(generation!==state.generation)return;state.records=data.items;state.total=data.total??data.items.length;state.hasMore=Boolean(data.has_more);}
   notice('');
  }catch(e){if(e.name==='AbortError'||generation!==state.generation)return;state.dbReady=false;state.overview=null;state.records=[];notice(e.message,'error');}
  finally{if(generation===state.generation){state.loading=false;render();pendingNotice();}}
 }
 function closeEditor(){state.editorEpoch++;state.editor=null;if($('#editor').open)$('#editor').close();}
 function navigate(view){if(!modules.some(m=>m[0]===view))return;if(state.saving){toast('Aguarde a confirmação da gravação antes de mudar o escopo.');return;}
  closeEditor();state.view=view;state.records=[];state.total=0;state.hasMore=false;state.query='';history.replaceState(null,'','#'+view);document.body.classList.remove('nav-open');$('#mobile-nav').setAttribute('aria-expanded','false');render();void load();}
'''+s[b:]
s=s.replace('async function openEditor(record=null,prefill=null){if(!state.dbReady)',"async function openEditor(record=null,prefill=null){if(state.pending){toast('Reconcilie o comando pendente antes de iniciar outra gravação.');return;}if(!state.dbReady)")
s=s.replace('state.editor={resource,record,tenant:state.tenant,command:crypto.randomUUID(),fingerprint:null};','const epoch=++state.editorEpoch,tenant=state.tenant,view=state.view;\n  const editor={resource,record,tenant,intent:new CommandIntent()};state.editor=editor;')
s=s.replace("'list?tenant='+state.tenant+'&resource='+(kind","'list?tenant='+tenant+'&resource='+(kind")
s=s.replace('lookups[kind]=list.items;','if(epoch!==state.editorEpoch||tenant!==state.tenant||view!==state.view)return;lookups[kind]=list.items;')
s=s.replace("state.editor=null;return;}\n  $('#editor-title')","if(epoch===state.editorEpoch)state.editor=null;return;}\n  if(epoch!==state.editorEpoch||tenant!==state.tenant||view!==state.view)return;\n  $('#editor-title')")
s=s.replace("v=(Number(value)/100).toFixed(2).replace('.',',')",'v=minorToInput(value)')
anchor='return `<label class="${f.type===\'textarea\'?\'span2\':\'\'}">'
if anchor not in s:raise RuntimeError('EDITOR_ANCHOR')
s=s.replace(anchor,"if(['project','client'].includes(f.type)&&!readonly)input+=`<span class=\"reference-search\"><input data-reference-query=\"${f.key}\" aria-label=\"Buscar referência de ${esc(f.label)}\" placeholder=\"Buscar no banco (2 caracteres)…\" maxlength=\"120\"><button type=\"button\" data-action=\"lookup-reference\" data-field=\"${f.key}\" data-resource=\"${f.type==='project'?'projects':'clients'}\">Buscar</button></span>`;\n   "+anchor)
s=s.replace('if(state.saving||!state.editor)return;','if(state.saving||!state.editor)return;if(state.pending){await sendIntent(state.pending);return;}')
s=s.replace("const [whole,cents='']=str.replace(',','.').split('.');data[f.key]=Number(BigInt(whole)*100n+BigInt(cents.padEnd(2,'0')));",'data[f.key]=inputToMinor(str);')
a=s.index('const fingerprint=JSON.stringify(payload);');b=s.index("\n });\n document.addEventListener('click'",a)
s=s[:a]+"edit.intent.prepare(payload);await sendIntent(edit);\n  }catch(error){$('#editor-error').textContent=error.message;$('#editor-error').hidden=false;}\n"+s[b:]
s=s.replace("else if(action==='close-dialog'&&!state.saving){$('#editor').close();state.editor=null;}","else if(action==='close-dialog'&&!state.saving)closeEditor();\n  else if(action==='reconcile-command')void reconcilePending();\n  else if(action==='retry-command'&&state.pending)void sendIntent(state.pending);\n  else if(action==='lookup-receipt')void lookupReceipt();\n  else if(action==='lookup-reference')void lookupReference(button);")
s=s.replace("if(e.target.id==='tenant'){state.tenant=e.target.value;","if(e.target.id==='tenant'){if(state.saving){e.target.value=state.tenant;toast('Aguarde a gravação.');return;}closeEditor();state.tenant=e.target.value;")
s=s.replace('else state.editor=null;','else closeEditor();')
s=s.replace("async function start(refresh=false){try{const b=await api('bootstrap');state.boot=b;","async function start(refresh=false){if(state.saving){toast('Aguarde a gravação.');return;}const epoch=++state.startEpoch;try{const b=await api('bootstrap');if(epoch!==state.startEpoch)return;state.boot=b;")
s=s.replace("}catch(error){notice(error.message,'error');$('#content')","}catch(error){if(epoch!==state.startEpoch)return;notice(error.message,'error');$('#content')")
insert='''
 async function lookupReference(button){
  const editor=state.editor,epoch=state.editorEpoch;if(!editor||state.saving)return;
  const field=button.dataset.field,resource=button.dataset.resource,input=$('#editor-fields [data-reference-query="'+field+'"]'),select=$('#editor-fields select[name="'+field+'"]');
  if(!input||!select)return;const query=input.value.trim();if(query.length<2){toast('Digite pelo menos dois caracteres.');return;}
  button.disabled=true;
  try{const result=await api('lookup?tenant='+encodeURIComponent(editor.tenant)+'&resource='+resource+'&query='+encodeURIComponent(query));
   if(state.editor!==editor||state.editorEpoch!==epoch||state.saving)return;
   const current=select.value;for(const item of result.items){if(![...select.options].some(o=>o.value===item.id)){select.add(new Option(item.name,item.id));}}
   select.value=current;toast(result.items.length+' referências encontradas.'+(result.truncated?' Refine a busca; há mais resultados.':''));select.focus();
  }catch(e){toast(e.message);}finally{if(button.isConnected)button.disabled=false;}
 }
 async function lookupReceipt(){
  const input=$('#receipt-command'),out=$('#receipt-result');if(!input||!out)return;
  const command=input.value.trim(),tenant=state.tenant,generation=state.generation;
  if(!/^[0-9a-f-]{36}$/i.test(command)){out.textContent='Informe o UUID do comando.';return;}
  out.textContent='Consultando recibo…';
  try{const result=await api('receipt?tenant='+encodeURIComponent(tenant)+'&command='+encodeURIComponent(command));if(generation!==state.generation||tenant!==state.tenant||!out.isConnected)return;
   out.textContent=result.state==='committed'?'Confirmado. Registro '+result.record_id+' · versão '+result.version+' · '+dt(result.committed_at):'Recibo ainda não observado. Não interprete como falha definitiva; repita a consulta ou a mesma intenção original.';
  }catch(e){if(out.isConnected)out.textContent=e.message;}
 }
'''
s=s.replace(' void start();',insert+' void start();')
s=s.replace("c?fmt(c.overdue):'—','data-alvo vencida; exclui encerradas'","c?fmt(c.overdue):'—',state.overview?'corte '+state.overview.business_date+' · '+state.overview.business_timezone:'data-alvo vencida; exclui encerradas'")
p.write_text(s)
p=root/'public/allinone-assets/app.css';p.write_text(p.read_text()+'\n/* R2: reconciliação e busca de referências. */\n#pending-command code{overflow-wrap:anywhere}.reference-search{display:flex;gap:5px;min-width:0}.reference-search input{min-width:0;flex:1}.reference-search button{font-size:10px}#receipt-command{font-family:ui-monospace,monospace}#pending-command button{margin:4px 4px 0 0}#pending-command p{margin:6px 0}\n')
p=root/'scripts/allinone-browser.cjs';s=p.read_text().replace("const assets={'/allinone-assets/app.js'", "const assets={'/allinone-assets/state.js':['public/allinone-assets/state.js','text/javascript'],'/allinone-assets/app.js'");s=s.replace("'integrations','audit_log']", "'integrations','audit_log','reconciliation']");p.write_text(s)
p=root/'lib/allinone/contracts.ts';s=p.read_text().replace('version:z.number().int().min(1).nullable()', 'version:z.number().int().min(1).max(2147483646).nullable()');p.write_text(s)
p=root/'package.json';obj=json.loads(p.read_text());obj['scripts']['prebuild']+=' && node allinone/tests/hardening.cjs';obj['scripts']['test:allinone:r2']='tsc -p tsconfig.allinone.json && node allinone/tests/hardening.cjs';p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print('R2 aplicada sobre seis fontes conferidas; autorização e segredos de produção não foram alterados.')
