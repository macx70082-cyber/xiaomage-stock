function pct(a,b){return b===0?0:(a-b)/b*100}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function price(n){return Number(n.toFixed(2))}

function analyzePosition(d){
  const range = d.high - d.low;
  const rawRatio = range <= 0 ? 0.5 : (d.price - d.low) / range;
  const posRatio = clamp(rawRatio, 0, 1);

  let big = '历史中位';
  let bigLevel = 3;
  let bigExplain = '价格位于历史高低点之间的中枢区域，多空相对平衡。';

  if(posRatio <= 0.20){
    big = '历史极低位';
    bigLevel = 1;
    bigExplain = '价格处于历史区间底部区域，长期位置优势明显，但不代表马上上涨。';
  }else if(posRatio <= 0.40){
    big = '历史低位';
    bigLevel = 2;
    bigExplain = '价格仍位于历史低位区域，具备修复空间，但需要趋势和量能确认。';
  }else if(posRatio <= 0.60){
    big = '历史中位';
    bigLevel = 3;
    bigExplain = '价格位于历史中枢区域，多空相对平衡，不适合只凭位置下结论。';
  }else if(posRatio <= 0.80){
    big = '历史高位';
    bigLevel = 4;
    bigExplain = '价格已进入历史高位区域，获利盘和压力风险需要重点考虑。';
  }else{
    big = '历史极高位';
    bigLevel = 5;
    bigExplain = '价格非常接近历史高点，追涨风险明显增加，必须严格控制仓位。';
  }

  const ma20Gap = pct(d.price,d.ma20);
  const ma60Gap = pct(d.price,d.ma60);

  let small = '均衡区域';
  let smallLevel = 3;
  let smallExplain = '价格距离MA20不远，短线位置相对均衡。';

  if(ma20Gap <= -12){
    small = '严重超跌';
    smallLevel = 1;
    smallExplain = '价格明显低于MA20，短线存在超跌，但弱势股可能继续走弱。';
  }else if(ma20Gap <= -5){
    small = '短线低位';
    smallLevel = 2;
    smallExplain = '价格低于MA20一定幅度，短线偏低，需要看是否止跌企稳。';
  }else if(ma20Gap < 5){
    small = '均衡区域';
    smallLevel = 3;
    smallExplain = '价格接近MA20，短线不过热也不明显超跌。';
  }else if(ma20Gap < 12){
    small = '短线偏高';
    smallLevel = 4;
    smallExplain = '价格高于MA20较多，短线追涨性价比下降。';
  }else{
    small = '严重偏离';
    smallLevel = 5;
    smallExplain = '价格严重偏离MA20，短线容易出现震荡或回踩。';
  }

  let finalPosition = '均衡区域';
  let priorityExplain = '大位置与小位置没有明显冲突，可以综合趋势和量能判断。';

  if(bigLevel >= 4){
    finalPosition = '高位优先';
    priorityExplain = '大位置优先：即使短线靠近MA20，也不能把历史高位误判成安全低位。';
  }else if(bigLevel <= 2){
    finalPosition = '低位优先';
    priorityExplain = '大位置优先：长期位置不高，但低位不等于马上上涨，仍要等趋势确认。';
  }

  const positionRisk = bigLevel;
  const positionScoreMap = {1:10,2:8,3:6,4:3,5:1};
  const positionScore = positionScoreMap[bigLevel];

  let traderComment = '当前大位置和小位置没有极端矛盾，重点观察趋势方向和成交量配合。';
  if(bigLevel >= 4 && smallLevel === 3){
    traderComment = '长期位置已经偏高，虽然短线并不算过热，但这不是低风险区域，不能因为接近MA20就放松警惕。';
  }else if(bigLevel >= 4 && smallLevel >= 4){
    traderComment = '长期位置高，短线也偏热，属于追涨风险较大的结构，必须等待回踩或确认信号。';
  }else if(bigLevel <= 2 && smallLevel <= 2){
    traderComment = '长期位置低，短线也偏低，具备观察价值，但要防止弱势下跌中的“便宜陷阱”。';
  }else if(bigLevel <= 2 && d.trend === 'up'){
    traderComment = '长期位置不高且趋势改善，这是较值得跟踪的结构，但仍需要计划和止损。';
  }else if(bigLevel === 5){
    traderComment = '接近历史极高位时，老手通常先看风险和卖压，再看是否有继续突破的确认。';
  }else if(bigLevel === 1){
    traderComment = '历史极低位说明空间位置有优势，但老手不会只因为低就买，会等待止跌、放量或重新站上均线。';
  }

  const maState = d.price>=d.ma20 && d.price>=d.ma60 ? '站上MA20与MA60' : d.price<d.ma20 && d.price<d.ma60 ? '跌破MA20与MA60' : '位于均线夹层';
  return {posRatio, big, bigLevel, small, smallLevel, bigExplain, smallExplain, priorityExplain, finalPosition, positionRisk, positionScore, traderComment, ma20Gap, ma60Gap, maState};
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
  if(pos.big==='历史极高位'){bear+=4;bears.push('历史极高位追涨风险很大');}
  else if(pos.big==='历史高位'){bear+=3;bears.push('历史高位追涨风险较大');}
  if(pos.big==='历史极低位'){bull+=2;bulls.push('历史极低位，大位置优势明显');}
  else if(pos.big==='历史低位'){bull+=1;bulls.push('大位置不高，有低位修复空间');}
  if(pos.finalPosition==='高位优先') bears.push('大位置优先：不能只因靠近均线就判断为低位');
  if(pos.finalPosition==='低位优先') bulls.push('大位置优先：长期位置不高，值得加入观察池');
  const decision = bull-bear>=3?'偏多':bear-bull>=3?'偏空':'中性偏观察';
  return {bull,bear,bulls,bears,decision};
}

function supportResistance(d){
  const supports = [d.ma20,d.ma60,d.low].sort((a,b)=>b-a).filter(x=>x<d.price);
  const pressures = [d.ma20,d.ma60,d.high].sort((a,b)=>a-b).filter(x=>x>d.price);
  return {
    support: price(supports[0] || d.low),
    strongSupport: price(supports[1] || d.low),
    pressure: price(pressures[0] || d.high),
    strongPressure: price(pressures[1] || d.high)
  };
}
