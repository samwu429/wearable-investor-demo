export type InstantAppModule = { name: string; desc: string }

export type InstantAppScreen = { label: string; tone: 'gold' | 'mint' | 'rose' }

export type InstantAppPreview = {
  productName: string
  tagline: string
  userIntentEcho: string
  modules: InstantAppModule[]
  screens: InstantAppScreen[]
  codeSnippet: string
  etaLine: string
}

function preview(
  productName: string,
  tagline: string,
  userIntentEcho: string,
  modules: InstantAppModule[],
  screens: InstantAppScreen[],
  codeSnippet: string,
): InstantAppPreview {
  return {
    productName,
    tagline,
    userIntentEcho,
    modules,
    screens,
    codeSnippet,
    etaLine: 'JIT 演示 · 无真实编译与部署 · 仅结构预览',
  }
}

/** 投资人演示：根据自然语言意图返回一套「已生成软件」的静态结构（不调用后端）。 */
export function generateInstantAppPreview(intentRaw: string): InstantAppPreview {
  const intent = intentRaw.trim() || '未描述的需求'
  const t = intent.toLowerCase()

  if (/库存|进销|仓储|warehouse|sku|盘点/i.test(intent)) {
    return preview(
      'StockLens 进销存',
      '一眼看清补货与滞销',
      intent,
      [
        { name: '实时库存看板', desc: 'SKU 维度 + 安全库存告警' },
        { name: '采购建议', desc: '按近 30 日动销生成补货草稿' },
        { name: '权限与审计', desc: '仓库 / 财务分级 + 操作留痕' },
      ],
      [
        { label: '总览', tone: 'gold' },
        { label: '入库', tone: 'mint' },
        { label: '报表', tone: 'rose' },
      ],
      `// JIT scaffold · StockLens (demo)\nexport const routes = ['/dash', '/inbound', '/reports']\ncomponents: [KpiStrip, SkuTable, AlertDrawer]\n// 生成耗时示意: 1.2s`,
    )
  }

  if (/聊天|客服|bot|im|消息|会话/i.test(intent)) {
    return preview(
      'ThreadKit 会话台',
      '人机协同的一线响应',
      intent,
      [
        { name: '智能分流', desc: '意图识别 → 人工 / 机器人队列' },
        { name: '知识片段 JIT', desc: '命中条款自动浮窗摘要' },
        { name: 'SLA 看板', desc: '响应时长与满意度实时曲线' },
      ],
      [
        { label: '收件箱', tone: 'mint' },
        { label: '知识', tone: 'gold' },
        { label: '质检', tone: 'rose' },
      ],
      `// JIT scaffold · ThreadKit (demo)\nexport const routes = ['/inbox', '/kb', '/qa']\nwidgets: [IntentBadge, JitClauseCard, SlaSparkline]`,
    )
  }

  if (/合同|法务|条款|签约|nda/i.test(intent)) {
    return preview(
      'ClauseFlow 条款助手',
      '看到即解释，签前可核对',
      intent,
      [
        { name: '条款 JIT 浮窗', desc: '注视段落即弹出风险摘要' },
        { name: '比对版本', desc: 'v1 / v2 差异高亮' },
        { name: '签署阻尼', desc: '戒指 / 手表双因子确认（演示）' },
      ],
      [
        { label: '审阅', tone: 'gold' },
        { label: '差异', tone: 'rose' },
        { label: '签署', tone: 'mint' },
      ],
      `// JIT scaffold · ClauseFlow (demo)\nexport const routes = ['/review', '/diff', '/sign']\njit: [RiskHighlight, SignetHandshake]`,
    )
  }

  if (/健身|运动|心率|wearable|手表|健康/i.test(intent)) {
    return preview(
      'PulseRing 健康中枢',
      '穿戴数据与信任链同屏',
      intent,
      [
        { name: '体征时间线', desc: '心率 / 睡眠 / 活动合并视图' },
        { name: 'JIT 健康提示', desc: '异常阈值触发可解释建议' },
        { name: '家庭共享', desc: '授权范围与撤销一键管理' },
      ],
      [
        { label: '今日', tone: 'mint' },
        { label: '趋势', tone: 'gold' },
        { label: '家庭', tone: 'rose' },
      ],
      `// JIT scaffold · PulseRing (demo)\nexport const routes = ['/today', '/trends', '/family']\nstreams: [hrSeries, sleepStages, jitNudges]`,
    )
  }

  if (/报表|bi|数据|dashboard|看板/i.test(intent)) {
    return preview(
      'NorthStar 看板',
      '指标随问随答',
      intent,
      [
        { name: '自然语言取数', desc: '口述问题 → 图表草案' },
        { name: '指标血缘', desc: 'JIT 展示口径与数据源' },
        { name: '订阅推送', desc: '阈值告警到眼镜 / 手表' },
      ],
      [
        { label: '探索', tone: 'gold' },
        { label: '血缘', tone: 'mint' },
        { label: '告警', tone: 'rose' },
      ],
      `// JIT scaffold · NorthStar (demo)\nexport const routes = ['/explore', '/lineage', '/alerts']\nnl: [QueryToSpec, ChartDraft, JitProvenance]`,
    )
  }

  return preview(
    `Nova · ${intent.slice(0, 18)}${intent.length > 18 ? '…' : ''}`,
    '按你的描述即时搭出的产品骨架',
    intent,
    [
      { name: '身份与租户', desc: '登录、角色、工作区隔离' },
      { name: '核心业务流', desc: '列表 / 详情 / 状态机占位' },
      { name: '可观测性', desc: '日志、指标、JIT 排障入口' },
    ],
    [
      { label: '首页', tone: 'gold' },
      { label: '流程', tone: 'mint' },
      { label: '设置', tone: 'rose' },
    ],
    `// JIT scaffold · Nova (demo)\nexport const routes = ['/home', '/flow', '/settings']\n// intent: ${t.slice(0, 60).replace(/\n/g, ' ')}\ncomponents: [Shell, DataTable, JitInspector]`,
  )
}
