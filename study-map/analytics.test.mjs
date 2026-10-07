import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {brotliDecompressSync} from 'node:zlib';
import {buildTerritories,CATEGORIES,DEFAULTS,checkedParameters,pointInGeometry,PROFILES,scoreTerritory,simulate,stressParameters,portfolio,pareto,weightedScore} from './analytics.mjs';
let count=0;
const check=(x,label)=>{assert.ok(x,label);count++;};
const eq=(a,b,label)=>{assert.equal(a,b,label);count++;};
const close=(a,b,label)=>check(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),label);
const square={type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]};
check(pointInGeometry([1,1],square),'POINT_INSIDE');check(!pointInGeometry([3,1],square),'POINT_OUTSIDE');check(pointInGeometry([0,1],square),'POINT_BOUNDARY');
const hole={type:'Polygon',coordinates:[square.coordinates[0],[[.5,.5],[1.5,.5],[1.5,1.5],[.5,1.5],[.5,.5]]]};
check(!pointInGeometry([1,1],hole),'HOLE_EXCLUDED');check(pointInGeometry([.25,.25],hole),'SHELL_INCLUDED');check(pointInGeometry([1,1],{type:'MultiPolygon',coordinates:[square.coordinates]}),'MULTIPOLYGON');
const base={id:'01',city:'sinop',geometry:square,bbox:[0,0,2,2],center:[1,1],areaHa:25,homes:300,people:900,totalHomes:340,privateHomes:340,imputedShare:.05,pois:[],coverage:true};
const points=Array.from({length:10},(_,i)=>({type:'Feature',geometry:{type:'Point',coordinates:[1,1]},properties:{id:'node/'+i,city:'sinop',category:Object.keys(CATEGORIES)[i%5],name:'Teste '+i}}));
const census={schema:1,collection:{features:[{type:'Feature',geometry:square,properties:base}]}};
const associated=buildTerritories(census,[...points,points[0]],{sinop:[0,0,2,2]});eq(associated.rows[0].pois.length,10,'SPATIAL_COUNT');eq(associated.duplicated,1,'IDENTITY_DEDUP');eq(associated.unassigned.length,0,'ALL_MATCH');
const t={...base,pois:points},scored=scoreTerritory(t),missing=scoreTerritory({...t,coverage:false});
close(scored.components.reduce((s,x)=>s+x.contribution,0),scored.score,'SCORE_IDENTITY');close(scored.available,1,'FULL_INPUTS');close(missing.available,.6,'PARTIAL_INPUTS');close(missing.upper-missing.score,40,'MISSING_INTERVAL');check(missing.score<=scored.score&&missing.upper>=scored.score,'INTERVAL_CONTAINS_COMPLETE');
check(scoreTerritory({...t,homes:400}).score>scored.score,'HOUSEHOLDS_MONOTONIC');eq(scoreTerritory({...t,homes:null}).density,null,'NULL_NOT_ZERO');eq(scoreTerritory(t,'misto',[]).n,0,'CATEGORY_FILTER');check(scoreTerritory(t,'misto',[]).score<=scored.score,'FILTER_CONTRIBUTION');
for(const [name,profile] of Object.entries(PROFILES)){close(profile.weights.reduce((a,b)=>a+b,0),1,'WEIGHTS_'+name);const s=scoreTerritory(t,name);check(s.score>=0&&s.upper<=100,'RANGE_'+name);}
assert.throws(()=>checkedParameters({arpu:NaN}));count++;assert.throws(()=>checkedParameters({penetration:2}));count++;
eq(simulate(scoreTerritory({...t,homes:null})),null,'UNKNOWN_NO_FORECAST');
const sim=simulate(scored),stress=simulate(scored,stressParameters(DEFAULTS));eq(sim.flow.length,121,'MONTHS');eq(sim.series.length,121,'SERIES');check(stress.npv<sim.npv,'STRESS_WORSE');check(stress.peakFunding>sim.peakFunding,'STRESS_CAPITAL');
close(sim.series[0].cash,-(sim.network+sim.setup),'INITIAL_CAPEX');close(sim.mrr,sim.nTarget*DEFAULTS.arpu+sim.bTarget*DEFAULTS.b2bArpu,'MRR');
let cumulative=0,npv=0,peak=0;for(let i=0;i<=120;i++){cumulative+=sim.flow[i];peak=Math.max(peak,-cumulative);npv+=sim.flow[i]/Math.pow(1+DEFAULTS.tma,i/12);close(sim.series[i].cumulative,cumulative,'CUMULATIVE_'+i);check(Number.isFinite(sim.flow[i]),'FINITE_'+i);if(i)close(sim.series[i].cash,sim.series[i].operating-sim.series[i].capex,'CASH_IDENTITY_'+i);}
close(sim.npv,npv,'NPV');close(sim.peakFunding,peak,'PEAK');if(sim.payback){check(sim.series.slice(sim.payback).every(x=>x.cumulative>=0),'SUSTAINED_PAYBACK');}
const noB2b=simulate({...scored,n:0},{qualification:0});eq(noB2b.bTarget,0,'NO_B2B_REVENUE');const shock=simulate(scored,{shock:1,repair:15000});check(shock.series[24].cash<sim.series[24].cash,'INCIDENT_MONTH');close(shock.series[25].cash,sim.series[25].cash,'INCIDENT_NO_PERSISTENT_FICTION');
const batch=portfolio([scored,{...scored,id:'02'}],{...DEFAULTS});close(batch.npv,sim.npv*2,'BATCH_NPV');close(batch.funding,sim.peakFunding*2,'BATCH_PEAK_SAME_RAMP');eq(portfolio([],{...DEFAULTS}).funding,0,'EMPTY_BATCH');eq(pareto([]).length,0,'EMPTY_PARETO');eq(weightedScore([]),null,'EMPTY_WEIGHT');close(pareto([scored])[0].y,1,'PARETO_TOTAL');
const generated=await readFile(new URL('../lib/estudos/census.generated.ts',import.meta.url),'utf8');
const encoded=JSON.parse(generated.match(/CENSUS_B64=("[^"]+")/)[1]);const official=JSON.parse(brotliDecompressSync(Buffer.from(encoded,'base64')));
eq(official.collection.features.length,470,'OFFICIAL_COHORT');eq(official.totals.sinop.homes,66569,'SINOP_DPO');eq(official.totals.sorriso.homes,34515,'SORRISO_DPO');eq(official.totals.sinop.people,190451,'SINOP_PEOPLE');eq(official.totals.sorriso.people,103010,'SORRISO_PEOPLE');
const territories=buildTerritories(official,[],{sinop:[-55.56,-11.92,-55.45,-11.8],sorriso:[-55.78,-12.58,-55.66,-12.49]}).rows;
for(const t of territories){const s=scoreTerritory(t),r=simulate(s);check(s.score>=0&&s.score<=100&&s.upper>=s.score&&s.upper<=100,'OFFICIAL_SCORE_'+t.id);if(r){check(Number.isFinite(r.npv)&&Number.isFinite(r.peakFunding),'OFFICIAL_FINITE_'+t.id);check(simulate(s,{arpu:DEFAULTS.arpu+1}).npv>=r.npv-1e-5,'PRICE_MONOTONIC_'+t.id);}}
console.log('geokpi: '+count+' verificações aprovadas; fonte oficial, geometria, pesos, dados ausentes e fluxo mensal.');
