function riskBreakdown(d,pos,score,sr){
  const positionRisk = clamp(pos.positionRisk || 3, 1, 5);

  let trendRisk = d.trend === 'up' ? 1 : d.trend === 'side' ? 3 : 5;
  if(d.price < d.ma20) trendRisk += 1;
  if(d.price < d.ma60) trendRisk += 1;
  trendRisk = clamp(trendRisk, 1, 5);

  let volumeRisk = {strong:1, normal:2, weak:3, divergence:5}[d.volume] || 2;

  const pressureGap = sr.pressure && d.price > 0 ? (sr.pressure - d.price) / d.price * 100 : 20;
  let pressureRisk = 1;
  if(pressureGap < 3) pressureRisk = 5;
  else if(pressureGap < 5) pressureRisk = 4;
  else if(pressureGap < 10) pressureRisk = 3;
  else if(pressureGap < 15) pressureRisk = 2;
  else pressureRisk = 1;

  const totalRisk = positionRisk + trendRisk + volumeRisk + pressureRisk;
  let grade = 'C';
  if(totalRisk <= 5) grade = 'A';
  else if(totalRisk <= 9) grade = 'B';
  else if(totalRisk <= 13) grade = 'C';
  else if(totalRisk <= 17) grade = 'D';
  else grade = 'E';

  const riskItems = [];
  if(positionRisk >= 4) riskItems.push('历史位置偏高');
  if(trendRisk >= 4) riskItems.push('趋势结构偏弱或跌破关键均线');
  if(volumeRisk >= 4) riskItems.push('量能异常，尤其是放量滞涨');
  if(pressureRisk >= 4) riskItems.push('距离压力位过近');

  let explain = '风险中等，需要按交易计划执行，不能凭感觉追涨。';
  if(grade === 'A') explain = '总风险较低，位置、趋势和压力条件相对友好，但仍必须设置止损。';
  if(grade === 'B') explain = '风险中低，可以观察确认，但不代表可以重仓冲动买入。';
  if(grade === 'C') explain = '风险中等，适合等待确认信号，避免无计划追涨。';
  if(grade === 'D') explain = `风险较高，主要来自：${riskItems.join('、') || '结构不够理想'}。必须控制仓位。`;
  if(grade === 'E') explain = `极高风险，主要来自：${riskItems.join('、') || '多项风险叠加'}。优先回避或只做学习观察。`;

  const textLevel = n => n >= 5 ? '极高' : n >= 4 ? '高' : n >= 3 ? '中' : n >= 2 ? '中低' : '低';

  return {
    location: textLevel(positionRisk),
    trend: textLevel(trendRisk),
    volume: textLevel(volumeRisk),
    pressure: textLevel(pressureRisk),
    positionRisk,
    trendRisk,
    volumeRisk,
    pressureRisk,
    totalRisk,
    maxRisk:20,
    grade,
    explain,
    pressureGap:Number(pressureGap.toFixed(2))
  };
}
