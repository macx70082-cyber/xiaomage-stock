const $ = id => document.getElementById(id);

function num(id){
  const v = parseFloat($(id).value);
  return Number.isFinite(v) ? v : null;
}

function levelByDistance(value){
  if(value < 0.33) return "低位";
  if(value < 0.66) return "中位";
  return "高位";
}

function maState(price, ma){
  const diff = (price - ma) / ma * 100;
  if(Math.abs(diff) <= 3) return {text:"接近", diff};
  return {text: diff > 0 ? "高于" : "低于", diff};
}

function stars(score){
  const n = Math.max(1, Math.min(5, Math.round(score / 20)));
  return "★".repeat(n) + "☆".repeat(5-n);
}

function analyze(){
  const name = $("name").value.trim() || "未命名股票";
  const code = $("code").value.trim() || "未填写代码";
  const price = num("price"), ma20 = num("ma20"), ma30 = num("ma30"), ma60 = num("ma60");
  const high = num("high"), low = num("low"), buy = num("buy"), qty = num("qty");

  if([price,ma20,ma30,ma60,high,low,buy,qty].some(v=>v===null)){
    $("result").textContent = "请填写完整数据。";
    return;
  }
  if(high <= low){
    $("result").textContent = "历史最高价必须大于历史最低价。";
    return;
  }

  const pos = (price - low) / (high - low);
  const big = levelByDistance(pos);
  const m20 = maState(price, ma20), m30 = maState(price, ma30), m60 = maState(price, ma60);

  let trendScore = 0;
  if(price > ma20) trendScore++;
  if(price > ma30) trendScore++;
  if(price > ma60) trendScore++;

  const trend = trendScore === 3 ? "偏多" : trendScore === 2 ? "中性偏强" : trendScore === 1 ? "偏弱" : "弱势";
  const small = Math.abs(m20.diff) <= 3 ? "接近MA20" : (m20.diff > 0 ? "高于MA20" : "低于MA20");

  const cost = buy * qty;
  const value = price * qty;
  const profit = value - cost;
  const rate = profit / cost * 100;

  let score = 50;
  if(big === "低位") score += 22;
  if(big === "中位") score += 8;
  if(big === "高位") score -= 15;
  if(price > ma20) score += 8; else score -= 5;
  if(price > ma30) score += 6; else score -= 4;
  if(price > ma60) score += 10; else score -= 8;
  if(pos > 0.85) score -= 12;
  if(pos < 0.2) score += 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const risk = score >= 80 ? "较低" : score >= 60 ? "中等" : score >= 40 ? "偏高" : "高";
  const scoreText = score >= 80 ? "优秀观察区" : score >= 60 ? "可观察" : score >= 40 ? "谨慎等待" : "风险较高";

  $("score").textContent = score;
  $("scoreText").textContent = scoreText;
  $("bigPos").textContent = big;
  $("smallPos").textContent = small;
  $("trend").textContent = trend;
  $("risk").textContent = risk;

  $("result").textContent =
`股票：${name}（${code}）

一、位置分析
大位置：${big}
当前位置处在历史区间的 ${(pos*100).toFixed(2)}% 位置。
历史最低价：${low.toFixed(2)}
历史最高价：${high.toFixed(2)}

二、均线分析
MA20：当前价格${m20.text}MA20，偏离 ${m20.diff.toFixed(2)}%
MA30：当前价格${m30.text}MA30，偏离 ${m30.diff.toFixed(2)}%
MA60：当前价格${m60.text}MA60，偏离 ${m60.diff.toFixed(2)}%

三、趋势判断
趋势：${trend}

四、持仓盈亏
成本：${cost.toFixed(2)} 元
当前市值：${value.toFixed(2)} 元
盈亏：${profit.toFixed(2)} 元
收益率：${rate.toFixed(2)}%

五、综合评分
评分：${score} / 100
星级：${stars(score)}
风险：${risk}

六、AI综合分析
当前股票处于「${big}」，短期状态为「${small}」，趋势判断为「${trend}」。
如果大位置较低，同时股价能够站上 MA20 / MA30 / MA60，说明技术面更健康。
如果价格接近历史高位，哪怕均线较强，也要注意追高风险。

提示：本工具只做学习和辅助分析，不构成买卖建议。`;
}

function resetAll(){
  document.querySelectorAll("input").forEach(i=>i.value="");
  $("score").textContent="--";
  $("scoreText").textContent="等待分析";
  $("bigPos").textContent="--";
  $("smallPos").textContent="--";
  $("trend").textContent="--";
  $("risk").textContent="--";
  $("result").textContent="等待分析...";
}

window.addEventListener("DOMContentLoaded",()=>{
  $("analyzeBtn").addEventListener("click", analyze);
  $("resetBtn").addEventListener("click", resetAll);
});
