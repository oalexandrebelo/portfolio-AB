/** Motor determinístico. Dados ausentes não são convertidos em demanda ou zeros de mercado. */
export const CATEGORIES={educacao:{label:'Educação',color:'#6bb6ff',weight:2},saude:{label:'Saúde',color:'#6ee7ba',weight:3},servicos:{label:'Serviços',color:'#b4a4ff',weight:2},consumo:{label:'Comércio',color:'#ffca79',weight:1},comunidade:{label:'Comunidade',color:'#ef9bb3',weight:0.5}};
export const PROFILES={misto:{label:'Misto',weights:[0.4,0.2,0.25,0.15]},residencial:{label:'Residencial',weights:[0.6,0.3,0.05,0.05]},empresarial:{label:'Empresarial',weights:[0.15,0.1,0.55,0.2]}};
export const DEFAULTS=Object.freeze({arpu:129,b2bArpu:450,penetration:0.3,serviceable:0.7,qualification:0.5,b2bWin:0.2,churn:0.015,deductions:0.24,variable:25,b2bVariable:95,capexKm:24000,hpKm:120,setup:30000,activation:650,b2bActivation:1800,cac:200,b2bCac:500,recovery:0.3,fixed:2500,pole:10,polesKm:25,maintenance:0.02,ramp:18,tma:0.18,shock:0,repair:0});
export const PARAMS={arpu:[40,350],b2bArpu:[100,5000],penetration:[0.05,0.8],serviceable:[0.1,1],qualification:[0,1],b2bWin:[0,1],churn:[0,0.1],deductions:[0,0.6],variable:[0,100],b2bVariable:[0,3000],capexKm:[5000,100000],hpKm:[20,800],setup:[0,500000],activation:[100,5000],b2bActivation:[100,20000],cac:[0,2000],b2bCac:[0,5000],recovery:[0,0.8],fixed:[0,30000],pole:[0,50],polesKm:[0,100],maintenance:[0,0.2],ramp:[1,60],tma:[0,1],shock:[0,30],repair:[0,500000]};
export const MODEL_VERSION='AB-IOT-3.0';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const valid=x=>typeof x==='number'&&Number.isFinite(x);
export const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function checkedParameters(input={}){const p={...DEFAULTS,...input};for(const [key,[lo,hi]] of Object.entries(PARAMS)){if(!valid(p[key])||p[key]<lo||p[key]>hi)throw new Error('Parâmetro inválido: '+key);}return p;}
function inRing(point,ring){let inside=false;const [x,y]=point;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];const cross=(x-xi)*(yj-yi)-(y-yi)*(xj-xi);if(Math.abs(cross)<1e-12&&x>=Math.min(xi,xj)-1e-10&&x<=Math.max(xi,xj)+1e-10&&y>=Math.min(yi,yj)-1e-10&&y<=Math.max(yi,yj)+1e-10)return true;if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
export function pointInGeometry(point,geometry){const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polygons.some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(r=>inRing(point,r)));}
const inBox=(p,b)=>p[0]>=b[0]&&p[0]<=b[2]&&p[1]>=b[1]&&p[1]<=b[3];
/** Uma associação por ID OSM. Pontos de fronteira usam o menor código censitário. */
export function buildTerritories(census,places,bounds){
 if(census?.schema!==1||!Array.isArray(census.collection?.features)||census.collection.features.length>10000||!Array.isArray(places)||places.length>10000)throw new Error('Dados territoriais inválidos');
 const ids=new Set(),rows=census.collection.features.map(f=>{const p=f.properties;if(ids.has(p.id)||!valid(p.areaHa)||p.areaHa<=0)throw new Error('Setor duplicado ou área inválida');ids.add(p.id);const box=bounds[p.city];return{...p,geometry:f.geometry,pois:[],coverage:!!box&&inBox([p.bbox[0],p.bbox[1]],box)&&inBox([p.bbox[2],p.bbox[3]],box)};}).sort((a,b)=>a.id.localeCompare(b.id));
 const seen=new Set(),unassigned=[];let duplicated=0;
 for(const p of places){const id=p.properties.id;if(seen.has(id)){duplicated++;continue;}seen.add(id);const xy=p.geometry?.coordinates;if(!xy||!xy.every(valid))throw new Error('Coordenada inválida');const t=rows.find(t=>t.city===p.properties.city&&inBox(xy,t.bbox)&&pointInGeometry(xy,t.geometry));if(t)t.pois.push(p);else unassigned.push(p);}
 return{rows,unassigned,duplicated};
}
const scaled=(x,ref)=>100*clamp(Math.log1p(Math.max(0,x))/Math.log1p(ref),0,1);
/** Limites de referência são escolhas analíticas explícitas, não limiares da Anatel. */
export function scoreTerritory(t,profile='misto',active=Object.keys(CATEGORIES)){
 if(!PROFILES[profile])throw new Error('Perfil inválido');
 const pois=t.pois.filter(p=>active.includes(p.properties.category));
 const counts=Object.fromEntries(Object.keys(CATEGORIES).map(k=>[k,pois.filter(p=>p.properties.category===k).length]));
 const n=pois.length,weighted=Object.entries(counts).reduce((s,[k,v])=>s+v*CATEGORIES[k].weight,0);
 const density=valid(t.homes)?t.homes/t.areaHa:null;
 const diversity=n?Object.values(counts).reduce((s,c)=>c?s-(c/n)*Math.log(c/n):s,0)/Math.log(5):0;
 // Diversidade com amostras minúsculas é reduzida; n/(n+5) é uma regra de estabilidade, não IC.
 const raw=[density,t.homes,t.coverage?weighted/(t.areaHa/100):null,t.coverage?diversity*n/(n+5):null];
 const scores=[raw[0]===null?null:scaled(raw[0],30),raw[1]===null?null:scaled(raw[1],800),raw[2]===null?null:scaled(raw[2],40),raw[3]===null?null:100*raw[3]];
 const weights=PROFILES[profile].weights,labels=['Densidade residencial','Escala endereçável histórica','Âncoras mapeadas','Diversidade de atividades'];
 const components=scores.map((value,i)=>({label:labels[i],raw:raw[i],value,weight:weights[i],contribution:value===null?null:value*weights[i]}));
 const score=components.reduce((s,c)=>s+(c.contribution??0),0),available=components.reduce((s,c)=>s+(c.value===null?0:c.weight),0);
 return{...t,pois,counts,n,weighted,density,diversity,components,score,upper:clamp(score+100*(1-available),0,100),available,profile};
}
/** Fluxo operacional incremental sem reajustes de preços e custos, 120 meses, sem valor terminal.
 * Não substitui o EVTEO completo: custos compartilhados entram na premissa fixa do bloco.
 * Deduções efetivas são uma hipótese agregada, não um enquadramento tributário.
 */
export function simulate(t,input={}){
 const p=checkedParameters(input);
 if(!valid(t.homes)||t.homes<0)return null;
 const hp=t.homes*p.serviceable,km=hp/p.hpKm,network=km*p.capexKm;
 const nTarget=hp*p.penetration,bTarget=t.n*p.qualification*p.b2bWin;
 const fixed=p.fixed+km*p.polesKm*p.pole+network*p.maintenance/12;
 const flow=[-(network+p.setup)],series=[{month:0,cash:flow[0],cumulative:flow[0],revenue:0,residential:0,business:0,capex:network+p.setup,operating:0}];
 let previous=0,prevB=0,cumulative=flow[0],peak=-cumulative,totalCapex=network+p.setup,npv=flow[0],grossActivations=0,totalRevenue=0;
 for(let month=1;month<=120;month++){
  const n=nTarget*Math.min(1,month/p.ramp),b=bTarget*Math.min(1,month/p.ramp),avg=(previous+n)/2,avgB=(prevB+b)/2;
  const lost=previous*p.churn,lostB=prevB*p.churn/2,gross=Math.max(0,n-previous+lost),grossB=Math.max(0,b-prevB+lostB);
  const reuse=Math.min(lost,gross)*p.activation*p.recovery,reuseB=Math.min(lostB,grossB)*p.b2bActivation*p.recovery;
  let capex=gross*p.activation+grossB*p.b2bActivation-reuse-reuseB;
  if(month===60)capex+=n*p.activation*0.5+b*p.b2bActivation*0.5;
  const revenue=avg*p.arpu+avgB*p.b2bArpu;
  const acquisition=gross*p.cac+grossB*p.b2bCac;
  const operating=revenue*(1-p.deductions)-avg*p.variable-avgB*p.b2bVariable-fixed-acquisition;
  const incident=month===24?revenue*p.shock/30+p.repair:0;
  const cash=operating-capex-incident;cumulative+=cash;peak=Math.max(peak,-cumulative);npv+=cash/Math.pow(1+p.tma,month/12);totalCapex+=capex;grossActivations+=gross+grossB;totalRevenue+=revenue;
  flow.push(cash);series.push({month,cash,cumulative,revenue,residential:n,business:b,capex,operating});previous=n;prevB=b;
 }
 let payback=null,minimum=Infinity;for(let i=series.length-1;i>=1;i--){minimum=Math.min(minimum,series[i].cumulative);if(minimum>=0)payback=i;}
 const contribution=p.arpu*(1-p.deductions)-p.variable-p.churn*(p.cac+p.activation*(1-p.recovery));
 const mature=series[120];
 const breakEven=contribution>0?fixed/contribution:null;
 return{hp,km,network,setup:p.setup,nTarget,bTarget,fixed,contribution,breakEven,breakEvenTakeup:breakEven===null||hp===0?null:breakEven/hp,npv,peakFunding:peak,payback,totalCapex,grossActivations,totalRevenue,mrr:nTarget*p.arpu+bTarget*p.b2bArpu,matureCash:mature.cash,flow,series,capacityGbps:(nTarget*3.5+bTarget*20)/1000};
}
export function stressParameters(input){const p=checkedParameters(input);return checkedParameters({...p,arpu:Math.max(40,p.arpu*0.9),penetration:Math.max(0.05,p.penetration-0.05),churn:Math.min(0.1,p.churn+0.007),capexKm:Math.min(100000,p.capexKm*1.25),variable:Math.min(100,p.variable*1.15),shock:1,repair:15000});}
export function portfolio(rows,input){const items=rows.map(t=>({territory:t,result:simulate(t,input)})).filter(x=>x.result);const flows=Array.from({length:121},(_,i)=>items.reduce((s,x)=>s+x.result.flow[i],0));let cumulative=0,peak=0;for(const f of flows){cumulative+=f;peak=Math.max(peak,-cumulative);}return{items,flows,npv:items.reduce((s,x)=>s+x.result.npv,0),funding:peak,mrr:items.reduce((s,x)=>s+x.result.mrr,0),hp:items.reduce((s,x)=>s+x.result.hp,0),homes:rows.reduce((s,t)=>s+(t.homes??0),0)};}
export function pareto(rows){const total=rows.reduce((s,t)=>s+(t.homes??0),0);let homes=0;return rows.map((t,i)=>{homes+=t.homes??0;return{id:t.id,x:(i+1)/Math.max(1,rows.length),y:total?homes/total:0,homes};});}
export function weightedScore(rows){const weight=rows.reduce((s,t)=>s+(t.homes??0),0);return weight?rows.reduce((s,t)=>s+t.score*(t.homes??0),0)/weight:null;}
export const KPI_REGISTER=[
 ['01','PSI','Ocupação e disponibilidade de postes','N/D','Cadastro Energisa e inspeção por rota; não inferir pela imagem do mapa.'],
 ['02','HHI-Telecom','Concentração por prestadora','N/D','Acessos reconciliados por grupo econômico e território. Não espacializar total municipal por regra de três.'],
 ['03','AMR','Preço ou ARPU por Mbps','Cenário','Preço de vitrine não é ARPU realizado. Coletar oferta por CEP e mix faturado.'],
 ['04','FOR','Sobreposição de redes','N/D','Rotas concorrentes georreferenciadas e auditadas.'],
 ['05','CUI','Utilização de CTO','N/D','Portas ativas não são contáveis com segurança por cabos drop visíveis.'],
 ['06','ECC','Origem das novas ativações','N/D','CRM e denominador de novas ativações; não mede churn do concorrente.'],
 ['07','LDI','Diferença de latência','N/D','Sondas consentidas, mesmo destino, horário e protocolo.'],
 ['08','MTTR','Tempo de reparo','N/D','Timestamps de abertura e restauração; relatos isolados não medem MTTR.'],
 ['09','CSR','CGNAT sem IPv6 funcional','N/D','Medição no terminal com consentimento. Não varrer ASNs para inferir assinantes.'],
 ['10','BOF','Frequência de falhas de transporte','N/D','Telemetria temporal; ausência de evento não certifica disponibilidade.'],
 ['11','DYH','Densidade de acessos por hectare','Não equivalente','O mapa calcula DPO 2022 por hectare, não acessos Anatel.'],
 ['12','POS','Participação de ODN própria','N/D','Inventário de ativos e contratos; outorga não comprova propriedade da rede.'],
 ['13','CPE','Elasticidade cruzada de preços','N/D','Variação causal de preço e conversão; a matriz de sensibilidade não é elasticidade medida.'],
 ['14','CAC Diff','Diferença de aquisição','Cenário','CAC próprio é uma premissa; custo concorrente não foi medido.'],
 ['15','c-NPS','Reclamações normalizadas','N/D','Queixas por mil não são NPS. Exige período, amostra e base comparáveis.'],
 ['16','CTG','Lacuna tecnológica do CPE','N/D','Inventário consentido; Wi-Fi 5 não implica limite universal de 300 Mbps.'],
 ['17','CPE_km','CAPEX por quilômetro','Cenário','R$/km editável; km equivalentes não são projeto executivo de rota.'],
 ['18','PBVI','Risco físico de transporte','N/D','Traçados e grupos de risco compartilhado. Rodovias diferentes não comprovam independência.'],
 ['19','CAS','Participação corporativa agro','N/D','CNPJs elegíveis e contratos dedicados. POIs não medem market share agro.'],
 ['20','TTP','Prazo de instalação','N/D','Pedidos reais, viabilidade, agenda e SLA; meta não é desempenho aferido.']
];
