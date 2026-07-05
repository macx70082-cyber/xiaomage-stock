export function validateStockInput(data) {
  const errors = [];
  const code = String(data.stockCode || '').trim();
  const name = String(data.stockName || '').trim();

  if (!name) errors.push('请填写股票名称。');
  if (!code) errors.push('请填写股票代码。');

  const cnCode = /^(60|68|00|30|90|20|43|83|87)\d{4}$/;
  const hkCode = /^\d{5}$/;
  const usCode = /^[A-Z]{1,5}(\.[A-Z])?$/;
  if (code && !cnCode.test(code) && !hkCode.test(code) && !usCode.test(code.toUpperCase())) {
    errors.push('股票代码格式不太像 A股 / 港股 / 美股常见格式，请检查。');
  }

  ['price', 'ma20', 'ma60', 'high', 'low'].forEach(key => {
    if (!Number.isFinite(data[key]) || data[key] <= 0) errors.push(`${labelMap[key]} 必须是大于 0 的数字。`);
  });

  if (Number.isFinite(data.high) && Number.isFinite(data.low) && data.high <= data.low) {
    errors.push('历史高点必须大于历史低点。');
  }

  return errors;
}

const labelMap = {
  price: '当前价格',
  ma20: 'MA20',
  ma60: 'MA60',
  high: '历史高点',
  low: '历史低点'
};
