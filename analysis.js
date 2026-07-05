function pct(a,b){return b===0?0:(a-b)/b*100}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}

function analyzePosition(d){
  const range = d.high - d.low;
  const rawRatio = range <= 0 ? 0.5 : (d.price - d.low) / range;
  const posRatio = clamp(rawRatio, 0, 1);

  let big = '历史中位';
  let bigExplain = '价格位于历史高低点之间的中枢区域，多空力量相对平衡。';
  let positionRisk = 3;
  let positionScore = 6;

  if(posRatio <= 0.20){
    big = '历史极低位';
    bigExplain = '价格处于历史区间底部附近，长期位置优势明显，但仍需等待趋势和量能确认。';
    positionRisk = 1;
    positionScore = 10;
  }else if(posRatio <= 0.40){
    big = '历史低位';
    bigExplain = '价格仍在历史低位区域，具备修复空间，但低位不等于马上上涨。';
    positionRisk = 2;
    positionScore = 8;
  }else if(posRatio <= 0.60){
    big = '历史中位';
    bigExplain = '价格位于历史区间中部，既没有明显低位优势，也没有极端高位压力。';
    positionRisk = 3;
    positionScore = 6;
  }else if(posRatio <= 0.80){
    big = '历史高位';
    bigExplain = '价格已进入历史高位区域，压力、获利盘和回撤风险需要重点考虑。';
    positionRisk = 4;
    positionScore = 3;
  }else{
    big = '历史极高位';
    bigExplain = '价格非常接近历史高点，追涨风险明显增大，必须优先考虑风控。';
    positionRisk = 5;
    positionScore = 1;
  }

  const ma20Gap = pct(d.price,d.ma20);
  const ma60Gap = pct(d.price,d.ma60);
  let small='均衡区域';
  if(ma20Gap <= -12) small='严重超跌';
  else if(ma20Gap <= -5) small='短线低位';
  else if(ma20Gap < 5) small='均衡区域';
  else if(ma20Gap < 12) small='短线偏高';
  else small='严重偏离';

  const maState = d.price>=d.ma20 && d.price>=d.ma60 ? '站上MA20与MA60' : d.price<d.ma20 && d.price<d.ma60 ? '跌破MA20与MA60' : '位于均线夹层';

  let finalPosition = '均衡区域';
  if(big === '历史极高位' || big === '历史高位') finalPosition = '高位优先';
  if(big === '历史极低位' || big === '历史低位') finalPosition = '低位优先';

  let traderComment = '当前大位置和小位置没有明显矛盾，继续结合趋势、量能和压力位判断。';
  if((big === '历史极高位' || big === '历史高位') && (small === '均衡区域' || small === '短线低位')){
    traderComment = '大位置优先：长期位置已经偏高，即使短线靠近MA20，也不能简单理解为安全低位。';
  }else if((big === '历史极低位' || big === '历史低位') && (small === '短线偏高' || small === '严重偏离')){
    traderComment = '长期位置有优势，但短线已经偏离均线，适合等回踩或确认，不适合冲动追高。';
  }else if(big === '历史极低位'){
    traderComment = '长期位置优势明显，但交易员不会只因低位买入，还要等待趋势和量能确认。';
  }else if(big === '历史极高位'){
    traderComment = '长期位置风险很高，任何买入都必须降低仓位，并设置明确止损。';
  }

  return {posRatio, big, small, bigExplain, ma20Gap, ma60Gap, maState, finalPosition, positionRisk, positionScore, traderComment};
}

function analyzeTrend(d){
  const trendText = {up:'上涨趋势',side:'震荡趋势',down:'下跌趋势'}[d.trend];
  const volumeText = {normal:'量能正常',strong:'明显放量',weak:'缩量',divergence:'放量滞涨'}[d.volume];
  return {trendText, volumeText};
}

function bullBearScore(d,pos){
  let bull=0,bear=0,bulls=[],bears=[];

  // 1. 位置评分：来自 Sprint 1 的大位置引擎
  const positionScore = clamp(pos.positionScore || 6, 1, 10);
  if(positionScore >= 8){bull += 2; bulls.push('大位置不高，具备位置优势');}
  if(positionScore <= 3){bear += 3; bears.push('大位置偏高，追涨风险较大');}

  // 2. 趋势评分
  let trendScore = d.trend === 'up' ? 8 : d.trend === 'side' ? 5 : 2;
  if(d.trend === 'up' && d.price >= d.ma20) trendScore += 1;
  if(d.trend === 'up' && d.price >= d.ma60) trendScore += 1;
  trendScore = clamp(trendScore, 1, 10);
  if(d.trend==='up'){bull+=3;bulls.push('趋势向上，顺势概率更高');}
  if(d.trend==='side'){bull+=1;bear+=1;bulls.push('震荡中仍可能有结构机会');bears.push('震荡趋势容易假突破');}
  if(d.trend==='down'){bear+=3;bears.push('下跌趋势中，反弹失败概率更高');}

  // 3. 量能评分
  let volumeScore = {strong:8, normal:6, weak:4, divergence:2}[d.volume] || 6;
  if(d.volume==='strong'){bull+=2;bulls.push('放量说明资金关注度提升');}
  if(d.volume==='normal'){bull+=1;bulls.push('量能正常，结构没有明显失真');}
  if(d.volume==='weak'){bear+=1;bears.push('缩量说明主动进攻不足');}
  if(d.volume==='divergence'){bear+=3;bears.push('放量滞涨，说明分歧或抛压较重');}

  // 4. 结构评分：看价格、均线和大位置的组合质量
  let structureScore = 0;
  if(d.price >= d.ma20){structureScore += 3; bull += 1; bulls.push('价格站在MA20上方');}
  else {structureScore += 1; bear += 1; bears.push('价格未站稳MA20');}
  if(d.price >= d.ma60){structureScore += 3; bull += 1; bulls.push('价格站在MA60上方，中期结构较好');}
  else {structureScore += 1; bear += 1; bears.push('价格低于MA60，中期偏弱');}
  if(pos.big === '历史极低位') structureScore += 4;
  else if(pos.big === '历史低位') structureScore += 3;
  else if(pos.big === '历史中位') structureScore += 2;
  else if(pos.big === '历史高位') structureScore += 1;
  structureScore = clamp(structureScore, 1, 10);

  const totalScore = positionScore + trendScore + volumeScore + structureScore;
  let decision = '中性观察';
  if(totalScore >= 32) decision = '强势偏多';
  else if(totalScore >= 24) decision = '偏多';
  else if(totalScore >= 16) decision = '中性观察';
  else if(totalScore >= 8) decision = '偏空';
  else decision = '弱势偏空';

  let environment = 'C级买入环境';
  if(totalScore >= 32 && pos.positionRisk <= 3) environment = 'A级买入环境';
  else if(totalScore >= 28) environment = 'B级买入环境';
  else if(totalScore >= 20) environment = 'C级买入环境';
  else if(totalScore >= 12) environment = 'D级观察环境';
  else environment = 'E级回避环境';

  return {bull,bear,bulls,bears,decision,positionScore,trendScore,volumeScore,structureScore,totalScore,maxScore:40,environment};
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
