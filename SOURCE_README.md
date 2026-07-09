# AI666 社区 B端 Ant Design 原型 V0.1

## 结论

本目录是 AI666 / 多元拾光社区 B端 V0.1 的 Ant Design 风格多页静态 HTML 原型。当前原型用于验证信息架构、导航分配、16 个左侧导航入口、3 个详情路由页、21 个正式 C端页面承接、广告位配置集中管理、审核工作台处理闭环、活动任务积分配置闭环、用户积分权限日志闭环、商城配置闭环、批量动作、抽屉详情、异常态、危险操作确认、操作日志字段和敏感信息脱敏。

## 来源

```text
docs/versions/v1.0/planning/AI666_社区B端承接矩阵_V0.1.md
docs/versions/v1.0/planning/AI666_社区B端页面清单与验收表_V0.1.md
docs/versions/v1.0/planning/AI666_社区B端AntDesign原型信息架构_V0.1.md
```

## 打开方式

直接在浏览器打开入口页，或通过本地静态服务访问：

```text
outputs/community-b-end-antdesign-prototype/index.html
```

`index.html` 是内容列表页，左侧导航会跳转到同目录下的独立 HTML 页面，例如：

```text
outputs/community-b-end-antdesign-prototype/login-popup-config.html
outputs/community-b-end-antdesign-prototype/home-slots.html
```

多页文件由以下脚本从 `spa-source.html` 生成：

```powershell
node outputs/community-b-end-antdesign-prototype/build-multipage.mjs
```

## 验证方式

```powershell
node outputs/community-b-end-antdesign-prototype/validate-community-b-end-prototype.mjs
node outputs/community-b-end-antdesign-prototype/validate-community-b-end-interactions.mjs
```

验证报告：

```text
outputs/community-b-end-antdesign-prototype/community-b-end-antdesign-prototype-validation.json
outputs/community-b-end-antdesign-prototype/community-b-end-antdesign-prototype-interaction-validation.json
```

## 当前范围

- 5 个一级导航。
- 16 个左侧导航入口和 3 个详情路由页均为独立 HTML 文件，导航为真实页面跳转，并带页面契约。
- 覆盖 `scripts/community-public-preview-config.mjs` 中 21 个正式 C端页面，并归类 2 个独立预览入口。
- 广告位配置是全量广告位台账：默认展示所有已识别广告位，页签只做点位聚焦，不隐藏其他行；首页 Banner 按“广告组 + 组内子广告”组织，爆款首卡按单广告位组织，首页信息流广告先保留台账行和走查提醒，后续再补配置结构。
- 审核工作台包含内容、评论、投稿、资料四类队列，以及对象类型、风险来源、处理时限、用户可读原因、内部备注、复核状态和日志要求。
- 活动配置、任务配置和积分规则形成配置闭环，覆盖活动规则、任务绑定、奖励摘要、状态变更原因、人工异常处理和日志约束。
- 积分记录、操作日志、角色管理和后台用户管理形成治理闭环，覆盖积分人工调整、权限变更、日志不可改、二次复核和敏感字段拦截。
- 消息配置当前不进入左侧导航或生成页，源视图保留为后续迭代参考，不自动群发。
- 商城配置覆盖商品展示、权益说明、积分消耗摘要、兑换状态和兑换异常，不进入支付、结算或卡密库存。
- 数据看板当前后置，不进入左侧导航或生成页；源视图保留指标口径、来源归因、排除规则、运营判断、负责人和下一步动作，不做复杂 BI。
- 内容列表、审核工作台、积分记录、操作日志和角色管理补充批量动作承接；批量动作必须限定范围、填写原因并写入日志。
- 全局详情抽屉补充对象摘要、状态历史、关联记录、风险原因和操作历史，敏感字段仍只用占位展示。
- 异常态覆盖待复核、素材阻断、目标失效、积分风险、权限风险和消息发送失败。
- 内容运营、运营配置、用户管理、操作日志和系统设置均有表格、指标或权限样例。
- 危险操作均要求确认和原因；示例敏感字段只以占位或脱敏形式展示。

## 不进入本轮

```text
接口协议、数据库设计、技术架构、真实上线工程方案
真实自动审核、自动发奖、自动防刷、支付、退款、财务结算
真实 Cookie、Session、Token、卡密或用户隐私明文
```
