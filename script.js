const STOCK_DB=[{"code": "600519", "name": "贵州茅台", "market": "沪市主板"}, {"code": "601318", "name": "中国平安", "market": "沪市主板"}, {"code": "600036", "name": "招商银行", "market": "沪市主板"}, {"code": "600900", "name": "长江电力", "market": "沪市主板"}, {"code": "601899", "name": "紫金矿业", "market": "沪市主板"}, {"code": "603259", "name": "药明康德", "market": "沪市主板"}, {"code": "600497", "name": "驰宏锌锗", "market": "沪市主板"}, {"code": "600276", "name": "恒瑞医药", "market": "沪市主板"}, {"code": "601857", "name": "中国石油", "market": "沪市主板"}, {"code": "000001", "name": "平安银行", "market": "深市主板"}, {"code": "000333", "name": "美的集团", "market": "深市主板"}, {"code": "000858", "name": "五粮液", "market": "深市主板"}, {"code": "002594", "name": "比亚迪", "market": "深市主板"}, {"code": "002415", "name": "海康威视", "market": "深市主板"}, {"code": "000651", "name": "格力电器", "market": "深市主板"}, {"code": "300750", "name": "宁德时代", "market": "创业板"}, {"code": "300760", "name": "迈瑞医疗", "market": "创业板"}, {"code": "300059", "name": "东方财富", "market": "创业板"}, {"code": "300124", "name": "汇川技术", "market": "创业板"}, {"code": "301199", "name": "迈赫股份", "market": "创业板"}, {"code": "300274", "name": "阳光电源", "market": "创业板"}, {"code": "688981", "name": "中芯国际", "market": "科创板"}, {"code": "688041", "name": "海光信息", "market": "科创板"}, {"code": "688111", "name": "金山办公", "market": "科创板"}, {"code": "688256", "name": "寒武纪", "market": "科创板"}, {"code": "688012", "name": "中微公司", "market": "科创板"}, {"code": "920211", "name": "新睿电子", "market": "北交所"}, {"code": "920510", "name": "丰光精密", "market": "北交所"}, {"code": "920193", "name": "吉冈精密", "market": "北交所"}, {"code": "920096", "name": "嘉晨智能", "market": "北交所"}, {"code": "920002", "name": "万达轴承", "market": "北交所"}];
const $=id=>document.getElementById(id);
const n=id=>{const v=parseFloat($(id).value);return Number.isFinite(v)?v:null};
const clean=s=>String(s||"").trim().replace(/\s+/g,"");

function guessMarket(code){
 if(code.startsWith("600")||code.startsWith("601")||code.startsWith("603")||code.startsWith("605"))return"沪市主板";
 if(code.startsWith("688"))return"科创板";
 if(code.startsWith("000")||code.startsWith("001")||code.startsWith("002")||code.startsWith("003"))return"深市主板";
 if(code.startsWith("300")||code.startsWith("301"))return"创业板";
 if(code.startsWith("920")||code.startsWith("83")||code.startsWith("87")||code.startsWith("43")||code.startsWith("8")||code.startsWith("4"))return"北交所";
 return"疑似无效";
}
function stockByCode(code){return STOCK_DB.find(s=>s.code===code)||null}

function verify(){
 const code=clean($("code").value), name=clean($("name").value);
 if(!/^\d{6}$/.test(code)) return showVerify({canAnalyze:false,verified:false,type:"bad",title:"❌ 代码格式错误",msg:"请输入 6 位 A股代码。",stock:null,code,market:"无效"});
 const stock=stockByCode(code);
 if(stock){
   if(name && name!==stock.name) return showVerify({canAnalyze:false,verified:false,type:"bad",title:"❌ 名称与代码不匹配",msg:`${code} 对应「${stock.name}」，不是「${name}」。`,stock,code,market:stock.market});
   if(!name) $("name").value=stock.name;
   return showVerify({canAnalyze:true,verified:true,type:"ok",title:"✅ 数据库验证通过",msg:`代码：${stock.code}\n名称：${stock.name}\n市场：${stock.market}`,stock,code:stock.code,market:stock.market});
 }
 const market=guessMarket(code);
 if(market!=="疑似无效"){
   return showVerify({canAnalyze:true,verified:false,type:"warn",title:"⚠️ 数据库未收录，但允许分析",msg:`${code} 符合「${market}」代码段。请你自己确认股票名称真实对应。`,stock:{code:code,name:name||"未填写名称",market:market},code,market});
 }
 return showVerify({canAnalyze:false,verified:false,type:"bad",title:"❌ 疑似无效代码",msg:`${code} 不符合常见 A股代码段，系统停止分析。`,stock:null,code,market:"疑似无效"});
}
function showVerify(v){
 const box=$("verifyBox"); box.className="notice "+v.type; box.textContent=`${v.title}\n${v.msg}`;
 $("realStatus").textContent = v.verified ? "已验证" : (v.canAnalyze ? "未收录" : "未通过");
 $("realHint").textContent = v.verified ? "数据库已收录" : (v.canAnalyze ? "格式有效，可分析" : "停止分析");
 return v;
}
function maRank(ma5,ma10,ma20,ma60){
 let order = [ma5>ma10, ma10>ma20, ma20>ma60].filter(Boolean).length;
 if(order===3) return {type:"多头排列",score:30,msg:"MA5 > MA10 > MA20 > MA60，符合你的强信心形态。",health:"健康"};
 if(ma5<ma10 && ma10<ma20 && ma20<ma60) return {type:"空头排列",score:0,msg:"MA5 < MA10 < MA20 < MA60，趋势偏弱。",health:"危险"};
 return {type:"混合排列",score:order*8,msg:"均线没有完全多头排列，属于观察或等待区。",health:order===2?"一般":"偏弱"};
}
function bigPosition(price,high,low){
 const p=(price-low)/(high-low);
 const type=p<0.33?"低位":p<0.66?"中位":"高位";
 const score=type==="低位"?40:type==="中位"?24:8;
 return {p,type,score,msg:`当前处在历史区间 ${(p*100).toFixed(2)}% 位置。`};
}
function ma20Distance(price,ma20){
 const d=(price-ma20)/ma20*100;
 const score=Math.abs(d)<=3?15:(d<0?12:(d<=8?8:3));
 const type=Math.abs(d)<=3?"接近MA20":(d>0?"高于MA20":"低于MA20");
 return {d,score,type};
}
function volumeScore(vol,avg){
 if(vol===null||avg===null||avg<=0) return {score:6,type:"未填写",msg:"未填写成交量，默认给中性分。"};
 const r=vol/avg;
 if(r>=1.3) return {score:10,type:"放量",msg:`当前成交量约为平均成交量的 ${r.toFixed(2)} 倍。`};
 if(r<=0.7) return {score:4,type:"缩量",msg:`当前成交量约为平均成交量的 ${r.toFixed(2)} 倍。`};
 return {score:7,type:"正常",msg:`当前成交量约为平均成交量的 ${r.toFixed(2)} 倍。`};
}
function buyLevel(score,big,rank,dist){
 if(score>=85 && big==="低位" && rank==="多头排列" && Math.abs(dist)<=6) return {level:"S级",hint:"强共振"};
 if(score>=72 && rank==="多头排列") return {level:"A级",hint:"重点观察"};
 if(score>=58) return {level:"B级",hint:"普通观察"};
 if(score>=42) return {level:"C级",hint:"谨慎等待"};
 return {level:"D级",hint:"暂时回避"};
}
function tradePlan(level,big,rank,price,ma20,verified){
 let action="等待", position="0-10%", mainRisk="趋势不清";
 if(level==="S级"){action="可重点观察"; position=verified?"20-30%":"10-20%"; mainRisk=verified?"回踩破MA20":"股票未验证";}
 else if(level==="A级"){action="分批观察"; position="10-20%"; mainRisk=big==="高位"?"大位置偏高":"未完全低位共振";}
 else if(level==="B级"){action="小仓观察"; position="0-10%"; mainRisk="胜率一般";}
 else if(level==="C级"){action="继续等待"; position="0-5%"; mainRisk="条件不足";}
 else {action="暂不考虑"; position="0%"; mainRisk="风险过高";}
 const stop = Math.min(ma20*0.97, price*0.92);
 return {action,position,mainRisk,stop:stop.toFixed(2)};
}
function riskBy(score,big,rank,verified){
 if(!verified && score>=82) return "中等";
 if(score>=82 && big==="低位" && rank==="多头排列") return "较低";
 if(score>=65) return "中等";
 if(score>=45) return "偏高";
 return "高";
}
function analyze(){
 const v=verify();
 if(!v.canAnalyze){$("score").textContent="--";$("scoreText").textContent="校验未通过";$("report").textContent="股票验证未通过，系统停止分析。\n\n原因：\n"+v.msg;return;}
 const price=n("price"), high=n("high"), low=n("low"), ma5=n("ma5"), ma10=n("ma10"), ma20=n("ma20"), ma60=n("ma60");
 if([price,high,low,ma5,ma10,ma20,ma60].some(x=>x===null)){ $("report").textContent="请至少填写：当前价格、历史最高、历史最低、MA5、MA10、MA20、MA60。"; return; }
 if(high<=low){ $("report").textContent="历史最高价必须大于历史最低价。"; return; }
 const bp=bigPosition(price,high,low), mr=maRank(ma5,ma10,ma20,ma60), md=ma20Distance(price,ma20), vs=volumeScore(n("vol"),n("avgVol"));
 let score=Math.round(bp.score+mr.score+md.score+vs.score+5-(v.verified?0:5));
 score=Math.max(0,Math.min(100,score));
 const risk=riskBy(score,bp.type,mr.type,v.verified), bl=buyLevel(score,bp.type,mr.type,md.d), plan=tradePlan(bl.level,bp.type,mr.type,price,ma20,v.verified);
 const buy=n("buy"), qty=n("qty");
 let holding="未填写买入价或股数，跳过持仓盈亏计算。";
 if(buy!==null && qty!==null && buy>0 && qty>0){
   const cost=buy*qty, value=price*qty, profit=value-cost, rate=profit/cost*100;
   holding=`成本：${cost.toFixed(2)} 元\n当前市值：${value.toFixed(2)} 元\n盈亏：${profit.toFixed(2)} 元\n收益率：${rate.toFixed(2)}%`;
 }
 $("score").textContent=score; $("scoreText").textContent=score>=85?"小马哥优选":score>=72?"可重点观察":score>=58?"普通观察":score>=42?"谨慎等待":"暂时回避";
 $("buyLevel").textContent=bl.level; $("buyHint").textContent=bl.hint; $("risk").textContent=risk; $("riskHint").textContent=vs.type;
 $("rankLine").textContent=`MA5 ${ma5} / MA10 ${ma10} / MA20 ${ma20} / MA60 ${ma60} —— ${mr.type}，健康度：${mr.health}`;
 $("action").textContent=plan.action; $("position").textContent=plan.position; $("stopLoss").textContent=plan.stop; $("mainRisk").textContent=plan.mainRisk;

 const name=v.stock.name, code=v.stock.code, market=v.stock.market;
 let finalText = `${bl.level}，${plan.action}。`;
 if(bp.type==="高位" && mr.type==="多头排列") finalText += " 重点注意：高位多头排列不等于低风险，不能只看均线。";
 if(bp.type==="低位" && mr.type==="多头排列") finalText += " 低位加多头排列，是你的体系里最值得观察的组合。";
 if(!v.verified) finalText += " 但该股未被内置数据库验证，必须先确认名称与代码。";

 $("report").textContent =
`股票：${name}（${code}）
市场：${market}
真实性：${v.verified ? "数据库已验证" : "数据库未收录，但代码格式有效"}
版本：Stock AI V1.3.2

一、核心判断
大位置：${bp.type}
${bp.msg}

均线排列：${mr.type}
${mr.msg}
均线健康度：${mr.health}

MA20距离：${md.type}
当前价格相对 MA20 偏离 ${md.d.toFixed(2)}%

成交量：${vs.type}
${vs.msg}

二、评分结构
大位置：${bp.score}/40
均线排列：${mr.score}/30
MA20距离：${md.score}/15
成交量：${vs.score}/10
风险控制基础分：5/5
未收录风险修正：${v.verified ? "0" : "-5"}
综合评分：${score}/100
买点等级：${bl.level}

三、交易参考
建议动作：${plan.action}
参考仓位：${plan.position}
止损参考：${plan.stop}
核心风险：${plan.mainRisk}

四、持仓情况
${holding}

五、AI结论
${finalText}

注意：这只是按你的交易体系做的辅助分析，不等于买卖建议。`;
}
function fillSample(){
 $("code").value="600497"; $("name").value="驰宏锌锗"; $("price").value="18"; $("high").value="35"; $("low").value="8";
 $("ma5").value="18.6"; $("ma10").value="17.8"; $("ma20").value="16.9"; $("ma60").value="15.2";
 $("vol").value="1800000"; $("avgVol").value="1300000"; verify();
}
function resetAll(){
 document.querySelectorAll("input").forEach(i=>i.value="");
 ["score","buyLevel","realStatus","risk","action","position","stopLoss","mainRisk"].forEach(id=>$(id).textContent="--");
 $("scoreText").textContent="等待分析"; $("buyHint").textContent="等待分析"; $("realHint").textContent="等待验证"; $("riskHint").textContent="等待分析";
 $("verifyBox").className="notice"; $("verifyBox").textContent="等待验证..."; $("rankLine").textContent="等待输入 MA5、MA10、MA20、MA60"; $("report").textContent="等待分析...";
}
window.addEventListener("DOMContentLoaded",()=>{
 $("checkBtn").addEventListener("click",verify); $("analyzeBtn").addEventListener("click",analyze);
 $("resetBtn").addEventListener("click",resetAll); $("sampleBtn").addEventListener("click",fillSample);
});
