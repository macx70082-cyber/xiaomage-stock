const $=id=>document.getElementById(id);

function num(id){
  const v=parseFloat($(id).value);
  return Number.isFinite(v)?v:null;
}

function normalizeCode(code){
  return String(code||"").trim().replace(/\s+/g,"");
}

function validateAStock(code){
  code=normalizeCode(code);
  if(!/^\d{6}$/.test(code)){
    return {valid:false,level:"bad",market:"无效",title:"❌ 股票代码格式错误",message:"A股代码通常是 6 位数字，例如 600519、000001、300750、688981。"};
  }
  if(code.startsWith("600")||code.startsWith("601")||code.startsWith("603")||code.startsWith("605")){
    return {valid:true,level:"ok",market:"沪市主板",title:"✅ 格式有效",message:`${code} 符合沪市主板 A股代码格式。`};
  }
  if(code.startsWith("688")){
    return {valid:true,level:"ok",market:"科创板",title:"✅ 格式有效",message:`${code} 符合科创板 A股代码格式。`};
  }
  if(code.startsWith("000")||code.startsWith("001")||code.startsWith("002")||code.startsWith("003")){
    return {valid:true,level:"ok",market:"深市主板",title:"✅ 格式有效",message:`${code} 符合深市主板 A股代码格式。`};
  }
  if(code.startsWith("300")||code.startsWith("301")){
    return {valid:true,level:"ok",market:"创业板",title:"✅ 格式有效",message:`${code} 符合创业板 A股代码格式。`};
  }
  if(code.startsWith("8")||code.startsWith("4")){
    return {valid:true,level:"warn",market:"北交所",title:"⚠️ 可能是北交所股票",message:`${code} 可能属于北交所代码段。V1.2.1 先做格式识别，后续需要联网接口确认。`};
  }
  return {valid:false,level:"bad",market:"疑似无效",title:"❌ 疑似无效股票代码",message:`${code} 不符合常见 A股代码段。系统不会继续分析，避免分析不存在的股票。`};
}

function showCheckResult(check){
  const box=$("checkResult");
  box.className="checkBox";
  if(check.level==="ok")box.classList.add("checkOk");
  if(check.level==="warn")box.classList.add("checkWarn");
  if(check.level==="bad")box.classList.add("checkBad");
  box.textContent=`${check.title}\n市场类型：${check.market}\n${check.message}`;
  $("realStatus").textContent=check.valid?check.market:"未通过";
}

function checkStock(){
  const check=validateAStock($("code").value);
  showCheckResult(check);
  return check;
}

function levelByDistance(v){
  if(v<0.33)return"低位";
  if(v<0.66)return"中位";
  return"高位";
}

function maState(price,ma){
  const diff=(price-ma)/ma*100;
  if(Math.abs(diff)<=3)return{text:"接近",diff};
  return{text:diff>0?"高于":"低于",diff};
}

function stars(score){
  const n=Math.max(1,Math.min(5,Math.round(score/20)));
  return "★".repeat(n)+"☆".repeat(5-n);
}

function analyze(){
  const name=$("name").value.trim()||"未命名股票";
  const code=normalizeCode($("code").value);
  const check=checkStock();

  if(!check.valid){
    $("score").textContent="--";
    $("scoreText").textContent="股票校验未通过";
    $("bigPos").textContent="--";
    $("smallPos").textContent="--";
    $("risk").textContent="--";
    $("result").textContent=`股票校验未通过，系统已停止分析。\n\n原因：\n${check.message}\n\n这样做是为了避免对不存在或明显异常的股票进行分析。`;
    return;
  }

  const price=num("price"),ma20=num("ma20"),ma30=num("ma30"),ma60=num("ma60");
  const high=num("high"),low=num("low"),buy=num("buy"),qty=num("qty");

  if([price,ma20,ma30,ma60,high,low,buy,qty].some(v=>v===null)){
    $("result").textContent="请填写完整数据。";
    return;
  }
  if(high<=low){
    $("result").textContent="历史最高价必须大于历史最低价。";
    return;
  }

  const pos=(price-low)/(high-low);
  const big=levelByDistance(pos);
  const m20=maState(price,ma20),m30=maState(price,ma30),m60=maState(price,ma60);

  let trendScore=0;
  if(price>ma20)trendScore++;
  if(price>ma30)trendScore++;
  if(price>ma60)trendScore++;

  const trend=trendScore===3?"偏多":trendScore===2?"中性偏强":trendScore===1?"偏弱":"弱势";
  const small=Math.abs(m20.diff)<=3?"接近MA20":(m20.diff>0?"高于MA20":"低于MA20");

  const cost=buy*qty,value=price*qty,profit=value-cost,rate=profit/cost*100;

  let score=50;
  if(big==="低位")score+=22;
  if(big==="中位")score+=8;
  if(big==="高位")score-=15;
  if(price>ma20)score+=8;else score-=5;
  if(price>ma30)score+=6;else score-=4;
  if(price>ma60)score+=10;else score-=8;
  if(pos>0.85)score-=12;
  if(pos<0.2)score+=8;
  score=Math.max(0,Math.min(100,Math.round(score)));

  const risk=score>=80?"较低":score>=60?"中等":score>=40?"偏高":"高";
  const scoreText=score>=80?"优秀观察区":score>=60?"可观察":score>=40?"谨慎等待":"风险较高";

  $("score").textContent=score;
  $("scoreText").textContent=scoreText;
  $("bigPos").textContent=big;
  $("smallPos").textContent=small;
  $("risk").textContent=risk;

  $("result").textContent=`股票：${name}（${code}）\n校验结果：${check.market}，基础格式通过。\n\n一、位置分析\n大位置：${big}\n当前位置处在历史区间的 ${(pos*100).toFixed(2)}% 位置。\n\n二、均线分析\nMA20：当前价格${m20.text}MA20，偏离 ${m20.diff.toFixed(2)}%\nMA30：当前价格${m30.text}MA30，偏离 ${m30.diff.toFixed(2)}%\nMA60：当前价格${m60.text}MA60，偏离 ${m60.diff.toFixed(2)}%\n\n三、趋势判断\n趋势：${trend}\n\n四、持仓盈亏\n成本：${cost.toFixed(2)} 元\n当前市值：${value.toFixed(2)} 元\n盈亏：${profit.toFixed(2)} 元\n收益率：${rate.toFixed(2)}%\n\n五、综合评分\n评分：${score} / 100\n星级：${stars(score)}\n风险：${risk}\n\n六、AI综合分析\nV1.2.1 已经加入股票代码基础校验。\n当前股票代码属于「${check.market}」格式，避免了明显错误代码直接进入分析。\n但注意：这一步还不是联网真实行情校验。V1.2.3 会继续接入真实数据接口。`;
}

function resetAll(){
  document.querySelectorAll("input").forEach(i=>i.value="");
  $("checkResult").className="checkBox";
  $("checkResult").textContent="等待验证...";
  $("score").textContent="--";
  $("scoreText").textContent="等待分析";
  $("realStatus").textContent="--";
  $("bigPos").textContent="--";
  $("smallPos").textContent="--";
  $("risk").textContent="--";
  $("result").textContent="等待分析...";
}

window.addEventListener("DOMContentLoaded",()=>{
  $("checkBtn").addEventListener("click",checkStock);
  $("analyzeBtn").addEventListener("click",analyze);
  $("resetBtn").addEventListener("click",resetAll);
});