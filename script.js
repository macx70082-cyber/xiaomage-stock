(function () {
  'use strict';

  const VERSION = 'Stock AI V1.5 Ultimate Pro';

  const FIELD_LABELS = {
    price: '当前价格',
    high: '历史高点',
    low: '历史低点',
    ma5: 'MA5',
    ma10: 'MA10',
    ma20: 'MA20',
    ma60: 'MA60'
  };

  const STYLE_CONFIG = {
    steady: { label: '稳健', maxPosition: 15, stopBuffer: 0.02 },
    balanced: { label: '平衡', maxPosition: 20, stopBuffer: 0.03 },
    aggressive: { label: '激进', maxPosition: 25, stopBuffer: 0.04 }
  };

  const POSITION_STATE_LABELS = {
    watch: '还没买，正在观察',
    hold: '已经持有',
    wantBuy: '很想买',
    wantSell: '正在考虑卖出'
  };

  const CASE_LIBRARY = [
    { name: '低位启动', desc: '历史位置较低，均线开始修复，量能温和改善。重点是确认趋势，而不是只因低位买入。' },
    { name: '低位空头', desc: '历史位置低，但均线仍为空头排列。低位可能继续低迷，应等待趋势修复。' },
    { name: '主升趋势', desc: '均线多头排列、价格站在主要均线上方，量价配合较好，但仍要检查位置和偏离程度。' },
    { name: '高位多头', desc: '趋势很强但历史位置偏高。最容易出现“均线很好看、风险收益比却变差”的冲突。' },
    { name: 'MA20 回踩', desc: '上涨结构中回到 MA20 附近，重点观察是否缩量企稳，而不是看到 MA20 就自动买入。' },
    { name: '箱体震荡', desc: '均线交叉混乱、价格在区间内波动。更适合等支撑确认或有效突破。' },
    { name: '放量下跌', desc: '成交量放大且价格下跌，通常表示抛压或分歧增强，风险优先级较高。' },
    { name: '假突破风险', desc: '靠近压力位时突然放量，但价格无法持续上行。需要防止突破失败和快速回落。' }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function percentDifference(value, base) {
    if (!Number.isFinite(value) || !Number.isFinite(base) || base === 0) return null;
    return ((value - base) / base) * 100;
  }

  function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '--';
    return value.toLocaleString('zh-CN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatPercent(value, digits = 2) {
    if (!Number.isFinite(value)) return '--';
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatNumber(value, digits)}%`;
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function uniqueByApproxValue(items) {
    const result = [];
    for (const item of items) {
      const exists = result.some(existing => Math.abs(existing.value - item.value) <= Math.max(0.0001, item.value * 0.0001));
      if (!exists) result.push(item);
    }
    return result;
  }

  function analyzeCode(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      return { normalized: '', valid: true, market: '未填写', message: '未填写代码，不影响手动数据分析。' };
    }

    if (/^6(?:00|01|03|05)\d{3}$/.test(normalized)) {
      return { normalized, valid: true, market: '沪市主板', message: '代码格式符合常见沪市主板格式。' };
    }
    if (/^688\d{3}$/.test(normalized)) {
      return { normalized, valid: true, market: '科创板', message: '代码格式符合常见科创板格式。' };
    }
    if (/^(?:000|001|002|003)\d{3}$/.test(normalized)) {
      return { normalized, valid: true, market: '深市主板', message: '代码格式符合常见深市主板格式。' };
    }
    if (/^(?:300|301)\d{3}$/.test(normalized)) {
      return { normalized, valid: true, market: '创业板', message: '代码格式符合常见创业板格式。' };
    }
    if (/^(?:920\d{3}|8\d{5}|4\d{5})$/.test(normalized)) {
      return { normalized, valid: true, market: '北交所（基础格式）', message: '代码格式符合常见北交所代码形式，但未联网验证真实性。' };
    }
    if (/^[A-Z]{1,5}$/.test(normalized)) {
      return { normalized, valid: true, market: '美股代码（基础格式）', message: '字母代码格式正常，但未联网验证交易所和股票真实性。' };
    }

    return {
      normalized,
      valid: false,
      market: '格式未识别',
      message: '代码格式未识别。系统仍可分析你手动输入的数据，但不会验证该股票是否真实存在。'
    };
  }

  function validateData(data) {
    const errors = [];
    const warnings = [];

    Object.keys(FIELD_LABELS).forEach(key => {
      if (!Number.isFinite(data[key])) {
        errors.push(`${FIELD_LABELS[key]}不能为空，且必须是有效数字。`);
      } else if (data[key] <= 0) {
        errors.push(`${FIELD_LABELS[key]}必须大于 0。`);
      }
    });

    if (errors.length === 0) {
      if (data.high <= data.low) {
        errors.push('历史高点必须大于历史低点。');
      } else if (data.price > data.high) {
        errors.push('当前价格不能高于你填写的历史高点。请检查历史区间或当前价格。');
      } else if (data.price < data.low) {
        errors.push('当前价格不能低于你填写的历史低点。请检查历史区间或当前价格。');
      }
    }

    const hasCurrentVolume = Number.isFinite(data.currentVolume);
    const hasAverageVolume = Number.isFinite(data.averageVolume);
    if (hasCurrentVolume !== hasAverageVolume) {
      errors.push('当前成交量和平均成交量需要同时填写，或者同时留空。');
    }
    if (hasCurrentVolume && data.currentVolume < 0) {
      errors.push('当前成交量不能为负数。');
    }
    if (hasAverageVolume && data.averageVolume <= 0) {
      errors.push('平均成交量必须大于 0。');
    }

    const hasBuyPrice = Number.isFinite(data.buyPrice);
    const hasQuantity = Number.isFinite(data.quantity);
    if (hasBuyPrice !== hasQuantity) {
      errors.push('买入价格和持有数量需要同时填写，或者同时留空。');
    }
    if (hasBuyPrice && data.buyPrice <= 0) {
      errors.push('买入价格必须大于 0。');
    }
    if (hasQuantity && data.quantity <= 0) {
      errors.push('持有数量必须大于 0。');
    }

    const codeResult = analyzeCode(data.code);
    if (!codeResult.valid) warnings.push(codeResult.message);

    if (!hasCurrentVolume && !hasAverageVolume) {
      warnings.push('未填写成交量，量能评分将使用中性值，分析可信度会降低。');
    }

    if (data.recentTrend !== 'auto') {
      warnings.push('近期趋势由你手动选择，系统会把它作为辅助信息，而不是客观实时数据。');
    }

    if (errors.length === 0) {
      const maValues = [data.ma5, data.ma10, data.ma20, data.ma60];
      const farOutsideRange = maValues.some(value => value > data.high * 1.5 || value < data.low * 0.5);
      if (farOutsideRange) {
        warnings.push('部分均线明显超出历史区间，请确认是否混用了复权口径或不同时间范围的数据。');
      }
    }

    return { ok: errors.length === 0, errors, warnings, codeResult };
  }

  function analyzePosition(data) {
    const ratio = clamp((data.price - data.low) / (data.high - data.low), 0, 1);
    const percent = ratio * 100;

    let zone = '历史中位';
    let opportunityScore = 16;
    let riskScore = 25;
    let explanation = '价格处于历史区间中部，没有明显低位优势，也没有极端高位压力。';

    if (ratio <= 0.1) {
      zone = '历史极低位';
      opportunityScore = 16;
      riskScore = 38;
      explanation = '位置很低，但极低位也可能来自长期弱势，不能把“低”直接等同于“安全”。';
    } else if (ratio <= 0.25) {
      zone = '历史低位';
      opportunityScore = 23;
      riskScore = 20;
      explanation = '历史位置偏低，具备一定赔率优势，但仍需趋势和量能确认。';
    } else if (ratio <= 0.45) {
      zone = '历史中低位';
      opportunityScore = 21;
      riskScore = 15;
      explanation = '位置相对友好，同时没有陷入极端低位的明显弱势风险。';
    } else if (ratio <= 0.65) {
      zone = '历史中位';
      opportunityScore = 16;
      riskScore = 25;
    } else if (ratio <= 0.8) {
      zone = '历史中高位';
      opportunityScore = 10;
      riskScore = 55;
      explanation = '价格进入历史中高区域，获利盘和回撤风险需要提高权重。';
    } else {
      zone = '历史高位';
      opportunityScore = 4;
      riskScore = 82;
      explanation = '价格接近历史高点，趋势可能很强，但追涨风险和回撤风险明显上升。';
    }

    const ma20Gap = percentDifference(data.price, data.ma20);
    const ma60Gap = percentDifference(data.price, data.ma60);

    let smallZone = '贴近 MA20';
    if (ma20Gap <= -10) smallZone = '明显跌破 MA20';
    else if (ma20Gap < -3) smallZone = 'MA20 下方';
    else if (ma20Gap <= 3) smallZone = '贴近 MA20';
    else if (ma20Gap <= 8) smallZone = 'MA20 上方适度偏离';
    else if (ma20Gap <= 15) smallZone = '短线偏离 MA20';
    else smallZone = '严重偏离 MA20';

    let maRelation = '位于 MA20 与 MA60 之间';
    if (data.price >= data.ma20 && data.price >= data.ma60) maRelation = '站在 MA20 与 MA60 上方';
    if (data.price < data.ma20 && data.price < data.ma60) maRelation = '跌破 MA20 与 MA60';

    let conflict = '大位置与小位置暂时没有明显冲突。';
    if (ratio > 0.65 && Math.abs(ma20Gap) <= 3) {
      conflict = '大位置偏高，但价格贴近 MA20。MA20 附近不等于历史低位，仍要优先考虑高位风险。';
    } else if (ratio <= 0.45 && ma20Gap > 8) {
      conflict = '长期位置不高，但短线已经远离 MA20。位置优势不能抵消追高风险。';
    } else if (ratio <= 0.1) {
      conflict = '极低位与弱势风险并存，必须等待均线和量能确认，防止“低位陷阱”。';
    }

    return {
      ratio,
      percent,
      zone,
      opportunityScore,
      riskScore,
      explanation,
      ma20Gap,
      ma60Gap,
      smallZone,
      maRelation,
      conflict
    };
  }

  function analyzeMovingAverages(data) {
    const bullishPairs = [
      data.ma5 > data.ma10,
      data.ma10 > data.ma20,
      data.ma20 > data.ma60
    ];
    const bullishPairCount = bullishPairs.filter(Boolean).length;
    const strictBull = bullishPairCount === 3;
    const strictBear = data.ma5 < data.ma10 && data.ma10 < data.ma20 && data.ma20 < data.ma60;

    let type = '混合排列';
    let score = 15;
    let health = '一般';
    let derivedTrend = 'side';
    let explanation = '均线顺序互相交叉，趋势共振不足，更接近震荡或转折阶段。';

    if (strictBull) {
      type = '多头排列';
      score = data.price >= data.ma5 ? 30 : 27;
      health = data.price >= data.ma5 ? '较健康' : '出现回落';
      derivedTrend = 'up';
      explanation = 'MA5 > MA10 > MA20 > MA60，趋势结构偏强；但仍需结合历史位置、量能和偏离程度。';
    } else if (strictBear) {
      type = '空头排列';
      score = data.price < data.ma5 ? 3 : 6;
      health = '偏弱';
      derivedTrend = 'down';
      explanation = 'MA5 < MA10 < MA20 < MA60，趋势结构偏弱。低位也不能自动抵消空头结构。';
    } else if (bullishPairCount === 2 && data.price >= data.ma20) {
      type = '偏多混合排列';
      score = 22;
      health = '正在改善';
      derivedTrend = 'up';
      explanation = '多数均线关系偏多，但尚未完全形成共振，适合等待进一步确认。';
    } else if (bullishPairCount <= 1 && data.price < data.ma20) {
      type = '偏空混合排列';
      score = 9;
      health = '偏弱';
      derivedTrend = 'down';
      explanation = '多数均线关系不利，且价格位于 MA20 下方，趋势确认度较低。';
    } else {
      score = 13 + bullishPairCount * 2;
    }

    let manualAdjustment = 0;
    let trendConflict = '';
    if (data.recentTrend !== 'auto') {
      if (data.recentTrend === derivedTrend) manualAdjustment = 2;
      if (data.recentTrend === 'up' && derivedTrend === 'down') {
        manualAdjustment = -2;
        trendConflict = '你选择“上涨趋势”，但当前均线结构偏空，两者存在冲突。';
      }
      if (data.recentTrend === 'down' && derivedTrend === 'up') {
        manualAdjustment = -2;
        trendConflict = '你选择“下跌趋势”，但当前均线结构偏多，两者存在冲突。';
      }
    }

    score = clamp(score + manualAdjustment, 0, 30);

    return {
      bullishPairCount,
      strictBull,
      strictBear,
      type,
      score,
      health,
      derivedTrend,
      explanation,
      trendConflict
    };
  }

  function analyzeMomentum(data, position) {
    const gap = position.ma20Gap;
    let score = 8;
    let riskScore = 35;
    let explanation = '价格与 MA20 的距离处于中性区域。';

    if (gap >= -3 && gap <= 3) {
      score = data.price >= data.ma60 ? 13 : 9;
      riskScore = data.price >= data.ma60 ? 18 : 42;
      explanation = data.price >= data.ma60
        ? '价格贴近 MA20 且仍在 MA60 上方，短线偏离不大。'
        : '价格贴近 MA20，但仍低于 MA60，中期结构尚未完全修复。';
    } else if (gap > 3 && gap <= 8) {
      score = 10;
      riskScore = 38;
      explanation = '价格位于 MA20 上方，但偏离仍在可观察范围内。';
    } else if (gap > 8 && gap <= 15) {
      score = 5;
      riskScore = 68;
      explanation = '价格明显远离 MA20，短线追高风险增加。';
    } else if (gap > 15) {
      score = 2;
      riskScore = 90;
      explanation = '价格严重偏离 MA20，均值回归和波动风险较高。';
    } else if (gap < -3 && gap >= -8) {
      score = 6;
      riskScore = 52;
      explanation = '价格位于 MA20 下方，可能是回踩，也可能是趋势转弱，需要结合均线排列。';
    } else {
      score = 2;
      riskScore = 86;
      explanation = '价格明显跌破 MA20，不能仅因“超跌”就判断为机会。';
    }

    if (data.price >= data.ma5 && data.price >= data.ma10 && score < 15) score += 1;
    if (data.price < data.ma60) riskScore = clamp(riskScore + 10, 0, 100);

    return { score: clamp(score, 0, 15), riskScore, explanation };
  }

  function analyzeVolume(data) {
    if (!Number.isFinite(data.currentVolume) || !Number.isFinite(data.averageVolume)) {
      return {
        available: false,
        ratio: null,
        type: '未提供成交量',
        score: 7,
        riskScore: 45,
        explanation: '没有成交量数据，系统使用中性分数，不会假装知道真实量能。'
      };
    }

    const ratio = data.currentVolume / data.averageVolume;
    let type = '正常量';
    if (ratio < 0.75) type = '缩量';
    else if (ratio < 1.25) type = '正常量';
    else if (ratio < 1.8) type = '温和放量';
    else type = '明显放量';

    const action = data.priceAction;
    let score = 7;
    let riskScore = 45;
    let explanation = '';

    if (type === '缩量' && action === 'up') {
      score = 7;
      riskScore = 48;
      explanation = '缩量上涨说明价格在升，但主动资金确认不足，持续性需要观察。';
    } else if (type === '缩量' && action === 'down') {
      score = 5;
      riskScore = 48;
      explanation = '缩量下跌可能表示抛压减弱，但趋势尚未因此反转。';
    } else if (type === '缩量') {
      score = 6;
      riskScore = 42;
      explanation = '缩量震荡，资金参与度偏低，方向尚不明确。';
    } else if (type === '正常量' && action === 'up') {
      score = 10;
      riskScore = 30;
      explanation = '正常量上涨，量价关系较为平稳。';
    } else if (type === '正常量' && action === 'down') {
      score = 5;
      riskScore = 52;
      explanation = '正常量下跌，趋势压力仍在，但没有出现极端放量抛售。';
    } else if (type === '正常量') {
      score = 8;
      riskScore = 34;
      explanation = '成交量接近近期平均水平，量能中性。';
    } else if (type === '温和放量' && action === 'up') {
      score = 14;
      riskScore = 24;
      explanation = '温和放量上涨，属于相对健康的量价确认，但仍需防止接近压力位。';
    } else if (type === '温和放量' && action === 'down') {
      score = 3;
      riskScore = 78;
      explanation = '温和放量下跌，说明抛压或分歧增强，风险优先。';
    } else if (type === '温和放量') {
      score = 8;
      riskScore = 50;
      explanation = '成交量放大但价格变化不大，可能出现分歧或换手。';
    } else if (type === '明显放量' && action === 'up') {
      score = 12;
      riskScore = 48;
      explanation = '明显放量上涨说明资金活跃，但也可能短线过热，不能把放量等同于必涨。';
    } else if (type === '明显放量' && action === 'down') {
      score = 1;
      riskScore = 95;
      explanation = '明显放量下跌通常代表抛压显著增强，是高优先级风险信号。';
    } else {
      score = 4;
      riskScore = 76;
      explanation = '明显放量但价格没有上涨，可能存在放量滞涨或高位分歧。';
    }

    return { available: true, ratio, type, score, riskScore, explanation };
  }

  function calculateSupportResistance(data, style) {
    const candidates = uniqueByApproxValue([
      { label: 'MA5', value: data.ma5 },
      { label: 'MA10', value: data.ma10 },
      { label: 'MA20', value: data.ma20 },
      { label: 'MA60', value: data.ma60 },
      { label: '历史低点', value: data.low },
      { label: '历史高点', value: data.high }
    ].filter(item => Number.isFinite(item.value) && item.value > 0));

    const supports = candidates
      .filter(item => item.value <= data.price)
      .sort((a, b) => b.value - a.value);
    const pressures = candidates
      .filter(item => item.value >= data.price)
      .sort((a, b) => a.value - b.value);

    const firstSupport = supports.find(item => item.value < data.price) || supports[0] || { label: '历史低点', value: data.low };
    const strongSupport = supports.find(item => item.value < firstSupport.value - Math.max(0.0001, firstSupport.value * 0.0001)) || { label: '历史低点', value: data.low };
    const firstPressure = pressures.find(item => item.value > data.price) || pressures[0] || { label: '历史高点', value: data.high };
    const strongPressure = pressures.find(item => item.value > firstPressure.value + Math.max(0.0001, firstPressure.value * 0.0001)) || { label: '历史高点', value: data.high };

    const config = STYLE_CONFIG[style] || STYLE_CONFIG.balanced;
    const rawStop = firstSupport.value * (1 - config.stopBuffer);
    const stop = clamp(Math.min(rawStop, data.price * 0.985), data.low * 0.95, data.price * 0.999);
    const stopGap = ((data.price - stop) / data.price) * 100;
    const pressureGap = Math.max(0, ((firstPressure.value - data.price) / data.price) * 100);
    const reward = Math.max(0, firstPressure.value - data.price);
    const risk = Math.max(0.0000001, data.price - stop);
    const rewardRiskRatio = reward / risk;

    return {
      firstSupport,
      strongSupport,
      firstPressure,
      strongPressure,
      stop,
      stopGap,
      pressureGap,
      rewardRiskRatio
    };
  }

  function analyzeRisk(position, movingAverage, momentum, volume, levels) {
    const trendRisk = clamp(100 - (movingAverage.score / 30) * 100, 0, 100);

    let pressureRisk = 20;
    if (levels.pressureGap < 3) pressureRisk = 80;
    else if (levels.pressureGap < 6) pressureRisk = 60;
    else if (levels.pressureGap < 10) pressureRisk = 40;

    let rewardRiskRisk = 25;
    if (levels.rewardRiskRatio < 0.7) rewardRiskRisk = 90;
    else if (levels.rewardRiskRatio < 1) rewardRiskRisk = 75;
    else if (levels.rewardRiskRatio < 1.5) rewardRiskRisk = 52;
    else if (levels.rewardRiskRatio < 2) rewardRiskRisk = 35;

    let stopDistanceRisk = 22;
    if (levels.stopGap > 12) stopDistanceRisk = 88;
    else if (levels.stopGap > 8) stopDistanceRisk = 70;
    else if (levels.stopGap > 5) stopDistanceRisk = 48;

    const setupRisk = (pressureRisk + rewardRiskRisk + stopDistanceRisk) / 3;
    const total = clamp(
      position.riskScore * 0.2 +
      trendRisk * 0.3 +
      momentum.riskScore * 0.2 +
      volume.riskScore * 0.15 +
      setupRisk * 0.15,
      0,
      100
    );

    let grade = 'C';
    let label = '中等';
    if (total <= 20) {
      grade = 'A';
      label = '较低';
    } else if (total <= 35) {
      grade = 'B';
      label = '中低';
    } else if (total <= 55) {
      grade = 'C';
      label = '中等';
    } else if (total <= 75) {
      grade = 'D';
      label = '较高';
    } else {
      grade = 'E';
      label = '很高';
    }

    return {
      total,
      grade,
      label,
      positionRisk: position.riskScore,
      trendRisk,
      momentumRisk: momentum.riskScore,
      volumeRisk: volume.riskScore,
      setupRisk
    };
  }

  function calculateScore(position, movingAverage, momentum, volume, levels) {
    let rewardRiskScore = 1;
    if (levels.rewardRiskRatio >= 2) rewardRiskScore = 15;
    else if (levels.rewardRiskRatio >= 1.5) rewardRiskScore = 12;
    else if (levels.rewardRiskRatio >= 1) rewardRiskScore = 8;
    else if (levels.rewardRiskRatio >= 0.7) rewardRiskScore = 4;

    if (levels.pressureGap < 3) rewardRiskScore = Math.min(rewardRiskScore, 5);

    const total = clamp(
      position.opportunityScore +
      movingAverage.score +
      momentum.score +
      volume.score +
      rewardRiskScore,
      0,
      100
    );

    return {
      total,
      positionScore: position.opportunityScore,
      trendScore: movingAverage.score,
      momentumScore: momentum.score,
      volumeScore: volume.score,
      rewardRiskScore
    };
  }

  function createReasons(data, position, movingAverage, momentum, volume, levels) {
    const bullish = [];
    const bearish = [];

    if (position.ratio > 0.1 && position.ratio <= 0.45) bullish.push('历史位置处于相对友好的低位或中低位。');
    if (movingAverage.strictBull) bullish.push('MA5 > MA10 > MA20 > MA60，均线形成多头排列。');
    if (movingAverage.type === '偏多混合排列') bullish.push('多数均线关系正在改善。');
    if (data.price >= data.ma20 && data.price >= data.ma60) bullish.push('价格站在 MA20 和 MA60 上方。');
    if (Math.abs(position.ma20Gap) <= 3) bullish.push('价格贴近 MA20，短线没有明显过度偏离。');
    if (volume.available && volume.type === '温和放量' && data.priceAction === 'up') bullish.push('温和放量上涨，量价配合相对健康。');
    if (levels.rewardRiskRatio >= 1.5) bullish.push('按当前参考位计算，潜在收益风险比不算差。');

    if (position.ratio > 0.65) bearish.push('历史位置偏高，获利盘和回撤风险需要优先考虑。');
    if (position.ratio <= 0.1) bearish.push('历史极低位可能来自长期弱势，存在低位陷阱风险。');
    if (movingAverage.strictBear) bearish.push('MA5 < MA10 < MA20 < MA60，均线为空头排列。');
    if (movingAverage.type === '偏空混合排列') bearish.push('均线结构偏空，趋势确认不足。');
    if (position.ma20Gap > 8) bearish.push('价格明显高于 MA20，短线追高风险增加。');
    if (position.ma20Gap < -8) bearish.push('价格明显跌破 MA20，超跌不等于趋势已经反转。');
    if (volume.available && data.priceAction === 'down' && volume.ratio >= 1.25) bearish.push('放量下跌，抛压或分歧明显增强。');
    if (volume.available && data.priceAction === 'up' && volume.ratio < 0.75) bearish.push('缩量上涨，量能确认不足。');
    if (levels.pressureGap < 3) bearish.push('距离第一参考压力位过近，上方空间有限。');
    if (levels.rewardRiskRatio < 1) bearish.push('按当前参考位计算，收益风险比偏弱。');
    if (levels.stopGap > 8) bearish.push('参考风控位距离当前价格较远，潜在单次风险偏大。');

    if (bullish.length === 0) bullish.push('当前没有形成特别明确的积极共振条件。');
    if (bearish.length === 0) bearish.push('没有发现极端风险信号，但市场仍可能受整体环境影响。');

    return { bullish, bearish };
  }

  function makeDecision(score, risk, movingAverage, position) {
    let decision = '等待确认';
    let environment = 'C级观察环境';
    let tone = 'warning';

    if (risk.grade === 'E' || score.total < 35) {
      decision = '暂不参与';
      environment = 'E级回避环境';
      tone = 'danger';
    } else if (risk.grade === 'D') {
      decision = '风险较高，继续等待';
      environment = 'D级观察环境';
      tone = 'danger';
    } else if (score.total >= 75 && (risk.grade === 'A' || risk.grade === 'B')) {
      decision = '重点观察';
      environment = 'A级观察环境';
      tone = 'success';
    } else if (score.total >= 60 && ['A', 'B', 'C'].includes(risk.grade)) {
      decision = '条件观察';
      environment = 'B级观察环境';
      tone = 'success';
    } else if (score.total >= 48) {
      decision = '普通观察';
      environment = 'C级观察环境';
      tone = 'warning';
    }

    if (position.ratio > 0.8 && movingAverage.strictBull && decision === '重点观察') {
      decision = '高位强势，谨慎观察';
      environment = 'C级高位观察环境';
      tone = 'warning';
    }

    return { decision, environment, tone };
  }

  function createTradePlan(data, decisionResult, risk, levels, movingAverage) {
    const config = STYLE_CONFIG[data.style] || STYLE_CONFIG.balanced;
    let positionRange = '0%（仅观察）';

    if (decisionResult.environment.startsWith('A') && ['A', 'B'].includes(risk.grade)) {
      positionRange = `学习型参考：5%–${config.maxPosition}%`;
    } else if (decisionResult.environment.startsWith('B') && ['A', 'B', 'C'].includes(risk.grade)) {
      positionRange = `学习型参考：0%–${Math.min(10, config.maxPosition)}%`;
    } else if (decisionResult.environment.startsWith('C') && risk.grade === 'C') {
      positionRange = '学习型参考：0%–5% 或继续观察';
    }

    let mainAction = '先观察，不追涨；等待价格靠近支撑后企稳，或有效突破压力后再重新评估。';
    if (decisionResult.decision === '暂不参与') {
      mainAction = '当前以回避和学习观察为主，不为寻找买点而忽略明显风险。';
    } else if (decisionResult.decision.includes('风险较高')) {
      mainAction = '当前风险偏高，优先等待风险释放和均线结构修复。';
    } else if (decisionResult.decision === '重点观察') {
      mainAction = '条件相对较好，但仍不建议追一根快速上涨的 K 线；优先等待回踩确认或突破后的有效承接。';
    }

    if (data.positionState === 'hold') {
      mainAction += ' 你已经持有，应把风控位和减仓条件放在继续加仓之前。';
    } else if (data.positionState === 'wantBuy') {
      mainAction += ' 你当前有较强买入冲动，建议先写下触发条件和放弃条件，避免情绪化操作。';
    } else if (data.positionState === 'wantSell') {
      mainAction += ' 你正在考虑卖出，应重点观察是否跌破支撑、均线转弱或反弹遇阻。';
    }

    const supportWatch = levels.firstSupport.value * 1.005;
    const breakoutWatch = levels.firstPressure.value * 1.01;
    const failureSignals = [
      `有效跌破 ${levels.firstSupport.label}（约 ${formatNumber(levels.firstSupport.value)}）`,
      `跌破风控参考位 ${formatNumber(levels.stop)}`,
      'MA5 下穿 MA10 且短线无法快速修复',
      '放量下跌或突破压力后快速回落'
    ];

    if (movingAverage.strictBear) {
      failureSignals.unshift('均线仍为空头排列，趋势尚未修复');
    }

    return {
      styleLabel: config.label,
      mainAction,
      positionRange,
      supportWatch,
      breakoutWatch,
      failureSignals
    };
  }

  function calculateHolding(data) {
    if (!Number.isFinite(data.buyPrice) || !Number.isFinite(data.quantity)) {
      return { available: false };
    }

    const cost = data.buyPrice * data.quantity;
    const currentValue = data.price * data.quantity;
    const profit = currentValue - cost;
    const returnRate = cost === 0 ? null : (profit / cost) * 100;

    return { available: true, cost, currentValue, profit, returnRate };
  }

  function matchCase(data, position, movingAverage, volume) {
    if (volume.available && data.priceAction === 'down' && volume.ratio >= 1.25) {
      return { name: '放量下跌', similarity: volume.ratio >= 1.8 ? 94 : 88, explanation: '价格下跌同时成交量放大，抛压和分歧是当前核心风险。' };
    }
    if (position.ratio > 0.8 && movingAverage.strictBull) {
      return { name: '高位多头', similarity: 91, explanation: '均线强势与历史高位同时出现，趋势和位置形成明显冲突。' };
    }
    if (position.ratio <= 0.25 && movingAverage.strictBear) {
      return { name: '低位空头', similarity: 90, explanation: '位置很低但趋势仍弱，最需要防止把低价误判为安全。' };
    }
    if (movingAverage.strictBull && Math.abs(position.ma20Gap) <= 3 && data.priceAction !== 'down') {
      return { name: 'MA20 回踩', similarity: 84, explanation: '多头结构中价格贴近 MA20，重点观察企稳和量能，而不是看到均线就直接买入。' };
    }
    if (movingAverage.strictBull) {
      return { name: '主升趋势', similarity: 86, explanation: '均线多头排列，价格处于主要均线附近或上方，结构偏强，但仍需检查位置和偏离。' };
    }
    if (movingAverage.type === '混合排列') {
      return { name: '箱体震荡', similarity: 79, explanation: '均线交叉混乱，方向共振不足，更接近震荡或转折阶段。' };
    }
    if (position.ratio <= 0.45 && movingAverage.derivedTrend !== 'down') {
      return { name: '低位启动', similarity: 76, explanation: '位置相对较低，趋势没有明显恶化，可继续等待量价确认。' };
    }
    return { name: '假突破风险', similarity: 68, explanation: '当前条件不够典型，重点仍是观察压力位附近的量价表现。' };
  }

  function calculateConfidence(data, validation, volume, movingAverage) {
    let score = 62;
    if (volume.available) score += 15;
    if (data.recentTrend === 'auto') score += 8;
    if (validation.codeResult.valid && validation.codeResult.normalized) score += 3;
    if (!movingAverage.trendConflict) score += 5;
    score -= validation.warnings.length * 3;
    return clamp(Math.round(score), 35, 90);
  }

  function analyzeStockData(data) {
    const validation = validateData(data);
    if (!validation.ok) {
      return { ok: false, validation };
    }

    const position = analyzePosition(data);
    const movingAverage = analyzeMovingAverages(data);
    const momentum = analyzeMomentum(data, position);
    const volume = analyzeVolume(data);
    const levels = calculateSupportResistance(data, data.style);
    const risk = analyzeRisk(position, movingAverage, momentum, volume, levels);
    const score = calculateScore(position, movingAverage, momentum, volume, levels);
    const reasons = createReasons(data, position, movingAverage, momentum, volume, levels);
    const decision = makeDecision(score, risk, movingAverage, position);
    const plan = createTradePlan(data, decision, risk, levels, movingAverage);
    const holding = calculateHolding(data);
    const matchedCase = matchCase(data, position, movingAverage, volume);
    const confidence = calculateConfidence(data, validation, volume, movingAverage);

    return {
      ok: true,
      version: VERSION,
      validation,
      data,
      position,
      movingAverage,
      momentum,
      volume,
      levels,
      risk,
      score,
      reasons,
      decision,
      plan,
      holding,
      matchedCase,
      confidence
    };
  }

  function getToneClass(tone) {
    if (tone === 'success') return 'summary-card--success';
    if (tone === 'danger') return 'summary-card--danger';
    return 'summary-card--warning';
  }

  function riskTone(grade) {
    if (grade === 'A' || grade === 'B') return 'summary-card--success';
    if (grade === 'D' || grade === 'E') return 'summary-card--danger';
    return 'summary-card--warning';
  }

  function renderSummary(result) {
    const container = document.getElementById('summaryCards');
    const decisionClass = getToneClass(result.decision.tone);
    const scoreClass = result.score.total >= 60 ? 'summary-card--success' : result.score.total < 40 ? 'summary-card--danger' : 'summary-card--warning';

    container.innerHTML = [
      { label: '综合结论', value: result.decision.decision, cls: decisionClass },
      { label: '综合评分', value: `${Math.round(result.score.total)}/100`, cls: scoreClass },
      { label: '风险等级', value: `${result.risk.grade}级 · ${result.risk.label}`, cls: riskTone(result.risk.grade) },
      { label: '均线结构', value: result.movingAverage.type, cls: result.movingAverage.strictBull ? 'summary-card--success' : result.movingAverage.strictBear ? 'summary-card--danger' : 'summary-card--warning' },
      { label: '历史位置', value: result.position.zone, cls: result.position.ratio > 0.65 ? 'summary-card--danger' : 'summary-card--success' },
      { label: '量能状态', value: result.volume.type, cls: result.volume.riskScore >= 70 ? 'summary-card--danger' : result.volume.score >= 10 ? 'summary-card--success' : 'summary-card--warning' },
      { label: '观察环境', value: result.decision.environment, cls: decisionClass },
      { label: '案例匹配', value: `${result.matchedCase.name} ${result.matchedCase.similarity}%`, cls: 'summary-card--warning' }
    ].map(card => `
      <article class="summary-card ${card.cls}">
        <span>${escapeHTML(card.label)}</span>
        <strong>${escapeHTML(card.value)}</strong>
      </article>
    `).join('');
  }

  function renderTagList(items, risk = false) {
    return `<div class="tag-list">${items.map(item => `<span class="tag${risk ? ' tag--risk' : ''}">${escapeHTML(item)}</span>`).join('')}</div>`;
  }

  function renderWarnings(warnings) {
    if (!warnings.length) return '';
    return `<div class="notice-box">${warnings.map(item => `<p>⚠ ${escapeHTML(item)}</p>`).join('')}</div>`;
  }

  function renderReport(result) {
    const data = result.data;
    const report = document.getElementById('report');
    const safeName = escapeHTML(data.name || '未命名股票');
    const safeCode = escapeHTML(result.validation.codeResult.normalized || '未填写代码');
    const volumeRatio = Number.isFinite(result.volume.ratio) ? `${formatNumber(result.volume.ratio)} 倍` : '未提供';
    const trendConflict = result.movingAverage.trendConflict
      ? `<div class="notice-box notice-box--danger">${escapeHTML(result.movingAverage.trendConflict)}</div>`
      : '';
    const holdingHTML = result.holding.available
      ? `
        <div class="report-grid">
          <div class="metric-box"><span>持仓成本</span><strong>${formatNumber(result.holding.cost)} 元</strong></div>
          <div class="metric-box"><span>当前市值</span><strong>${formatNumber(result.holding.currentValue)} 元</strong></div>
          <div class="metric-box"><span>浮动盈亏</span><strong class="${result.holding.profit >= 0 ? 'text-success' : 'text-danger'}">${formatNumber(result.holding.profit)} 元</strong></div>
          <div class="metric-box"><span>收益率</span><strong class="${result.holding.returnRate >= 0 ? 'text-success' : 'text-danger'}">${formatPercent(result.holding.returnRate)}</strong></div>
        </div>`
      : '<p>未同时填写买入价格和持有数量，本次跳过持仓盈亏计算。</p>';

    report.className = 'report';
    report.innerHTML = `
      <section class="report-section">
        <h3>一、基础信息与数据说明</h3>
        <p><strong>${safeName}（${safeCode}）</strong> · ${escapeHTML(result.validation.codeResult.market)}</p>
        <p>${escapeHTML(result.validation.codeResult.message)}</p>
        <div class="notice-box">
          当前结果完全基于你手动输入的数据。系统未联网获取实时价格、复权数据、公司公告或市场环境。
        </div>
        ${renderWarnings(result.validation.warnings)}
      </section>

      <section class="report-section">
        <h3>二、位置分析</h3>
        <div class="report-grid">
          <div class="metric-box"><span>历史区间位置</span><strong>${formatNumber(result.position.percent, 1)}%</strong></div>
          <div class="metric-box"><span>大位置</span><strong>${escapeHTML(result.position.zone)}</strong></div>
          <div class="metric-box"><span>相对 MA20</span><strong>${formatPercent(result.position.ma20Gap)}</strong></div>
          <div class="metric-box"><span>相对 MA60</span><strong>${formatPercent(result.position.ma60Gap)}</strong></div>
        </div>
        <p>${escapeHTML(result.position.explanation)}</p>
        <p><strong>小位置：</strong>${escapeHTML(result.position.smallZone)}；${escapeHTML(result.position.maRelation)}。</p>
        <div class="notice-box">${escapeHTML(result.position.conflict)}</div>
      </section>

      <section class="report-section">
        <h3>三、均线、趋势与量能</h3>
        <p><strong>均线结构：</strong>${escapeHTML(result.movingAverage.type)}（健康度：${escapeHTML(result.movingAverage.health)}）</p>
        <p>${escapeHTML(result.movingAverage.explanation)}</p>
        ${trendConflict}
        <p><strong>MA20 距离判断：</strong>${escapeHTML(result.momentum.explanation)}</p>
        <p><strong>量能：</strong>${escapeHTML(result.volume.type)}，成交量约为均量的 ${escapeHTML(volumeRatio)}。</p>
        <p>${escapeHTML(result.volume.explanation)}</p>
      </section>

      <section class="report-section">
        <h3>四、综合评分</h3>
        <div class="report-grid">
          <div class="metric-box"><span>位置机会</span><strong>${Math.round(result.score.positionScore)}/25</strong></div>
          <div class="metric-box"><span>趋势结构</span><strong>${Math.round(result.score.trendScore)}/30</strong></div>
          <div class="metric-box"><span>短线位置</span><strong>${Math.round(result.score.momentumScore)}/15</strong></div>
          <div class="metric-box"><span>量能确认</span><strong>${Math.round(result.score.volumeScore)}/15</strong></div>
          <div class="metric-box"><span>收益风险比</span><strong>${Math.round(result.score.rewardRiskScore)}/15</strong></div>
          <div class="metric-box"><span>综合评分</span><strong>${Math.round(result.score.total)}/100</strong></div>
        </div>
        <p><strong>结论：</strong>${escapeHTML(result.decision.decision)}；${escapeHTML(result.decision.environment)}。</p>
        <p>评分高只表示输入条件之间的配合程度较高，不代表风险低，也不代表股价一定上涨。</p>
      </section>

      <section class="report-section">
        <h3>五、支持与反对理由</h3>
        <p><strong>支持继续观察的理由：</strong></p>
        ${renderTagList(result.reasons.bullish)}
        <p><strong>反对追入或需要谨慎的理由：</strong></p>
        ${renderTagList(result.reasons.bearish, true)}
      </section>

      <section class="report-section">
        <h3>六、风险拆解</h3>
        <div class="report-grid">
          <div class="metric-box"><span>位置风险</span><strong>${Math.round(result.risk.positionRisk)}/100</strong></div>
          <div class="metric-box"><span>趋势风险</span><strong>${Math.round(result.risk.trendRisk)}/100</strong></div>
          <div class="metric-box"><span>偏离风险</span><strong>${Math.round(result.risk.momentumRisk)}/100</strong></div>
          <div class="metric-box"><span>量能风险</span><strong>${Math.round(result.risk.volumeRisk)}/100</strong></div>
          <div class="metric-box"><span>交易结构风险</span><strong>${Math.round(result.risk.setupRisk)}/100</strong></div>
          <div class="metric-box"><span>综合风险</span><strong>${result.risk.grade}级 · ${formatNumber(result.risk.total, 0)}/100</strong></div>
        </div>
        <div class="notice-box ${result.risk.grade === 'D' || result.risk.grade === 'E' ? 'notice-box--danger' : ''}">
          风险等级与综合评分分开计算。即使均线多头排列，只要位置过高、偏离过大或量价异常，风险仍可能很高。
        </div>
      </section>

      <section class="report-section">
        <h3>七、支撑、压力与交易计划</h3>
        <div class="report-grid">
          <div class="metric-box"><span>第一参考支撑</span><strong>${escapeHTML(result.levels.firstSupport.label)} · ${formatNumber(result.levels.firstSupport.value)}</strong></div>
          <div class="metric-box"><span>第二参考支撑</span><strong>${escapeHTML(result.levels.strongSupport.label)} · ${formatNumber(result.levels.strongSupport.value)}</strong></div>
          <div class="metric-box"><span>第一参考压力</span><strong>${escapeHTML(result.levels.firstPressure.label)} · ${formatNumber(result.levels.firstPressure.value)}</strong></div>
          <div class="metric-box"><span>第二参考压力</span><strong>${escapeHTML(result.levels.strongPressure.label)} · ${formatNumber(result.levels.strongPressure.value)}</strong></div>
          <div class="metric-box"><span>风控参考位</span><strong>${formatNumber(result.levels.stop)}</strong></div>
          <div class="metric-box"><span>参考收益风险比</span><strong>${formatNumber(result.levels.rewardRiskRatio)} : 1</strong></div>
        </div>
        <p>${escapeHTML(result.plan.mainAction)}</p>
        <p><strong>低吸观察条件：</strong>价格回到约 ${formatNumber(result.plan.supportWatch)} 附近后，不再放量下跌并出现企稳迹象，再重新评估。</p>
        <p><strong>突破观察条件：</strong>价格有效站上约 ${formatNumber(result.plan.breakoutWatch)}，且成交量没有出现放量滞涨，再重新评估。</p>
        <p><strong>仓位表达：</strong>${escapeHTML(result.plan.positionRange)}。这是学习型风险上限示例，不是针对你的个性化建议。</p>
        <p><strong>失败或放弃条件：</strong></p>
        ${renderTagList(result.plan.failureSignals, true)}
      </section>

      <section class="report-section">
        <h3>八、持仓盈亏</h3>
        ${holdingHTML}
      </section>

      <section class="report-section">
        <h3>九、案例教学</h3>
        <p>当前最接近：<strong>${escapeHTML(result.matchedCase.name)}</strong>，规则相似度约 ${result.matchedCase.similarity}%。</p>
        <p>${escapeHTML(result.matchedCase.explanation)}</p>
      </section>

      <section class="report-section">
        <h3>十、最终提醒</h3>
        <div class="notice-box notice-box--danger">
          本报告不包含实时行情、基本面、消息面、市场指数、流动性和交易成本。请勿使用“必涨、稳赚、一定可以买”等绝对化理解。
        </div>
      </section>
    `;
  }

  function parseOptionalNumber(id) {
    const element = document.getElementById(id);
    const raw = element.value.trim();
    if (raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function collectFormData() {
    return {
      name: document.getElementById('stockName').value.trim() || '未命名股票',
      code: document.getElementById('stockCode').value.trim(),
      price: parseOptionalNumber('price'),
      high: parseOptionalNumber('high'),
      low: parseOptionalNumber('low'),
      ma5: parseOptionalNumber('ma5'),
      ma10: parseOptionalNumber('ma10'),
      ma20: parseOptionalNumber('ma20'),
      ma60: parseOptionalNumber('ma60'),
      currentVolume: parseOptionalNumber('currentVolume'),
      averageVolume: parseOptionalNumber('averageVolume'),
      priceAction: document.getElementById('priceAction').value,
      recentTrend: document.getElementById('recentTrend').value,
      positionState: document.getElementById('positionState').value,
      style: document.getElementById('style').value,
      buyPrice: parseOptionalNumber('buyPrice'),
      quantity: parseOptionalNumber('quantity')
    };
  }

  function setFormStatus(type, messages) {
    const status = document.getElementById('formStatus');
    status.className = `form-status${type ? ` form-status--${type}` : ''}`;
    status.innerHTML = messages.map(message => `<div>${escapeHTML(message)}</div>`).join('');
  }

  function clearInvalidStates() {
    document.querySelectorAll('[aria-invalid="true"]').forEach(element => element.removeAttribute('aria-invalid'));
  }

  function markInvalidFields(errors) {
    const mapping = [
      ['当前价格', 'price'],
      ['历史高点', 'high'],
      ['历史低点', 'low'],
      ['MA5', 'ma5'],
      ['MA10', 'ma10'],
      ['MA20', 'ma20'],
      ['MA60', 'ma60'],
      ['当前成交量', 'currentVolume'],
      ['平均成交量', 'averageVolume'],
      ['买入价格', 'buyPrice'],
      ['持有数量', 'quantity']
    ];

    mapping.forEach(([keyword, id]) => {
      if (errors.some(error => error.includes(keyword))) {
        const element = document.getElementById(id);
        if (element) element.setAttribute('aria-invalid', 'true');
      }
    });
  }

  function handleAnalyze(event) {
    event.preventDefault();
    clearInvalidStates();

    const data = collectFormData();
    const result = analyzeStockData(data);

    if (!result.ok) {
      markInvalidFields(result.validation.errors);
      setFormStatus('error', result.validation.errors);
      document.getElementById('analysisConfidence').textContent = '输入未通过';
      return;
    }

    const messages = ['输入校验通过，分析已完成。'];
    if (result.validation.warnings.length) {
      messages.push(...result.validation.warnings);
      setFormStatus('warning', messages);
    } else {
      setFormStatus('success', messages);
    }

    renderSummary(result);
    renderReport(result);
    document.getElementById('analysisConfidence').textContent = `数据可信度 ${result.confidence}%`;

    if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleCodeValidation() {
    const code = document.getElementById('stockCode').value;
    const result = analyzeCode(code);
    const status = document.getElementById('codeStatus');
    status.textContent = `${result.market}：${result.message}`;
    status.className = `inline-status ${result.valid ? 'text-success' : 'text-warning'}`;
  }

  function fillSample() {
    const sample = {
      stockName: '示例股票',
      stockCode: '600519',
      price: '25.20',
      high: '42.00',
      low: '12.00',
      ma5: '25.50',
      ma10: '24.90',
      ma20: '24.10',
      ma60: '22.80',
      currentVolume: '1500000',
      averageVolume: '1200000',
      priceAction: 'up',
      recentTrend: 'auto',
      positionState: 'watch',
      style: 'balanced',
      buyPrice: '',
      quantity: ''
    };

    Object.entries(sample).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });

    clearInvalidStates();
    handleCodeValidation();
    setFormStatus('success', ['示例数据已填入，可以点击“开始分析”。']);
  }

  function resetView() {
    window.setTimeout(() => {
      clearInvalidStates();
      document.getElementById('summaryCards').innerHTML = `
        <article class="summary-card summary-card--placeholder"><span>综合结论</span><strong>--</strong></article>
        <article class="summary-card summary-card--placeholder"><span>综合评分</span><strong>--</strong></article>
        <article class="summary-card summary-card--placeholder"><span>风险等级</span><strong>--</strong></article>
        <article class="summary-card summary-card--placeholder"><span>均线结构</span><strong>--</strong></article>
      `;
      const report = document.getElementById('report');
      report.className = 'report report--empty';
      report.textContent = '输入数据后点击“开始分析”。分析结果只适合学习和辅助判断，不能替代真实行情、基本面研究和个人风险评估。';
      document.getElementById('analysisConfidence').textContent = '等待分析';
      document.getElementById('codeStatus').textContent = '仅检查格式，不验证股票真实性。';
      document.getElementById('codeStatus').className = 'inline-status';
      setFormStatus('', ['请填写带 * 的项目。成交量和持仓信息可以留空。']);
    }, 0);
  }

  function renderCaseLibrary() {
    const container = document.getElementById('caseLibrary');
    container.innerHTML = CASE_LIBRARY.map(item => `
      <article class="case-card">
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.desc)}</p>
      </article>
    `).join('');
  }

  function initializeBrowserApp() {
    const form = document.getElementById('stockForm');
    if (!form) return;

    renderCaseLibrary();
    form.addEventListener('submit', handleAnalyze);
    form.addEventListener('reset', resetView);
    document.getElementById('validateBtn').addEventListener('click', handleCodeValidation);
    document.getElementById('sampleBtn').addEventListener('click', fillSample);
  }

  const StockAI = {
    VERSION,
    analyzeCode,
    validateData,
    analyzePosition,
    analyzeMovingAverages,
    analyzeVolume,
    calculateSupportResistance,
    analyzeStockData
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockAI;
  }

  if (typeof window !== 'undefined') {
    window.StockAI = StockAI;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeBrowserApp);
  }
}());
