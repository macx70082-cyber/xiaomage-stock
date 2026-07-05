const cases = [
  {name:'低位启动案例',desc:'大位置低，站回MA20，量能开始改善。'},
  {name:'主升浪案例',desc:'趋势向上，价格在MA20上方运行，回调不破关键均线。'},
  {name:'历史新高案例',desc:'价格接近或突破历史高点，机会和风险同时放大。'},
  {name:'箱体震荡案例',desc:'价格在高低点之间来回波动，适合等突破或支撑确认。'},
  {name:'假突破案例',desc:'突破后无量或快速回落，容易诱多。'},
  {name:'MA20支撑案例',desc:'上涨趋势中回踩MA20附近企稳。'},
  {name:'MA60防守案例',desc:'中期趋势关键防线，跌破后要谨慎。'},
  {name:'下跌反弹案例',desc:'下跌趋势中的反弹，不等于趋势反转。'}
];
function matchCase(d,pos){
  if(pos.big==='历史高位') return {name:'历史新高案例',sim:84,why:'大位置偏高，压力和获利盘是核心矛盾。'};
  if(d.trend==='up' && d.price>d.ma20 && d.price>d.ma60) return {name:'主升浪案例',sim:82,why:'趋势向上，价格在主要均线上方，符合顺势结构。'};
  if(d.trend==='side') return {name:'箱体震荡案例',sim:78,why:'趋势不够明确，更像区间波动。'};
  if(d.trend==='down') return {name:'下跌反弹案例',sim:80,why:'下跌趋势中要先防反弹失败。'};
  return {name:'MA20支撑案例',sim:70,why:'当前最需要观察MA20附近是否有效支撑。'};
}
function mistakes(d,pos){
  const arr=[];
  if(Math.abs((d.price-d.ma20)/d.ma20*100)<3 && pos.big==='历史高位') arr.push('MA20附近 ≠ 低位。历史位置高时，短线贴近均线也可能只是高位休整。');
  if(pos.big==='历史低位') arr.push('低位 ≠ 马上涨。低位只说明位置不高，还需要趋势和量能配合。');
  if(d.volume==='strong') arr.push('放量 ≠ 一定上涨。要看放量后价格是否能继续上攻。');
  if(d.volume==='divergence') arr.push('放量滞涨要谨慎，可能说明上方抛压较重。');
  if(d.positionState==='wantBuy') arr.push('很想买时最容易冲动，必须先写好止损和放弃条件。');
  return arr.length?arr:['暂无明显误区，但仍要按计划交易。'];
}
function renderCases(){
  const box=document.getElementById('caseLibrary');
  box.innerHTML=cases.map(c=>`<div class="case"><h3>${c.name}</h3><p>${c.desc}</p></div>`).join('');
}
