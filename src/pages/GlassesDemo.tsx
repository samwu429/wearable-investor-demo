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
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-cyan-400/50 bg-slate-950/50 px-2 py-1.5">
        <div className="text-slate-100">
          <span className="text-amber-400">#</span> CHAT <span className="text-cyan-400">::</span>{' '}
          <span className="font-medium text-white">{data.peerName}</span>
        </div>
        <div className="text-[10px] font-medium text-emerald-400">{data.peerStatus}</div>
        <span className="text-[10px] text-cyan-300">[SOC]</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-2">
        {data.bubbles.map((b, i) => (
          <p key={i} className="break-words text-slate-100">
            <span className={b.role === 'me' ? 'font-semibold text-cyan-300' : 'font-semibold text-slate-400'}>
              {b.role === 'me' ? 'you>' : 'peer>'}
            </span>{' '}
            {b.text}
          </p>
        ))}
      </div>
      <div className="border-t border-cyan-400/50 bg-slate-950/40 px-2 py-1.5">
        <div className="text-slate-400">
          &gt; <span className="text-cyan-400">_</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-500">[缓冲区: 输入消息…]</span>
          <button
            type="button"
            className="rounded-sm border border-cyan-500/70 bg-cyan-600/40 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-cyan-600/60"
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
      <div className="border-b border-cyan-400/50 bg-slate-950/50 px-2 py-1 text-slate-200">
        <span className="text-amber-400">MAP</span> <span className="text-cyan-400">::</span>{' '}
        <span className="text-white">{data.headline}</span>
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
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-cyan-400/50 bg-slate-950/90 px-2 py-1.5 text-[10px] text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-semibold text-cyan-400">[A]</span>
          <span className="text-slate-100">{data.fromLabel}</span>
        </div>
        <div className="text-center font-medium text-emerald-400">
          {data.travelMode} ~ {data.minutes} min
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-semibold text-cyan-400">[B]</span>
          <span className="text-slate-100">{data.toLabel}</span>
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
        第 7.2 条：若乙方延迟交付超过 <strong className="text-amber-300">14</strong> 个自然日，甲方有权终止协议并要求按日计违约金。
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
        第 11 条：任一方重大违约且未在 <strong className="text-amber-300">30</strong> 日内补救的，守约方可书面终止；已交付成果按里程碑结算。
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
    if (tone === 'mint') return 'rounded-sm border-2 border-emerald-500/60 bg-slate-950/70 text-emerald-300'
    if (tone === 'rose') return 'rounded-sm border-2 border-rose-500/60 bg-slate-950/70 text-rose-300'
    return 'rounded-sm border-2 border-cyan-500/55 bg-slate-950/70 text-cyan-200'
  }

  return (
    <div className="mx-auto max-w-[min(100%,1400px)] px-4 py-6 md:px-6 md:py-8">
      {/* 外：金属镜框 · 内：亮镜片视野 */}
      <div className="glasses-frame-bezel relative p-2 shadow-[0_20px_48px_rgba(56,189,248,0.12)] md:p-2.5">
        <div className="glasses-lens-field relative min-h-[min(88vh,940px)] w-full overflow-hidden border border-sky-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
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

        {/* 顶栏：左侧高对比说明 + 右侧 TUI 控件 */}
        <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-start justify-between gap-3 md:left-5 md:right-5 md:top-4">
          <div className="max-w-[min(100%,28rem)] rounded-sm border border-sky-300/60 bg-white/95 px-3 py-2 shadow-md">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">镜片视野 · 单画布</p>
            <h1 className="text-base font-bold leading-tight text-slate-900 md:text-lg">Part 2 · 眼镜 TUI</h1>
            <p className="mt-0.5 hidden text-[10px] leading-snug text-slate-600 md:block">
              深色块为叠显终端；浅色区模拟透视路面
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className={jitCardClass(sensitivity) + ' !py-1.5 !px-2 text-[10px] text-slate-100'}>
              <span className="text-cyan-400">JIT</span> SESS
            </span>
            <button
              type="button"
              onClick={() => setHideUnverified((v) => !v)}
              className={jitCardClass(sensitivity) + ' !py-1.5 !px-2 text-[10px] text-slate-300 hover:text-white'}
            >
              {hideUnverified ? '显示未验证' : '隐藏未验证'}
            </button>
            <div className={jitCardClass(sensitivity) + ' !flex !w-[128px] !flex-col !py-1.5 !px-2'}>
              <p className="text-[9px] uppercase tracking-wider text-amber-300">光晕</p>
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
              className={`glasses-tui flex h-14 w-14 items-center justify-center border-2 bg-slate-950/90 text-xs font-bold text-white shadow-md backdrop-blur-sm ${
                p.verified ? 'border-emerald-400 text-emerald-300' : 'border-cyan-500 text-cyan-300'
              }`}
            >
              {p.verified ? 'OK' : '?'}
            </div>
            <span className="max-w-[130px] rounded-sm bg-slate-900/85 px-1.5 py-0.5 text-center text-[9px] font-medium text-white shadow-sm backdrop-blur-sm">
              {p.name}
            </span>
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
              className={`absolute left-1/2 top-[22%] z-30 max-h-[min(48vh,400px)] w-[min(94vw,560px)] -translate-x-1/2 overflow-y-auto md:top-[24%] md:max-h-[min(52vh,440px)] md:w-[min(520px,calc(100%-36rem))] ${jitCardClass(sensitivity)} !p-4 md:!p-5`}
              role="dialog"
              aria-label="即时合同浮窗"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cyan-500/45 pb-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[CONTRACT]</p>
                  <h2 className="mt-1 text-base font-semibold text-white md:text-lg">{clauseData.title}</h2>
                  <p className="mt-0.5 text-[10px] font-medium text-emerald-400">RISK: {clauseData.risk}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setJitVisible(false)}
                  className="rounded-sm border border-cyan-500/60 bg-slate-950/60 px-2 py-1 text-[10px] font-medium text-cyan-200 hover:bg-slate-900"
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
                    className={`rounded-sm border px-2 py-1 text-[10px] font-medium transition-colors ${
                      clause === key
                        ? 'border-cyan-400 bg-cyan-600/35 text-white'
                        : 'border-slate-600 text-slate-400 hover:border-cyan-500/50 hover:text-slate-200'
                    }`}
                  >
                    {CLAUSES[key].tag}
                  </button>
                ))}
              </div>

              <p
                className={`mt-4 leading-relaxed text-slate-200 ${highlight ? 'rounded-sm border-2 border-amber-400/70 bg-slate-950/80 p-3 text-white' : ''}`}
              >
                {clauseData.body}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHighlight((h) => !h)}
                  className="rounded-sm border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:border-cyan-500/50 hover:bg-slate-800"
                >
                  {highlight ? '取消高亮' : '高亮风险句'}
                </button>
                <button
                  type="button"
                  onClick={startVoiceDemo}
                  className="rounded-sm border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:border-cyan-500/50 hover:bg-slate-800"
                >
                  {voicePlaying ? '停止语音示意' : '语音解释（示意）'}
                </button>
                <button
                  type="button"
                  onClick={() => setSigned(true)}
                  disabled={signed}
                  className="rounded-sm border border-cyan-500/80 bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-cyan-500 disabled:cursor-default disabled:opacity-60"
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
                  <p className="mt-1 text-[10px] text-slate-500">TTS 进度 · 演示</p>
                </div>
              )}
              {signed && (
                <p className="mt-3 text-[11px] font-medium text-emerald-400">&gt; 已推送 Signet · 戒指阻尼确认（演示）</p>
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
            className="glasses-tui absolute bottom-[8.5rem] left-1/2 z-50 -translate-x-1/2 rounded-sm border border-cyan-500 bg-cyan-600 px-4 py-2 text-[11px] font-semibold text-white shadow-lg md:bottom-[8rem] md:px-6 md:text-xs"
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
              className="absolute inset-x-3 bottom-[8rem] top-[30%] z-[35] flex flex-col overflow-hidden rounded-sm border-2 border-cyan-500/50 bg-slate-950/90 shadow-xl backdrop-blur-md md:inset-x-6 md:bottom-[8.25rem] md:left-[272px] md:right-[260px] md:top-[26%]"
            >
              {instantGenerating && (
                <div className="glasses-tui flex flex-1 flex-col justify-center p-4 text-slate-100">
                  <p className="text-white">&gt; 解析意图…</p>
                  <p className="mt-2 text-[10px] text-slate-400">聊天/地图 → TUI 预览 · ~1.6s</p>
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
                    <div className="glasses-tui min-w-0 text-slate-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[GEN] 口述即产品</p>
                      <p className="truncate text-sm font-semibold text-white md:text-base">{instantPreview.productName}</p>
                      <p className="text-[10px] font-medium text-emerald-400">{instantPreview.tagline}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInstantPreview(null)}
                      className="glasses-tui shrink-0 rounded-sm border border-slate-600 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-cyan-500/50 hover:bg-slate-900"
                    >
                      [X]
                    </button>
                  </div>
                  <div className="glasses-tui min-h-0 flex-1 overflow-y-auto p-3 text-slate-200">
                    <p className="text-[10px] text-slate-500">
                      输入 <span className="text-slate-100">「{instantPreview.userIntentEcho}」</span>
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-emerald-400">{instantPreview.etaLine}</p>

                    {(instantPreview.uiMode === 'chat' || instantPreview.uiMode === 'map' || instantPreview.uiMode === 'split') && (
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">--- TUI 预览 ---</p>
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
                              <p className="text-[11px] font-semibold text-white">{m.name}</p>
                              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{m.desc}</p>
                            </motion.div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[SCAFFOLD] 屏结构</p>
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
                            <div className="border-b border-slate-600 px-2 py-1 text-[10px] font-medium text-slate-400">routes.ts</div>
                            <pre className="max-h-28 overflow-auto bg-slate-950 p-2 text-[10px] leading-relaxed text-emerald-400">
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

        {/* 底栏：口述输入 */}
        <div className="absolute bottom-3 left-3 right-3 z-40 md:left-5 md:right-5">
          <div className={`${jitCardClass(sensitivity)} !flex !flex-col gap-2 !p-2.5 md:!flex-row md:!items-end`}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[CMD] 口述需求</p>
              <textarea
                value={instantIntent}
                onChange={(e) => setInstantIntent(e.target.value)}
                rows={2}
                className="glasses-tui mt-1 w-full resize-none rounded-sm border border-slate-600 bg-slate-950/90 px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 md:text-xs"
                placeholder="例: 发消息… / 导航到…"
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={instantGenerating || instantIntent.trim().length < 6}
                onClick={runInstantAppDemo}
                className="rounded-sm border border-cyan-500 bg-cyan-600 px-4 py-2 text-[10px] font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {instantGenerating ? '…' : 'RUN'}
              </button>
            </div>
          </div>
        </div>

        {/* 队列：大屏贴右下；小屏改右上，避免与左下 AI 重叠 */}
        <div className="absolute right-3 z-30 flex w-[min(100%,248px)] flex-col gap-2 max-md:bottom-auto max-md:left-auto max-md:top-28 md:bottom-[8rem] md:right-5 md:top-auto">
          <div className={jitCardClass(sensitivity) + ' !p-2.5'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[QUEUE]</p>
            <p className="mt-1 text-[10px] text-slate-400">固定 → 主上下文</p>
            <ul className="mt-2 space-y-1">
              {queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => togglePin(item.id)}
                    className={`flex w-full flex-col rounded-sm border px-2 py-1.5 text-left text-[10px] transition-colors ${
                      pinnedId === item.id
                        ? 'border-cyan-500 bg-cyan-600/25 text-white'
                        : 'border-slate-600 text-slate-400 hover:border-cyan-500/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-medium text-slate-100">{item.label}</span>
                    <span className="text-[9px] text-slate-500">{item.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI：左下；小屏拉满宽度，上缘抬高避免与底栏挤在一起 */}
        <div className="absolute bottom-[8rem] left-3 z-30 w-[min(100%,min(92vw,360px))] max-md:right-3 max-md:max-h-[38vh] max-md:overflow-y-auto md:left-5 md:max-w-[380px]">
          <div className={jitCardClass(sensitivity)}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[AI] LLM</p>
            <p className="mt-1 break-all text-[9px] text-slate-500">{API_BASE_URL}/v1/ai/generate</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="glasses-tui mt-2 w-full rounded-sm border border-slate-600 bg-slate-950/90 px-2 py-1.5 text-[10px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
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
                className="rounded-sm border border-cyan-500 bg-cyan-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading ? '…' : 'REQ'}
              </button>
              <button
                type="button"
                disabled={!aiResult}
                onClick={async () => {
                  await navigator.clipboard.writeText(aiResult)
                }}
                className="rounded-sm border border-slate-600 px-3 py-1 text-[10px] font-medium text-slate-200 hover:border-cyan-500/50 hover:bg-slate-900 disabled:opacity-40"
              >
                CP
              </button>
            </div>
            {aiMeta && <p className="mt-2 text-[9px] text-mint">{aiMeta}</p>}
            {aiError && <p className="mt-2 rounded-sm border border-rose-500/40 bg-rose-950/30 p-1.5 text-[10px] text-rose-300">{aiError}</p>}
            {aiResult && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-sm border border-slate-600 bg-slate-950/95 p-2 text-[10px] leading-relaxed text-slate-100">
                {aiResult}
              </div>
            )}
          </div>
        </div>

        {/* JIT trust + pupil — 顶角（避开顶栏） */}
        <div className="absolute left-3 top-[9.5rem] z-20 hidden max-w-[200px] md:left-5 md:top-[10.5rem] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-2.5'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[TRUST]</p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
              OK=人源链 · ?=未验证 · 少信息降冒充
            </p>
          </div>
        </div>
        <div className="absolute right-3 top-[9.5rem] z-20 hidden w-48 md:right-5 md:top-[10.5rem] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-2.5'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">[BIO]</p>
            <svg viewBox="0 0 280 56" className="mt-1 h-12 w-full" aria-hidden>
              <path d={pupilPath} fill="none" stroke="rgba(52,211,153,0.85)" strokeWidth="1.5" />
              <line x1="0" y1="28" x2="280" y2="28" stroke="rgba(56,189,248,0.25)" strokeWidth="1" />
            </svg>
            <p className="mt-1 text-[9px] text-slate-500">波形示意 · 非医学</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
