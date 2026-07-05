function pct(a,b){return b===0?0:(a-b)/b*100}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function analyzePosition(d){
  const range = d.high - d.low;
  const posRatio = (d.price - d.low) / range;
  let big = '历史中位', bigExplain = '价格位于历史高低点之间的中部区域。';
  if(posRatio >= .78){ big='历史高位'; bigExplain='价格已经接近历史高点，获利盘和压力风险需要重点考虑。'; }
  else if(posRatio <= .32){ big='历史低位'; bigExplain='价格距离历史高点较远，长期位置不算高，但不代表马上会上涨。'; }
  const ma20Gap = pct(d.price,d.ma20);
  const ma60Gap = pct(d.price,d.ma60);
  let small='小位置中性';
  if(ma20Gap > 8) small='短线偏高';
  else if(ma20Gap < -5) small='短线偏低';
  const maState = d.price>=d.ma20 && d.price>=d.ma60 ? '站上MA20与MA60' : d.price<d.ma20 && d.price<d.ma60 ? '跌破MA20与MA60' : '位于均线夹层';
  return {posRatio, big, small, bigExplain, ma20Gap, ma60Gap, maState};
}
function analyzeTrend(d){
  const trendText = {up:'上涨趋势',side:'震荡趋势',down:'下跌趋势'}[d.trend];
  const volumeText = {normal:'量能正常',strong:'明显放量',weak:'缩量',divergence:'放量滞涨'}[d.volume];
  return {trendText, volumeText};
}
function bullBearScore(d,pos){
  let bull=0,bear=0,bulls=[],bears=[];
  if(d.trend==='up'){bull+=3;bulls.push('趋势向上，顺势概率更高');}
  if(d.trend==='side'){bull+=1;bear+=1;bulls.push('震荡中仍有结构机会');bears.push('震荡趋势容易假突破');}
  if(d.trend==='down'){bear+=3;bears.push('下跌趋势中，反弹失败概率更高');}
  if(d.price>d.ma20){bull+=1;bulls.push('价格站在MA20上方');}else{bear+=1;bears.push('价格未站稳MA20');}
  if(d.price>d.ma60){bull+=1;bulls.push('价格站在MA60上方，中期结构较好');}else{bear+=1;bears.push('价格低于MA60，中期偏弱');}
  if(d.volume==='strong'){bull+=2;bulls.push('放量说明资金关注度提升');}
  if(d.volume==='weak'){bear+=1;bears.push('缩量说明主动进攻不足');}
  if(d.volume==='divergence'){bear+=3;bears.push('放量滞涨，说明分歧或抛压较重');}
  if(pos.big==='历史高位'){bear+=3;bears.push('历史高位追涨风险较大');}
  if(pos.big==='历史低位'){bull+=1;bulls.push('大位置不高，有低位修复空间');}
  const decision = bull-bear>=3?'偏多':bear-bull>=3?'偏空':'中性偏观察';
  return {bull,bear,bulls,bears,decision};
}
function supportResistance(d){
  const supports = [d.ma20,d.ma60,d.low].sort((a,b)=>b-a).filter(x=>x<d.price);
  const pressures = [d.ma20,d.ma60,d.high].sort((a,b)=>a-b).filter(x=>x>d.price);
  return {
    support: supports[0] || d.low,
    strongSupport: supports[1] || d.low,
    pressure: pressures[0] || d.high,
    strongPressure: pressures[1] || d.high
  };
}
