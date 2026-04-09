import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ApiError, API_BASE_URL } from '../lib/apiClient'
import { generateInsight } from '../lib/ai'
import {
  generateInstantAppPreview,
  type InstantAppPreview,
  type InstantAppScreen,
  type InstantChatUi,
  type InstantMapUi,
} from '../lib/mockInstantApp'

function InstantChatVisual({ data }: { data: InstantChatUi }) {
  return (
    <div className="glasses-tui-panel flex max-h-[min(52vh,440px)] min-h-[200px] flex-col overflow-hidden !p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-sky-500/35 px-2 py-1.5 text-sky-200">
        <div>
          <span className="text-sky-500">#</span> CHAT <span className="text-sky-600">::</span>{' '}
          <span className="text-sky-100">{data.peerName}</span>
        </div>
        <div className="text-[10px] text-mint">{data.peerStatus}</div>
        <span className="text-[10px] text-sky-500/90">[SOC]</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {data.bubbles.map((b, i) => (
          <p key={i} className="break-words text-sky-100/95">
            <span className={b.role === 'me' ? 'text-sky-400' : 'text-sky-500'}>{b.role === 'me' ? 'you>' : 'peer>'}</span>{' '}
            {b.text}
          </p>
        ))}
      </div>
      <div className="border-t border-sky-500/35 px-2 py-1.5 text-sky-400">
        <div className="text-sky-500">
          &gt; <span className="text-sky-600/80">_</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-sky-500/80">[缓冲区: 输入消息…]</span>
          <button
            type="button"
            className="rounded-sm border border-sky-400/60 bg-sky-500/25 px-2 py-0.5 text-[10px] font-medium text-sky-100 hover:bg-sky-500/40"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}

function InstantMapVisual({ data }: { data: InstantMapUi }) {
  return (
    <div className="glasses-tui-panel relative min-h-[200px] flex-1 overflow-hidden !p-0">
      <div className="border-b border-sky-500/35 px-2 py-1 text-sky-300">
        MAP <span className="text-sky-600">::</span> {data.headline}
      </div>
      <div
        className="pointer-events-none absolute inset-0 top-7 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(56,189,248,0.5) 1px, transparent 0)',
          backgroundSize: '10px 10px',
        }}
      />
      <svg className="relative z-10 h-[200px] w-full md:h-[min(240px,28vh)]" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M 48 170 Q 130 36 272 52"
          fill="none"
          stroke="rgba(52,211,153,0.9)"
          strokeWidth="2"
          strokeLinecap="square"
          strokeDasharray="6 4"
        />
        <rect x="39" y="161" width="18" height="18" fill="none" stroke="rgba(56,189,248,0.95)" strokeWidth="2" />
        <rect x="263" y="43" width="18" height="18" fill="none" stroke="rgba(251,113,133,0.95)" strokeWidth="2" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-sky-500/35 bg-slate-950/55 px-2 py-1 text-[10px] text-sky-200">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-sky-400">[A]</span>
          <span className="text-sky-100/90">{data.fromLabel}</span>
        </div>
        <div className="text-center text-mint">
          {data.travelMode} ~ {data.minutes} min
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-sky-400">[B]</span>
          <span className="text-sky-100/90">{data.toLabel}</span>
        </div>
      </div>
    </div>
  )
}

type Person = { id: string; name: string; verified: boolean; x: string; y: string }

const PEOPLE: Person[] = [
  { id: '1', name: '已通过认证', verified: true, x: '18%', y: '42%' },
  { id: '2', name: '同事 · 已认证', verified: true, x: '72%', y: '38%' },
  { id: '3', name: '未知账号', verified: false, x: '52%', y: '62%' },
]

type ClauseKey = 'delay' | 'nda' | 'terminate'

const CLAUSES: Record<
  ClauseKey,
  { title: string; tag: string; body: React.ReactNode; risk: string }
> = {
  delay: {
    title: '风险条款摘要',
    tag: '7.2 交付',
    body: (
      <>
        第 7.2 条：若乙方延迟交付超过 <strong className="text-sky-300">14</strong> 个自然日，甲方有权终止协议并要求按日计违约金。
      </>
    ),
    risk: '现金流与交付节奏',
  },
  nda: {
    title: '保密与数据',
    tag: '9.1 NDA',
    body: (
      <>
        第 9.1 条：双方对路演材料、模型权重与日志负有保密义务；未经书面同意不得向第三方披露可识别个人或商业敏感信息。
      </>
    ),
    risk: '合规与数据出境',
  },
  terminate: {
    title: '终止与清算',
    tag: '11 终止',
    body: (
      <>
        第 11 条：任一方重大违约且未在 <strong className="text-sky-300">30</strong> 日内补救的，守约方可书面终止；已交付成果按里程碑结算。
      </>
    ),
    risk: '退出路径与残值',
  },
}

type JitQueueItem = { id: string; label: string; sub: string; pinned?: boolean }

const JIT_QUEUE_SEED: JitQueueItem[] = [
  { id: 'q1', label: '对方 IP 归属', sub: '附件 B · 待核对' },
  { id: 'q2', label: '跨境管辖', sub: '7.2 关联条款' },
  { id: 'q3', label: '审计权范围', sub: '合规团队请求' },
]

function jitCardClass(intensity: number) {
  const glow = 6 + intensity * 16
  return `glasses-tui-panel rounded-sm p-3 shadow-[0_0_${glow}px_rgba(56,189,248,0.12)] md:p-4`
}

export function GlassesDemo() {
  const [jitVisible, setJitVisible] = useState(true)
  const [highlight, setHighlight] = useState(false)
  const [signed, setSigned] = useState(false)
  const [clause, setClause] = useState<ClauseKey>('delay')
  const [sensitivity, setSensitivity] = useState(1)
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [voiceProgress, setVoiceProgress] = useState(0)
  const [hideUnverified, setHideUnverified] = useState(false)
  const [queue, setQueue] = useState<JitQueueItem[]>(JIT_QUEUE_SEED)
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const [prompt, setPrompt] = useState('请用投资人能听懂的话，解释第7.2条延期违约条款的风险与建议。')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiMeta, setAiMeta] = useState('')
  const [aiError, setAiError] = useState('')

  const [instantIntent, setInstantIntent] = useState(
    '我想做一个给门店店长用的库存小工具，能看滞销和补货建议。',
  )
  const [instantGenerating, setInstantGenerating] = useState(false)
  const [instantPreview, setInstantPreview] = useState<InstantAppPreview | null>(null)

  const pupilPath = useMemo(() => {
    const pts: string[] = []
    for (let x = 0; x <= 280; x += 4) {
      const y = 28 + Math.sin(x / 18) * 10 + Math.sin(x / 7) * 4
      pts.push(`${x},${y}`)
    }
    return `M${pts.map((p) => p).join(' L')}`
  }, [])

  const clauseData = CLAUSES[clause]

  const startVoiceDemo = () => {
    if (voicePlaying) {
      setVoicePlaying(false)
      setVoiceProgress(0)
      return
    }
    setVoicePlaying(true)
    setVoiceProgress(0)
    const started = Date.now()
    const tick = () => {
      const elapsed = Date.now() - started
      const p = Math.min(1, elapsed / 3200)
      setVoiceProgress(p)
      if (p < 1) requestAnimationFrame(tick)
      else setVoicePlaying(false)
    }
    requestAnimationFrame(tick)
  }

  const togglePin = (id: string) => {
    setPinnedId((cur) => (cur === id ? null : id))
    setQueue((items) => items.map((it) => ({ ...it, pinned: it.id === id ? !it.pinned : false })))
  }

  const runInstantAppDemo = () => {
    const q = instantIntent.trim()
    if (q.length < 6) return
    setInstantGenerating(true)
    setInstantPreview(null)
    window.setTimeout(() => {
      setInstantPreview(generateInstantAppPreview(q))
      setInstantGenerating(false)
    }, 1600)
  }

  const screenTone = (tone: InstantAppScreen['tone']) => {
    if (tone === 'mint') return 'rounded-sm border border-mint/50 bg-slate-950/30 text-mint'
    if (tone === 'rose') return 'rounded-sm border border-rose/50 bg-slate-950/30 text-rose'
    return 'rounded-sm border border-sky-500/45 bg-sky-500/10 text-sky-200'
  }

  return (
    <div className="mx-auto max-w-[min(100%,1400px)] px-4 py-6 md:px-6 md:py-8">
      {/* 外：金属镜框 · 内：亮镜片视野 */}
      <div className="glasses-frame-bezel relative p-2 shadow-[0_20px_48px_rgba(56,189,248,0.12)] md:p-2.5">
        <div className="glasses-lens-field relative min-h-[min(88vh,940px)] w-full overflow-hidden border border-sky-300/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-95"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 14%, rgba(125,211,252,0.2), transparent 52%), radial-gradient(ellipse at 80% 74%, rgba(52,211,153,0.1), transparent 48%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230ea5e9\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />

        {/* HUD frame */}
        {[
          'left-5 top-5 border-l-2 border-t-2',
          'right-5 top-5 border-r-2 border-t-2',
          'left-5 bottom-5 border-l-2 border-b-2',
          'right-5 bottom-5 border-r-2 border-b-2',
        ].map((c) => (
          <div key={c} className={`pointer-events-none absolute h-10 w-10 border-sky-400/45 ${c}`} aria-hidden />
        ))}

        {/* 顶栏：标题 + 敏感度 + 会话状态（全部在同一视野框内） */}
        <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-center justify-between gap-3 md:left-5 md:right-5 md:top-4">
          <div className="glasses-tui min-w-0 text-sky-950 drop-shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-sky-600">[HUD] 单画布 JIT</p>
            <h1 className="text-base font-bold leading-tight md:text-lg">Part 2 · 眼镜 · TUI 叠显</h1>
            <p className="mt-0.5 hidden max-w-lg text-[10px] text-sky-800/90 md:block">
              文本线框界面 · 余光可读 · 模拟走路时仍要看路
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className={jitCardClass(sensitivity) + ' !py-1.5 !px-2 text-[10px] text-sky-100'}>
              <span className="text-sky-400">JIT</span> SESS
            </span>
            <button
              type="button"
              onClick={() => setHideUnverified((v) => !v)}
              className={jitCardClass(sensitivity) + ' !py-1.5 !px-2 text-[10px] text-sky-300 hover:text-sky-100'}
            >
              {hideUnverified ? '显示未验证' : '隐藏未验证'}
            </button>
            <div className={jitCardClass(sensitivity) + ' !flex !w-[128px] !flex-col !py-1.5 !px-2'}>
              <p className="text-[9px] uppercase tracking-wider text-sky-500">光晕</p>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="mt-1 w-full accent-gold"
                aria-label="JIT 视觉敏感度"
              />
            </div>
          </div>
        </div>

        {/* People */}
        {PEOPLE.filter((p) => !hideUnverified || p.verified).map((p) => (
          <div
            key={p.id}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: p.x, top: p.y }}
          >
            <div
              className={`glasses-tui flex h-14 w-14 items-center justify-center border-2 bg-slate-950/45 text-xs text-sky-100 shadow-sm backdrop-blur-sm ${
                p.verified ? 'border-mint text-mint' : 'border-sky-500/40 text-sky-500'
              }`}
            >
              {p.verified ? 'OK' : '?'}
            </div>
            <span className="glasses-tui max-w-[120px] text-center text-[10px] text-sky-950/90">{p.name}</span>
          </div>
        ))}

        <motion.div
          className="pointer-events-none absolute z-10 h-3 w-3 rounded-sm border border-rose-300 bg-rose-500/90 shadow-md shadow-rose-500/30"
          initial={{ left: '50%', top: '50%' }}
          animate={{ left: ['46%', '58%', '50%'], top: ['46%', '42%', '50%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        {/* Main JIT contract — large center */}
        <AnimatePresence>
          {jitVisible && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              className={`absolute left-1/2 top-[24%] z-30 w-[min(96%,600px)] -translate-x-1/2 md:top-[26%] ${jitCardClass(sensitivity)} !p-4 md:!p-5`}
              role="dialog"
              aria-label="即时合同浮窗"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-500/30 pb-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-sky-500">[CONTRACT]</p>
                  <h2 className="mt-1 text-base font-semibold text-sky-100 md:text-lg">{clauseData.title}</h2>
                  <p className="mt-0.5 text-[10px] text-mint">RISK: {clauseData.risk}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setJitVisible(false)}
                  className="rounded-sm border border-sky-500/40 bg-slate-950/40 px-2 py-1 text-[10px] text-sky-300 hover:bg-slate-950/60"
                  aria-label="关闭主浮窗"
                >
                  [ESC]
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {(Object.keys(CLAUSES) as ClauseKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setClause(key)
                      setHighlight(false)
                      setSigned(false)
                    }}
                    className={`rounded-sm border px-2 py-1 text-[10px] transition-colors ${
                      clause === key
                        ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                        : 'border-sky-500/25 text-sky-400 hover:border-sky-400/50 hover:text-sky-200'
                    }`}
                  >
                    {CLAUSES[key].tag}
                  </button>
                ))}
              </div>

              <p
                className={`mt-4 leading-relaxed text-sky-200/95 ${highlight ? 'rounded-sm border border-sky-400/40 bg-slate-950/50 p-3 text-sky-50' : ''}`}
              >
                {clauseData.body}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHighlight((h) => !h)}
                  className="rounded-sm border border-sky-500/40 bg-slate-950/35 px-3 py-1.5 text-[11px] text-sky-200 hover:bg-slate-950/55"
                >
                  {highlight ? '取消高亮' : '高亮风险句'}
                </button>
                <button
                  type="button"
                  onClick={startVoiceDemo}
                  className="rounded-sm border border-sky-500/40 bg-slate-950/35 px-3 py-1.5 text-[11px] text-sky-200 hover:bg-slate-950/55"
                >
                  {voicePlaying ? '停止语音示意' : '语音解释（示意）'}
                </button>
                <button
                  type="button"
                  onClick={() => setSigned(true)}
                  disabled={signed}
                  className="rounded-sm border border-sky-400/60 bg-sky-500/30 px-3 py-1.5 text-[11px] font-medium text-sky-50 hover:bg-sky-500/45 disabled:cursor-default disabled:opacity-60"
                >
                  {signed ? '已请求戒指确认' : '发起签署'}
                </button>
              </div>
              {voicePlaying && (
                <div className="mt-3">
                  <div className="h-1 overflow-hidden rounded-sm bg-slate-900/80">
                    <div
                      className="h-full bg-mint transition-[width] duration-75 ease-linear"
                      style={{ width: `${voiceProgress * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-sky-500">TTS 进度 · 演示</p>
                </div>
              )}
              {signed && (
                <p className="mt-3 text-[11px] text-mint">&gt; 已推送 Signet · 戒指阻尼确认（演示）</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!jitVisible && (
          <button
            type="button"
            onClick={() => {
              setJitVisible(true)
              setSigned(false)
            }}
            className="glasses-tui absolute bottom-[5.5rem] left-1/2 z-30 -translate-x-1/2 rounded-sm border border-sky-400/70 bg-sky-500/35 px-4 py-2 text-[11px] font-medium text-sky-50 shadow-md backdrop-blur-sm md:px-6 md:text-xs"
          >
            重新打开 JIT 主浮窗
          </button>
        )}

        {/* 口述即产品：结果层（单层面板，仍在同一视野框内） */}
        <AnimatePresence>
          {(instantGenerating || instantPreview) && (
            <motion.div
              key="instant-layer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute inset-x-3 bottom-[5.75rem] top-[30%] z-40 flex flex-col overflow-hidden rounded-sm border border-sky-500/45 bg-slate-950/52 shadow-[0_0_28px_rgba(56,189,248,0.12)] backdrop-blur-md md:inset-x-6 md:bottom-[6rem] md:top-[28%]"
            >
              {instantGenerating && (
                <div className="glasses-tui flex flex-1 flex-col justify-center p-4 text-sky-100">
                  <p className="text-sky-200">&gt; 解析意图…</p>
                  <p className="mt-2 text-[10px] text-sky-500">聊天/地图 → TUI 预览 · ~1.6s</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-sm bg-slate-900/90">
                    <motion.div
                      className="h-full bg-gradient-to-r from-sky-400 via-mint to-sky-400"
                      initial={{ width: '6%' }}
                      animate={{ width: '94%' }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
              {!instantGenerating && instantPreview && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sky-500/35 px-3 py-2">
                    <div className="glasses-tui min-w-0 text-sky-100">
                      <p className="text-[10px] uppercase tracking-wider text-sky-500">[GEN] 口述即产品</p>
                      <p className="truncate text-sm font-semibold text-sky-50 md:text-base">{instantPreview.productName}</p>
                      <p className="text-[10px] text-mint">{instantPreview.tagline}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInstantPreview(null)}
                      className="glasses-tui shrink-0 rounded-sm border border-sky-500/40 px-2 py-1 text-[10px] text-sky-300 hover:bg-slate-950/40"
                    >
                      [X]
                    </button>
                  </div>
                  <div className="glasses-tui min-h-0 flex-1 overflow-y-auto p-3 text-sky-200">
                    <p className="text-[10px] text-sky-500">
                      输入 <span className="text-sky-200">「{instantPreview.userIntentEcho}」</span>
                    </p>
                    <p className="mt-1 text-[10px] text-mint">{instantPreview.etaLine}</p>

                    {(instantPreview.uiMode === 'chat' || instantPreview.uiMode === 'map' || instantPreview.uiMode === 'split') && (
                      <p className="mt-3 text-[10px] uppercase tracking-wider text-sky-500">--- TUI 预览 ---</p>
                    )}

                    {instantPreview.uiMode === 'chat' && instantPreview.chatUi && (
                      <div className="mt-3">
                        <InstantChatVisual data={instantPreview.chatUi} />
                      </div>
                    )}

                    {instantPreview.uiMode === 'map' && instantPreview.mapUi && (
                      <div className="mt-3">
                        <InstantMapVisual data={instantPreview.mapUi} />
                      </div>
                    )}

                    {instantPreview.uiMode === 'split' && instantPreview.chatUi && instantPreview.mapUi && (
                      <div className="mt-3 grid min-h-0 gap-3 md:grid-cols-2 md:items-stretch">
                        <InstantChatVisual data={instantPreview.chatUi} />
                        <InstantMapVisual data={instantPreview.mapUi} />
                      </div>
                    )}

                    {instantPreview.uiMode === 'scaffold' && instantPreview.modules && instantPreview.screens && (
                      <>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {instantPreview.modules.map((m, i) => (
                            <motion.div
                              key={m.name}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.04 * i }}
                              className={`${jitCardClass(sensitivity)} !p-3`}
                            >
                              <p className="text-[11px] font-semibold text-sky-100">{m.name}</p>
                              <p className="mt-1 text-[10px] leading-relaxed text-sky-400">{m.desc}</p>
                            </motion.div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] uppercase tracking-wider text-sky-500">[SCAFFOLD] 屏结构</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {instantPreview.screens.map((s) => (
                              <div
                                key={s.label}
                                className={`flex min-h-[52px] min-w-[68px] flex-1 flex-col justify-between border px-2 py-1.5 text-[10px] font-medium ${screenTone(s.tone)}`}
                              >
                                <span>{s.label}</span>
                                <span className="text-[9px] font-normal opacity-80">占位</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {instantPreview.codeSnippet && (
                          <div className={`${jitCardClass(sensitivity)} mt-3 !p-0 overflow-hidden`}>
                            <div className="border-b border-sky-500/30 px-2 py-1 text-[10px] text-sky-500">routes.ts</div>
                            <pre className="max-h-28 overflow-auto bg-slate-950/50 p-2 text-[10px] leading-relaxed text-mint">
                              {instantPreview.codeSnippet}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底栏：口述输入（同一视野框最下层） */}
        <div className="absolute bottom-3 left-3 right-3 z-30 md:left-5 md:right-5">
          <div className={`${jitCardClass(sensitivity)} !flex !flex-col gap-2 !p-2.5 md:!flex-row md:!items-end`}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-sky-500">[CMD] 口述需求</p>
              <textarea
                value={instantIntent}
                onChange={(e) => setInstantIntent(e.target.value)}
                rows={2}
                className="glasses-tui mt-1 w-full resize-none rounded-sm border border-sky-500/35 bg-slate-950/50 px-2 py-1.5 text-[11px] text-sky-100 placeholder:text-sky-600 outline-none focus:border-sky-400/60 md:text-xs"
                placeholder="例: 发消息… / 导航到…"
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={instantGenerating || instantIntent.trim().length < 6}
                onClick={runInstantAppDemo}
                className="rounded-sm border border-sky-400/60 bg-sky-500/35 px-4 py-2 text-[10px] font-medium text-sky-50 hover:bg-sky-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {instantGenerating ? '…' : 'RUN'}
              </button>
            </div>
          </div>
        </div>

        {/* JIT queue — right rail inside viewport */}
        <div className="absolute bottom-[5.75rem] right-3 z-20 flex w-[min(100%,240px)] flex-col gap-2 md:right-5 md:w-[min(100%,260px)]">
          <div className={jitCardClass(sensitivity) + ' !p-2.5'}>
            <p className="text-[10px] uppercase tracking-wider text-sky-500">[QUEUE]</p>
            <p className="mt-1 text-[10px] text-sky-500">固定 → 主上下文</p>
            <ul className="mt-2 space-y-1">
              {queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => togglePin(item.id)}
                    className={`flex w-full flex-col rounded-sm border px-2 py-1.5 text-left text-[10px] transition-colors ${
                      pinnedId === item.id
                        ? 'border-sky-400 bg-sky-500/15 text-sky-50'
                        : 'border-sky-500/25 text-sky-400 hover:border-sky-400/50 hover:text-sky-200'
                    }`}
                  >
                    <span className="font-medium text-sky-100">{item.label}</span>
                    <span className="text-[9px] text-sky-500">{item.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* JIT AI — bottom left inside viewport（与底栏错开） */}
        <div className="absolute bottom-[5.75rem] left-3 z-20 w-[min(100%,min(92vw,340px))] md:left-5 md:max-w-[380px]">
          <div className={jitCardClass(sensitivity)}>
            <p className="text-[10px] uppercase tracking-wider text-sky-500">[AI] LLM</p>
            <p className="mt-1 break-all text-[9px] text-sky-500">{API_BASE_URL}/v1/ai/generate</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="glasses-tui mt-2 w-full rounded-sm border border-sky-500/35 bg-slate-950/50 px-2 py-1.5 text-[10px] text-sky-100 placeholder:text-sky-600 outline-none focus:border-sky-400/60"
              placeholder="条款/问题…"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                disabled={aiLoading || prompt.trim().length < 8}
                onClick={async () => {
                  setAiLoading(true)
                  setAiError('')
                  try {
                    const result = await generateInsight({ prompt: prompt.trim() })
                    setAiResult(result.text)
                    setAiMeta(`${result.provider} · ${result.model}`)
                  } catch (error) {
                    if (error instanceof ApiError) setAiError(error.message)
                    else setAiError('请求失败，请稍后重试。')
                  } finally {
                    setAiLoading(false)
                  }
                }}
                className="rounded-sm border border-sky-400/60 bg-sky-500/30 px-3 py-1 text-[10px] font-medium text-sky-50 hover:bg-sky-500/45 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading ? '…' : 'REQ'}
              </button>
              <button
                type="button"
                disabled={!aiResult}
                onClick={async () => {
                  await navigator.clipboard.writeText(aiResult)
                }}
                className="rounded-sm border border-sky-500/40 px-3 py-1 text-[10px] text-sky-300 hover:bg-slate-950/40 disabled:opacity-40"
              >
                CP
              </button>
            </div>
            {aiMeta && <p className="mt-2 text-[9px] text-mint">{aiMeta}</p>}
            {aiError && <p className="mt-2 rounded-sm border border-rose-500/40 bg-rose-950/30 p-1.5 text-[10px] text-rose-300">{aiError}</p>}
            {aiResult && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-sm border border-sky-500/25 bg-slate-950/40 p-2 text-[10px] leading-relaxed text-sky-100">
                {aiResult}
              </div>
            )}
          </div>
        </div>

        {/* JIT trust + pupil — 顶角（避开顶栏） */}
        <div className="absolute left-3 top-[7.5rem] z-20 hidden max-w-[190px] md:left-5 md:top-[8.25rem] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-2.5'}>
            <p className="text-[10px] uppercase tracking-wider text-sky-500">[TRUST]</p>
            <p className="mt-1 text-[10px] leading-relaxed text-sky-400">
              OK=人源链 · ?=未验证 · 少信息降冒充
            </p>
          </div>
        </div>
        <div className="absolute right-3 top-[8.5rem] z-20 hidden w-48 md:right-5 md:top-[9rem] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-2.5'}>
            <p className="text-[10px] uppercase tracking-wider text-sky-500">[BIO]</p>
            <svg viewBox="0 0 280 56" className="mt-1 h-12 w-full" aria-hidden>
              <path d={pupilPath} fill="none" stroke="rgba(52,211,153,0.85)" strokeWidth="1.5" />
              <line x1="0" y1="28" x2="280" y2="28" stroke="rgba(56,189,248,0.25)" strokeWidth="1" />
            </svg>
            <p className="mt-1 text-[9px] text-sky-500">波形示意 · 非医学</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
