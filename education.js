export const cases = [
  { title: '低位启动', desc: '大位置低，突破 MA20 或 MA60，放量但不过度。' },
  { title: '突破回踩', desc: '突破压力后回踩不破，缩量企稳，属于较健康结构。' },
  { title: '历史新高', desc: '强势但风险也高，不能只因为新高就追。' },
  { title: '假突破', desc: '突破后快速跌回压力位下方，常见于追涨失败。' },
  { title: '放量滞涨', desc: '成交量变大但价格涨不动，说明分歧和抛压增加。' },
  { title: '缩量回调', desc: '上涨趋势中的缩量回踩，可能是洗盘或正常休整。' },
  { title: '箱体震荡', desc: '在区间内高抛低吸，突破前不要过度乐观。' },
  { title: '下降趋势反弹', desc: '反弹不等于反转，必须等趋势结构改变。' },
  { title: 'MA20支撑', desc: '短线趋势支撑，但不能代替历史位置判断。' },
  { title: 'MA60支撑', desc: '中期趋势支撑，跌破后风险明显增加。' }
];

export function matchCase(data, position) {
  if (position.bigPosition === '历史低位' && data.volume === 'breakout') return '低位启动';
  if (data.volume === 'stagnation') return '放量滞涨';
  if (data.volume === 'shrinkPullback' && data.trend === 'up') return '缩量回调';
  if (position.bigPosition === '历史高位' && data.trend === 'up') return '历史新高';
  if (data.trend === 'sideways') return '箱体震荡';
  if (data.trend === 'down') return '下降趋势反弹';
  return '综合观察型';
}

export function commonMistakes(data, position) {
  const list = [
    'MA20 附近 ≠ 绝对低位，必须结合历史位置。',
    '放量 ≠ 一定上涨，要看放量后价格是否有效推进。',
    '低位 ≠ 马上会涨，低位也可能继续磨底。'
  ];
  if (position.bigPosition === '历史高位') list.push('历史高位不能只看均线低不低，追涨前必须先想止损。');
  if (data.volume === 'stagnation') list.push('放量滞涨时，不要把所有成交量都理解成主力吸筹。');
  if (data.trend === 'down') list.push('下降趋势里最常见的错误，是把普通反弹当成反转。');
  return list;
}

export function renderCaseLibrary(container) {
  container.innerHTML = cases.map(item => `
    <div class="case-item">
      <strong>${item.title}</strong>
      <span>${item.desc}</span>
    </div>
  `).join('');
}
