/* AB V11 | Image-derived point field. No runtime libraries or external requests. */
(() => {
  'use strict';
  const VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aBrand;
  layout(location=2) in vec3 aColor;
  layout(location=3) in float aSeed;
  uniform float uTime, uMorph, uAspect, uDpr;
  uniform vec2 uPointer;
  out vec3 vColor; out float vAlpha;
  void main(){
    vec3 p=mix(aBrand,aPosition,uMorph);
    float pulse=sin(uTime*.65+aSeed*6.283)*.006;
    p*=1.+pulse*uMorph;
    float yaw=uPointer.x*.10+sin(uTime*.16)*.025*uMorph;
    float pitch=uPointer.y*.045;
    mat2 ry=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw));
    p.xz=ry*p.xz;
    mat2 rx=mat2(cos(pitch),-sin(pitch),sin(pitch),cos(pitch));
    p.yz=rx*p.yz;
    vec2 m=uPointer*vec2(2.5,-2.5);
    float dist=length(p.xy-m);
    float wave=exp(-dist*dist*1.8)*sin(uTime*1.6-dist*4.)*.018;
    p.z+=wave;
    float persp=4.5/(4.5-p.z*.21);
    gl_Position=vec4(p.x*.355/uAspect*persp,p.y*.355*persp,0.,1.);
    gl_PointSize=clamp((1.25+aSeed*.85)*uDpr*persp,1.,4.8);
    vColor=mix(vec3(.70,.82,1.),aColor,uMorph);
    vAlpha=.31+aSeed*.19;
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 vColor; in float vAlpha; out vec4 frag;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;float a=exp(-r*3.2)*vAlpha;frag=vec4(vColor,a);}`;
  const QUAD = `#version 300 es
  precision highp float;out vec2 uv;
  void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const BLUR = `#version 300 es
  precision highp float;in vec2 uv;uniform sampler2D uImage;uniform vec2 uStep;out vec4 frag;
  void main(){vec4 c=texture(uImage,uv)*.227027;c+=texture(uImage,uv+uStep*1.384615)*.316216;c+=texture(uImage,uv-uStep*1.384615)*.316216;c+=texture(uImage,uv+uStep*3.230769)*.070270;c+=texture(uImage,uv-uStep*3.230769)*.070270;frag=c;}`;
  const COMPOSITE = `#version 300 es
  precision highp float;in vec2 uv;uniform sampler2D uImage,uGlow;uniform float uBloom;out vec4 frag;
  void main(){vec3 c=texture(uImage,uv).rgb+texture(uGlow,uv).rgb*uBloom;
  float vignette=1.-smoothstep(.42,.72,length(uv-.5));c*=vignette;
  frag=vec4(c,clamp(max(c.r,max(c.g,c.b))*1.15,0.,1.));}`;

  class NeuralField {
    constructor(canvas, data) {
      this.canvas=canvas;this.data=data;this.total=data.length/10;
      this.mobile=matchMedia('(max-width: 700px)').matches;
      this.count=this.mobile?11000:this.total;this.dpr=Math.min(devicePixelRatio||1,this.mobile?1.35:1.65);
      this.pointer=[0,0];this.aim=[0,0];this.morph=0;this.target=1;this.time=0;this.frame=0;this.last=0;
      this.visible=true;this.paused=window.ABMotion?.paused||false;this.morph=this.paused?1:0;
      this.samples=[];this.drawCalls=0;this.ready=false;this.raf=0;this.resources=[];
      this.gl=canvas.getContext('webgl2',{alpha:true,antialias:false,powerPreference:'low-power',premultipliedAlpha:false,preserveDrawingBuffer:true});
      if(this.gl) { try {this.initGL();this.mode='WebGL 2';} catch(e){this.report(e);this.useFallback();} }
      else this.useFallback();
      this.bind();this.resize();this.ready=true;this.draw();this.start();
      this.intro=setTimeout(()=>{if(!this.interacted){this.target=1;this.setButtons(1);this.start();}},900);
      if(!this.paused){this.target=0;this.setButtons(0);}else this.setButtons(1);
      if(this.gl||this.ctx)this.canvas.closest('.neural-stage')?.classList.add('is-ready');else {this.ready=false;document.querySelectorAll('[data-neural]').forEach(b=>b.disabled=true);}this.updateStats();
    }
    report(e){console.warn('AB graphic fallback:',e.message);window.AB_GRAPHIC_WARNING=String(e.message);}
    shader(type,src){const g=this.gl,s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS)){let log=g.getShaderInfoLog(s);g.deleteShader(s);throw new Error(log);}return s;}
    program(v,f){const g=this.gl,p=g.createProgram(),vs=this.shader(g.VERTEX_SHADER,v),fs=this.shader(g.FRAGMENT_SHADER,f);g.attachShader(p,vs);g.attachShader(p,fs);g.linkProgram(p);g.deleteShader(vs);g.deleteShader(fs);if(!g.getProgramParameter(p,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(p));this.resources.push(['Program',p]);return p;}
    initGL(){const g=this.gl;this.points=this.program(VS,FS);this.blur=this.program(QUAD,BLUR);this.composite=this.program(QUAD,COMPOSITE);
      this.vao=g.createVertexArray();g.bindVertexArray(this.vao);this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,this.data,g.STATIC_DRAW);
      [[0,3,0],[1,3,12],[2,3,24],[3,1,36]].forEach(([slot,size,offset])=>{g.enableVertexAttribArray(slot);g.vertexAttribPointer(slot,size,g.FLOAT,false,40,offset);});g.bindVertexArray(null);
      this.quadVAO=g.createVertexArray();this.uniforms=new Map();this.targets=[];
    }
    loc(p,n){const key=`${p===this.points?'p':p===this.blur?'b':'c'}:${n}`;if(!this.uniforms.has(key))this.uniforms.set(key,this.gl.getUniformLocation(p,n));return this.uniforms.get(key);}
    makeTarget(w,h){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,w,h,0,g.RGBA,g.UNSIGNED_BYTE,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);const fb=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fb);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,t,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw new Error('Framebuffer incompleto');return {t,fb,w,h};}
    useFallback(){this.gl=null;let c=this.canvas.cloneNode();this.canvas.replaceWith(c);this.canvas=c;this.ctx=c.getContext('2d',{alpha:true});this.mode=this.ctx?'Canvas 2D':'Imagem estática';this.count=Math.min(this.count,this.mobile?8000:16000);this.cpuGroups=Array.from({length:16},()=>[]);for(let i=0;i<this.total;i++)this.cpuGroups[Math.min(15,Math.floor(this.data[i*10+7]*15))].push(i);this.glow=document.createElement('canvas');this.glowCtx=this.glow.getContext('2d');if(!this.ctx)this.canvas.style.display='none';}
    bind(){
      this.canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=this.canvas.getBoundingClientRect();this.aim=[((e.clientX-r.left)/r.width-.5)*2,((e.clientY-r.top)/r.height-.5)*2];},{passive:true});
      this.canvas.addEventListener('pointerleave',()=>this.aim=[0,0]);
      this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(this.raf);this.raf=0;this.lost=true;this.canvas.style.opacity='0';this.canvas.closest('.neural-stage')?.classList.remove('is-ready');this.mode='Imagem estática (contexto perdido)';this.updateStats();});
      this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.resources=[];this.initGL();this.mode='WebGL 2';this.resize();this.canvas.style.opacity='1';this.canvas.closest('.neural-stage')?.classList.add('is-ready');this.draw();this.start();this.updateStats();});
      this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this.canvas.parentElement);
      this.io=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.start();else{cancelAnimationFrame(this.raf);this.raf=0;}},{rootMargin:'80px'});this.io.observe(this.canvas);
      document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0;}else this.start();});
      document.addEventListener('ab:motion',e=>{this.paused=e.detail.paused;if(this.paused){cancelAnimationFrame(this.raf);this.raf=0;this.morph=this.target;this.draw();}else this.start();this.updateStats();});
      document.querySelectorAll('[data-neural]').forEach(b=>b.addEventListener('click',()=>this.select(Number(b.dataset.neural))));
      window.addEventListener('pagehide',e=>{if(e.persisted){cancelAnimationFrame(this.raf);this.raf=0;}else this.destroy();});window.addEventListener('pageshow',e=>{if(e.persisted){this.resize();this.start();}});
    }
    resize(){if(this.lost)return;const r=this.canvas.parentElement.getBoundingClientRect();if(r.width<1||r.height<1)return;this.w=Math.round(r.width*this.dpr);this.h=Math.round(r.height*this.dpr);this.canvas.width=this.w;this.canvas.height=this.h;
      if(this.gl){const g=this.gl;for(const t of this.targets){g.deleteTexture(t.t);g.deleteFramebuffer(t.fb);}this.targets=[this.makeTarget(this.w,this.h),this.makeTarget(Math.max(1,this.w>>2),Math.max(1,this.h>>2)),this.makeTarget(Math.max(1,this.w>>2),Math.max(1,this.h>>2))];g.bindFramebuffer(g.FRAMEBUFFER,null);}
      this.draw();}
    setButtons(s){document.querySelectorAll('[data-neural]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.neural)===s)));const c=document.querySelector('#neural-caption');if(c)c.textContent=s?'O humano no centro. A tecnologia a serviço.':'Uma assinatura. Muitas possibilidades.';}
    select(s){this.interacted=true;clearTimeout(this.intro);this.target=Math.max(0,Math.min(1,s));this.setButtons(this.target);if(this.paused){this.morph=this.target;this.draw();}else this.start();}
    start(){if(this.raf||this.paused||!this.visible||document.hidden||this.lost||!this.ready)return;this.last=0;this.raf=requestAnimationFrame(t=>this.tick(t));}
    tick(t){this.raf=0;if(this.paused||!this.visible||document.hidden||this.lost)return;const delta=this.last?t-this.last:16.7;this.last=t;this.time+=Math.min(delta,50)/1000;this.morph+=(this.target-this.morph)*(1-Math.exp(-Math.min(delta,50)/310));for(let i=0;i<2;i++)this.pointer[i]+=(this.aim[i]-this.pointer[i])*.065;
      this.draw();this.frame++;if(this.frame>20&&this.frame<140)this.samples.push(delta);
      if(this.frame===140){const avg=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;if(avg>30){this.count=Math.floor(this.count*.62);this.bloomReduced=true;}this.updateStats();}
      this.raf=requestAnimationFrame(tt=>this.tick(tt));}
    texture(p,name,tex,slot){const g=this.gl;g.activeTexture(g.TEXTURE0+slot);g.bindTexture(g.TEXTURE_2D,tex);g.uniform1i(this.loc(p,name),slot);}
    draw(){if(!this.w||this.lost)return;if(this.gl)this.drawGL();else if(this.ctx)this.draw2D();}
    drawGL(){const g=this.gl,[scene,a,b]=this.targets;if(!scene)return;
      g.bindFramebuffer(g.FRAMEBUFFER,scene.fb);g.viewport(0,0,scene.w,scene.h);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE);g.useProgram(this.points);g.bindVertexArray(this.vao);
      g.uniform1f(this.loc(this.points,'uTime'),this.time);g.uniform1f(this.loc(this.points,'uMorph'),this.morph);g.uniform1f(this.loc(this.points,'uAspect'),this.w/this.h);g.uniform1f(this.loc(this.points,'uDpr'),this.dpr);g.uniform2fv(this.loc(this.points,'uPointer'),this.pointer);g.drawArrays(g.POINTS,0,this.count);g.disable(g.BLEND);g.bindVertexArray(this.quadVAO);
      g.useProgram(this.blur);g.bindFramebuffer(g.FRAMEBUFFER,a.fb);g.viewport(0,0,a.w,a.h);this.texture(this.blur,'uImage',scene.t,0);g.uniform2f(this.loc(this.blur,'uStep'),1/scene.w*2,0);g.drawArrays(g.TRIANGLES,0,3);
      g.bindFramebuffer(g.FRAMEBUFFER,b.fb);this.texture(this.blur,'uImage',a.t,0);g.uniform2f(this.loc(this.blur,'uStep'),0,1/a.h);g.drawArrays(g.TRIANGLES,0,3);
      g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,this.w,this.h);g.useProgram(this.composite);this.texture(this.composite,'uImage',scene.t,0);this.texture(this.composite,'uGlow',b.t,1);g.uniform1f(this.loc(this.composite,'uBloom'),this.bloomReduced?.12:.65);g.drawArrays(g.TRIANGLES,0,3);g.bindVertexArray(null);this.drawCalls=4;
    }
    draw2D(){const c=this.ctx,d=this.data,m=this.morph;c.clearRect(0,0,this.w,this.h);c.globalCompositeOperation='lighter';const yaw=this.pointer[0]*.1,cy=Math.cos(yaw),sy=Math.sin(yaw),scale=this.h*.1775;for(let bucket=0;bucket<16;bucket++){const r=Math.round((.75*(1-m)+.08*m)*255),g=Math.round((.85*(1-m)+(bucket/15)*m)*255);c.fillStyle=`rgba(${r},${g},255,.85)`;for(const i of this.cpuGroups[bucket]){if(i>=this.count)continue;const o=i*10;const x=(d[o+3]*(1-m)+d[o]*m)*cy+d[o+2]*m*sy,y=d[o+4]*(1-m)+d[o+1]*m;c.fillRect(this.w/2+x*scale,this.h/2-y*scale,this.dpr*1.7,this.dpr*1.7);}}if(this.glowCtx){const w=this.w>>1,h=this.h>>1;if(this.glow.width!==w||this.glow.height!==h){this.glow.width=w;this.glow.height=h;}const g=this.glowCtx;g.clearRect(0,0,w,h);g.drawImage(this.canvas,0,0,w,h);c.save();c.globalAlpha=.35;c.filter='blur(4px)';c.drawImage(this.glow,0,0,this.w,this.h);c.restore();}c.globalCompositeOperation='source-over';this.drawCalls=0;}

    updateStats(){const s=document.querySelector('#engine-label');if(s)s.textContent=this.mode;const out=document.querySelector('#engine-details');if(out)out.textContent=`${this.mode} · ${this.count.toLocaleString('pt-BR')} pontos · ${this.gl?'4 passes / frame':'alternativa sem GPU'}${this.paused?' · pausado':''}`;window.AB_RENDER_INFO={renderer:this.mode,points:this.count,sourcePoints:this.total,drawCalls:this.gl?4:0,depth:'inferred-2.5d',paused:this.paused};}
    seek(m,t=1){clearTimeout(this.intro);this.interacted=true;this.target=this.morph=m;this.time=t;this.pointer=[0,0];this.draw();this.setButtons(m);}
    destroy(){cancelAnimationFrame(this.raf);clearTimeout(this.intro);this.ro?.disconnect();this.io?.disconnect();if(this.gl&&!this.lost){const g=this.gl;this.targets.forEach(t=>{g.deleteTexture(t.t);g.deleteFramebuffer(t.fb);});g.deleteBuffer(this.buffer);g.deleteVertexArray(this.vao);g.deleteVertexArray(this.quadVAO);this.resources.forEach(([type,obj])=>g['delete'+type](obj));}}
  }
  async function boot(){const canvas=document.querySelector('#neural-canvas');if(!canvas)return;try{let buffer;if(window.AB_PARTICLE_BASE64){const b=atob(window.AB_PARTICLE_BASE64),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);buffer=a.buffer;}else{const r=await fetch(new URL('data/particles.bin',window.AB_ASSETS));if(!r.ok)throw new Error('Dados de partículas indisponíveis: '+r.status);buffer=await r.arrayBuffer();}window.ABExperience=new NeuralField(canvas,new Float32Array(buffer));}catch(e){console.warn('AB: visual estático ativado.',e.message);const label=document.querySelector('#engine-label');if(label)label.textContent='Imagem estática';canvas.hidden=true;}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
