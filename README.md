# Stock AI V1.5 Pro

这是 Stock AI 的 V1.5 Pro 版本，适合直接部署到 GitHub Pages。

## 核心更新

- 删除大量内置股票数据库依赖，改为股票代码格式验证。
- 新增职业交易员决策树：位置、趋势、成交量、支撑压力、风险、交易计划。
- 新增大位置 / 小位置判断，避免只看 MA20 误判。
- 新增看多理由和看空理由。
- 新增 A-E 风险等级。
- 新增低吸、突破、止损、止盈计划。
- 新增交易案例学习库。
- 新增常见错误提醒。
- 代码模块化，方便未来升级联网行情。

## 文件结构

```text
index.html
css/style.css
js/main.js
js/validation.js
js/analysis.js
js/risk.js
js/strategy.js
js/education.js
```

## 使用方式

把这些文件上传到 GitHub 仓库根目录，开启 GitHub Pages 即可。

注意：本项目仅用于学习和辅助分析，不构成投资建议。
