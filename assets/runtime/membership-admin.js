"use strict";

(() => {
  const root = document.querySelector("[data-membership-admin]");
  if (!root) return;
  const store = window.Membership;
  const byId = (id) => root.querySelector(`#member-admin-${id}`);
  const content = byId("content");
  const editor = byId("editor");
  const drawer = byId("details");
  const actionLabels = { open: "开通", renew: "同档续费", upgrade: "升档" };
  const statusLabels = {
    pending: "待付款", confirming: "支付确认中", paid: "已完成",
    invalid: "已失效", cancelled: "已取消", expired: "已超时"
  };
  const giftLabels = { none: "—", pending: "待补发", sent: "已发放" };
  const statusColors = { pending: "warn", confirming: "info", paid: "ok", invalid: "", cancelled: "", expired: "" };
  const appearanceOptions = [["month", "青蓝"], ["quarter", "曜紫"], ["year", "暖金"], ["jade", "碧绿"]];
  const renderers = {
    plans: renderPlans, promotions: renderPromotions, orders: renderOrders,
    inventory: renderInventory, logs: renderLogs
  };
  const dateDisplay = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });
  const currency = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
  const tabParam = new URLSearchParams(location.search).get("tab");
  let page = Object.hasOwn(renderers, tabParam) ? tabParam : "plans";
  let selectedOrder = null;
  let filter = { keyword: "", status: "" };
  let submitEdit;
  let noticeTimer;

  function read() {
    return store.readAdmin ? store.readAdmin() : store.read();
  }

  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (letter) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[letter]);
  }

  function date(value) {
    return value && Number.isFinite(Date.parse(value)) ? dateDisplay.format(new Date(value)) : "—";
  }

  function dateInput(value) {
    if (!value || !Number.isFinite(Date.parse(value))) return "";
    const parts = Object.fromEntries(dateDisplay.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function isoAtBeijingTime(value) {
    const parsed = new Date(`${value}:00+08:00`);
    if (!Number.isFinite(parsed.getTime())) throw new Error("请填写有效的起止时间。");
    return parsed.toISOString();
  }

  function money(value) {
    return value == null ? "—" : `¥${currency.format(value)}`;
  }

  function maskedCode(value) {
    return value ? `•••• ${escape(String(value).slice(-4))}` : "—";
  }

  function periodLabel(record) {
    if (record.durationLabel) return record.durationLabel;
    const count = record.periodCount ?? record.months;
    if (record.periodUnit === "day") return `${count} 天`;
    if (count === 12) return "1 年";
    return count ? `${count} 个月` : "—";
  }

  function hasDeliveryIssue(order) {
    return order.status === "paid" && (order.memberStatus === "failed" || order.pointsStatus === "failed");
  }

  function orderTag(order) {
    return hasDeliveryIssue(order)
      ? tags(["已收款 · 到账异常"], "warn")
      : tags([statusLabels[order.status] || "—"], statusColors[order.status]);
  }

  function pointsLabel(order) {
    if (order.pointsStatus === "failed") return "到账异常";
    return order.status === "paid" ? "已入账 · 永久有效" : "待入账";
  }

  function tags(values, tone = "") {
    const appearance = { ok: "success", warn: "warning", error: "danger", info: "info" };
    return values.map((value) => `<span class="tag ${appearance[tone] || "gray"}">${escape(value)}</span>`).join("");
  }

  function button(label, action, id = "", style = "link") {
    return `<button type="button" class="btn ${style}" data-antd-component="Button" data-member-admin-action="${action}" data-id="${escape(id)}">${label}</button>`;
  }

  function table(headers, rows, empty = "暂无记录") {
    return `<div class="table-wrap ant-table-wrapper member-table" tabindex="0" role="region" aria-label="数据列表">
      <table data-component-library="ant-design-vue" data-antd-component="Table">
        <thead><tr>${headers.map((header) => `<th scope="col">${header}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.join("") : `<tr class="table-empty-row"><td colspan="${headers.length}">${empty}</td></tr>`}</tbody>
      </table></div>`;
  }

  function box(title, description, body, actions = "") {
    return `<section class="panel">
      <header class="panel-head"><div><h3 class="panel-title">${title}</h3>${description ? `<p class="muted">${description}</p>` : ""}</div>${actions}</header>
      ${body}</section>`;
  }

  function planRows(state) {
    return state.plans.map((plan, index) => `<tr>
      <td>${index + 1}</td>
      <td><strong>${escape(plan.name)}</strong><span class="table-muted">${escape(periodLabel(plan))}</span></td>
      <td><strong>${money(plan.price)}</strong></td><td>${escape(plan.points)} 分
        <span class="table-muted">${plan.pointsMode === "rate" ? `每元 ${escape(plan.pointRate)} 分` : "固定赠分"}</span></td>
      <td>${currency.format(plan.discount * 10)} 折</td><td>${escape(plan.activityRate)} 倍</td><td>${escape(plan.signRate)} 倍</td>
      <td><span class="appearance-preview" data-appearance="${escape(plan.appearance || plan.id)}">${escape(plan.style || "—")}</span></td>
      <td>${escape(plan.gift || "—")}</td>
      <td>${button("编辑档位", "edit-plan", plan.id)}</td>
    </tr>`);
  }

  function renderPlans(state) {
    return box("在售档位", "", table(
      ["升档顺序", "档位和时长", "常规售价", "开通积分", "商城折扣", "活动奖励", "每日签到", "装扮", "赠礼", "操作"],
      planRows(state)
    ), button("新增会员档位", "new-plan", "", "primary"));
  }

  function campaignTag(campaign) {
    const now = Date.now();
    if (!campaign.enabled) return tags(["已暂停"]);
    if (Date.parse(campaign.start) > now) return tags(["未开始"], "info");
    if (Date.parse(campaign.end) <= now) return tags(["已结束"]);
    return tags(["进行中"], "ok");
  }

  function renderPromotions(state) {
    const firstRows = state.plans.map((plan) => `<tr>
      <td><strong>${escape(plan.name)}</strong></td><td>${money(plan.price)}</td><td>${money(plan.firstPrice)}</td>
      <td>${tags([plan.firstPrice == null ? "未配置" : "已启用"], plan.firstPrice == null ? "" : "ok")}</td>
      <td>${button("设置首充价", "edit-first", plan.id)}</td></tr>`);
    const names = Object.fromEntries(state.plans.map((plan) => [plan.id, plan.name]));
    const campaignRows = state.campaigns.map((campaign) => `<tr>
      <td><strong>${escape(campaign.name)}</strong></td>
      <td>${tags(campaign.planIds.map((id) => names[id] || id), "info")}</td>
      <td>${tags(campaign.actions.map((action) => actionLabels[action] || action))}</td>
      <td><strong>${money(campaign.price)}</strong></td>
      <td>${date(campaign.start)}<span class="table-muted">至 ${date(campaign.end)}</span></td>
      <td>${campaignTag(campaign)}</td><td>${button("编辑活动", "edit-campaign", campaign.id)}</td></tr>`);
    return box("首充优惠", "每个社区账号一次，以首笔会员订单支付成功为准。", table(
      ["适用档位", "常规售价", "首充价", "状态", "操作"], firstRows
    )) + box("限时活动", "", table(
      ["活动名称", "参加档位", "购买方式", "活动价", "起止时间（北京时间）", "状态", "操作"],
      campaignRows, "暂无限时活动"
    ), button("新建限时活动", "edit-campaign", "", "primary"));
  }

  function renderOrders(state) {
    const rows = state.orders.filter((order) =>
      order.id.toLowerCase().includes(filter.keyword.toLowerCase()) &&
      (!filter.status || (hasDeliveryIssue(order) ? "delivery-issue" : order.status) === filter.status ||
        (filter.status === "gift-pending" && order.giftStatus === "pending"))
    ).map((order) => `<tr>
      <td><strong>${escape(order.id)}</strong><span class="table-muted">${date(order.createdAt)}</span></td>
      <td>${escape(order.planName)}<span class="table-muted">${actionLabels[order.action] || "—"}</span></td>
      <td><strong>${order.status === "paid" ? money(order.amount) : "—"}</strong>
        ${order.status === "paid" ? "" : `<span class="table-muted">应付 ${money(order.amount)}</span>`}</td>
      <td>${escape(order.points)} 分<span class="table-muted">${pointsLabel(order)}</span></td>
      <td>${date(order.expiry)}</td>
      <td>${orderTag(order)}</td>
      <td>${tags([giftLabels[order.giftStatus] || "—"], order.giftStatus === "pending" ? "warn" : order.giftStatus === "sent" ? "ok" : "")}</td>
      <td>${button("查看订单", "view-order", order.id)}</td></tr>`);
    const statusOptions = { "": "全部状态", ...statusLabels, "delivery-issue": "到账异常", "gift-pending": "兑换码待补发" };
    const filters = `<form id="member-admin-order-filters" class="member-filters" data-antd-component="Form">
      <label>订单号<input class="input" name="keyword" data-antd-component="Input" placeholder="输入全部或部分编号" value="${escape(filter.keyword)}"></label>
      <label>订单状态<select class="select" name="status" data-antd-component="Select">${Object.entries(statusOptions).map(([value, label]) =>
        `<option value="${value}"${filter.status === value ? " selected" : ""}>${label}</option>`).join("")}</select></label>
      <button type="submit" class="btn primary" data-antd-component="Button">查询</button>
      ${button("重置", "reset-filter")}
    </form>`;
    return box("订单记录", "", filters + table([
      "会员订单", "档位和购买方式", "实付", "开通积分", "订单对应到期时间", "订单状态", "年卡兑换码", "操作"
    ], rows, "没有符合条件的订单"));
  }

  function renderInventory(state) {
    const stock = state.codes.filter((code) => code.status === "available").length;
    const pending = state.orders.filter((order) => order.giftStatus === "pending").length;
    const rows = [...state.codes].reverse().map((code) => `<tr>
      <td><code>${maskedCode(code.value)}</code></td>
      <td>${escape(code.batchName || code.batch || "初始批次")}</td>
      <td>${date(code.importedAt)}</td>
      <td>${tags([code.status === "available" ? "可用" : "已发放"], code.status === "available" ? "info" : "ok")}</td>
      <td>${code.orderId ? button(escape(code.orderId), "view-order", code.orderId) : "—"}</td></tr>`);
    const summary = `可用 <strong>${stock}</strong> 份 · 已发 <strong>${state.codes.length - stock}</strong> 份 · 待补发 <strong>${pending}</strong> 单`;
    return box("兑换码库存", summary, table(
      ["兑换码", "导入批次", "导入时间", "状态", "订单"], rows, "暂无兑换码，可批量导入"
    ), `<div class="action-row">${button("查看待补发", "open-pending", "", "")}${button("批量导入", "import-codes", "", "primary")}</div>`);
  }

  function renderLogs(state) {
    const rows = state.logs.map((record) => `<tr>
      <td>${date(record.at)}</td><td>${escape(record.actor || "—")}</td>
      <td class="log-message">${escape(record.text)}</td></tr>`);
    return box("最近操作", "", table(["时间（北京时间）", "操作人", "操作内容"], rows, "暂无操作记录"));
  }

  function render() {
    root.querySelectorAll("[data-member-admin-tab]").forEach((tab) => {
      const active = tab.dataset.memberAdminTab === page;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    content.setAttribute("aria-labelledby", `member-admin-tab-${page}`);
    if (!store) {
      content.innerHTML = '<p class="alert warning" role="alert">会员数据加载失败，请刷新后重试。</p>';
      return;
    }
    content.innerHTML = renderers[page](read());
    if (selectedOrder && drawer.open) drawOrder(selectedOrder);
  }

  function navigate(next) {
    if (!Object.hasOwn(renderers, next)) return;
    page = next;
    render();
    byId(`tab-${page}`).focus();
  }

  function field(name, label, value, options = {}) {
    const { type = "text", required = true, min, max, step, help, wide, maxLength } = options;
    const id = `member-admin-field-${name}`;
    return `<div class="field${wide ? " wide" : ""}">
      <label for="${id}">${label}</label>
      <input class="input" data-antd-component="Input" name="${name}" id="${id}" type="${type}" value="${escape(value)}"${required ? " required" : ""}
        ${min === undefined ? "" : `min="${min}"`} ${max === undefined ? "" : `max="${max}"`}
        ${step === undefined ? "" : `step="${step}"`} ${maxLength === undefined ? "" : `maxlength="${maxLength}"`}
        ${help ? `aria-describedby="${id}-help"` : ""}>
      ${help ? `<small class="help" id="${id}-help">${help}</small>` : ""}</div>`;
  }

  function textarea(name, label, help, placeholder = "") {
    return `<div class="field">
      <label for="member-admin-field-${name}">${label}</label>
      <textarea class="input" data-antd-component="Input.TextArea" name="${name}" id="member-admin-field-${name}" aria-describedby="member-admin-${name}-help" placeholder="${escape(placeholder)}" rows="4" required></textarea>
      <small id="member-admin-${name}-help" class="help">${help}</small></div>`;
  }

  function selectField(name, label, options, selected) {
    const id = `member-admin-field-${name}`;
    return `<div class="field"><label for="${id}">${label}</label>
      <select class="select" data-antd-component="Select" name="${name}" id="${id}">${options.map(([key, value]) =>
        `<option value="${escape(key)}"${selected === key ? " selected" : ""}>${escape(value)}</option>`).join("")}</select></div>`;
  }

  function checkboxes(name, label, values, selected) {
    return `<fieldset class="field wide"><legend>${label}</legend><div class="choices">
      ${Object.entries(values).map(([value, text]) => `<label class="choice">
        <input type="checkbox" data-antd-component="Checkbox" name="${name}" value="${escape(value)}"${selected.includes(value) ? " checked" : ""}>
        ${escape(text)}</label>`).join("")}</div></fieldset>`;
  }

  function showEditor(title, body, submit, submitLabel = "保存") {
    byId("editor-title").textContent = title;
    byId("editor-body").innerHTML = body;
    byId("editor-submit").textContent = submitLabel;
    byId("editor-error").hidden = true;
    submitEdit = submit;
    if (!editor.open) editor.showModal();
    (editor.querySelector("input, textarea, select") || byId("editor-submit")).focus();
  }

  const number = (data, key) => Number(data.get(key));
  const formValue = (data, key) => String(data.get(key) ?? "").trim();
  const priceFields = { type: "number", min: 0.01, step: 0.01 };

  function refreshPlanPreview() {
    const planFields = editor.querySelector("[data-plan-fields]");
    if (!planFields) return;
    const { elements } = byId("editor-form");
    const isRate = elements.pointsMode.value === "rate";
    elements.points.disabled = isRate;
    elements.pointRate.disabled = !isRate;
    elements.points.closest(".field").hidden = isRate;
    elements.pointRate.closest(".field").hidden = !isRate;
    const price = Number(elements.price.value);
    const points = isRate ? Math.round(price * Number(elements.pointRate.value)) : Number(elements.points.value);
    const pointsInput = isRate ? elements.pointRate : elements.points;
    byId("plan-point-preview").textContent = pointsInput.value !== "" && (!isRate || elements.price.value !== "") && Number.isFinite(points)
      ? `每笔购买到账 ${points} 积分，永久有效。` : "请填写赠分规则。";
    const preview = byId("plan-appearance-preview");
    preview.dataset.appearance = elements.appearance.value;
    preview.textContent = elements.style.value.trim() || "装扮预览";
    if (elements.insertAfterId) {
      const ordered = read().plans.map(({ id, name }) => ({ id, name }));
      const index = elements.insertAfterId.value
        ? ordered.findIndex(({ id }) => id === elements.insertAfterId.value) + 1 : 0;
      ordered.splice(index, 0, { name: elements.name.value.trim() || "新档位" });
      byId("plan-position-preview").textContent = ordered.map(({ name }) => name).join(" → ");
    }
  }

  function editPlan(plan = null) {
    const plans = read().plans;
    const current = plan || {
      name: "", periodUnit: "month", periodCount: 1, price: "", points: "",
      discount: 1, activityRate: 1, signRate: 1, style: ""
    };
    const { pointsMode = "fixed", periodUnit = "month", periodCount = current.months } = current;
    const positions = [["", "放在首位"], ...plans.map(({ id, name }) => [id, `放在 ${name} 之后`])];
    const defaultPosition = plans.at(-1)?.id || "";
    const formatDiscount = Math.round(current.discount * 1000) / 100;
    showEditor(plan ? `编辑 ${plan.name}` : "新增会员档位", `
      ${plan ? '<p class="attention">改价、时长和赠分用于新订单。已售权益只可调优。</p>' : ""}
      <div class="field-grid" data-plan-fields>
        ${field("name", "档位名称", current.name, { maxLength: 24, wide: Boolean(plan) })}
        ${plan ? "" : selectField("insertAfterId", "升档顺序", positions, defaultPosition)}
      ${plan ? "" : '<p class="plan-result field wide" id="member-admin-plan-position-preview"></p>'}
        ${field("periodCount", "会员时长", periodCount, { type: "number", min: 1, step: 1 })}
        ${selectField("periodUnit", "时长单位", [["month", "月"], ["day", "天"]], periodUnit)}
        ${field("price", "常规售价（元）", current.price, priceFields)}
        ${selectField("pointsMode", "开通积分规则", [["fixed", "固定赠分"], ["rate", "按常规售价换算"]], pointsMode)}
        ${field("points", "每笔开通赠分", current.points, { type: "number", min: 0, step: 1 })}
        ${field("pointRate", "常规售价每元对应积分", current.pointRate ?? 1, { type: "number", min: 0, step: 0.01 })}
        <p class="plan-result field" id="member-admin-plan-point-preview" aria-live="polite"></p>
        ${field("discount", "商城折扣（折）", formatDiscount, { type: "number", min: 0.1, step: 0.01, max: 10 })}
        ${field("activityRate", "活动积分倍率", current.activityRate, { type: "number", min: 1, step: 0.01 })}
        ${field("signRate", "签到积分倍率", current.signRate, { type: "number", min: 1, step: 0.01 })}
        ${field("style", "身份装扮名称", current.style, { maxLength: 40 })}
        ${selectField("appearance", "身份装扮样式", appearanceOptions, current.appearance || current.id || "jade")}
        <div class="appearance-field"><span id="member-admin-plan-appearance-preview" class="appearance-preview"></span></div>
        ${current.id === "year" ? field("gift", "年卡赠礼说明", current.gift, { maxLength: 80, wide: true }) : ""}
      </div>`, (data) => {
        const mode = formValue(data, "pointsMode");
        const next = {
          name: formValue(data, "name"), periodUnit: formValue(data, "periodUnit"), periodCount: number(data, "periodCount"),
          price: number(data, "price"), pointsMode: mode, discount: number(data, "discount") / 10,
          activityRate: number(data, "activityRate"), signRate: number(data, "signRate"),
          style: formValue(data, "style"), appearance: formValue(data, "appearance")
        };
        if (mode === "rate") next.pointRate = number(data, "pointRate");
        else next.points = number(data, "points");
        if (current.id === "year") next.gift = formValue(data, "gift");
        if (!next.name || !next.style || (current.id === "year" && !next.gift)) {
          throw new Error("请填写档位名称、装扮名称和适用的赠礼说明。");
        }
        if (plan) {
          store.updatePlan(plan.id, next);
          return "会员档位已保存";
        }
        store.createPlan({ ...next, insertAfterId: formValue(data, "insertAfterId") });
        return "会员档位已开售";
      }, plan ? "保存" : "确认并开售");
    refreshPlanPreview();
  }

  function editFirst(plan) {
    if (!plan) return;
    showEditor(`设置 ${plan.name} 首充价`, `<div class="field-grid">
      ${field("firstPrice", "首充价（元）", plan.firstPrice, { ...priceFields, max: plan.price, wide: true,
        required: false, help: `常规售价为 ${money(plan.price)}。留空后保存即可停用该档首充优惠。` })}
    </div>`, (data) => {
      store.updatePlan(plan.id, { firstPrice: formValue(data, "firstPrice") ? number(data, "firstPrice") : null });
      return "首充价已保存";
    });
  }

  function editCampaign(campaign) {
    const state = read();
    const plans = Object.fromEntries(state.plans.map(({ id, name }) => [id, name]));
    const start = campaign?.start || new Date(Date.now() + 86_400_000).toISOString();
    const end = campaign?.end || new Date(Date.now() + 604_800_000).toISOString();
    showEditor(campaign ? "编辑限时活动" : "新建限时活动", `<div class="field-grid">
      ${field("name", "活动名称", campaign?.name, { maxLength: 40, wide: true })}
      ${field("price", "活动价（元）", campaign?.price, { ...priceFields, help: "价格应用于所选档位和购买方式。" })}
      ${selectField("enabled", "活动设置", [["yes", "启用"], ["no", "暂停"]], campaign?.enabled === false ? "no" : "yes")}
      ${checkboxes("planIds", "适用档位", plans, campaign?.planIds || [])}
      ${checkboxes("actions", "购买方式", actionLabels, campaign?.actions || [])}
      ${field("start", "开始时间（北京时间）", dateInput(start), { type: "datetime-local" })}
      ${field("end", "结束时间（北京时间）", dateInput(end), { type: "datetime-local" })}
      </div>`, (data) => {
        const next = {
          name: formValue(data, "name"), price: number(data, "price"),
          start: isoAtBeijingTime(formValue(data, "start")), end: isoAtBeijingTime(formValue(data, "end")),
          planIds: data.getAll("planIds"), actions: data.getAll("actions"), enabled: data.get("enabled") === "yes"
        };
        if (campaign) next.id = campaign.id;
        if (!next.name || !next.planIds.length || !next.actions.length) {
          throw new Error("请填写活动名称，并至少选择一个档位和一种购买方式。");
        }
        if (next.start >= next.end) throw new Error("结束时间必须晚于开始时间。");
      if (next.enabled && state.plans.some((plan) => next.planIds.includes(plan.id) && next.price > plan.price)) {
          throw new Error("活动价不能高于所选档位的常规售价。");
        }
        store.saveCampaign(next);
        return "限时活动已保存";
      });
  }

  function importCodes() {
    showEditor("批量导入年卡兑换码", `<div class="field-grid">
      ${field("batch", "批次名称", "", { wide: true, maxLength: 40 })}
      <div class="field wide">${textarea("codes", "兑换码", "每行一条。已存在的码会被跳过，导入后仅显示尾号。", "DEMO-MN-20261124-001")}</div>
    </div>`, (data) => {
      const codes = formValue(data, "codes").split(/\r?\n/).map((code) => code.trim()).filter(Boolean);
      const batch = formValue(data, "batch");
      if (!batch || !codes.length) throw new Error("请填写批次名称和至少一条兑换码。");
      if (codes.some((code) => !/^DEMO-[A-Z0-9_-]{2,60}$/i.test(code))) {
        throw new Error("本地体验请使用以 DEMO- 开头的示例码。");
      }
      const added = store.importCodes(codes, batch);
      return `已导入 ${added} 份兑换码`;
    }, "导入");
  }

  function detailGroup(title, rows) {
    return `<section class="detail-group"><h3>${title}</h3><dl class="detail-list">${rows.map(([label, value]) =>
      `<dt>${label}</dt><dd>${value}</dd>`).join("")}</dl></section>`;
  }

  function drawOrder(id) {
    const state = read();
    const order = state.orders.find((record) => record.id === id);
    if (!order) {
      byId("details-body").innerHTML = '<p class="empty">未找到该订单</p>';
      return;
    }
    const stock = state.codes.filter((code) => code.status === "available").length;
    const isYear = order.planId === "year";
    const canSupply = order.status === "paid" && order.giftStatus === "pending";
    const noteButton = order.status === "paid" ? button("登记客服处理", "service-note", id, "") : "";
    const offer = typeof order.offer === "string" ? order.offer : order.offer?.label;
    const noteEntries = order.notes || order.serviceNotes || (order.note ? [order.note] : []);
    const notes = Array.isArray(noteEntries) ? noteEntries.map((note) =>
      escape(typeof note === "string" ? note : note.text)).filter(Boolean) : [];
    const request = order.request?.text ? `<dl class="detail-list customer-request">
      <dt>用户留言</dt><dd>${escape(order.request.text)}</dd>
      <dt>提交时间</dt><dd>${date(order.request.at)}</dd></dl>` : "";
    const isPaid = order.status === "paid";
    const memberLabel = order.memberStatus === "failed" ? "开通异常" : isPaid ? "已生效" : "未生效";
    const received = order.receivedAt || order.paidAt;
    const canRepairMember = isPaid && order.memberStatus === "failed";
    const canRepairPoints = isPaid && order.pointsStatus === "failed";
    const repairActions = [
      canRepairMember ? button("恢复会员权益", "repair-member", id, "primary") : "",
      canRepairPoints ? button("补发开通积分", "repair-points", id, "primary") : ""
    ].filter(Boolean);
    const repairControls = repairActions.length ? `<div class="action-row order-actions">${repairActions.join("")}</div>` : "";
    let giftDetails = "";
    if (isYear) {
      giftDetails = detailGroup("MakeNow 年卡赠礼", [
        ["发放状态", tags([giftLabels[order.giftStatus] || "—"], canSupply ? "warn" : order.giftStatus === "sent" ? "ok" : "")],
        ["兑换码", maskedCode(order.code)],
        ...(canSupply ? [["剩余库存", `${stock} 份`]] : [])
      ]);
      if (canSupply) {
        giftDetails += stock
          ? `<div class="action-row order-actions">${button("补发兑换码", "supply-code", id, "primary")}</div>`
          : `<p class="attention order-actions">暂无可用兑换码，导入后可回到此订单补发。
            ${button("查看兑换码库存", "open-inventory")}</p>`;
      }
    }
    byId("details-body").innerHTML = detailGroup("订单信息", [
      ["会员订单", escape(order.id)], ["订单状态", orderTag(order)],
      ["档位", escape(order.planName)], ["购买方式", actionLabels[order.action] || "—"],
      ["购买时长", escape(periodLabel(order))],
      ["应付金额", money(order.amount)], ["实付金额", order.status === "paid" ? money(order.amount) : "—"],
      ["优惠", escape(offer || "—")], ["下单时间", date(order.createdAt)],
      ["收款时间", date(received)], ["付款截止", date(order.payBy)],
      ...(order.invalidReason ? [["失效原因", escape(order.invalidReason)]] : [])
    ]) + detailGroup("会员和积分到账", [
      ["会员权益", tags([memberLabel], canRepairMember ? "warn" : isPaid ? "ok" : "")],
      [isPaid && !canRepairMember ? "会员到期时间" : "预计到期时间", date(order.expiry)],
      ["开通积分", `${escape(order.points)} 分 · 永久有效`],
      ["积分状态", tags([pointsLabel(order)], canRepairPoints ? "warn" : isPaid ? "ok" : "")],
      ...(order.failureReason && hasDeliveryIssue(order) ? [["异常原因", escape(order.failureReason)]] : [])
    ]) + repairControls + giftDetails + `<section class="detail-group"><h3>客服处理</h3>
      <p class="muted">退款和赠礼异常按原订单核对后由客服处理。</p>
      ${request}
      ${notes.length ? `<ul class="order-notes">${notes.map((note) => `<li>${note}</li>`).join("")}</ul>` : ""}
      <div class="action-row order-actions">${noteButton}</div></section>`;
  }

  function viewOrder(id) {
    selectedOrder = id;
    drawOrder(id);
    if (!drawer.open) drawer.showModal();
  }

  function supplyCode(id) {
    showEditor("补发 MakeNow 兑换码", `<p class="attention">确认将一份可用兑换码发给订单 <strong>${escape(id)}</strong>。用户可从原订单查看。</p>`,
      () => {
        store.supply(id);
        return "兑换码已补发，用户可在原订单查看";
      }, "确认补发");
  }

  function repairOrder(id, kind) {
    const order = read().orders.find((item) => item.id === id);
    if (!order || !hasDeliveryIssue(order)) return;
    const isMember = kind === "member";
    const title = isMember ? "恢复会员权益" : "补发开通积分";
    const result = isMember ? "按原订单的购买时长开通或续期会员" : `补发原订单的 ${order.points} 永久积分`;
    showEditor(title, `<p class="attention">订单 <strong>${escape(id)}</strong> 已收款。确认${escape(result)}。</p>`,
      () => {
        store.repair(id, kind);
        return isMember ? "会员权益已恢复" : "开通积分已补发";
      }, title);
  }

  function serviceNote(id) {
    showEditor("登记客服处理", `<p class="attention">订单 ${escape(id)} 的实际退款由客服另行处理。此处登记核对结果。</p>
      ${textarea("note", "处理记录", "填写订单核对结果或下一步。请勿录入手机号、支付账户或完整兑换码。")}`,
      (data) => {
        const note = formValue(data, "note");
        if (!note || note.length > 300) throw new Error("处理记录需填写 1–300 字。");
        if (/DEMO-[A-Z0-9_-]{2,60}|[\w.%+-]+@[\w.-]+\.[a-z]{2,}|\d{7,}/i.test(note)) {
          throw new Error("请用脱敏内容描述处理结果，订单号已有关联。");
        }
        store.addServiceNote(id, note);
        return "客服处理记录已保存";
      });
  }

  function notify(message) {
    const toast = byId("notice");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => { toast.hidden = true; }, 3600);
  }

  function openPending() {
    filter = { keyword: "", status: "gift-pending" };
    navigate("orders");
  }

  function openInventory() {
    drawer.close();
    navigate("inventory");
  }

  function loadSupport() {
    showEditor("加载缺码客服示例", '<p class="attention">将重置本地演示订单和库存，并载入一笔已付款、待补发的年卡订单。</p>',
      () => {
        store.reset("support");
        closeWalkthrough();
        openPending();
        return "已加载缺码客服示例";
      }, "载入示例");
  }

  function loadPaymentIssue() {
    showEditor("加载已收款异常示例", `<p class="attention">将重置本地演示订单和库存。</p>
      ${selectField("failedPart", "示例订单的异常", [["points", "积分未到账"], ["member", "会员未生效"]], "points")}`,
      (data) => {
        store.reset("new");
        const order = store.startOrder("month", "member");
        store.pay(order.id, { fail: formValue(data, "failedPart") });
        closeWalkthrough();
        filter = { keyword: "", status: "delivery-issue" };
        navigate("orders");
        return "已加载已收款异常示例";
      }, "载入示例");
  }

  function resetFilter() {
    filter = { keyword: "", status: "" };
    render();
  }

  function closeWalkthrough() {
    document.querySelector("[data-close-walkthrough]")?.click();
  }

  const tabList = root.querySelector('[role="tablist"]');
  tabList.addEventListener("keydown", (event) => {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const destinations = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0, End: tabs.length - 1
    };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    navigate(tabs[destinations[event.key]].dataset.memberAdminTab);
  });

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-member-admin-tab]");
    if (nav) navigate(nav.dataset.memberAdminTab);
    const close = event.target.closest("[data-member-admin-close]");
    if (close) byId(close.dataset.memberAdminClose).close();
    const control = event.target.closest("[data-member-admin-action]");
    if (!control || !store) return;
    const { memberAdminAction: action, id } = control.dataset;
    const plan = () => read().plans.find((item) => item.id === id);
    const handlers = {
      "new-plan": () => editPlan(),
      "edit-plan": () => editPlan(plan()), "edit-first": () => editFirst(plan()),
      "edit-campaign": () => editCampaign(read().campaigns.find((item) => item.id === id)),
      "view-order": () => viewOrder(id), "load-support": loadSupport, "load-payment-issue": loadPaymentIssue,
      "import-codes": importCodes, "open-pending": openPending, "open-inventory": openInventory, "reset-filter": resetFilter,
      "service-note": () => serviceNote(id), "supply-code": () => supplyCode(id),
      "repair-member": () => repairOrder(id, "member"), "repair-points": () => repairOrder(id, "points")
    };
    handlers[action]?.();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "member-admin-order-filters") return;
    event.preventDefault();
    const data = new FormData(event.target);
    filter = { keyword: formValue(data, "keyword"), status: formValue(data, "status") };
    render();
  });

  byId("editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const error = byId("editor-error");
    try {
      const message = submitEdit(new FormData(event.currentTarget));
      editor.close();
      render();
      notify(message);
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
      error.scrollIntoView({ block: "nearest" });
    }
  });
  byId("editor-form").addEventListener("input", refreshPlanPreview);
  byId("editor-form").addEventListener("change", refreshPlanPreview);

  drawer.addEventListener("close", () => { selectedOrder = null; });
  window.addEventListener("membership-changed", render);
  render();
})();
