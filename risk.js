export function calculateRisk(data, position) {
  let score = 2;
  const reasons = [];

  if (position.bigPosition === '历史高位') { score += 2; reasons.push('大位置较高'); }
  if (position.bigPosition === '历史低位') { score -= 1; reasons.push('大位置较低'); }
  if (data.trend === 'down') { score += 2; reasons.push('下降趋势'); }
  if (data.trend === 'up') { score -= 1; reasons.push('上升趋势'); }
  if (data.volume === 'stagnation') { score += 2; reasons.push('放量滞涨'); }
  if (data.volume === 'divergence') { score += 2; reasons.push('量价背离'); }
  if (data.volume === 'breakout') { score -= 1; reasons.push('放量突破'); }
  if (position.ma20Diff > 0.12) { score += 1; reasons.push('短线偏离 MA20 过大'); }
  if (data.positionState === 'holdingLoss') { score += 1; reasons.push('当前处于亏损持仓'); }
  if (data.style === 'aggressive') { score += 1; reasons.push('激进风格需要额外控制仓位'); }

  score = Math.max(1, Math.min(5, score));
  const levels = {
    1: { grade: 'A', text: '低风险', className: 'low' },
    2: { grade: 'B', text: '中低风险', className: 'low' },
    3: { grade: 'C', text: '中风险', className: 'mid' },
    4: { grade: 'D', text: '高风险', className: 'high' },
    5: { grade: 'E', text: '极高风险', className: 'high' }
  };
  return { ...levels[score], score, reasons };
}
