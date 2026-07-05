import { validateStockInput } from './validation.js';
import { analyzePosition, analyzeTrend, analyzeVolume, findSupportResistance, bullBearArguments } from './analysis.js';
import { calculateRisk } from './risk.js';
import { createTradePlan } from './strategy.js';
import { matchCase, commonMistakes, renderCaseLibrary } from './education.js';

const $ = id => document.getElementById(id);

renderCaseLibrary($('caseLibrary'));
$('analyzeBtn').addEventListener('click', runAnalysis);

function getData() {
  return {
    stockName: $('stockName').value.trim(),
    stockCode: $('stockCode').value.trim().toUpperCase(),
    price: Number($('price').value),
    ma20: Number($('ma20').value),
    ma60: Number($('ma60').value),
    high: Number($('high').value),
    low: Number($('low').value),
    trend: $('trend').value,
    volume: $('volume').value,
    positionState: $('positionState').value,
    style: $('style').value
  };
}

function runAnalysis() {
  const data = getData();
  const errors = validateStockInput(data);
  if (errors.length) {
    $('riskBadge').className = 'badge high';
    $('riskBadge').textContent = '输入需检查';
    $('output').className = 'output';
    $('output').innerHTML = block('输入检查', `<ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`);
    return;
  }

  const position = analyzePosition(data);
  const trend = analyzeTrend(data);
  const volume = analyzeVolume(data);
  const sr = findSupportResistance(data);
  const argumentsResult = bullBearArguments(data, position);
  const risk = calculateRisk(data, position);
  const plan = createTradePlan(data, sr, risk);
  const matchedCase = matchCase(data, position);
  const mistakes = commonMistakes(data, position);
  const conclusion = makeConclusion(data, risk, argumentsResult, matchedCase);

  $('riskBadge').className = `badge ${risk.className}`;
  $('riskBadge').textContent = `${risk.grade}级 · ${risk.text}`;
  $('output').className = 'output';
  $('output').innerHTML = `
    ${block('股票识别', `<p>${data.stockName}（${data.stockCode}）代码格式已通过本地规则检查。V1.5 不再依赖大量内置股票库，未来联网后可进一步验证真实行情。</p>`)}
    ${block('① 位置分析', `<p>${position.summary}</p><p>注意：大位置优先级高于小位置。即使股价在 MA20 附近，只要处于历史高位，也不能简单理解成低位。</p>`)}
    ${block('② 趋势分析', `<p>${trend}</p>`)}
    ${block('③ 成交量分析', `<p>${volume}</p>`)}
    ${block('④ 支撑压力', `<p>最近支撑：${formatLevel(sr.support)}</p><p>最近压力：${formatLevel(sr.resistance)}</p>`)}
    ${block('⑤ 看多理由', list(argumentsResult.bull))}
    ${block('⑥ 看空理由', list(argumentsResult.bear))}
    ${block('⑦ 风险等级', `<p>${risk.grade}级 · ${risk.text}</p><p>主要原因：${risk.reasons.length ? risk.reasons.join('、') : '暂无明显极端风险信号'}。</p>`)}
    ${block('⑧ 交易计划', list(plan))}
    ${block('⑨ 教学匹配', `<p>当前最接近案例：<strong>${matchedCase}</strong></p>`)}
    ${block('⑩ 常见错误提醒', list(mistakes))}
    ${block('最终结论', `<p>${conclusion}</p><p class="note">本工具只做学习和辅助分析，不构成投资建议。</p>`)}
  `;
}

function makeConclusion(data, risk, args, matchedCase) {
  if (risk.score >= 4) return `这只股票当前不适合无计划追入。更合理的做法是先观察关键支撑和压力，等确认信号出现后再行动。案例类型偏向“${matchedCase}”。`;
  if (args.bull.length > args.bear.length && risk.score <= 3) return `整体偏积极，但不能直接等于可以买。更适合按低吸、突破、止损三套计划执行。案例类型偏向“${matchedCase}”。`;
  return `当前多空理由接近，属于需要继续观察的结构。不要因为单一指标就做决定，重点等待趋势、量能和关键价位共同确认。`;
}

function block(title, html) {
  return `<div class="analysis-block"><h3>${title}</h3>${html}</div>`;
}

function list(items) {
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function formatLevel(item) {
  if (!item.value) return item.name;
  return `${item.name}：${Number(item.value).toFixed(2)}`;
}
