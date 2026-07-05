function card(title,value,cls='') {return `<div class="card"><span>${title}</span><strong class="${cls}">${value}</strong></div>`}
function block(title,html){return `<div class="block"><h3>${title}</h3>${html}</div>`}
function run(){
  const d=collectInput();
  const v=validateInput(d);
  if(!v.ok){document.getElementById('report').innerHTML=`<p class="danger">${v.msg}</p>`;return;}
  const pos=analyzePosition(d), trend=analyzeTrend(d), score=bullBearScore(d,pos), sr=supportResistance(d), risk=riskBreakdown(d,pos,score,sr), plan=tradePlan(d,pos,score,risk,sr), mc=matchCase(d,pos), ms=mistakes(d,pos);
  document.getElementById('summaryCards').innerHTML = card('综合结论',score.decision,score.decision==='偏多'?'ok':score.decision==='偏空'?'danger':'warn')+card('风险等级',risk.grade,risk.grade==='D'||risk.grade==='E'?'danger':'')+card('总评分',`${score.totalScore}/${score.maxScore}`)+card('买入环境',score.environment)+card('案例匹配',`${mc.sim}%`);
  document.getElementById('report').classList.remove('empty');
  document.getElementById('report').innerHTML =
    block('【基础验证】',`<p>${d.name}（${d.code}）：${codeQuality(d.code)}</p>`)+
    block('【位置分析】',`<p><b>大位置：</b>${pos.big}。${pos.bigExplain}</p><p><b>小位置：</b>${pos.small}；当前状态：${pos.maState}。</p><p><b>最终位置判断：</b>${pos.finalPosition}；位置评分：${pos.positionScore}/10；位置风险：${pos.positionRisk}/5。</p><p>距离MA20：${pos.ma20Gap.toFixed(2)}%，距离MA60：${pos.ma60Gap.toFixed(2)}%。</p><p>${pos.traderComment}</p>`)+
    block('【趋势与量能】',`<p>趋势：${trend.trendText}；趋势评分：${score.trendScore}/10。</p><p>量能：${trend.volumeText}；量能评分：${score.volumeScore}/10。</p>`)+
    block('【评分系统】',`<p>位置评分：<b>${score.positionScore}/10</b>；趋势评分：<b>${score.trendScore}/10</b>；量能评分：<b>${score.volumeScore}/10</b>；结构评分：<b>${score.structureScore}/10</b>。</p><p><b>总评分：${score.totalScore}/${score.maxScore}</b>；买入环境：${score.environment}。</p>`)+
    block('【支撑压力】',`<p>第一支撑：<b>${sr.support}</b>；强支撑：<b>${sr.strongSupport}</b>。</p><p>第一压力：<b>${sr.pressure}</b>；强压力：<b>${sr.strongPressure}</b>。</p>`)+
    block('【多头观点】',score.bulls.map(x=>`<span class="tag">${x}</span>`).join(''))+
    block('【空头观点】',score.bears.map(x=>`<span class="tag">${x}</span>`).join(''))+
    block('【风险拆解】',`<p>位置风险：${risk.location}；趋势风险：${risk.trend}；量能风险：${risk.volume}；压力风险：${risk.pressure}。</p><p><b>综合风险：${risk.grade}级。</b>${risk.explain}</p>`)+
    block('【交易计划】',`<p>${plan.core}</p><p>${plan.lowBuy}</p><p>${plan.breakBuy}</p><p class="danger">${plan.stop}</p><p>${plan.giveUp}</p>`)+
    block('【案例匹配】',`<p>当前最像：<b>${mc.name}</b>，相似度 ${mc.sim}%。</p><p>${mc.why}</p>`)+
    block('【错误提醒】',ms.map(x=>`<p class="warn">⚠ ${x}</p>`).join(''))+
    block('【最终结论】',`<p><b>${score.decision}</b>。总评分 ${score.totalScore}/${score.maxScore}，买入环境为 ${score.environment}。这不是买卖指令，而是基于你输入数据生成的交易计划框架。真正操作前，要结合真实行情、仓位和止损纪律。</p>`);
}
document.addEventListener('DOMContentLoaded',()=>{renderCases();document.getElementById('analyzeBtn').addEventListener('click',run);});
