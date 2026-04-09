export type Locale = 'zh' | 'en'

export const LOCALE_STORAGE_KEY = 'trustfield.locale'

export type WatchStep = { id: string; label: string; detail: string; ms: number }

export type Messages = {
  shell: {
    tagline: string
    navOverview: string
    navWatch: string
    navGlasses: string
    navAria: string
    footer: string
    langZh: string
    langEn: string
    langToggleAria: string
  }
  home: {
    eyebrow: string
    titleLine1: string
    titleLine2: string
    lead: string
    ctaWatch: string
    ctaGlasses: string
    cards: { title: string; body: string }[]
    pitchTitle: string
    pitchSteps: string[]
  }
  watch: {
    title: string
    lead: string
    hubSlm: string
    slmBusy: string
    slmIdle: string
    verified: string
    waiting: string
    seLock: string
    lensConnected: string
    signetConnected: string
    dialCaption: string
    runHandshake: string
    running: string
    reset: string
    logTitle: string
    logEmpty: string
    steps: WatchStep[]
    logStart: string
    logDone: string
    clockDemo: string
    stepsAria: string
  }
  glasses: {
    intro: string
    streetAria: string
    hudEyebrow: string
    hudTitle: string
    localTime: string
    backdropClose: string
    idleHintBefore: string
    idleHintEm: string
    idleHintAfter: string
    loadingBrand: string
    loadingTitle: string
    loadingSub: string
    legalWindowTitle: string
    legalSubtitle: string
    legalDocDisclaimer: string
    intentEchoPrefix: string
    inputLabel: string
    inputPlaceholder: string
    submit: string
    submitting: string
    photoCreditBg: string
    photoCreditScene: string
    photoCreditLink: string
    toastFallbackWithErr: string
    toastFallback: string
    toastNetwork: string
    legalPromptPad: string
    closeWindow: string
    mapBadge: string
    routeSpec: string
    routeArrow: string
    mode: string
    eta: string
    min: string
    intentEchoBlock: string
    chatChan: string
    chatYou: string
    chatPeer: string
    compose: string
    demoNoSend: string
    paneMessage: string
    paneNav: string
    stackNav: string
    stackRoot: string
    windowFooterHud: string
    windowFooterClause: string
  }
}

const zh: Messages = {
  shell: {
    tagline: '穿戴式信任 · 演示',
    navOverview: '概览',
    navWatch: '手表演示',
    navGlasses: '眼镜演示',
    navAria: '主导航',
    footer: '无硬件线上演示 · 叙事与交互均为模拟 · 正式技术以论文与产品规格为准',
    langZh: '中文',
    langEn: 'EN',
    langToggleAria: '界面语言',
  },
  home: {
    eyebrow: 'Investor walkthrough',
    titleLine1: '分布式穿戴 + AIOS',
    titleLine2: '把「真实的人」锁进关键动作',
    lead:
      '手表负责算力与安全域，眼镜负责视线与光刺激感知，戒指负责「最终确认」。下面两个演示页，可在没有样机的情况下，向投资人展示产品气质与核心流程。',
    ctaWatch: 'Part 1 · 手表中枢',
    ctaGlasses: 'Part 2 · 眼镜 AR',
    cards: [
      {
        title: '去 App 化',
        body: '能力拆成「服务原子」，由 AIOS 按任务即时编排，而不是让用户在孤岛应用里迷路。',
      },
      {
        title: '时间之盾',
        body: '利用生理响应与生成链路在时序上的差异，辅助判断「是否像当场真人」——配合多模态与硬件根。',
      },
      {
        title: '99% / 1%',
        body: '琐事静默自动化；支付、签约等高风险动作，必须由戒指给出带阻尼的物理确认。',
      },
    ],
    pitchTitle: '演示怎么讲（30 秒版）',
    pitchSteps: [
      '先打开「手表演示」，走一遍 PEH 握手：光刺激 → 瞳孔 → 心血管相位 → SE 签名。',
      '再打开「眼镜演示」：时间与对话在同一片视野里；用一句话生成草稿或问条款。',
      '强调：这是无硬件的交互样机，用于对齐叙事；工程实现与威胁模型另附材料。',
    ],
  },
  watch: {
    title: 'Part 1 · 手表中枢演示',
    lead:
      '模拟 Hub：端侧小模型状态、SE 安全域、与眼镜/戒指协同的 PEH（脉冲—视线握手）时间线。点击「运行握手」观看逐步动画；全程无需后端与硬件。',
    hubSlm: 'Hub · SLM',
    slmBusy: '编排中…',
    slmIdle: '待机',
    verified: 'Human-Source 已验证',
    waiting: '等待 PEH 握手',
    seLock: 'SE 锁定',
    lensConnected: 'Lens 已连接',
    signetConnected: 'Signet 已连接',
    dialCaption: '表盘为视觉示意 · 非真实 OS 截图',
    runHandshake: '运行 PEH 握手',
    running: '握手进行中…',
    reset: '重置',
    logTitle: '事件日志',
    logEmpty: '暂无',
    steps: [
      { id: 'light', label: '光脉冲', detail: '眼镜发出受控微光刺激', ms: 900 },
      { id: 'pupil', label: '瞳孔动力学', detail: '采集主序列约束内的动态响应', ms: 1100 },
      { id: 'ppg', label: '戒指 rPPG', detail: '心血管相位与刺激对齐校验', ms: 1000 },
      { id: 'se', label: 'SE / PUF', detail: '安全域签名与硬件指纹绑定', ms: 900 },
      { id: 'token', label: '人源令牌', detail: '生成可验证摘要（隐私不裸传）', ms: 800 },
    ],
    logStart: '开始 PEH 脉冲—视线握手（模拟）',
    logDone: '握手完成 · Human-Source 令牌已签发（演示）',
    clockDemo: '本地时钟 · 演示',
    stepsAria: 'PEH 步骤',
  },
  glasses: {
    intro:
      'Part 2 · 行人视角 + JIT 整页弹出：不保留对话记录；你说一句，系统理解意图后弹出「像电脑窗口一样」的界面。聊天类意图呈现的是即时聊天 App 画面，不是和助理来回聊。',
    streetAria: '模拟走路时透过镜片看到的前方街景（行人眼高、静态照片）',
    hudEyebrow: 'on foot · jit',
    hudTitle: '口述一句 → 整页界面',
    localTime: '本地时间',
    backdropClose: '点击关闭当前界面',
    idleHintBefore: '下方输入一句需求。界面会像电脑窗口从视野里弹出，',
    idleHintEm: '不累计聊天记录',
    idleHintAfter: '。',
    loadingBrand: 'trustfield',
    loadingTitle: 'parsing_utterance…',
    loadingSub: '生成光学 JIT 栅格界面',
    legalWindowTitle: 'CLAUSE_VIEW · 法务 JIT',
    legalSubtitle: '非对话模式 · 单页说明',
    legalDocDisclaimer: '// 单页说明 · 演示稿 · 不构成法律意见',
    intentEchoPrefix: 'intent_echo ',
    inputLabel: '口述需求',
    inputPlaceholder: '说一句：导航去××、给××发消息、做个库存看板、问第7.2条风险…',
    submit: '生成界面',
    submitting: '生成中',
    photoCreditBg: '背景',
    photoCreditScene: '行人眼高街景',
    photoCreditLink: 'Unsplash（Claudio Schwarz）',
    toastFallbackWithErr: '已用本地规则生成界面（{msg}）',
    toastFallback: '已用本地规则生成界面',
    toastNetwork: '请求失败，请稍后重试。',
    legalPromptPad: '请结合上述问题给出简要要点与风险提示（演示）。',
    closeWindow: '关闭窗口',
    mapBadge: 'MAP ',
    routeSpec: '┃ route_spec',
    routeArrow: '→',
    mode: 'mode',
    eta: 'eta',
    min: 'min',
    intentEchoBlock: 'intent_echo',
    chatChan: 'CHAN_MSG',
    chatYou: 'you> ',
    chatPeer: 'peer> ',
    compose: 'compose…',
    demoNoSend: 'demo · no send',
    paneMessage: '┃ pane_a · message',
    paneNav: '┃ pane_b · nav_radar',
    stackNav: 'stack_nav',
    stackRoot: '[ ] root',
    windowFooterHud: 'TRUSTFIELD · OPTICAL_JIT · demo build',
    windowFooterClause: 'TRUSTFIELD · CLAUSE_VIEW · demo build',
  },
}

const en: Messages = {
  shell: {
    tagline: 'Wearable trust · demo',
    navOverview: 'Overview',
    navWatch: 'Watch demo',
    navGlasses: 'Glasses demo',
    navAria: 'Main navigation',
    footer:
      'Online demo without hardware · narrative and interactions are simulated · engineering and threat model are documented separately',
    langZh: '中文',
    langEn: 'EN',
    langToggleAria: 'Interface language',
  },
  home: {
    eyebrow: 'Investor walkthrough',
    titleLine1: 'Distributed wearables + AIOS',
    titleLine2: 'Bind the real human to critical actions',
    lead:
      'The watch hosts compute and the trust enclave; glasses handle gaze and controlled light; the ring provides final confirmation. Use the two demos below to pitch narrative and flow without prototypes.',
    ctaWatch: 'Part 1 · Watch hub',
    ctaGlasses: 'Part 2 · Glasses AR',
    cards: [
      {
        title: 'De-app-ification',
        body: 'Capabilities become composable atoms orchestrated by AIOS on demand—users should not get lost across siloed apps.',
      },
      {
        title: 'Time shield',
        body: 'Use timing gaps between physiological response and generative chains to sanity-check “present human” signals—alongside multimodal and hardware roots.',
      },
      {
        title: '99% / 1%',
        body: 'Automate the mundane quietly; payments and signing require damped physical confirmation from the ring.',
      },
    ],
    pitchTitle: 'How to present it (~30s)',
    pitchSteps: [
      'Open the watch demo and run the PEH handshake: light → pupil dynamics → cardio phase → SE signature.',
      'Open the glasses demo: time and JIT UI share one field of view; one utterance drafts UI or asks about clauses.',
      'Clarify: this is a narrative/interaction mock without hardware; implementation details live elsewhere.',
    ],
  },
  watch: {
    title: 'Part 1 · Watch hub demo',
    lead:
      'Simulated hub: on-device SLM state, secure element, and the PEH (pulsed eye handshake) timeline with glasses and ring. Click “Run handshake” to step through—no backend or hardware required.',
    hubSlm: 'Hub · SLM',
    slmBusy: 'Orchestrating…',
    slmIdle: 'Idle',
    verified: 'Human-Source verified',
    waiting: 'Waiting for PEH handshake',
    seLock: 'SE locked',
    lensConnected: 'Lens connected',
    signetConnected: 'Signet connected',
    dialCaption: 'Dial is illustrative · not a real OS capture',
    runHandshake: 'Run PEH handshake',
    running: 'Handshake running…',
    reset: 'Reset',
    logTitle: 'Event log',
    logEmpty: 'Empty',
    steps: [
      { id: 'light', label: 'Light pulse', detail: 'Glasses emit controlled micro-stimulus', ms: 900 },
      { id: 'pupil', label: 'Pupil dynamics', detail: 'Capture response within primary sequence bounds', ms: 1100 },
      { id: 'ppg', label: 'Ring rPPG', detail: 'Cardio phase aligned to stimulus', ms: 1000 },
      { id: 'se', label: 'SE / PUF', detail: 'Secure-domain signature bound to hardware fingerprint', ms: 900 },
      {
        id: 'token',
        label: 'Human-source token',
        detail: 'Verifiable digest (privacy-preserving)',
        ms: 800,
      },
    ],
    logStart: 'Starting PEH pulse–gaze handshake (simulated)',
    logDone: 'Handshake complete · Human-Source token issued (demo)',
    clockDemo: 'Local clock · demo',
    stepsAria: 'PEH steps',
  },
  glasses: {
    intro:
      'Part 2 · Pedestrian POV + full-screen JIT: no chat history; one utterance is understood and a desktop-like surface pops in. Chat-like intents render as an instant messaging app view—not a back-and-forth with an assistant.',
    streetAria: 'Street view at eye level through the lens (still photo, simulated)',
    hudEyebrow: 'on foot · jit',
    hudTitle: 'One utterance → full page',
    localTime: 'Local time',
    backdropClose: 'Dismiss current surface',
    idleHintBefore: 'Type one request below. A window will appear over the scene; ',
    idleHintEm: 'nothing is accumulated as chat history',
    idleHintAfter: '.',
    loadingBrand: 'trustfield',
    loadingTitle: 'parsing_utterance…',
    loadingSub: 'Composing optical JIT grid',
    legalWindowTitle: 'CLAUSE_VIEW · legal JIT',
    legalSubtitle: 'Not chat · single-page brief',
    legalDocDisclaimer: '// Single-page brief · demo · not legal advice',
    intentEchoPrefix: 'intent_echo ',
    inputLabel: 'Voice / text request',
    inputPlaceholder:
      'Try: navigate to…, message someone…, build an inventory board, ask risks in clause 7.2…',
    submit: 'Build UI',
    submitting: 'Building…',
    photoCreditBg: 'Background',
    photoCreditScene: 'Eye-level street (photo)',
    photoCreditLink: 'Unsplash (Claudio Schwarz)',
    toastFallbackWithErr: 'Rendered with local rules ({msg})',
    toastFallback: 'Rendered with local rules',
    toastNetwork: 'Request failed. Please retry.',
    legalPromptPad: 'Please answer with a brief summary and risk notes (demo).',
    closeWindow: 'Close window',
    mapBadge: 'MAP ',
    routeSpec: '┃ route_spec',
    routeArrow: '→',
    mode: 'mode',
    eta: 'eta',
    min: 'min',
    intentEchoBlock: 'intent_echo',
    chatChan: 'CHAN_MSG',
    chatYou: 'you> ',
    chatPeer: 'peer> ',
    compose: 'compose…',
    demoNoSend: 'demo · no send',
    paneMessage: '┃ pane_a · message',
    paneNav: '┃ pane_b · nav_radar',
    stackNav: 'stack_nav',
    stackRoot: '[ ] root',
    windowFooterHud: 'TRUSTFIELD · OPTICAL_JIT · demo build',
    windowFooterClause: 'TRUSTFIELD · CLAUSE_VIEW · demo build',
  },
}

export const messages: Record<Locale, Messages> = { zh, en }

export function pickMessages(locale: Locale): Messages {
  return messages[locale]
}

/** Simple {name} interpolation */
export function interpolate(template: string, vars: Record<string, string>): string {
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v)
  }
  return s
}
