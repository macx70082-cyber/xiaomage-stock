function card(title,value,cls='') {return `<div class="card"><span>${title}</span><strong class="${cls}">${value}</strong></div>`}
function block(title,html){return `<div class="block"><h3>${title}</h3>${html}</div>`}
function decisionClass(decision){return decision.includes('多')?'ok':decision.includes('空')?'danger':'warn'}
function riskClass(grade){return grade==='D'||grade==='E'?'danger':grade==='C'?'warn':'ok'}
function run(){
  const d=collectInput();
  const v=validateInput(d);
  if(!v.ok){document.getElementById('report').innerHTML=`<p class="danger">${v.msg}</p>`;return;}
  const pos=analyzePosition(d), trend=analyzeTrend(d), score=bullBearScore(d,pos), sr=supportResistance(d), risk=riskBreakdown(d,pos,score,sr), plan=tradePlan(d,pos,score,risk,sr), mc=matchCase(d,pos), ms=mistakes(d,pos);
  document.getElementById('summaryCards').innerHTML =
    card('综合结论',score.decision,decisionClass(score.decision))+
    card('总评分',`${score.totalScore}/${score.maxScore}`)+
    card('买入环境',score.environment,score.environment.includes('A')||score.environment.includes('B')?'ok':score.environment.includes('E')?'danger':'warn')+
    card('风险等级',`${risk.grade}级`,riskClass(risk.grade))+
    card('总风险',`${risk.totalRisk}/${risk.maxRisk}`,riskClass(risk.grade))+
    card('案例匹配',`${mc.sim}%`);
  document.getElementById('report').classList.remove('empty');
  document.getElementById('report').innerHTML =
    block('【基础验证】',`<p>${d.name}（${d.code}）：${codeQuality(d.code)}</p>`)+
    block('【位置分析】',`<p><b>大位置：</b>${pos.big}。${pos.bigExplain}</p><p><b>小位置：</b>${pos.small}；当前状态：${pos.maState}。</p><p><b>最终位置判断：</b>${pos.finalPosition}；位置评分：${pos.positionScore}/10；位置风险：${pos.positionRisk}/5。</p><p>距离MA20：${pos.ma20Gap.toFixed(2)}%，距离MA60：${pos.ma60Gap.toFixed(2)}%。</p><p>${pos.traderComment}</p>`)+
    block('【趋势与量能】',`<p>趋势：${trend.trendText}；趋势评分：${score.trendScore}/10。</p><p>量能：${trend.volumeText}；量能评分：${score.volumeScore}/10。</p>`)+
    block('【评分系统】',`<p>位置评分：<b>${score.positionScore}/10</b>；趋势评分：<b>${score.trendScore}/10</b>；量能评分：<b>${score.volumeScore}/10</b>；结构评分：<b>${score.structureScore}/10</b>。</p><p><b>总评分：${score.totalScore}/${score.maxScore}</b>；买入环境：${score.environment}。</p>`)+
    block('【支撑压力】',`<p>第一支撑：<b>${sr.support}</b>；强支撑：<b>${sr.strongSupport}</b>。</p><p>第一压力：<b>${sr.pressure}</b>；强压力：<b>${sr.strongPressure}</b>。</p><p>距离第一压力：<b>${risk.pressureGap}%</b>。</p>`)+
    block('【多头观点】',score.bulls.map(x=>`<span class="tag">${x}</span>`).join(''))+
    block('【空头观点】',score.bears.map(x=>`<span class="tag">${x}</span>`).join(''))+
    block('【风险评分】',`<p>位置风险：<b>${risk.positionRisk}/5</b>；趋势风险：<b>${risk.trendRisk}/5</b>；量能风险：<b>${risk.volumeRisk}/5</b>；压力风险：<b>${risk.pressureRisk}/5</b>。</p><p><b>总风险：${risk.totalRisk}/${risk.maxRisk}</b>；综合风险：<b>${risk.grade}级</b>。</p>`)+
    block('【风险拆解】',`<p>位置风险：${risk.location}；趋势风险：${risk.trend}；量能风险：${risk.volume}；压力风险：${risk.pressure}。</p><p>${risk.explain}</p>`)+
    block('【交易计划】',`<p>${plan.core}</p><p>${plan.lowBuy}</p><p>${plan.breakBuy}</p><p class="danger">${plan.stop}</p><p>${plan.giveUp}</p>`)+
    block('【案例匹配】',`<p>当前最像：<b>${mc.name}</b>，相似度 ${mc.sim}%。</p><p>${mc.why}</p>`)+
    block('【错误提醒】',ms.map(x=>`<p class="warn">⚠ ${x}</p>`).join(''))+
    block('【最终结论】',`<p><b>${score.decision}</b>。总评分 ${score.totalScore}/${score.maxScore}，买入环境为 ${score.environment}；同时总风险为 ${risk.totalRisk}/${risk.maxRisk}，风险等级为 ${risk.grade}级。评分高不代表风险低，真正操作前要结合真实行情、仓位和止损纪律。</p>`);
}
document.addEventListener('DOMContentLoaded',()=>{renderCases();document.getElementById('analyzeBtn').addEventListener('click',run);});
