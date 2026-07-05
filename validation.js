function toNumber(id){
  const value = document.getElementById(id).value.trim();
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function collectInput(){
  return {
    name: document.getElementById('stockName').value.trim() || '未命名股票',
    code: document.getElementById('stockCode').value.trim() || '未填写代码',
    price: toNumber('price'), ma20: toNumber('ma20'), ma60: toNumber('ma60'),
    high: toNumber('high'), low: toNumber('low'),
    trend: document.getElementById('trend').value,
    volume: document.getElementById('volume').value,
    positionState: document.getElementById('positionState').value,
    style: document.getElementById('style').value
  };
}
function validateInput(d){
  const miss = [];
  ['price','ma20','ma60','high','low'].forEach(k=>{ if(d[k]===null) miss.push(k); });
  if(miss.length) return {ok:false,msg:'请补全价格、MA20、MA60、历史高点、历史低点。'};
  if(d.high <= d.low) return {ok:false,msg:'历史高点必须大于历史低点。'};
  if(d.price <= 0 || d.ma20 <= 0 || d.ma60 <= 0) return {ok:false,msg:'价格和均线必须大于0。'};
  return {ok:true,msg:'OK'};
}
function codeQuality(code){
  if(/^(60|68|00|30|8|4)\d{4}$/.test(code)) return 'A股代码格式正常';
  if(/^[A-Z]{1,5}$/.test(code)) return '美股代码格式正常';
  return '代码格式仅做基础检查，V2.0再联网验证真实性';
}
