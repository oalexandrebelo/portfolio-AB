/* AB V10 — native HTML first. No tracking, network form, or hidden submission. */
(() => {
  'use strict';
  const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  let data;try{data=JSON.parse($('#ab-data').textContent);}catch(error){console.error('Não foi possível ler o conteúdo.',error);return;}
  const {site}=data;
  const standalone=document.body.dataset.standalone==='true';
  const assetData=$('#ab-assets');let embedded={};if(assetData){try{embedded=JSON.parse(assetData.textContent);}catch{}}
  const asset=name=>embedded[name]||document.body.dataset.assets+name;
  const norm=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}};
  let toastTimer;
  function toast(text){const el=$('#toast');if(!el)return;clearTimeout(toastTimer);el.textContent=text;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),3800);}
  const dialogTriggers=new WeakMap();
  function closeAll(){ $$('dialog[open]').forEach(d=>d.close()); }
  function openDialog(id,trigger=document.activeElement){
    const dialog=document.getElementById(id);if(!dialog||typeof dialog.showModal!=='function')return false;
    closeAll();dialogTriggers.set(dialog,trigger);dialog.showModal();document.body.classList.add('has-dialog');return true;
  }
  $$('dialog').forEach(dialog=>{
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
    dialog.addEventListener('close',()=>{if(!$('dialog[open]'))document.body.classList.remove('has-dialog');const trigger=dialogTriggers.get(dialog);if(trigger?.isConnected&&trigger.getClientRects().length)trigger.focus({preventScroll:true});});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  });
  $$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog')?.close()));
  $$('[data-menu]').forEach(btn=>btn.addEventListener('click',()=>openDialog('menu-dialog',btn)));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=storage.get('ab-v10-motion')==='paused';
  const motionBtn=$('#motion-toggle');
  const dock=$('.motion-dock'),smallLayout=matchMedia('(max-width: 680px)');
  function positionDock(){if(!dock)return;if(smallLayout.matches)$('.header-actions')?.prepend(dock);else document.body.insertBefore(dock,$('#toast'));}
  positionDock();smallLayout.addEventListener('change',positionDock);
  function motionLabel(){if(!motionBtn)return;const info=window.ABMotion?.getState();const stopped=info?.paused||reduce.matches;motionBtn.setAttribute('aria-pressed',String(stopped));motionBtn.title=reduce.matches?'Movimento reduzido':stopped?'Retomar movimento':'Pausar movimento';motionBtn.querySelector('span').textContent=reduce.matches?'Movimento reduzido':stopped?'Retomar movimento':'Pausar movimento';const use=motionBtn.querySelector('use');if(use)use.setAttribute('href',stopped?'#i-play':'#i-pause');}
  window.ABMotion?.setPaused(paused);motionLabel();
  document.addEventListener('ab:motion',motionLabel);
  motionBtn?.addEventListener('click',()=>{if(reduce.matches){toast('O movimento reduzido acompanha a preferência do seu dispositivo.');return;}paused=!paused;window.ABMotion?.setPaused(paused);storage.set('ab-v10-motion',paused?'paused':'playing');motionLabel();});
  function motionAllowed(){return !reduce.matches&&!window.ABMotion?.getState().paused;}
  // Progressive reveal: content never depends on an animation library to exist.
  if('IntersectionObserver' in window){
    const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');reveal.unobserve(entry.target);}}),{threshold:.06});
    $$('.section-heading,.about-grid,.journal-feature,.contact-main').forEach(el=>{el.classList.add('reveal');reveal.observe(el);});
    document.documentElement.classList.add('js');
  }
  function currentPage(){return document.body.dataset.page||'home';}
  function showPage(page,update=true,anchor=null){
    if(!standalone)return;
    if(!['home','blog','article'].includes(page))page='home';
    closeAll();document.body.dataset.page=page;
    $$('[data-view]').forEach(el=>{el.hidden=el.dataset.view!==page;el.inert=el.hidden;});
    const hashes={home:'#inicio',blog:'#blog',article:'#artigo'};
    const url=anchor?'#'+anchor:hashes[page];
    if(update && location.hash!==url){history.pushState({page},'',url);}
    document.title='Alexandre Belo — '+({home:'Conexões com sentido.',blog:'Caderno AB.',article:'10 ferramentas de IA para criar com mais critério.'}[page]);
    if(!anchor){window.scrollTo({top:0,behavior:'instant'});const h=$(`[data-view="${page}"] h1`);if(h&&update){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}}
    else document.getElementById(anchor)?.scrollIntoView({behavior:motionAllowed()?'smooth':'instant'});
    document.dispatchEvent(new Event('ab:page'));updateReading();
  }
  function hashRoute(){
    const hash=location.hash.slice(1);
    if(hash==='blog')showPage('blog',false);else if(hash==='artigo')showPage('article',false);else if(['inicio','projetos','fluxo','sobre','contato','abordagem','caderno',''].includes(hash))showPage('home',false,hash&&hash!=='inicio'?hash:null);
    else if($(`[data-view="article"] [id="${CSS.escape(hash)}"]`))showPage('article',false,hash);
  }
  if(standalone){hashRoute();window.addEventListener('popstate',hashRoute);window.addEventListener('hashchange',hashRoute);}
  document.addEventListener('click',e=>{
    const link=e.target.closest('a');if(!link)return;
    if(link.classList.contains('skip-link')){e.preventDefault();const main=$('[data-view]:not([hidden])')||$('main');if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true});main.scrollIntoView({behavior:'instant'});}return;}
    if(link.dataset.page&&standalone){e.preventDefault();showPage(link.dataset.page,true);return;}
    if(link.dataset.homeAnchor){
      const id=link.dataset.homeAnchor;
      if(standalone){e.preventDefault();showPage('home',true,id);return;}
      if(currentPage()==='home'){e.preventDefault();closeAll();document.getElementById(id)?.scrollIntoView({behavior:motionAllowed()?'smooth':'instant'});history.pushState(null,'','#'+id);return;}
    }
    if(link.getAttribute('href')==='#topo'){e.preventDefault();window.scrollTo({top:0,behavior:motionAllowed()?'smooth':'instant'});}
    else if(link.closest('.full-nav'))closeAll();
  });
  let selectedProject=0,projectRequest=0;
  const featured=site.projects.slice(0,5);
  function selectProject(id){
    const index=featured.findIndex(x=>x.id===id);if(index<0)return;
    selectedProject=index;const p=featured[index];const request=++projectRequest;
    $$('[data-project]').forEach(btn=>{const active=btn.dataset.project===id;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    const mappings={'selected-label':p.label,'selected-headline':p.headline,'selected-description':p.description,'project-count':`0${index+1} / 05`};
    Object.entries(mappings).forEach(([key,value])=>{const el=document.getElementById(key);if(el)el.textContent=value;});
    const cover=$('#selected-cover');if(cover){cover.src=asset('projects/'+id+'.svg');cover.alt='Capa editorial de '+p.name+'. Não é uma captura da interface.';if(motionAllowed()&&typeof cover.animate==='function'){cover.getAnimations().forEach(a=>a.cancel());cover.animate([{opacity:.3,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:400,easing:'cubic-bezier(.22,1,.36,1)'});}cover.decode?.().catch(()=>{if(request===projectRequest)toast('A capa não carregou. Os detalhes e o link do projeto continuam disponíveis.');});}
    const button=$('[data-active-case]');if(button){button.dataset.activeCase=id;button.setAttribute('aria-label','Abrir detalhes de '+p.name);}
  }
  $$('[data-project]').forEach(btn=>{
    btn.addEventListener('click',()=>selectProject(btn.dataset.project));
    btn.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const forward=e.key==='ArrowDown'||e.key==='ArrowRight';const i=e.key==='Home'?0:e.key==='End'?featured.length-1:(selectedProject+(forward?1:featured.length-1))%featured.length;selectProject(featured[i].id);const target=$(`[data-project="${featured[i].id}"]`);target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});
  });
  $('#project-next')?.addEventListener('click',()=>selectProject(featured[(selectedProject+1)%featured.length].id));
  $('#project-prev')?.addEventListener('click',()=>selectProject(featured[(selectedProject+featured.length-1)%featured.length].id));
  let caseProject=null;
  function openCase(id,trigger){
    const p=site.projects.find(x=>x.id===id);if(!p)return;caseProject=p;
    $('#case-category').textContent=p.label;$('#case-title').textContent=p.name;$('#case-description').textContent=p.description;$('#case-scope').textContent=p.scope;
    $('#case-cover').src=asset('projects/'+p.id+'.svg');$('#case-cover').alt='Capa editorial de '+p.name;
    $('#case-visit').href=p.url;$('#case-variants').hidden=p.id!=='ruralin';
    $$('[data-ruralin]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ruralin==='lp')));
    if(!openDialog('case-dialog',trigger))location.href=p.url;
  }
  $$('[data-case]').forEach(btn=>btn.addEventListener('click',()=>openCase(btn.dataset.case,btn)));
  $('[data-active-case]')?.addEventListener('click',e=>{const btn=e.currentTarget;openCase(btn.dataset.activeCase,btn);});
  $$('[data-ruralin]').forEach(btn=>btn.addEventListener('click',()=>{
    if(caseProject?.id!=='ruralin')return;
    $('#case-cover').src=asset('projects/'+(btn.dataset.ruralin==='login'?'ruralin-acesso':'ruralin')+'.svg');
    $('#case-cover').alt='Ruralin — '+(btn.dataset.ruralin==='login'?'interface de login':'landing page')+'. Arte editorial.';
    $$('[data-ruralin]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
  }));
  const form=$('#brief-form');
  $$('[data-brief]').forEach(link=>link.addEventListener('click',e=>{
    if(!openDialog('brief-dialog',link))return;e.preventDefault();
    if(link.dataset.interest&&form){form.elements.interest.value=link.dataset.interest;form.hidden=false;$('#brief-ready').hidden=true;}
  }));
  const cleaned=value=>String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();
  form?.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',()=>el.setCustomValidity('')));
  form?.addEventListener('submit',e=>{
    e.preventDefault();const name=cleaned(form.elements.name.value),company=cleaned(form.elements.company.value),interest=form.elements.interest.value,challenge=cleaned(form.elements.challenge.value);
    form.elements.name.setCustomValidity(name.length<2?'Escreva seu nome, com pelo menos dois caracteres.':'');
    form.elements.challenge.setCustomValidity(challenge.length<10?'Conte um pouco mais: ao menos 10 caracteres além dos espaços.':'');
    if(!form.reportValidity())return;
    const text=`Olá, Alexandre. Sou ${name}.${company?'\nEmpresa/projeto: '+company:''}\n\nFrente: ${interest}\nDesafio: ${challenge}\n\nVamos conversar sobre os próximos passos?`;
    $('#brief-preview').textContent=text;$('#brief-whatsapp').href='https://wa.me/'+site.whatsapp+'?text='+encodeURIComponent(text);
    form.hidden=true;$('#brief-ready').hidden=false;$('#brief-ready h3').setAttribute('tabindex','-1');$('#brief-ready h3').focus();
  });
  $('#brief-edit')?.addEventListener('click',()=>{form.hidden=false;$('#brief-ready').hidden=true;form.elements.challenge.focus();});
  const resultIndex=[...site.projects.map(p=>({type:'case',id:p.id,title:p.name,meta:p.label,text:p.description+' '+p.tags.join(' ')})),{type:'page',id:'article',title:'10 ferramentas de IA',meta:'Caderno AB · artigo',text:'design ferramentas REA Impeccable curadoria'},{type:'page',id:'blog',title:'Caderno AB',meta:'Publicações',text:'blog artigos'},{type:'anchor',id:'fluxo',title:'Do contexto à entrega',meta:'Fluxo interativo',text:'método como construo etapas processo conexões'},{type:'anchor',id:'contato',title:'Vamos conversar',meta:'Contato',text:'briefing email whatsapp'},{type:'anchor',id:'sobre',title:'Minha trajetória',meta:'Alexandre Belo',text:'sobre experiência operação design engenharia'}];
  function renderSearch(query=''){
    const target=$('#search-results');if(!target)return;target.replaceChildren();
    const q=norm(query);const results=resultIndex.filter(x=>!q||norm(x.title+' '+x.meta+' '+x.text).includes(q)).slice(0,12);
    if(!results.length){const p=document.createElement('p');p.textContent='Nenhum resultado. Tente “Ruralin”, “IA” ou “fluxo”.';target.appendChild(p);return;}
    results.forEach(item=>{
      const btn=document.createElement('button');btn.type='button';const left=document.createElement('span');left.textContent=item.title;const meta=document.createElement('small');meta.textContent=item.meta;left.appendChild(meta);const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');btn.append(left,arrow);target.appendChild(btn);
      btn.addEventListener('click',()=>{
        closeAll();
        if(item.type==='case'){openCase(item.id,$('[data-search]'));return;}
        if(standalone){showPage(item.type==='page'?item.id:'home',true,item.type==='anchor'?item.id:null);return;}
        const root=new URL(document.body.dataset.assets+'../',location.href);
        location.href=item.type==='anchor'?new URL('index.html#'+item.id,root):new URL(item.id==='article'?'blog/10-ferramentas-ia/index.html':'blog/index.html',root);
      });
    });
  }
  function openSearch(trigger){renderSearch($('#search-input')?.value||'');if(openDialog('search-dialog',trigger))setTimeout(()=>$('#search-input').focus(),0);}
  $$('[data-search]').forEach(btn=>btn.addEventListener('click',()=>openSearch(btn)));
  $('#search-input')?.addEventListener('input',e=>renderSearch(e.target.value));
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if($('#search-dialog').open)$('#search-dialog').close();else openSearch(document.activeElement);}});
  $('#search-dialog')?.addEventListener('keydown',e=>{
    if(!['ArrowDown','ArrowUp'].includes(e.key))return;const results=$$('#search-results button');if(!results.length)return;e.preventDefault();const i=results.indexOf(document.activeElement),next=e.key==='ArrowDown'?(i+1)%results.length:(i<=0?results.length-1:i-1);results[next].focus();
  });
  let blogCategory='all';
  function filterBlog(){
    const q=norm($('#blog-search')?.value||'');
    const text=norm('10 ferramentas de IA para criar com mais critério design REA Ponytail Hallmark Humanizer Onyx Impeccable UI UX Pro Max Last 30 Days Scrapling Diagram Design');
    const show=(!q||text.includes(q))&&['all','ia','design'].includes(blogCategory);
    const card=$('[data-blog-card]');if(card)card.hidden=!show;const empty=$('#blog-empty');if(empty)empty.hidden=show;
  }
  $('#blog-search')?.addEventListener('input',filterBlog);
  $$('[data-blog-category]').forEach(btn=>btn.addEventListener('click',()=>{blogCategory=btn.dataset.blogCategory;$$('[data-blog-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));filterBlog();}));
  const themeBtn=$('#article-theme'),saveBtn=$('#article-save');
  function themeLight(value){document.body.classList.toggle('reading-light',value);themeBtn?.setAttribute('aria-pressed',String(value));}
  themeLight(storage.get('ab-v10-reading')==='light');
  themeBtn?.addEventListener('click',()=>{const value=!document.body.classList.contains('reading-light');themeLight(value);storage.set('ab-v10-reading',value?'light':'dark');});
  let saved=storage.get('ab-v10-bookmark')==='saved';
  function saveLabel(){saveBtn?.setAttribute('aria-pressed',String(saved));if(saveBtn){const svg=saveBtn.querySelector('svg');saveBtn.replaceChildren(svg,document.createTextNode(saved?'Leitura salva':'Salvar leitura'));}}
  saveLabel();saveBtn?.addEventListener('click',()=>{const next=!saved;if(storage.set('ab-v10-bookmark',next?'saved':'')){saved=next;saveLabel();toast(saved?'Artigo salvo neste navegador.':'Artigo removido dos salvos.');}else toast('O navegador bloqueou o armazenamento. A leitura não foi salva.');});
  $('#article-share')?.addEventListener('click',async()=>{
    const url='https://www.alexandrebelo.com.br/v10/blog/10-ferramentas-ia/index.html';
    try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard indisponível');await navigator.clipboard.writeText(url);toast('Endereço copiado. O artigo precisa estar publicado nesse endereço.');}
    catch{if(openDialog('share-dialog',$('#article-share'))){$('#share-url').focus();$('#share-url').select();}}
  });
  const tocLinks=$$('.article-toc a');
  function updateReading(){
    if(currentPage()!=='article')return;const body=$('.article-editorial');if(!body)return;
    const top=body.getBoundingClientRect().top+scrollY;const total=Math.max(1,body.offsetHeight-innerHeight*.5);const ratio=Math.max(0,Math.min(1,(scrollY-top+innerHeight*.25)/total));
    const bar=$('.article-progress');if(bar)bar.style.transform=`scaleX(${ratio})`;
    let active=null;tocLinks.forEach(a=>{const target=document.getElementById(a.hash.slice(1));if(target&&target.getBoundingClientRect().top<innerHeight*.35)active=a;});tocLinks.forEach(a=>a.classList.toggle('active',a===active));
  }
  let scrollQueued=false;window.addEventListener('scroll',()=>{if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{updateReading();scrollQueued=false;});},{passive:true});
  updateReading();
  window.AB={selectProject,openCase,setPage:showPage,toast,storage,getState:()=>({page:currentPage(),selectedProject:featured[selectedProject]?.id,saved,standalone})};
})();
