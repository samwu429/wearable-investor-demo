export type InstantUiMode = 'chat' | 'map' | 'split' | 'scaffold'

export type ChatBubble = { role: 'me' | 'them'; text: string }

export type InstantMapUi = {
  /** 顶部一行说明 */
  headline: string
  fromLabel: string
  toLabel: string
  minutes: number
  travelMode: '步行' | '骑行' | '驾车' | '公交'
}

export type InstantChatUi = {
  peerName: string
  peerStatus: string
  bubbles: ChatBubble[]
}

export type InstantAppModule = { name: string; desc: string }
export type InstantAppScreen = { label: string; tone: 'gold' | 'mint' | 'rose' }

export type InstantAppPreview = {
  uiMode: InstantUiMode
  productName: string
  tagline: string
  userIntentEcho: string
  etaLine: string
  chatUi?: InstantChatUi
  mapUi?: InstantMapUi
  /** 仅 scaffold 模式使用 */
  modules?: InstantAppModule[]
  screens?: InstantAppScreen[]
  codeSnippet?: string
}

function wantsMap(intent: string): boolean {
  return /地图|导航|路线|怎么去|到哪|怎么走|定位|步行|走路|骑车|骑行|驾车|开车|公交|地铁|附近|导个航/.test(intent)
}

function wantsChat(intent: string): boolean {
  return (
    /消息|聊天|发给|告诉|短信|微信|联系|说一下|跟.+说|给.+发/.test(intent) ||
    /妈妈|爸爸|朋友|同事|老婆|老公|对象/.test(intent)
  )
}

function extractDestination(intent: string): string {
  const cleaned = intent.replace(/给我生成地图|生成地图|地图|导航|路线/g, '').trim()
  let m = cleaned.match(/去([^，。！？\s]{1,16})(?:$|[，。！？\s]|并|然后)/)
  if (m?.[1]) return m[1].replace(/的.+$/, '').trim() || '目的地'
  m = cleaned.match(/到([^，。！？\s]{1,16})(?:$|[，。！？\s])/)
  if (m?.[1]) return m[1].trim()
  if (/图书馆/.test(intent)) return '图书馆'
  if (/公司|单位/.test(intent)) return '公司'
  if (/家/.test(intent)) return '家'
  if (/学校|校区/.test(intent)) return '学校'
  return '目的地'
}

function extractPeer(intent: string): string {
  if (/妈妈|老妈|娘/.test(intent)) return '妈妈'
  if (/爸爸|老爸/.test(intent)) return '爸爸'
  const m = intent.match(/给([^，。！？\s]{1,8}?)(?:发|说|聊|带|回)/)
  if (m?.[1] && m[1].length <= 8) return m[1].trim()
  if (/朋友/.test(intent)) return '朋友'
  if (/同事/.test(intent)) return '同事'
  return '联系人'
}

function extractUserMessage(intent: string): string {
  const food = intent.match(/我想吃([^，。！？]+)/)
  if (food?.[1]) return `我想吃${food[1].trim()}`
  const tail = intent.match(/(?:说|发|聊)(?:消息)?[，：:]?\s*(.+)$/)
  if (tail?.[1] && tail[1].length > 1 && tail[1].length < 80) return tail[1].trim()
  if (/我想/.test(intent)) {
    const m = intent.match(/我想[^，。！？]{1,40}/)
    if (m) return m[0]
  }
  return intent.length > 60 ? `${intent.slice(0, 57)}…` : intent
}

function replyForChat(intent: string, peer: string): string {
  if (/糖醋|吃|饭|菜/.test(intent) && /妈妈|妈/.test(peer)) return '收到啦，晚上给你做～路上注意安全 ❤'
  if (/图书馆|到了|在哪/.test(intent)) return '好，到了跟我说一声。'
  return `好的，${peer}已看到你的消息（演示回复）`
}

function travelModeFromIntent(intent: string): InstantMapUi['travelMode'] {
  if (/骑|单车/.test(intent)) return '骑行'
  if (/开|驾车|车/.test(intent)) return '驾车'
  if (/公交|地铁/.test(intent)) return '公交'
  return '步行'
}

function buildChatPreview(intent: string): InstantAppPreview {
  const peer = extractPeer(intent)
  const line = extractUserMessage(intent)
  const reply = replyForChat(intent, peer)
  return {
    uiMode: 'chat',
    productName: `私信 · ${peer}`,
    tagline: '根据口述即时渲染的聊天界面（演示）',
    userIntentEcho: intent,
    etaLine: '以下为拟真 UI 草图，无真实消息发送',
    chatUi: {
      peerName: peer,
      peerStatus: '在线 · 已验证联系人',
      bubbles: [
        { role: 'me', text: line },
        { role: 'them', text: reply },
      ],
    },
  }
}

function buildMapPreview(intent: string): InstantAppPreview {
  const to = extractDestination(intent)
  const mode = travelModeFromIntent(intent)
  const minutes = mode === '步行' ? 12 : mode === '骑行' ? 6 : mode === '公交' ? 18 : 8
  return {
    uiMode: 'map',
    productName: `导航 · ${to}`,
    tagline: '根据口述即时渲染的地图路线（演示）',
    userIntentEcho: intent,
    etaLine: '路线与时间为示意数据，非真实定位',
    mapUi: {
      headline: `${mode}前往「${to}」`,
      fromLabel: '你',
      toLabel: to,
      minutes,
      travelMode: mode,
    },
  }
}

function buildSplitPreview(intent: string): InstantAppPreview {
  const chat = buildChatPreview(intent)
  const map = buildMapPreview(intent)
  return {
    uiMode: 'split',
    productName: '社交 + 导航',
    tagline: '同时生成聊天与地图两块界面（演示）',
    userIntentEcho: intent,
    etaLine: '双面板为同一意图下的 JIT 叠加展示',
    chatUi: chat.chatUi,
    mapUi: map.mapUi,
  }
}

function scaffoldPreview(
  productName: string,
  tagline: string,
  intent: string,
  modules: InstantAppModule[],
  screens: InstantAppScreen[],
  codeSnippet: string,
): InstantAppPreview {
  return {
    uiMode: 'scaffold',
    productName,
    tagline,
    userIntentEcho: intent,
    etaLine: '垂直场景 · 仍用结构骨架演示（非聊天/地图类意图）',
    modules,
    screens,
    codeSnippet,
  }
}

/** 口述意图 → 预览数据：优先产出「看得懂的界面」（聊天 / 地图），否则再走垂直脚手架。 */
export function generateInstantAppPreview(intentRaw: string): InstantAppPreview {
  const intent = intentRaw.trim() || '未描述的需求'

  const map = wantsMap(intent)
  const chat = wantsChat(intent)

  if (map && chat) return buildSplitPreview(intent)
  if (map) return buildMapPreview(intent)
  if (chat) return buildChatPreview(intent)

  if (/库存|进销|仓储|warehouse|sku|盘点/i.test(intent)) {
    return scaffoldPreview(
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
      `// demo · StockLens\nexport const routes = ['/dash', '/inbound', '/reports']`,
    )
  }

  if (/合同|法务|条款|签约|nda/i.test(intent)) {
    return scaffoldPreview(
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
      `// demo · ClauseFlow\nexport const routes = ['/review', '/diff', '/sign']`,
    )
  }

  return scaffoldPreview(
    `轻应用 · ${intent.slice(0, 14)}${intent.length > 14 ? '…' : ''}`,
    '未命中聊天/地图关键词时的通用骨架',
    intent,
    [
      { name: '首页', desc: '入口与常用操作' },
      { name: '列表 / 详情', desc: '主数据流占位' },
      { name: '我的', desc: '账号与设置' },
    ],
    [
      { label: '首页', tone: 'gold' },
      { label: '流程', tone: 'mint' },
      { label: '设置', tone: 'rose' },
    ],
    `// demo · generic\nexport const routes = ['/home', '/flow', '/settings']`,
  )
}
