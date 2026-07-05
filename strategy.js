function tradePlan(d,pos,score,risk,sr){
  const buyBreak = Number((sr.pressure*1.01).toFixed(2));
  const watch = Number((Math.max(sr.support,d.ma20)*1.002).toFixed(2));
  const stop = Number((Math.min(sr.support,d.ma20,d.ma60)*0.98).toFixed(2));
  let core = '先观察，不追涨，等待价格靠近支撑或突破压力后再判断。';
  if(score.decision==='偏多' && risk.grade!=='D' && risk.grade!=='E') core='偏多但不代表直接买，优先等回踩企稳或放量突破。';
  if(score.decision==='偏空') core='当前偏空，重点不是找买点，而是等待风险释放。';
  if(d.positionState==='hold') core += ' 已经持有时，重点看止损位和减仓条件。';
  if(d.positionState==='wantBuy') core += ' 你有强烈买入冲动，系统建议先用条件约束自己。';
  return {
    core,
    lowBuy:`低吸观察：价格回到 ${watch} 附近并企稳，才考虑观察。`,
    breakBuy:`突破观察：放量突破 ${buyBreak}，再考虑跟踪。`,
    stop:`风险位：跌破 ${stop}，说明结构转弱，应放弃或减仓。`,
    giveUp:`放弃条件：跌破MA60、放量滞涨、突破失败后快速回落。`
  };
}
