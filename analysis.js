export function analyzePosition(data) {
  const { price, ma20, ma60, high, low } = data;
  const range = high - low;
  const locationScore = (price - low) / range;
  let bigPosition = '历史中位';
  if (locationScore >= 0.75) bigPosition = '历史高位';
  if (locationScore <= 0.35) bigPosition = '历史低位';

  const ma20Diff = (price - ma20) / ma20;
  const ma60Diff = (price - ma60) / ma60;
  let smallPosition = '小位置中性';
  if (ma20Diff > 0.08 && ma60Diff > 0.08) smallPosition = '小位置偏高';
  if (ma20Diff < -0.05 || ma60Diff < -0.05) smallPosition = '小位置偏低';

  return {
    bigPosition,
    smallPosition,
    locationScore,
    ma20Diff,
    ma60Diff,
    summary: `大位置：${bigPosition}；小位置：${smallPosition}。`
  };
}

export function analyzeTrend(data) {
  const trendMap = {
    up: '趋势偏多，适合寻找回踩确认或突破确认。',
    sideways: '箱体震荡，重点看上沿压力和下沿支撑。',
    down: '下降趋势，反弹不等于反转，必须降低预期。',
    unknown: '趋势不明确，先观察，不急着交易。'
  };
  return trendMap[data.trend] || trendMap.unknown;
}

export function analyzeVolume(data) {
  const map = {
    normal: '成交量正常，暂时没有强烈方向信号。',
    breakout: '放量突破，偏积极，但需要确认不是假突破。',
    stagnation: '放量滞涨，说明上方抛压较重，要警惕冲高回落。',
    shrinkPullback: '缩量回调，若趋势仍在，可能是健康回踩。',
    divergence: '量价背离，走势质量下降，不能盲目追涨。'
  };
  return map[data.volume] || map.normal;
}

export function findSupportResistance(data) {
  const supports = [
    { name: 'MA20', value: data.ma20 },
    { name: 'MA60', value: data.ma60 },
    { name: '近期低点', value: data.low }
  ].filter(x => x.value < data.price).sort((a, b) => b.value - a.value);

  const resistances = [
    { name: '近期高点', value: data.high }
  ].filter(x => x.value > data.price).sort((a, b) => a.value - b.value);

  return {
    support: supports[0] || { name: '暂无明显下方支撑', value: null },
    resistance: resistances[0] || { name: '已接近或突破历史高点，上方压力不明确', value: null }
  };
}

export function bullBearArguments(data, position) {
  const bull = [];
  const bear = [];
  if (data.trend === 'up') bull.push('趋势处于上升状态，资金结构相对积极。');
  if (data.trend === 'sideways') bull.push('箱体震荡中，如果靠近支撑位，可能出现低吸机会。');
  if (data.volume === 'breakout') bull.push('出现放量突破信号，有继续走强的可能。');
  if (data.volume === 'shrinkPullback') bull.push('缩量回调说明抛压可能不强，适合等待企稳。');
  if (position.bigPosition === '历史低位') bull.push('大位置偏低，安全边际相对更好。');

  if (position.bigPosition === '历史高位') bear.push('大位置处于历史高位，追涨风险明显上升。');
  if (data.trend === 'down') bear.push('下降趋势里，反弹容易失败。');
  if (data.volume === 'stagnation') bear.push('放量滞涨代表上方抛压较重。');
  if (data.volume === 'divergence') bear.push('量价背离说明上涨质量不足。');
  if (position.ma20Diff > 0.12) bear.push('股价明显远离 MA20，短线可能有回调压力。');

  if (!bull.length) bull.push('暂时没有特别强的看多证据。');
  if (!bear.length) bear.push('暂时没有特别强的看空证据，但仍需设置止损。');
  return { bull, bear };
}
