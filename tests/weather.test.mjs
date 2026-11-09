import test from 'node:test';
import assert from 'node:assert/strict';
import {rideSamples,summarizeWeather,condition} from '../dist/weather.js';

test('ride samples use distance and estimated arrival times, not vertex density',()=>{
 const samples=rideSamples({coordinates:[[103,1],[103.001,1],[104,1]],seconds:7200},0);
 assert.equal(samples.length,3);assert.ok(Math.abs(samples[1].lon-103.5)<.00001);
 assert.equal(samples[1].time,3600);assert.equal(samples[2].time,7200);
});
test('forecast follows each sample arrival across midnight and highlights worse conditions',()=>{
 const samples=[{time:86300},{time:90000},{time:93600}];
 const hourly={time:[86400,90000,93600],temperature_2m:[30,28,26],precipitation_probability:[10,60,90],weather_code:[1,61,95]};
 const result=summarizeWeather(samples.map(()=>({hourly})),samples);
 assert.equal(result.condition.label,'Thunderstorms');assert.equal(result.low,26);assert.equal(result.high,30);assert.equal(result.rain,90);
});
test('missing data and out-of-range times are unavailable, not falsely clear',()=>{
 const hourly={time:[10000],temperature_2m:[null],precipitation_probability:[0],weather_code:[0]};
 assert.throws(()=>summarizeWeather({hourly},[{time:10000}]));
 hourly.temperature_2m=[30];assert.throws(()=>summarizeWeather({hourly},[{time:20000}]));
 assert.throws(()=>summarizeWeather([],[{time:10000}]));
});
test('freezing rain and snow are distinguished from ordinary rain',()=>{
 assert.equal(condition(67).label,'Freezing rain');assert.equal(condition(85).label,'Snow');assert.equal(condition(80).label,'Showers');
});
