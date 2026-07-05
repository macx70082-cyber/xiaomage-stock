export function createTradePlan(data, sr, risk) {
  const supportValue = sr.support.value;
  const resistanceValue = sr.resistance.value;
  const stopLoss = supportValue ? supportValue * 0.97 : data.price * 0.92;
  const pullbackBuy = supportValue ? supportValue * 1.01 : data.ma20;
  const breakoutBuy = resistanceValue ? resistanceValue * 1.02 : data.price * 1.05;
  const takeProfit = resistanceValue ? resistanceValue * 0.98 : data.price * 1.12;

  const riskWarn = risk.score >= 4 ? '当前风险偏高，优先观察，仓位必须轻。' : '风险仍可控，但必须按计划执行。';

  return [
    `低吸方案：如果回踩 ${format(pullbackBuy)} 附近并企稳，可以进入观察区，不建议无确认直接冲进去。`,
    `突破方案：如果放量突破 ${format(breakoutBuy)} 并站稳，可以视为强势确认，但要防假突破。`,
    `止损方案：如果跌破 ${format(stopLoss)}，说明原判断失败，应优先控制风险。`,
    `止盈 / 减仓：接近 ${format(takeProfit)} 附近时，至少要考虑减仓或提高保护位。`,
    riskWarn
  ];
}

function format(n) {
  return Number(n).toFixed(2);
}
