/* AB V8 — deterministic, dependency-free drawing shared by the site and film.
   All movement is a pure function of time. No random state, network, images or fonts. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const mix = (a,b,t) => a + (b-a)*t;
  const hash = n => { const q = Math.sin(n * 127.1 + 311.7) * 43758.5453; return q - Math.floor(q); };
  const NODES = Array.from({length: 62}, (_, i) => {
    const y = 1 - (i / 61) * 2, r = Math.sqrt(1-y*y), a = i * Math.PI * (3-Math.sqrt(5));
    return {x:Math.cos(a)*r, y:y*.93, z:Math.sin(a)*r, size: i%13===0?14:i%7===0?9:3+hash(i)*3.7, blue:i%9===0};
  });
  const EDGES = [];
  NODES.forEach((p,i) => {
    NODES.map((q,j) => ({j,d:(p.x-q.x)**2+(p.y-q.y)**2+(p.z-q.z)**2})).filter(q=>q.j!==i).sort((a,b)=>a.d-b.d).slice(0,3).forEach(q=>{ if(q.j>i) EDGES.push([i,q.j]); });
    if(i%5===0)EDGES.push([i,(i+29)%62]);
  });
  let BRAND = [];
  const setBrand = value => { BRAND = value; };
  function logo(ctx,x,y,width,time=0,light=false) {
    ctx.save();ctx.translate(x,y);ctx.scale(width/200,width/200);
    for(let i=0;i<BRAND.length;i++){
      if(i===5)continue;
      ctx.globalAlpha = Number(BRAND[i].opacity || 1);
      ctx.fillStyle = light && BRAND[i].fill==='#070808'?'#f4f5f2':BRAND[i].fill;
      ctx.fill(new Path2D(BRAND[i].d));
    }
    const a=time*TAU/11, rot=-.27925, ex=90*Math.cos(a), ey=18*Math.sin(a);
    ctx.globalAlpha=1;ctx.fillStyle='#065cfb';ctx.beginPath();ctx.arc(102+ex*Math.cos(rot)-ey*Math.sin(rot),98+ex*Math.sin(rot)+ey*Math.cos(rot),4.5,0,TAU);ctx.fill();ctx.restore();
  }
  function rounded(ctx,x,y,w,h,r=8){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function network(ctx, w, h, time=0, opt={}) {
    ctx.save();
    const s=Math.min(w/800,h/720);ctx.translate((w-800*s)/2,(h-720*s)/2);ctx.scale(s,s);
    const cx=400, cy=350, radius=244, pointer=opt.pointer||{x:0,y:0};
    const mode=Number(opt.mode||0), rotation=time*.065 + pointer.x*.12, pitch=.08+pointer.y*.08;
    const c=Math.cos(rotation),sn=Math.sin(rotation), cp=Math.cos(pitch),sp=Math.sin(pitch);
    const shadow=ctx.createRadialGradient(cx,646,3,cx,646,240);shadow.addColorStop(0,'rgba(35,44,63,.09)');shadow.addColorStop(1,'rgba(35,44,63,0)');ctx.save();ctx.translate(0,500);ctx.scale(1,.23);ctx.fillStyle=shadow;ctx.fillRect(100,400,620,470);ctx.restore();
    ctx.lineWidth=.8;ctx.strokeStyle='rgba(71,87,107,.13)';
    for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(cx,cy,292-j*14,86+j*14,-.39+j*.88,0,TAU);ctx.stroke();}
    const points=NODES.map((p,i)=>{
      const base=mode===1?.82:mode===2?1.07:1, breath=1+.012*Math.sin(time*.6+i*.7);
      let x=(p.x*c-p.z*sn)*radius*base*breath, z=(p.x*sn+p.z*c)*radius, y=p.y*radius;
      const yy=y*cp-z*sp;z=y*sp+z*cp;const d=850/(850-z);
      return {x:cx+x*d,y:cy+yy*d,z,d,size:p.size*d,blue:p.blue};
    });
    EDGES.forEach(([i,j],idx)=>{
      const a=points[i],b=points[j],alpha=.07+clamp((a.z+b.z+440)/900)*.16;
      ctx.strokeStyle=`rgba(49,66,87,${alpha})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      if(idx%5===0){const q=(time*.10+idx*.17)%1;ctx.fillStyle=idx%10===0?'rgba(6,92,251,.7)':'rgba(69,94,118,.38)';ctx.beginPath();ctx.arc(mix(a.x,b.x,q),mix(a.y,b.y,q),1.7,0,TAU);ctx.fill();}
    });
    points.map((p,i)=>({...p,i})).sort((a,b)=>a.z-b.z).forEach(p=>{
      const alpha=clamp((p.z+380)/570,.3,.98);ctx.globalAlpha=alpha;
      if(p.size>8){
        const g=ctx.createRadialGradient(p.x-p.size*.4,p.y-p.size*.45,p.size*.08,p.x,p.y,p.size);
        if(p.blue){g.addColorStop(0,'#99c5ff');g.addColorStop(.55,'#2079ff');g.addColorStop(1,'#073985');}
        else{g.addColorStop(0,'#99a1a8');g.addColorStop(.5,'#434c54');g.addColorStop(1,'#141d26');}
        ctx.fillStyle=g;
      }else ctx.fillStyle=p.blue?'#065cfb':'#5f6a72';
      ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill();
      if(p.size>8){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=.6;ctx.stroke();}
    });
    ctx.globalAlpha=1;
    // Central porcelain object with the author's mark, not a simulated product status.
    const core=ctx.createRadialGradient(cx-32,cy-35,2,cx,cy,68);core.addColorStop(0,'#ffffff');core.addColorStop(.52,'#e4ebf1');core.addColorStop(1,'#bbc9d7');
    ctx.shadowColor='rgba(29,42,63,.12)';ctx.shadowBlur=20;ctx.shadowOffsetY=8;ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,66,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();logo(ctx,cx-62,cy-62,124,time);
    // Technical registration marks, kept quiet enough not to compete with the heading.
    ctx.fillStyle='#7d8791';ctx.font='10px Consolas, monospace';ctx.textAlign='left';ctx.fillText('AB / CONEXÕES QUE CRIAM',97,681);
    ctx.textAlign='right';ctx.fillText(['01 · CONTEXTO','02 · CONEXÃO','03 · PRODUTO'][mode],707,681);
    [[94,150],[715,533]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.strokeStyle='#9aa4ac';ctx.stroke();});ctx.restore();
  }
  function film(ctx,w,h,time){
    const t=clamp(time,0,14);ctx.clearRect(0,0,w,h);ctx.save();ctx.scale(w/1920,h/1080);
    ctx.fillStyle='#f1f2ed';ctx.fillRect(0,0,1920,1080);
    ctx.strokeStyle='#d2d7d5';ctx.setLineDash([3,6]);ctx.lineWidth=1;
    for(const x of [100,1820]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1080);ctx.stroke();}ctx.setLineDash([]);
    const last=ease((t-10.4)/1.2);
    ctx.save();ctx.globalAlpha=1-last;network(ctx,1300,1000,t,{mode:t>6?2:t>3?1:0});ctx.restore();
    ctx.save();ctx.translate(1070,330);ctx.globalAlpha=1-last;ctx.fillStyle='#23313f';ctx.font='20px Arial';ctx.fillText('ALEXANDRE BELO',0,0);
    ctx.fillStyle='#1b2b36';ctx.font='82px Georgia';
    const lines=t<3.4?['Tudo começa','com contexto.']:t<6.8?['Os pontos','se conectam.']:['A ideia ganha','o mundo.'];
    const start=t<3.4?0:t<6.8?3.4:6.8, entrance=ease((t-start)/.65);
    ctx.globalAlpha=(1-last)*entrance;ctx.translate(0,(1-entrance)*25);lines.forEach((txt,i)=>ctx.fillText(txt,0,140+i*96));
    ctx.fillStyle='#647079';ctx.font='22px Arial';ctx.fillText(['PESQUISA','DESIGN','ENGENHARIA','IA APLICADA'].join('  /  '),0,400);ctx.restore();
    if(last>0){ctx.save();ctx.globalAlpha=last;logo(ctx,782,68,360,t);ctx.textAlign='center';ctx.fillStyle='#25343e';ctx.font='94px Georgia';ctx.fillText('Ideias ganham forma.',960,538);ctx.fillStyle='#065cfb';ctx.fillText('E ganham vida.',960,650);ctx.font='23px Arial';ctx.fillStyle='#617079';ctx.fillText('Design que entende pessoas. Código que resolve problemas.',960,758);ctx.fillStyle='#25343e';ctx.font='19px Consolas, monospace';ctx.fillText('ALEXANDREBELO.COM.BR',960,914);ctx.restore();}
    ctx.fillStyle='#65727a';ctx.font='14px Consolas,monospace';ctx.fillText('DESIGN × ENGENHARIA × IA',141,1014);ctx.textAlign='right';ctx.fillText('AB / IDEIAS VIVAS',1774,1014);ctx.restore();
  }
  root.ABScene={network,film,logo,setBrand,NODES,EDGES,clamp,ease};
})(globalThis);
