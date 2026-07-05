function riskBreakdown(d,pos,score,sr){
  let location = (pos.big==='历史极高位'||pos.big==='历史高位')?'高':(pos.big==='历史极低位'||pos.big==='历史低位')?'低':'中';
  let trend = d.trend==='down'?'高':d.trend==='side'?'中':'低';
  let volume = d.volume==='divergence'?'高':d.volume==='weak'?'中':'低';
  let pressure = Math.abs((sr.pressure-d.price)/d.price*100) < 5 ? '高' : '中';
  let riskPoint = 0;
  [location,trend,volume,pressure].forEach(r=>{riskPoint += r==='高'?2:r==='中'?1:0});
  if(score.bear>score.bull) riskPoint += 1;
  const grade = riskPoint<=2?'A':riskPoint<=4?'B':riskPoint<=6?'C':riskPoint<=8?'D':'E';
  const explain = {A:'风险较低，但仍需要计划。',B:'风险中低，适合观察确认。',C:'风险中等，不能无计划追涨。',D:'风险较高，必须控制仓位和止损。',E:'极高风险，优先回避或只做学习观察。'}[grade];
  return {location,trend,volume,pressure,grade,explain};
}
