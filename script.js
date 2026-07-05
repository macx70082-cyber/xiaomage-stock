const STOCK_DB=[{"code": "600519", "name": "贵州茅台", "market": "沪市主板"}, {"code": "601318", "name": "中国平安", "market": "沪市主板"}, {"code": "600036", "name": "招商银行", "market": "沪市主板"}, {"code": "000001", "name": "平安银行", "market": "深市主板"}, {"code": "000333", "name": "美的集团", "market": "深市主板"}, {"code": "000858", "name": "五粮液", "market": "深市主板"}, {"code": "002594", "name": "比亚迪", "market": "深市主板"}, {"code": "300750", "name": "宁德时代", "market": "创业板"}, {"code": "300760", "name": "迈瑞医疗", "market": "创业板"}, {"code": "300059", "name": "东方财富", "market": "创业板"}, {"code": "688981", "name": "中芯国际", "market": "科创板"}, {"code": "688041", "name": "海光信息", "market": "科创板"}, {"code": "688256", "name": "寒武纪", "market": "科创板"}, {"code": "920211", "name": "新睿电子", "market": "北交所"}, {"code": "920510", "name": "丰光精密", "market": "北交所"}, {"code": "920193", "name": "吉冈精密", "market": "北交所"}, {"code": "920096", "name": "嘉晨智能", "market": "北交所"}, {"code": "920002", "name": "万达轴承", "market": "北交所"}, {"code": "301199", "name": "迈赫股份", "market": "创业板"}];
const $=id=>document.getElementById(id);
function num(id){const v=parseFloat($(id).value);return Number.isFinite(v)?v:null}
function norm(s){return String(s||"").trim().replace(/\s+/g,"")}
function guessMarket(code){
 if(code.startsWith("600")||code.startsWith("601")||code.startsWith("603")||code.startsWith("605"))return"沪市主板";
 if(code.startsWith("688"))return"科创板";
 if(code.startsWith("000")||code.startsWith("001")||code.startsWith("002")||code.startsWith("003"))return"深市主板";
 if(code.startsWith("300")||code.startsWith("301"))return"创业板";
 if(code.startsWith("920")||code.startsWith("83")||code.startsWith("87")||code.startsWith("43")||code.startsWith("8")||code.startsWith("4"))return"北交所";
 return"疑似无效";
}
function findStock(code){return STOCK_DB.find(s=>s.code===code)||null}
function validateStock(){
 const code=norm($("code").value), inputName=norm($("name").value);
 if(!/^\d{6}$/.test(code))return{valid:false,level:"bad",market:"无效",title:"❌ 股票代码格式错误",message:"A股代码通常是 6 位数字，例如 600519、300750、920211。",stock:null};
 const stock=findStock(code);
 if(stock){
  if(inputName&&inputName!==stock.name)return{valid:false,level:"bad",market:stock.market,title:"❌ 名称与代码不匹配",message:`代码 ${code} 在数据库中对应「${stock.name}」，不是「${inputName}」。请检查股票名称。`,stock};
  return{valid:true,level:"ok",market:stock.market,title:"✅ 股票数据库验证通过",message:`代码：${stock.code}\n名称：${stock.name}\n市场：${stock.market}`,stock};
 }
 const market=guessMarket(code);
 if(market!=="疑似无效")return{valid:false,level:"warn",market,title:"⚠️ 代码格式可能有效，但数据库未收录",message:`${code} 符合「${market}」代码段，但 V1.2.2 内置数据库暂未收录。为避免误判，系统暂不允许继续分析。`,stock:null};
 return{valid:false,level:"bad",market:"疑似无效",title:"❌ 疑似无效股票代码",message:`${code} 不符合常见 A股代码段，系统不会继续分析。`,stock:null};
}
function showCheckResult(c){
 const box=$("checkResult");box.className="checkBox";
 if(c.level==="ok")box.classList.add("checkOk");if(c.level==="warn")box.classList.add("checkWarn");if(c.level==="bad")box.classList.add("checkBad");
 box.textContent=`${c.title}\n市场类型：${c.market}\n${c.message}`;
 $("realStatus").textContent=c.valid?"已通过":"未通过";
 if(c.stock&&!$("name").value.trim())$("name").value=c.stock.name;
}
function checkStock(){const c=validateStock();showCheckResult(c);return c}
function levelByDistance(v){if(v<0.33)return"低位";if(v<0.66)return"中位";return"高位"}
function maState(p,ma){const d=(p-ma)/ma*100;if(Math.abs(d)<=3)return{text:"接近",diff:d};return{text:d>0?"高于":"低于",diff:d}}
function stars(score){const n=Math.max(1,Math.min(5,Math.round(score/20)));return"★".repeat(n)+"☆".repeat(5-n)}
function analyze(){
 const c=checkStock();
 if(!c.valid){$("score").textContent="--";$("scoreText").textContent="股票校验未通过";$("bigPos").textContent="--";$("smallPos").textContent="--";$("risk").textContent="--";$("result").textContent=`股票校验未通过，系统已停止分析。\n\n原因：\n${c.message}\n\n这样做是为了避免对不存在、未收录或名称不匹配的股票进行分析。`;return}
 const name=c.stock.name, code=c.stock.code;
 const price=num("price"),ma20=num("ma20"),ma30=num("ma30"),ma60=num("ma60"),high=num("high"),low=num("low"),buy=num("buy"),qty=num("qty");
 if([price,ma20,ma30,ma60,high,low,buy,qty].some(v=>v===null)){$("result").textContent="请填写完整数据。";return}
 if(high<=low){$("result").textContent="历史最高价必须大于历史最低价。";return}
 const pos=(price-low)/(high-low),big=levelByDistance(pos),m20=maState(price,ma20),m30=maState(price,ma30),m60=maState(price,ma60);
 let ts=0;if(price>ma20)ts++;if(price>ma30)ts++;if(price>ma60)ts++;
 const trend=ts===3?"偏多":ts===2?"中性偏强":ts===1?"偏弱":"弱势",small=Math.abs(m20.diff)<=3?"接近MA20":(m20.diff>0?"高于MA20":"低于MA20");
 const cost=buy*qty,value=price*qty,profit=value-cost,rate=profit/cost*100;
 let score=50;if(big==="低位")score+=22;if(big==="中位")score+=8;if(big==="高位")score-=15;if(price>ma20)score+=8;else score-=5;if(price>ma30)score+=6;else score-=4;if(price>ma60)score+=10;else score-=8;if(pos>0.85)score-=12;if(pos<0.2)score+=8;score=Math.max(0,Math.min(100,Math.round(score)));
 const risk=score>=80?"较低":score>=60?"中等":score>=40?"偏高":"高",scoreText=score>=80?"优秀观察区":score>=60?"可观察":score>=40?"谨慎等待":"风险较高";
 $("score").textContent=score;$("scoreText").textContent=scoreText;$("bigPos").textContent=big;$("smallPos").textContent=small;$("risk").textContent=risk;
 $("result").textContent=`股票：${name}（${code}）\n真实校验：数据库已收录\n市场类型：${c.stock.market}\n\n一、位置分析\n大位置：${big}\n当前位置处在历史区间的 ${(pos*100).toFixed(2)}% 位置。\n\n二、均线分析\nMA20：当前价格${m20.text}MA20，偏离 ${m20.diff.toFixed(2)}%\nMA30：当前价格${m30.text}MA30，偏离 ${m30.diff.toFixed(2)}%\nMA60：当前价格${m60.text}MA60，偏离 ${m60.diff.toFixed(2)}%\n\n三、趋势判断\n趋势：${trend}\n\n四、持仓盈亏\n成本：${cost.toFixed(2)} 元\n当前市值：${value.toFixed(2)} 元\n盈亏：${profit.toFixed(2)} 元\n收益率：${rate.toFixed(2)}%\n\n五、综合评分\n评分：${score} / 100\n星级：${stars(score)}\n风险：${risk}\n\n六、AI综合分析\nV1.2.2 已加入股票数据库验证。\n本次分析对象「${name}（${code}）」已在内置数据库中找到，市场类型为「${c.stock.market}」。\n这比 V1.2.1 单纯代码段识别更可靠，但仍不是完整联网行情验证。`;
}
function resetAll(){document.querySelectorAll("input").forEach(i=>i.value="");$("checkResult").className="checkBox";$("checkResult").textContent="等待验证...";$("score").textContent="--";$("scoreText").textContent="等待分析";$("realStatus").textContent="--";$("bigPos").textContent="--";$("smallPos").textContent="--";$("risk").textContent="--";$("result").textContent="等待分析..."}
window.addEventListener("DOMContentLoaded",()=>{$("checkBtn").addEventListener("click",checkStock);$("analyzeBtn").addEventListener("click",analyze);$("resetBtn").addEventListener("click",resetAll)});
