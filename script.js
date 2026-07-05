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
function verify(){
 const code=clean($("code").value);
 const name=clean($("name").value)||"未填写名称";
 const box=$("verifyBox");
 if(!/^\d{6}$/.test(code)){
   box.className="notice bad";
   box.textContent="❌ 代码格式错误\n请输入 6 位 A股代码。";
   return {ok:false,code,name,market:"无效"};
 }
 const market=guessMarket(code);
 if(market==="疑似无效"){
   box.className="notice bad";
   box.textContent=`❌ 疑似无效代码\n${code} 不符合常见 A股代码段。`;
   return {ok:false,code,name,market};
 }
 box.className="notice ok";
 box.textContent=`✅ 代码格式有效\n代码：${code}\n市场：${market}\n说明：V1.5 Pro 不再维护大量内置股票库，未来由联网接口验证股票真实性。`;
 return {ok:true,code,name,market};
}
function positionZone(price, high, low){
 const p=(price-low)/(high-low);
 let zone="中位区", score=22, hint="";
 if(p<0.12){zone="历史底部区"; score=40; hint="赔率较好，但要防止弱势股长期低迷。"}
 else if(p<0.33){zone="低位区"; score=35; hint="符合你的低位优先思路。"}
 else if(p<0.66){zone="中位区"; score=22; hint="不上不下，适合更重视确认信号。"}
 else if(p<0.88){zone="高位区"; score=8; hint="风险收益比开始变差。"}
 else{zone="历史顶部区"; score=2; hint="位置很高，不能只看均线强。"}
 return {pct:p*100,zone,score,hint};
}
function maStructure(ma5,ma10,ma20,ma60){
 const bull=ma5>ma10&&ma10>ma20&&ma20>ma60;
 const bear=ma5<ma10&&ma10<ma20&&ma20<ma60;
 let score=0, type="混合排列", health="一般", text="";
 if(bull){score=30;type="多头排列";health="健康";text="MA5 > MA10 > MA20 > MA60，趋势结构强。"}
 else if(bear){score=0;type="空头排列";health="危险";text="MA5 < MA10 < MA20 < MA60，趋势结构弱。"}
 else{
   const count=[ma5>ma10,ma10>ma20,ma20>ma60].filter(Boolean).length;
   score=count*8; health=count===2?"一般":"偏弱"; text="均线没有完全共振，还不是最舒服的形态。";
 }
 return {score,type,health,text};
}
function ma20Distance(price,ma20){
 const d=(price-ma20)/ma20*100;
 let score=0, text="";
 if(Math.abs(d)<=3){score=15;text="价格贴近MA20，买点不算太飘。"}
 else if(d<0){score=10;text="价格低于MA20，可能是低吸机会，也可能是走弱信号。"}
 else if(d<=8){score=8;text="价格略高于MA20，仍可观察，但不适合激进追。"}
 else{score=2;text="价格明显远离MA20，短线追高风险增加。"}
 return {d,score,text};
}
function volumeView(vol,avg){
 if(vol===null||avg===null||avg<=0)return{score:6,type:"未填写",text:"成交量未填写，量能判断中性。"};
 const r=vol/avg;
 if(r>=1.8)return{score:7,type:"明显放量",text:`成交量为均量 ${r.toFixed(2)} 倍，说明资金活跃，但也要防冲高回落。`};
 if(r>=1.25)return{score:10,type:"温和放量",text:`成交量为均量 ${r.toFixed(2)} 倍，属于较健康的放量。`};
 if(r>=0.75)return{score:7,type:"正常量",text:`成交量为均量 ${r.toFixed(2)} 倍，量能正常。`};
 return{score:3,type:"缩量",text:`成交量为均量 ${r.toFixed(2)} 倍，资金参与度不足。`};
}
function buildProsCons(pos,ma,md,vol,price,high,low){
 const pros=[], cons=[];
 if(pos.zone==="历史底部区"||pos.zone==="低位区") pros.push("大位置偏低，符合低位优先的核心原则。");
 if(ma.type==="多头排列") pros.push("MA5 > MA10 > MA20 > MA60，趋势结构较强。");
 if(Math.abs(md.d)<=3) pros.push("价格接近MA20，短线位置不算过分追高。");
 if(vol.type==="温和放量") pros.push("量能温和放大，资金参与度较好。");
 if(pos.zone==="高位区"||pos.zone==="历史顶部区") cons.push("大位置偏高，趋势强不代表安全。");
 if(md.d>8) cons.push("价格明显远离MA20，短线追高风险较大。");
 if(ma.type==="空头排列"||ma.health==="偏弱") cons.push("均线结构不强，趋势确认度不足。");
 if(vol.type==="明显放量") cons.push("放量过猛，可能存在冲高回落或分歧加大的风险。");
 if(vol.type==="缩量") cons.push("缩量说明资金参与不足，持续性需要验证。");
 const nearHigh=(high-price)/price*100;
 if(nearHigh>0 && nearHigh<12) cons.push("距离历史高点不远，上方压力需要重视。");
 if(pros.length===0) pros.push("暂时没有特别强的买入理由。");
 if(cons.length===0) cons.push("主要风险不明显，但仍要防止市场整体波动。");
 return {pros,cons};
}
function tradePlan(score,pos,ma,md,price,high,low,ma20,ma60,pros,cons){
 const support=Math.max(low, Math.min(ma20, price*0.97));
 const resistance=Math.min(high, price + (high-price)*0.45);
 const stop=Math.min(ma20*0.97, ma60*0.98, price*0.92);
 const target1=price+(resistance-price)*0.7;
 const target2=Math.min(high, price+(high-price)*0.9);
 let grade="C", decision="观察", action="继续等待", position="0-10%", risk="中等", hint="条件一般";
 if(pos.score>=35 && ma.type==="多头排列" && md.d<=8 && cons.length<=2){
   grade="A"; decision="重点观察"; action="等回踩或分批"; position="10-25%"; risk="中等"; hint="低位趋势共振";
   if(pos.zone==="历史底部区" && Math.abs(md.d)<=3 && pros.length>=3){grade="S"; position="15-30%"; risk="中低"; hint="低位强共振";}
 }else if(pos.zone==="高位区"||pos.zone==="历史顶部区"){
   grade=ma.type==="多头排列"?"B":"D"; decision=ma.type==="多头排列"?"强势但谨慎":"放弃"; action="不追高"; position="0-5%"; risk="偏高"; hint="位置风险优先";
 }else if(ma.type==="空头排列"){
   grade="D"; decision="放弃"; action="等待趋势修复"; position="0%"; risk="高"; hint="趋势结构差";
 }else if(score>=62){
   grade="B"; decision="普通观察"; action="小仓观察或等确认"; position="0-10%"; risk="中等"; hint="有条件但不完美";
 }
 return {grade,decision,action,position,risk,hint,support,resistance,stop,target1,target2,fail:`跌破 ${stop.toFixed(2)} 或 MA5/MA10死叉`};
}
function renderList(id,arr){
 $(id).innerHTML=arr.map(x=>`<li>${x}</li>`).join("");
}
function analyze(){
 const v=verify();
 if(!v.ok){$("report").textContent="代码格式未通过，停止分析。";return}
 const price=n("price"),high=n("high"),low=n("low"),ma5=n("ma5"),ma10=n("ma10"),ma20=n("ma20"),ma60=n("ma60");
 if([price,high,low,ma5,ma10,ma20,ma60].some(x=>x===null)){
   $("report").textContent="请填写：当前价格、历史最高、历史最低、MA5、MA10、MA20、MA60。";
   return;
 }
 if(high<=low){$("report").textContent="历史最高价必须大于历史最低价。";return}
 if(price<low||price>high){$("report").textContent="当前价格应在历史最低价和历史最高价之间。";return}
 const pos=positionZone(price,high,low), ma=maStructure(ma5,ma10,ma20,ma60), md=ma20Distance(price,ma20), vol=volumeView(n("vol"),n("avgVol"));
 const pc=buildProsCons(pos,ma,md,vol,price,high,low);
 let score=Math.round(pos.score+ma.score+md.score+vol.score+5);
 if(pos.zone==="历史顶部区" && ma.type==="多头排列") score-=10;
 score=Math.max(0,Math.min(100,score));
 const plan=tradePlan(score,pos,ma,md,price,high,low,ma20,ma60,pc.pros,pc.cons);
 $("proGrade").textContent=plan.grade+"级"; $("proHint").textContent=plan.hint;
 $("posZone").textContent=pos.zone; $("posHint").textContent=`历史区间 ${pos.pct.toFixed(1)}%`;
 $("decision").textContent=plan.decision; $("decisionHint").textContent=plan.action;
 $("risk").textContent=plan.risk; $("riskHint").textContent=pc.cons[0]||"暂无明显风险";
 $("rankLine").textContent=`${ma.type}｜健康度：${ma.health}｜${ma.text}`;
 $("action").textContent=plan.action; $("position").textContent=plan.position;
 $("support").textContent=plan.support.toFixed(2); $("resistance").textContent=plan.resistance.toFixed(2);
 $("stopLoss").textContent=plan.stop.toFixed(2); $("target1").textContent=plan.target1.toFixed(2);
 $("target2").textContent=plan.target2.toFixed(2); $("failSignal").textContent=plan.fail;
 renderList("pros",pc.pros); renderList("cons",pc.cons);

 const buy=n("buy"),qty=n("qty");
 let holding="未填写买入价或股数，跳过持仓盈亏计算。";
 if(buy!==null&&qty!==null&&buy>0&&qty>0){
   const cost=buy*qty,value=price*qty,profit=value-cost,rate=profit/cost*100;
   holding=`成本：${cost.toFixed(2)} 元\n当前市值：${value.toFixed(2)} 元\n盈亏：${profit.toFixed(2)} 元\n收益率：${rate.toFixed(2)}%`;
 }
 let oldTrader="";
 if(plan.grade==="S") oldTrader="如果我是交易者，我不会急着满仓，而是把它当成重点标的，等回踩不破MA20或缩量企稳时分批。";
 else if(plan.grade==="A") oldTrader="如果我是交易者，我会重点观察，但不会追一根大阳线，最好等回踩确认。";
 else if(plan.grade==="B") oldTrader="如果我是交易者，我只会小仓试探或继续观察，因为优势还不够明显。";
 else if(plan.grade==="C") oldTrader="如果我是交易者，我会继续等，等位置、均线、量能至少再多一个条件改善。";
 else oldTrader="如果我是交易者，我会先放弃。市场里机会很多，不需要在结构不舒服的位置硬做。";

 $("report").textContent=
`股票：${v.name}（${v.code}）
市场：${v.market}
版本：Stock AI V1.5 Pro
说明：本版已删除大量内置股票库，只做代码格式判断。真实股票验证留给后续联网接口。

一、老手主判断
大位置：${pos.zone}
当前位置处于历史区间 ${pos.pct.toFixed(2)}%。
判断：${pos.hint}

趋势结构：${ma.type}
${ma.text}

MA20距离：
价格相对 MA20 偏离 ${md.d.toFixed(2)}%。
${md.text}

量能：
${vol.text}

二、支持买入理由
${pc.pros.map((x,i)=>`${i+1}. ${x}`).join("\n")}

三、反对买入理由
${pc.cons.map((x,i)=>`${i+1}. ${x}`).join("\n")}

四、交易计划
老手评级：${plan.grade}级
最终决策：${plan.decision}
建议动作：${plan.action}
参考仓位：${plan.position}
支撑位：${plan.support.toFixed(2)}
压力位：${plan.resistance.toFixed(2)}
止损参考：${plan.stop.toFixed(2)}
第一目标：${plan.target1.toFixed(2)}
第二目标：${plan.target2.toFixed(2)}
失败信号：${plan.fail}

五、持仓情况
${holding}

六、老手口吻结论
${oldTrader}

注意：这不是投资建议，而是按你的“大位置优先 + 均线结构 + 风险先行”体系做的辅助判断。`;
}
function sample(){
 $("code").value="600497";$("name").value="驰宏锌锗";$("price").value="18";$("high").value="35";$("low").value="8";
 $("ma5").value="18.6";$("ma10").value="17.8";$("ma20").value="16.9";$("ma60").value="15.2";
 $("vol").value="1800000";$("avgVol").value="1300000";verify();
}
function resetAll(){
 document.querySelectorAll("input").forEach(i=>i.value="");
 ["proGrade","posZone","decision","risk","action","position","support","resistance","stopLoss","target1","target2","failSignal"].forEach(id=>$(id).textContent="--");
 $("proHint").textContent="等待分析";$("posHint").textContent="等待分析";$("decisionHint").textContent="等待分析";$("riskHint").textContent="等待分析";
 $("verifyBox").className="notice";$("verifyBox").textContent="V1.5 Pro 已删除大量内置股票库，只做代码格式判断。未来联网后由接口验证真实股票。";
 $("rankLine").textContent="等待输入 MA5、MA10、MA20、MA60";
 $("pros").innerHTML="<li>等待分析</li>";$("cons").innerHTML="<li>等待分析</li>";$("report").textContent="等待分析...";
}
window.addEventListener("DOMContentLoaded",()=>{
 $("checkBtn").addEventListener("click",verify);
 $("analyzeBtn").addEventListener("click",analyze);
 $("sampleBtn").addEventListener("click",sample);
 $("resetBtn").addEventListener("click",resetAll);
});
