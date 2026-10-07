import React,{useEffect} from 'react';
import {useMap} from './vendor/map';
import type {ExpressionSpecification,GeoJSONSource,Map as MapInstance,MapMouseEvent} from 'maplibre-gl';
import type {FeatureCollection,Polygon,MultiPolygon} from 'geojson';
import type {Evaluated,Metric} from './types';
export const METRICS:Record<Metric,{label:string;low:string;high:string;note:string;gradient:string}>={
 score:{label:'Oportunidade territorial · IOT',low:'0 · menor prioridade',high:'100 · maior prioridade',note:'Pontuação identificada; cinza não equivale a ausência de mercado.',gradient:'linear-gradient(90deg,#233a52,#4c7198,#63a5ce,#70d5c0,#e9d48e)'},
 density:{label:'Densidade residencial · DPO/ha',low:'0 DPO/ha',high:'30+ DPO/ha',note:'Domicílios particulares ocupados em 2022 por área total do setor.',gradient:'linear-gradient(90deg,#233a52,#447ca5,#67c6c2,#e9d48e)'},
 npv:{label:'VPL incremental · R$',low:'−R$ 300 mil ou menos',high:'+R$ 300 mil ou mais',note:'Simulação de 120 meses; hipóteses editáveis, sem valor terminal.',gradient:'linear-gradient(90deg,#a85050,#765555,#394855,#549d88,#6fd6ad)'},
 evidence:{label:'Insumos identificados · peso %',low:'0% do modelo',high:'100% do modelo',note:'Disponibilidade dos quatro insumos; não é confiança estatística.',gradient:'linear-gradient(90deg,#3e4752,#7d90a3,#6ed5c0)'}
};
function expression(metric:Metric):ExpressionSpecification{
 const stops=metric==='npv'?[-300000,'#a85050',0,'#394855',300000,'#6fd6ad']:metric==='density'?[0,'#233a52',5,'#447ca5',15,'#67c6c2',30,'#e9d48e']:metric==='evidence'?[0,'#3e4752',60,'#7d90a3',100,'#6ed5c0']:[0,'#233a52',25,'#4c7198',50,'#63a5ce',75,'#70d5c0',100,'#e9d48e'];
 return ['case',['==',['get','known'],false],'#53545d',['interpolate',['linear'],['get','value'],...stops]] as ExpressionSpecification;
}
export function TerritoryLayers({rows,metric,selected,points,heat,onSelect,onReady,onStatus}:{rows:Evaluated[];metric:Metric;selected:string|null;points:boolean;heat:boolean;onSelect:(id:string)=>void;onReady:(m:MapInstance)=>void;onStatus:(s:string)=>void}){
 const {map,isLoaded}=useMap();
 useEffect(()=>{if(!map)return;const error=()=>onStatus('Base externa indisponível · KPIs e catálogo preservados');map.on('error',error);return()=>{map.off('error',error);};},[map,onStatus]);
 useEffect(()=>{
  if(!map||!isLoaded)return;
  const collection:FeatureCollection<Polygon|MultiPolygon>={type:'FeatureCollection',features:rows.map(t=>{const value=metric==='score'?t.score:metric==='density'?t.density:metric==='npv'?t.result?.npv??null:t.available*100;return{type:'Feature',id:t.id,geometry:t.geometry,properties:{id:t.id,value:value??0,known:value!==null,partial:t.available<1}};})};
  const pois={type:'FeatureCollection' as const,features:rows.flatMap(t=>t.pois)};
  if(!map.getSource('ab-territories'))map.addSource('ab-territories',{type:'geojson',data:collection});else (map.getSource('ab-territories') as GeoJSONSource).setData(collection);
  if(!map.getSource('ab-pois'))map.addSource('ab-pois',{type:'geojson',data:pois});else (map.getSource('ab-pois') as GeoJSONSource).setData(pois);
  if(!map.getLayer('ab-sectors'))map.addLayer({id:'ab-sectors',type:'fill',source:'ab-territories',paint:{'fill-color':expression(metric),'fill-opacity':.67}});
  if(!map.getLayer('ab-sector-lines'))map.addLayer({id:'ab-sector-lines',type:'line',source:'ab-territories',paint:{'line-color':'#9dafbd','line-width':.7,'line-opacity':.6}});
  if(!map.getLayer('ab-points'))map.addLayer({id:'ab-points',type:'circle',source:'ab-pois',paint:{'circle-color':'#e3ebf1','circle-radius':3,'circle-stroke-color':'#152536','circle-stroke-width':1}});
  map.setPaintProperty('ab-sectors','fill-color',expression(metric));map.setPaintProperty('ab-sectors','fill-opacity',heat?.67:.05);
  map.setPaintProperty('ab-sector-lines','line-color',['case',['==',['get','id'],selected??''],'#ffffff','#8096a6']);
  map.setPaintProperty('ab-sector-lines','line-width',['case',['==',['get','id'],selected??''],3, .6]);
  map.setLayoutProperty('ab-points','visibility',points?'visible':'none');
  onReady(map);window.__AB_MAP_READY=true;onStatus('Mapa pronto · limites IBGE 2022');
 },[map,isLoaded,rows,metric,selected,points,heat,onReady,onStatus]);
 useEffect(()=>{if(!map||!isLoaded)return;const click=(e:MapMouseEvent)=>{const f=map.queryRenderedFeatures(e.point,{layers:['ab-sectors']})[0];if(typeof f?.properties?.id==='string')onSelect(f.properties.id);};const enter=()=>{map.getCanvas().style.cursor='pointer';},leave=()=>{map.getCanvas().style.cursor='';};map.on('click','ab-sectors',click);map.on('mouseenter','ab-sectors',enter);map.on('mouseleave','ab-sectors',leave);return()=>{map.off('click','ab-sectors',click);map.off('mouseenter','ab-sectors',enter);map.off('mouseleave','ab-sectors',leave);};},[map,isLoaded,onSelect]);
 return null;
}
export class MapBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}render(){return this.state.failed?<div className="map-fallback"><h2>Visualização geográfica indisponível</h2><p>O ranking, os gráficos e os cálculos continuam funcionando. Reative WebGL para explorar as geometrias.</p></div>:this.props.children;}}
