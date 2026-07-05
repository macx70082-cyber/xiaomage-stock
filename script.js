const STOCK_DB=[{"code": "600519", "name": "贵州茅台", "market": "沪市主板"}, {"code": "601318", "name": "中国平安", "market": "沪市主板"}, {"code": "600036", "name": "招商银行", "market": "沪市主板"}, {"code": "600900", "name": "长江电力", "market": "沪市主板"}, {"code": "601899", "name": "紫金矿业", "market": "沪市主板"}, {"code": "603259", "name": "药明康德", "market": "沪市主板"}, {"code": "600497", "name": "驰宏锌锗", "market": "沪市主板"}, {"code": "600276", "name": "恒瑞医药", "market": "沪市主板"}, {"code": "601857", "name": "中国石油", "market": "沪市主板"}, {"code": "000001", "name": "平安银行", "market": "深市主板"}, {"code": "000333", "name": "美的集团", "market": "深市主板"}, {"code": "000858", "name": "五粮液", "market": "深市主板"}, {"code": "002594", "name": "比亚迪", "market": "深市主板"}, {"code": "002415", "name": "海康威视", "market": "深市主板"}, {"code": "000651", "name": "格力电器", "market": "深市主板"}, {"code": "300750", "name": "宁德时代", "market": "创业板"}, {"code": "300760", "name": "迈瑞医疗", "market": "创业板"}, {"code": "300059", "name": "东方财富", "market": "创业板"}, {"code": "300124", "name": "汇川技术", "market": "创业板"}, {"code": "301199", "name": "迈赫股份", "market": "创业板"}, {"code": "300274", "name": "阳光电源", "market": "创业板"}, {"code": "688981", "name": "中芯国际", "market": "科创板"}, {"code": "688041", "name": "海光信息", "market": "科创板"}, {"code": "688111", "name": "金山办公", "market": "科创板"}, {"code": "688256", "name": "寒武纪", "market": "科创板"}, {"code": "688012", "name": "中微公司", "market": "科创板"}, {"code": "920211", "name": "新睿电子", "market": "北交所"}, {"code": "920510", "name": "丰光精密", "market": "北交所"}, {"code": "920193", "name": "吉冈精密", "market": "北交所"}, {"code": "920096", "name": "嘉晨智能", "market": "北交所"}, {"code": "920002", "name": "万达轴承", "market": "北交所"}];
const SAMPLE_DATA={"600497": {"name": "驰宏锌锗", "price": 18.2, "ma5": 18.62, "ma10": 17.92, "ma20": 16.88, "ma60": 15.35, "high": 35.0, "low": 8.0, "vol": 1800000, "avgVol": 1300000}, "920211": {"name": "新睿电子", "price": 13.4, "ma5": 13.62, "ma10": 13.1, "ma20": 12.58, "ma60": 11.3, "high": 29.5, "low": 7.2, "vol": 520000, "avgVol": 430000}, "300750": {"name": "宁德时代", "price": 190.0, "ma5": 188.2, "ma10": 184.9, "ma20": 180.3, "ma60": 170.8, "high": 382.0, "low": 120.0, "vol": 9800000, "avgVol": 8700000}, "600519": {"name": "贵州茅台", "price": 1500.0, "ma5": 1490.0, "ma10": 1472.0, "ma20": 1450.0, "ma60": 1390.0, "high": 2627.0, "low": 820.0, "vol": 4200000, "avgVol": 3900000}};
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
function setBox(type,msg){const b=$("verifyBox");b.className="notice "+type;b.textContent=msg}

function verify(){
 const code=clean($("code").value), name=clean($("name").value);
 if(!/^\d{6}$/.test(code)){setBox("bad","❌ 代码格式错误\n请输入 6 位 A股代码。");return{canAnalyze:false,verified:false,stock:null,code,market:"无效"}}
 const stock=stockByCode(code);
 if(stock){
   if(name && name!==stock.name){setBox("bad",`❌ 名称与代码不匹配\n${code} 对应「${stock.name}」，不是「${name}」。`);return{canAnalyze:false,verified:false,stock,code,market:stock.market}}
   $("name").value=stock.name;
   setBox("ok",`✅ 数据库验证通过\n代码：${stock.code}\n名称：${stock.name}\n市场：${stock.market}`);
   return{canAnalyze:true,verified:true,stock,code:stock.code,market:stock.market}
 }
 const market=guessMarket(code);
 if(market!=="疑似无效"){
   setBox("warn",`⚠️ 数据库未收录，但允许分析\n${code} 符合「${market}」代码段。请自行确认名称与代码。`);
   return{canAnalyze:true,verified:false,stock:{code,name:name||"未填写名称",market},code,market}
 }
 setBox("bad",`❌ 疑似无效代码\n${code} 不符合常见 A股代码段。`);
 return{canAnalyze:false,verified:false,stock:null,code,market:"疑似无效"}
}

async function fetchRealData(code){
 const api=$("apiUrl").value.trim();
 if(!api) throw new Error("未配置真实API");
 const url = api.includes("?") ? `${api}&code=${code}` : `${api}?code=${code}`;
 const res = await fetch(url);
 if(!res.ok) throw new Error("API请求失败");
 return await res.json();
}

function applyData(data, source){
 if(data.name) $("name").value=data.name;
 ["price","high","low","ma5","ma10","ma20","ma60","vol","avgVol"].forEach(k=>{
   if(data[k]!==undefined && data[k]!==null) $(k).value=data[k];
 });
 $("dataSource").textContent=source;
 $("dataHint").textContent=source==="真实API"?"已尝试联网获取":source==="备用数据"?"来自内置备用库":"手动输入";
}

async function autoFetch(){
 const code=clean($("code").value);
 const v=verify();
 if(!v.canAnalyze){$("dataSource").textContent="失败";$("dataHint").textContent="代码无效";return}
 try{
   const data=await fetchRealData(code);
   applyData(data,"真实API");
   setBox("ok",`✅ 已从真实API获取数据\n${code} 的价格和均线已自动填充。`);
 }catch(e){
   const local=SAMPLE_DATA[code];
   if(local){
     applyData(local,"备用数据");
     setBox("warn",`⚠️ 真实API不可用，已使用内置备用数据\n原因：${e.message}`);
   }else{
     $("dataSource").textContent="手动输入";
     $("dataHint").textContent="未找到备用数据";
     setBox("warn",`⚠️ 没有获取到自动数据\n原因：${e.message}\n你仍然可以手动填写价格、均线、历史高低点后分析。`);
   }
 }
}

function maRank(ma5,ma10,ma20,ma60){
 let order=[ma5>ma10,ma10>ma20,ma20>ma60].filter(Boolean).length;
 if(order===3)return{type:"多头排列",score:30,msg:"MA5 > MA10 > MA20 > MA60，符合你的强信心形态。",health:"健康"};
 if(ma5<ma10&&ma10<ma20&&ma20<ma60)return{type:"空头排列",score:0,msg:"MA5 < MA10 < MA20 < MA60，趋势偏弱。",health:"危险"};
 return{type:"混合排列",score:order*8,msg:"均线没有完全多头排列，属于观察或等待区。",health:order===2?"一般":"偏弱"};
}
function bigPosition(price,high,low){
 const p=(price-low)/(high-low),type=p<0.33?"低位":p<0.66?"中位":"高位";
 return{p,type,score:type==="低位"?40:type==="中位"?24:8,msg:`当前处在历史区间 ${(p*100).toFixed(2)}% 位置。`};
}
function ma20Distance(price,ma20){
 const d=(price-ma20)/ma20*100;
 return{d,score:Math.abs(d)<=3?15:(d<0?12:(d<=8?8:3)),type:Math.abs(d)<=3?"接近MA20":(d>0?"高于MA20":"低于MA20")};
}
function volumeScore(vol,avg){
 if(vol===null||avg===null||avg<=0)return{score:6,type:"未填写",msg:"未填写成交量，默认中性。"};
 const r=vol/avg;
 if(r>=1.3)return{score:10,type:"放量",msg:`当前成交量约为平均成交量的 ${r.toFixed(2)} 倍。`};
 if(r<=0.7)return{score:4,type:"缩量",msg:`当前成交量约为平均成交量的 ${r.toFixed(2)} 倍。`};
 return{score:7,type:"正常",msg:`当前成交量约为平均成交量的 ${r.toFixed(2)} 倍。`};
}
function buyLevel(score,big,rank,dist){
 if(score>=85&&big==="低位"&&rank==="多头排列"&&Math.abs(dist)<=6)return{level:"S级",hint:"强共振"};
 if(score>=72&&rank==="多头排列")return{level:"A级",hint:"重点观察"};
 if(score>=58)return{level:"B级",hint:"普通观察"};
 if(score>=42)return{level:"C级",hint:"谨慎等待"};
 return{level:"D级",hint:"暂时回避"};
}
function tradePlan(level,big,rank,price,ma20,verified,source){
 let action="等待",position="0-10%",mainRisk="趋势不清";
 if(level==="S级"){action="可重点观察";position=(verified&&source!=="手动输入")?"20-30%":"10-20%";mainRisk=verified?"回踩破MA20":"股票未验证"}
 else if(level==="A级"){action="分批观察";position="10-20%";mainRisk=big==="高位"?"大位置偏高":"未完全低位共振"}
 else if(level==="B级"){action="小仓观察";position="0-10%";mainRisk="胜率一般"}
 else if(level==="C级"){action="继续等待";position="0-5%";mainRisk="条件不足"}
 else{action="暂不考虑";position="0%";mainRisk="风险过高"}
 return{action,position,mainRisk,stop:Math.min(ma20*0.97,price*0.92).toFixed(2)};
}
function analyze(){
 const v=verify();
 if(!v.canAnalyze){$("report").textContent="股票验证未通过，系统停止分析。";return}
 const price=n("price"),high=n("high"),low=n("low"),ma5=n("ma5"),ma10=n("ma10"),ma20=n("ma20"),ma60=n("ma60");
 if([price,high,low,ma5,ma10,ma20,ma60].some(x=>x===null)){$("report").textContent="请填写或自动获取：当前价格、历史最高、历史最低、MA5、MA10、MA20、MA60。";return}
 if(high<=low){$("report").textContent="历史最高价必须大于历史最低价。";return}
 const bp=bigPosition(price,high,low),mr=maRank(ma5,ma10,ma20,ma60),md=ma20Distance(price,ma20),vs=volumeScore(n("vol"),n("avgVol"));
 let score=Math.round(bp.score+mr.score+md.score+vs.score+5-(v.verified?0:5));
 score=Math.max(0,Math.min(100,score));
 const risk=(!v.verified&&score>=82)?"中等":(score>=82&&bp.type==="低位"&&mr.type==="多头排列"?"较低":score>=65?"中等":score>=45?"偏高":"高");
 const bl=buyLevel(score,bp.type,mr.type,md.d);
 const source=$("dataSource").textContent==="--"?"手动输入":$("dataSource").textContent;
 const plan=tradePlan(bl.level,bp.type,mr.type,price,ma20,v.verified,source);
 $("score").textContent=score;$("scoreText").textContent=score>=85?"小马哥优选":score>=72?"可重点观察":score>=58?"普通观察":score>=42?"谨慎等待":"暂时回避";
 $("buyLevel").textContent=bl.level;$("buyHint").textContent=bl.hint;$("risk").textContent=risk;$("riskHint").textContent=vs.type;
 $("rankLine").textContent=`MA5 ${ma5} / MA10 ${ma10} / MA20 ${ma20} / MA60 ${ma60} —— ${mr.type}，健康度：${mr.health}`;
 $("action").textContent=plan.action;$("position").textContent=plan.position;$("stopLoss").textContent=plan.stop;$("mainRisk").textContent=plan.mainRisk;
 const buy=n("buy"),qty=n("qty");
 let holding="未填写买入价或股数，跳过持仓盈亏计算。";
 if(buy&&qty){const cost=buy*qty,value=price*qty,profit=value-cost,rate=profit/cost*100;holding=`成本：${cost.toFixed(2)} 元\n当前市值：${value.toFixed(2)} 元\n盈亏：${profit.toFixed(2)} 元\n收益率：${rate.toFixed(2)}%`}
 $("report").textContent=`股票：${v.stock.name}（${v.code}）
市场：${v.market}
真实性：${v.verified?"数据库已验证":"数据库未收录，代码格式有效"}
数据来源：${source}
版本：Stock AI V1.4.2

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
未收录风险修正：${v.verified?"0":"-5"}
综合评分：${score}/100
买点等级：${bl.level}

三、交易参考
建议动作：${plan.action}
参考仓位：${plan.position}
止损参考：${plan.stop}
核心风险：${plan.mainRisk}

四、持仓情况
${holding}

五、V1.4.2说明
这一版已经具备自动行情架构：
1. 优先请求你配置的真实 API；
2. 失败后使用内置备用数据；
3. 没有备用数据时允许手动填写；
4. 分析逻辑继续使用你的“大位置 + 均线多头排列”体系。

注意：如果没有配置真实 API，自动数据不是实时行情。`;
}
function resetAll(){document.querySelectorAll("input").forEach(i=>i.value="");["score","dataSource","buyLevel","risk","action","position","stopLoss","mainRisk"].forEach(id=>$(id).textContent="--");$("scoreText").textContent="等待分析";$("dataHint").textContent="等待获取";$("buyHint").textContent="等待分析";$("riskHint").textContent="等待分析";$("verifyBox").className="notice";$("verifyBox").textContent="等待查询...";$("rankLine").textContent="等待数据";$("report").textContent="等待分析..."}
window.addEventListener("DOMContentLoaded",()=>{$("autoBtn").addEventListener("click",autoFetch);$("checkBtn").addEventListener("click",verify);$("analyzeBtn").addEventListener("click",analyze);$("resetBtn").addEventListener("click",resetAll)});
