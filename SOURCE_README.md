# AI666 社区 B端 Ant Design 原型 V0.1

## 结论

本目录是 AI666 / 多元拾光社区 B端 V0.1 的 Ant Design 风格多页静态 HTML 原型。当前原型用于验证信息架构、导航分配、17 个左侧导航入口、4 个详情路由页、21 个正式 C端页面承接，以及内容与模型、活动与奖励、展示投放、用户与邀请、积分商城、权限与日志六个业务域的处理闭环。

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
npm.cmd run validate:community:cb-coverage
```

验证报告：

```text
outputs/community-b-end-antdesign-prototype/community-b-end-antdesign-prototype-validation.json
outputs/community-b-end-antdesign-prototype/community-b-end-antdesign-prototype-interaction-validation.json
outputs/community-b-end-antdesign-prototype/community-cb-coverage-validation.json
```

## 当前范围

- 4 个一级业务组：内容管理、运营管理、用户管理、系统管理。
- 17 个左侧导航入口和 4 个详情路由页均为独立 HTML 文件，导航为真实页面跳转，并带页面契约。
- 覆盖 `scripts/community-public-preview-config.mjs` 中 21 个正式 C端页面，并归类 2 个独立预览入口。
- 逐页覆盖验证要求每个 C端正式页面都具备业务对象、事实状态来源、B端承接页面、C端结果承接和待审批项；`prompt-detail.html` 已纳入内容详情、审核工作台和活动详情的共同承接。
- 展示位由产品预置，后台不新增或删除位置；展示位管理只创建投放单并维护来源、素材、排期、跳转、容量、状态和失效联动。
- 审核工作台包含内容、评论、投稿、资料四类队列，以及对象类型、风险来源、处理时限、用户可读原因、内部备注、复核状态和日志要求。
- 审核任务显式覆盖待分配、审核中、退回修改、复核中、通过、拒绝和审核完成七种状态；详情 Drawer 分开对象状态、用户结果和内部备注。
- 活动管理与活动详情形成业务闭环，分别承接活动扫描和参与条件、任务、投稿、奖励处理、积分关联与规则版本。
- 模型管理承接模型服务事实、供应状态、官方 ID 与 C端引用键、模型广场目录/推荐、AIGC 创作、模板默认模型资格、关联案例和暂停/下线影响；模板资格必须依附于 AIGC 创作范围。
- 积分记录、操作日志、角色管理和管理员管理形成治理闭环，覆盖追加式积分流水、权限四维、日志不可改、最后一个超级管理员保护和敏感访问留痕。
- 角色详情按六个业务域展示页面、动作、数据范围和敏感权限矩阵，并在权限变化时展示增减摘要和复核要求。
- 消息配置当前不进入左侧导航或生成页，源视图保留为后续迭代参考，不自动群发。
- 商城管理覆盖积分商品、兑换单、积分扣减、权益发放和兑换异常，不进入支付、结算或卡密库存。
- 数据看板当前后置，不进入左侧导航或生成页；源视图保留指标口径、来源归因、排除规则、运营判断、负责人和下一步动作，不做复杂 BI。
- 内容列表、审核工作台、积分记录、操作日志和角色管理补充批量动作承接；批量动作必须限定范围、填写原因并写入日志。
- 内容、模型、用户和操作日志列表的筛选可真实驱动结果集，支持结果计数、空结果和重置，不再保留仅作装饰的筛选控件。
- 模型、账号治理、操作日志和角色详情读取当前点击行；只读详情不出现“保存草稿”等误导性提交动作，角色详情按当前角色展示六域权限矩阵。
- 用户列表进入详情时保留用户唯一编号，详情页读取对应用户资料、账号类型和积分状态，避免重复编号与静态详情错配。
- 展示位投放单必须填写来源类型、来源对象、开始时间和结束时间；列表同步展示来源与排期，来源失效和排期状态继续参与投放判断。
- 账号治理分类标签可真实切换结果集；解除限制动作必须展示对象、当前状态、操作后结果并校验原因。
- 通用详情抽屉继续承接对象摘要、状态历史、关联记录、风险原因和操作历史，敏感字段仍只用占位展示。
- 异常态覆盖待复核、素材阻断、目标失效、积分风险、权限风险和消息发送失败。
- 内容运营、运营配置、用户管理、操作日志和系统设置均有表格、指标或权限样例。
- 危险操作均要求确认和原因；示例敏感字段只以占位或脱敏形式展示。
- 审核工作台筛选已可真实驱动列表，详情与处理动作读取当前点击任务；已处理任务只读，避免重复处置。
- 审核拒绝、活动奖励补发/撤回、商城权益补发/积分退回等危险动作均先展示对象、当前状态和操作后结果，原因默认留空并在确认前校验。
- 活动奖励与商城异常处理采用追加式结果记录，不覆盖原始奖励、兑换或权益状态；高频表格的操作列保持可达，紧凑奖励表在 1280px 视口不再遮挡业务编号。

## 不进入本轮

```text
接口协议、数据库设计、技术架构、真实上线工程方案
真实自动审核、自动发奖、自动防刷、支付、退款、财务结算
真实 Cookie、Session、Token、卡密或用户隐私明文
```
