# AI666 社区 B端管理后台公网静态预览包

生成时间：2026-07-07T03:18:04.861Z

## 用途

本目录是社区 B端 Ant Design 管理后台原型的独立静态预览包。它和 C端公网预览分开部署，避免后台入口、版本边界和 C端消费页面混在一起。

## 上传目录

```text
outputs/community-b-end-public-preview/
```

## 本地命令

```powershell
npm.cmd run build:community-b-end:public-preview
npm.cmd run validate:community-b-end:public-preview
```

## 公网项目站路径

```text
/ai666-community-b-end-preview/
```

## 页面

- 社区 B端管理后台: index.html

## 边界

- 这是静态产品原型，不是真实生产后台。
- 不连接真实登录、支付、退款、卡密、积分发放、审核自动化、API Key、用户隐私数据或生产账号。
- 敏感字段只以 [USER_ID]、[CONTENT_ID]、[TOKEN]、[CARD_CODE] 等占位展示。
- 已写入 robots.txt 和 noindex，默认不建议搜索引擎收录。
- GitHub Pages 使用时，根目录包含 .nojekyll，用于避免下划线目录被 Jekyll 忽略。
