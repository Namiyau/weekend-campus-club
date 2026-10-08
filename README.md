# 周末搭子

大学生周末兼职撮合主题展示站。岗位为虚构示例，支持类别筛选、搜索和详情查看，无报名或真实撮合服务。

公开源码备份：https://github.com/Namiyau/weekend-campus-club

GitHub Pages 公开网站：https://namiyau.github.io/weekend-campus-club/

提交 `site/` 下的网页更新到 `main` 后，GitHub Actions 自动部署 GitHub Pages。

## 部署

Cloudflare Pages 项目：`weekend-campus-club`

```powershell
npx wrangler pages deploy site --project-name weekend-campus-club --branch main
```

公开网址：https://weekend-campus-club.pages.dev/

## 本地查看

直接用浏览器打开 `site/index.html`。网页不需要构建。

## 验证

需要 Node.js，首次运行安装测试依赖和浏览器：

```powershell
npm install
npx playwright install chromium
npm test
```

检查公开站点：`npm test -- https://weekend-campus-club.pages.dev`

测试覆盖岗位列表、筛选、搜索、无结果状态、详情弹窗、键盘关闭、手机布局和 JavaScript 错误。
