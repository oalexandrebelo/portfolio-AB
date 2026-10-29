/* AB V10. Original SVG renderer. No runtime graphics dependencies. */
(() => {
  'use strict';
  const source = document.getElementById('ab-data');
  if (!source) return;
  let data;
  try { data = JSON.parse(source.textContent); } catch (error) { console.error('Dados de motion inválidos.', error); return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
  const lerp = (a,b,t) => a+(b-a)*t;
  const state = {paused:false,time:0,frames:0,costs:[],running:false,last:0,accum:0,raf:0};
  const scenes = new Map();
  const mini = [];
  const metrics = {particleCount:0,flowPaths:0,activeEdges:0,renderedFrames:0,meanFrameMs:0};
  const visible = el => Boolean(el && el.isConnected && el.getClientRects().length && el.getBoundingClientRect().bottom>0 && el.getBoundingClientRect().top<innerHeight);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (scenes.has(entry.target)) scenes.get(entry.target).visible=entry.isIntersecting; });
    wake();
  },{threshold:0.01}) : null;
  function register(el,draw){if(!el)return;scenes.set(el,{visible:visible(el),draw});if(io)io.observe(el);}
  const isPaused = () => state.paused || reduce.matches;
  function wake(){
    if(state.running || document.hidden || isPaused())return;
    if(!Array.from(scenes).some(([el,s])=>s.visible && el.getClientRects().length))return;
    state.running=true;state.last=performance.now();state.raf=requestAnimationFrame(frame);
  }
  function frame(now){
    state.raf=0;
    if(document.hidden || isPaused()){state.running=false;return;}
    const work=Array.from(scenes).filter(([el,s])=>s.visible && el.getClientRects().length);
    if(!work.length){state.running=false;return;}
    const delta=Math.min(64,Math.max(0,now-state.last));state.last=now;state.accum+=delta;
    if(state.accum>=1000/30){
      const elapsed=Math.min(0.08,state.accum/1000);state.accum=0;state.time+=elapsed;
      const start=performance.now();work.forEach(([,s])=>s.draw(state.time,elapsed));
      state.frames++;metrics.renderedFrames=state.frames;
      if(state.costs.length>=120)state.costs.shift();state.costs.push(performance.now()-start);
      metrics.meanFrameMs=+(state.costs.reduce((a,b)=>a+b,0)/state.costs.length).toFixed(2);
    }
    state.raf=requestAnimationFrame(frame);
  }
  document.querySelectorAll('[data-orbit-mini]').forEach(dot=>{
    const path=dot.previousElementSibling; if(!path || typeof path.getTotalLength!=='function')return;
    const total=path.getTotalLength();const el=dot.closest('svg');
    const draw=t=>{const point=path.getPointAtLength((t%11)/11*total);dot.setAttribute('cx',point.x.toFixed(2));dot.setAttribute('cy',point.y.toFixed(2));};
    mini.push(draw);draw(2);register(el,draw);
  });
  const svg=document.getElementById('morph-svg');
  const morph={value:0,from:0,target:0,start:0,duration:0,transition:false,auto:true,autoTime:0,region:0};
  let drawMorph=()=>{};
  if(svg){
    const layer=document.getElementById('particle-layer'),solid=document.getElementById('solid-logo'),brain=document.getElementById('brain-vector');
    const orbit=document.getElementById('hero-orbit'),dot=document.getElementById('orbit-dot'),glow=document.getElementById('orbit-glow');
    const orbitLength=orbit.getTotalLength();
    const neuralPaths=Array.from(brain.querySelectorAll('.brain-fold[data-region]:not([transform])')).map(path=>({path,length:path.getTotalLength()}));
    brain.querySelectorAll('[data-region]').forEach(path=>path.classList.toggle('selected',Number(path.dataset.region)===0));
    const all=data.points.count;
    // Fixed count per initial viewport; resize never resets the transition.
    const stride=innerWidth<681?2:1;
    const positions=[];const fragment=document.createDocumentFragment();
    for(let i=0;i<all;i+=stride){
      const node=document.createElementNS(NS,'circle');
      const size=.95+(i*13%11)/11*.9;
      node.setAttribute('r',size.toFixed(2));node.setAttribute('fill',i%17===0?'#83aaff':(i%5===0?'#8ac2bd':'#d4dfd8'));
      node.setAttribute('cx',data.points.logo[i][0]);node.setAttribute('cy',data.points.logo[i][1]);
      fragment.appendChild(node);positions.push({node,index:i,from:data.points.logo[i],to:data.points.brain[i],phase:i*2.39996323,size});
    }
    layer.appendChild(fragment);metrics.particleCount=positions.length;
    const mouse={x:-999,y:-999,active:false};
    const pointer=e=>{
      if(e.pointerType==='touch' || isPaused())return;
      const matrix=svg.getScreenCTM();if(!matrix)return;
      const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
      mouse.x=point.x;mouse.y=point.y;mouse.active=true;
    };
    svg.addEventListener('pointermove',pointer,{passive:true});
    svg.addEventListener('pointerleave',()=>{mouse.active=false;},{passive:true});
    const labels=['A identidade é o ponto de partida.','A mesma marca. Novas conexões.','Contexto, experiência e engenharia conectados.'];
    function selection(stage){
      document.querySelectorAll('[data-morph]').forEach(btn=>btn.setAttribute('aria-pressed',String(Number(btn.dataset.morph)===stage)));
      const label=document.getElementById('morph-label');if(label)label.textContent=labels[stage];
    }
    function setStage(stage,animate=true,manual=true){
      stage=clamp(Number(stage),0,2);if(manual)morph.auto=false;
      morph.from=morph.value;morph.target=stage;morph.start=state.time;morph.duration=stage===1?1.65:2.3;
      morph.transition=animate&&!isPaused()&&Math.abs(morph.from-stage)>.001;
      if(!morph.transition)morph.value=stage;
      selection(stage);drawMorph(state.time,0);wake();
    }
    drawMorph=(time,dt=0)=>{
      if(morph.auto && !isPaused()){
        morph.autoTime+=dt;
        if(morph.autoTime>2.6&&morph.target===0)setStage(1,true,false);
        if(morph.autoTime>7.0&&morph.target===1)setStage(2,true,false);
        if(morph.autoTime>10.2)morph.auto=false;
      }
      if(morph.transition){
        const f=clamp((time-morph.start)/morph.duration);morph.value=lerp(morph.from,morph.target,f*f*(3-2*f));
        if(f===1){morph.transition=false;morph.value=morph.target;}
      }
      const value=morph.value,change=smooth(1,2,value);
      const particleOpacity=smooth(0.02,.82,value)*(1-smooth(1.85,2,value)*.68);
      layer.setAttribute('opacity',particleOpacity.toFixed(3));
      solid.setAttribute('opacity',(1-smooth(.12,.94,value)).toFixed(3));
      brain.setAttribute('opacity',smooth(1.55,1.99,value).toFixed(3));
      const brainControls=document.getElementById('brain-controls');if(brainControls)brainControls.hidden=value<1.97;
      if(particleOpacity>.005){
        const arch=Math.sin(change*Math.PI)*10;
        positions.forEach(p=>{
          let x=lerp(p.from[0],p.to[0],change)+Math.sin(p.phase)*arch;
          let y=lerp(p.from[1],p.to[1],change)+Math.cos(p.phase)*arch*.7;
          if(value>.85&&value<1.99&&!isPaused()){
            x+=Math.sin(time*.45+p.phase)*.7;y+=Math.cos(time*.38+p.phase)*.7;
          }
          if(mouse.active&&!isPaused()){const dx=x-mouse.x,dy=y-mouse.y;const d2=dx*dx+dy*dy;if(d2<4900&&d2>.5){const d=Math.sqrt(d2),force=(1-d/70)*5;x+=dx/d*force;y+=dy/d*force;}}
          p.node.setAttribute('cx',x.toFixed(2));p.node.setAttribute('cy',y.toFixed(2));
        });
      }
      const point=orbit.getPointAtLength((time%11)/11*orbitLength);
      for(const el of [dot,glow]){el.setAttribute('cx',point.x.toFixed(2));el.setAttribute('cy',point.y.toFixed(2));}
      brain.querySelectorAll('.neuron').forEach((node,i)=>{
        const route=neuralPaths[(morph.region*2+i*3)%neuralPaths.length];
        if(route){const point=route.path.getPointAtLength(((time*.11+i*.27)%1)*route.length);node.setAttribute('cx',(i===1?600-point.x:point.x).toFixed(2));node.setAttribute('cy',point.y.toFixed(2));}
        node.setAttribute('r',isPaused()?'3.2':(2.3+Math.max(0,Math.sin(time*1.5-i*1.6))*1.4).toFixed(2));
      });
    };
    document.querySelectorAll('[data-morph]').forEach(btn=>btn.addEventListener('click',()=>setStage(Number(btn.dataset.morph))));
    document.getElementById('morph-replay')?.addEventListener('click',()=>{
      if(isPaused()){setStage(0,false);return;}
      morph.value=0;morph.target=0;morph.transition=false;morph.auto=true;morph.autoTime=0;selection(0);drawMorph(state.time,0);wake();
    });
    const brainLabels=['O contexto orienta a decisão.','A experiência conecta pessoas e produto.','A engenharia sustenta o que a interface promete.'];
    document.querySelectorAll('[data-brain]').forEach(btn=>{
      const choose=()=>{morph.region=Number(btn.dataset.brain);document.querySelectorAll('[data-brain]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));brain.querySelectorAll('[data-region]').forEach(p=>p.classList.toggle('selected',Number(p.dataset.region)===morph.region));document.getElementById('morph-label').textContent=brainLabels[morph.region];};
      btn.addEventListener('click',choose);btn.addEventListener('focus',choose);
    });
    register(svg.closest('[data-motion-scene]'),drawMorph);drawMorph(0,0);
    morph.setStage=setStage;morph.selection=selection;
  }
  let flowStep=0;
  const activeNodes=[['business','people','operation','data','context'],['context','product'],['product','versions'],['product','ui','db','api','automation'],['product','release','users'],['users','versions','context']];
  const flowSVGs=Array.from(document.querySelectorAll('.flow-svg'));
  const flowCache=new Map();
  function drawFlow(time){
    flowSVGs.forEach(el=>{
      if(!el.getClientRects().length)return;
      el.querySelectorAll('.flow-edge.active').forEach((edge,index)=>{
        const path=edge.querySelector('.edge-light'),dot=edge.querySelector('.edge-dot');
        if(!flowCache.has(path))flowCache.set(path,path.getTotalLength());
        const q=(time*.22+index*.19)%1;
        const p=path.getPointAtLength(flowCache.get(path)*q);
        dot.setAttribute('cx',p.x.toFixed(2));dot.setAttribute('cy',p.y.toFixed(2));
      });
    });
  }
  function setFlow(step){
    flowStep=clamp(Number(step),0,data.steps.length-1);
    const details=data.steps[flowStep];
    const fields={'flow-detail-title':details.title,'flow-detail-body':details.body,'flow-input':details.input,'flow-decision':details.decision,'flow-output':details.output,'flow-counter':`0${flowStep+1} / 06`};
    Object.entries(fields).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
    document.querySelectorAll('[data-flow-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.flowStep)===flowStep)));
    flowSVGs.forEach(el=>{
      el.querySelectorAll('.flow-edge').forEach(edge=>{
        const steps=edge.dataset.steps.split(',').map(Number);edge.classList.toggle('active',steps.includes(flowStep));edge.classList.toggle('complete',Math.min(...steps)<flowStep);
      });
      el.querySelectorAll('.flow-node').forEach(node=>node.classList.toggle('active',activeNodes[flowStep].includes(node.dataset.node)));
    });
    metrics.activeEdges=flowSVGs[0]?.querySelectorAll('.flow-edge.active').length||0;
    drawFlow(state.time);wake();
    document.dispatchEvent(new CustomEvent('ab:flow',{detail:{step:flowStep}}));
  }
  metrics.flowPaths=flowSVGs[0]?.querySelectorAll('.flow-edge').length||0;
  document.querySelectorAll('[data-flow-step]').forEach(btn=>{
    btn.addEventListener('click',()=>setFlow(Number(btn.dataset.flowStep)));
    btn.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?5:(flowStep+(e.key==='ArrowRight'?1:5))%6;
      setFlow(next);document.querySelector(`[data-flow-step="${next}"]`)?.focus();
    });
  });
  document.querySelectorAll('.flow-node').forEach(node=>{
    node.addEventListener('click',()=>setFlow(Number(node.dataset.step)));
    node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setFlow(Number(node.dataset.step));}});
  });
  register(document.querySelector('.flow-frame'),drawFlow);setFlow(0);
  function setPaused(value){
    state.paused=Boolean(value);document.documentElement.classList.toggle('motion-paused',isPaused());
    if(isPaused()){document.getAnimations?.().forEach(animation=>{try{if(animation.effect?.getTiming().iterations!==Infinity)animation.finish();}catch{}});if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.running=false;state.accum=0;}else wake();
    // Selection remains possible with reduced motion; it is rendered immediately.
    if(isPaused()&&morph.transition){morph.value=morph.target;morph.transition=false;}
    drawMorph(state.time,0);drawFlow(state.time);
    document.dispatchEvent(new CustomEvent('ab:motion',{detail:{paused:isPaused(),reduced:reduce.matches}}));
  }
  reduce.addEventListener('change',()=>setPaused(state.paused));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.running=false;state.accum=0;}else wake();});
  document.addEventListener('ab:page',()=>{scenes.forEach((s,el)=>s.visible=visible(el));wake();});
  window.addEventListener('resize',()=>{scenes.forEach((s,el)=>s.visible=visible(el));drawMorph(state.time,0);drawFlow(state.time);wake();},{passive:true});
  if(!io)window.addEventListener('scroll',()=>{scenes.forEach((s,el)=>s.visible=visible(el));wake();},{passive:true});
  window.ABMotion={
    setPaused,setFlow,setStage:(n,animate=true)=>morph.setStage?.(n,animate),
    getState:()=>({paused:isPaused(),reduced:reduce.matches,stage:morph.target,position:morph.value,flowStep,time:state.time,auto:morph.auto,metrics:{...metrics}}),
    // Deterministic preview rendering, also used by the shipped regression tests.
    renderAt:(position,seconds=2)=>{morph.auto=false;morph.value=clamp(position,0,2);morph.target=Math.round(morph.value);morph.selection?.(morph.target);morph.transition=false;state.time=seconds;drawMorph(seconds,0);drawFlow(seconds);mini.forEach(f=>f(seconds));},
    metrics
  };
  setPaused(false);wake();
})();
