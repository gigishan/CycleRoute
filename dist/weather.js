import {distance} from './core.js';

// Sample by distance, not vertex count: dense map geometry must not bias the forecast.
export function rideSamples(route,departure=Date.now()) {
  const points=route.coordinates.map(c=>({lat:c[1],lon:c[0]}));
  const cumulative=[0];
  for(let i=1;i<points.length;i++) cumulative.push(cumulative[i-1]+distance(points[i-1],points[i]));
  const total=cumulative.at(-1),count=Math.min(17,Math.max(3,Math.ceil(route.seconds/3600)+1));
  return Array.from({length:count},(_,i)=>{
    const fraction=i/(count-1),target=total*fraction;
    let j=1;while(j<cumulative.length-1&&cumulative[j]<target)j++;
    const span=cumulative[j]-cumulative[j-1],weight=span?(target-cumulative[j-1])/span:0;
    return {lat:points[j-1].lat+(points[j].lat-points[j-1].lat)*weight,lon:points[j-1].lon+(points[j].lon-points[j-1].lon)*weight,time:departure/1000+route.seconds*fraction};
  });
}
export function condition(code){
  if(code>=95)return {label:'Thunderstorms',rank:8,symbol:'⛈'};
  if([56,57,66,67].includes(code))return {label:'Freezing rain',rank:7,symbol:'🌧'};
  if([71,73,75,77,85,86].includes(code))return {label:'Snow',rank:6,symbol:'❄'};
  if(code>=80)return {label:'Showers',rank:5,symbol:'🌦'};
  if(code>=61)return {label:'Rain',rank:5,symbol:'🌧'};
  if(code>=51)return {label:'Drizzle',rank:4,symbol:'🌦'};
  if(code>=45)return {label:'Fog',rank:3,symbol:'🌫'};
  if(code===3)return {label:'Overcast',rank:2,symbol:'☁'};
  if(code===2)return {label:'Partly cloudy',rank:1,symbol:'⛅'};
  return {label:code===1?'Mainly clear':'Clear',rank:0,symbol:'☀'};
}
export function summarizeWeather(data,samples){
  const forecasts=Array.isArray(data)?data:[data];
  if(forecasts.length!==samples.length)throw Error('Incomplete forecast');
  const values=samples.map((sample,i)=>{
    const h=forecasts[i]?.hourly;if(!h?.time?.length)throw Error('Forecast unavailable');
    let index=0;h.time.forEach((t,j)=>{if(Math.abs(t-sample.time)<Math.abs(h.time[index]-sample.time))index=j;});
    const temperature=h.temperature_2m?.[index],rain=h.precipitation_probability?.[index],code=h.weather_code?.[index];
    if(Math.abs(h.time[index]-sample.time)>3600||![temperature,rain,code].every(Number.isFinite))throw Error('Forecast unavailable for ride time');
    return {temperature,rain,...condition(code)};
  });
  return {condition:[...values].sort((a,b)=>b.rank-a.rank)[0],low:Math.round(Math.min(...values.map(x=>x.temperature))),high:Math.round(Math.max(...values.map(x=>x.temperature))),rain:Math.round(Math.max(...values.map(x=>x.rain))),departure:samples[0].time*1000,arrival:samples.at(-1).time*1000,count:samples.length};
}
export async function fetchRideWeather(route,departure){
  const samples=rideSamples(route,departure),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
    const query=new URLSearchParams({latitude:samples.map(s=>s.lat.toFixed(5)).join(','),longitude:samples.map(s=>s.lon.toFixed(5)).join(','),hourly:'temperature_2m,precipitation_probability,weather_code',timeformat:'unixtime',timezone:'GMT',forecast_days:'7'});
    const response=await fetch(`https://api.open-meteo.com/v1/forecast?${query}`,{signal:controller.signal});
    if(!response.ok)throw Error('Weather service unavailable');
    return summarizeWeather(await response.json(),samples);
  }finally{clearTimeout(timer);}
}
