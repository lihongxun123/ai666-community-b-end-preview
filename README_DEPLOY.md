# AI666 社区 B端管理后台公网静态预览包

生成时间：2026-07-22T07:28:52.404Z

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

- 内容列表: index.html
- 内容详情: content-detail.html
- 审核工作台: review-workbench.html
- 审核任务: review-detail.html
- 闪念管理: flash-management.html
- 闪念详情: flash-detail.html
- 模型管理: model-management.html
- 模板配置: aigc-template-config.html
- 教程管理: tutorial-management.html
- 展示位管理: home-slots.html
- 登录弹窗配置: login-popup-config.html
- 活动管理: activity-config.html
- 活动详情: activity-detail.html
- 公告配置: operation-config.html
- 商城管理: store-config.html
- 用户列表: user-list.html
- 用户详情: user-detail.html
- 邀请记录: invite-records.html
- 积分记录: points-records.html
- 账号治理: trust-lists.html
- 日志: operation-log.html
- 角色管理: role-management.html
- 后台用户管理: admin-users.html

## 边界

- 这是静态产品原型，不是真实生产后台。
- 不连接真实登录、支付、退款、卡密、积分发放、审核自动化、API Key、用户隐私数据或生产账号。
- 敏感字段只以 [USER_ID]、[CONTENT_ID]、[TOKEN]、[CARD_CODE] 等占位展示。
- 已写入 robots.txt 和 noindex，默认不建议搜索引擎收录。
- GitHub Pages 使用时，根目录包含 .nojekyll，用于避免下划线目录被 Jekyll 忽略。
