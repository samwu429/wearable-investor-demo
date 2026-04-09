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
    <div className="flex max-h-[min(52vh,440px)] min-h-[200px] flex-col overflow-hidden rounded-xl border border-white/12 bg-[#0b1220] shadow-inner">
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-mint/50 to-mint/10 text-sm font-semibold text-mint ring-2 ring-white/15">
          {data.peerName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{data.peerName}</p>
          <p className="text-[10px] text-mint">{data.peerStatus}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-mist">社交</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {data.bubbles.map((b, i) => (
          <div key={i} className={`flex ${b.role === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                b.role === 'me'
                  ? 'bg-gold/25 text-white ring-1 ring-gold/40'
                  : 'bg-white/10 text-mist ring-1 ring-white/10'
              }`}
            >
              {b.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/10 p-2">
        <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-mist">输入消息…</div>
        <button type="button" className="rounded-xl bg-gold px-4 text-xs font-semibold text-night">
          发送
        </button>
      </div>
    </div>
  )
}

function InstantMapVisual({ data }: { data: InstantMapUi }) {
  return (
    <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-xl border border-mint/35 bg-gradient-to-br from-[#0a1628] via-[#0f2844] to-[#0a1420]">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <p className="absolute left-3 top-2 z-20 text-[11px] font-semibold text-white drop-shadow-md">{data.headline}</p>
      <svg className="relative z-10 h-[200px] w-full md:h-[min(240px,28vh)]" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M 48 170 Q 130 36 272 52"
          fill="none"
          stroke="rgba(52,211,191,0.95)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <circle cx="48" cy="170" r="9" fill="#d4a853" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
        <circle cx="272" cy="52" r="11" fill="#fb7185" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
      </svg>
      <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <span className="rounded-lg bg-black/55 px-2 py-1 text-mist ring-1 ring-white/10">{data.fromLabel}</span>
        <span className="rounded-lg bg-mint/20 px-2 py-1 font-medium text-mint ring-1 ring-mint/30">
          {data.travelMode} · 约 {data.minutes} 分钟
        </span>
        <span className="rounded-lg bg-black/55 px-2 py-1 text-white ring-1 ring-white/10">{data.toLabel}</span>
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
        第 7.2 条：若乙方延迟交付超过 <strong className="text-gold">14</strong> 个自然日，甲方有权终止协议并要求按日计违约金。
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
        第 11 条：任一方重大违约且未在 <strong className="text-gold">30</strong> 日内补救的，守约方可书面终止；已交付成果按里程碑结算。
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
  const glow = 12 + intensity * 28
  return `rounded-2xl border border-gold/35 bg-night/88 p-4 shadow-[0_0_${glow}px_rgba(212,168,83,0.18)] backdrop-blur-md ring-1 ring-white/10`
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
    if (tone === 'mint') return 'border-mint/45 bg-mint/10 text-mint'
    if (tone === 'rose') return 'border-rose/45 bg-rose/10 text-rose'
    return 'border-gold/45 bg-gold/15 text-gold'
  }

  return (
    <div className="mx-auto max-w-[min(100%,1400px)] px-4 py-6 md:px-6 md:py-8">
      {/* 穿戴演示：仅保留单一视野框，所有 JIT（合同 / 口述生成 / AI / 队列）均在框内 */}
      <div className="relative min-h-[min(88vh,940px)] w-full overflow-hidden rounded-[2rem] border-2 border-gold/25 bg-gradient-to-br from-[#1a2030] via-[#0f141c] to-[#070b14] shadow-[0_0_80px_rgba(212,168,83,0.12)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 25% 18%, rgba(52,211,191,0.2), transparent 55%), radial-gradient(ellipse at 78% 70%, rgba(212,168,83,0.18), transparent 50%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />

        {/* HUD frame */}
        {[
          'left-5 top-5 border-l-2 border-t-2',
          'right-5 top-5 border-r-2 border-t-2',
          'left-5 bottom-5 border-l-2 border-b-2',
          'right-5 bottom-5 border-r-2 border-b-2',
        ].map((c) => (
          <div key={c} className={`pointer-events-none absolute h-12 w-12 border-gold/60 ${c}`} aria-hidden />
        ))}

        {/* 顶栏：标题 + 敏感度 + 会话状态（全部在同一视野框内） */}
        <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-center justify-between gap-3 md:left-5 md:right-5 md:top-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">穿戴视野 · 单一 JIT 画布</p>
            <h1 className="font-display text-lg font-bold leading-tight text-white md:text-2xl">Part 2 · 眼镜即时界面</h1>
            <p className="mt-0.5 hidden max-w-lg text-[11px] text-mist md:block">
              合同、口述生成、AI 解释、队列均在同一视野中叠加——模拟真实眼镜上的连续 JIT。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className={jitCardClass(sensitivity) + ' !py-1.5 !px-3 text-[11px] text-white'}>
              <span className="text-gold">JIT</span> 会话
            </span>
            <button
              type="button"
              onClick={() => setHideUnverified((v) => !v)}
              className={jitCardClass(sensitivity) + ' !py-1.5 !px-3 text-[11px] text-mist hover:text-white'}
            >
              {hideUnverified ? '显示未验证' : '隐藏未验证'}
            </button>
            <div className={jitCardClass(sensitivity) + ' !flex !w-[140px] !flex-col !py-2 !px-3'}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gold">光晕</p>
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
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 bg-night/85 text-sm font-medium backdrop-blur ${
                p.verified ? 'border-mint text-mint shadow-[0_0_28px_rgba(52,211,191,0.45)]' : 'border-mist/50 text-mist'
              }`}
            >
              {p.verified ? '真人' : '?'}
            </div>
            <span className="max-w-[120px] text-center text-[11px] text-mist">{p.name}</span>
          </div>
        ))}

        <motion.div
          className="pointer-events-none absolute z-10 h-4 w-4 rounded-full bg-rose/90 shadow-lg shadow-rose/50 ring-2 ring-white/40"
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
              className={`absolute left-1/2 top-[24%] z-30 w-[min(96%,600px)] -translate-x-1/2 md:top-[26%] ${jitCardClass(sensitivity)} !p-5 md:!p-7`}
              role="dialog"
              aria-label="即时合同浮窗"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">JIT · 合同要点</p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-white md:text-2xl">{clauseData.title}</h2>
                  <p className="mt-1 text-xs text-mint">风险域：{clauseData.risk}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setJitVisible(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-mist hover:bg-white/10"
                  aria-label="关闭主浮窗"
                >
                  收起
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(CLAUSES) as ClauseKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setClause(key)
                      setHighlight(false)
                      setSigned(false)
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors ${
                      clause === key
                        ? 'bg-gold/20 text-gold ring-gold/50'
                        : 'bg-white/5 text-mist ring-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {CLAUSES[key].tag}
                  </button>
                ))}
              </div>

              <p
                className={`mt-5 text-base leading-relaxed text-mist md:text-lg ${highlight ? 'rounded-xl bg-gold/10 p-4 text-white ring-1 ring-gold/35' : ''}`}
              >
                {clauseData.body}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHighlight((h) => !h)}
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  {highlight ? '取消高亮' : '高亮风险句'}
                </button>
                <button
                  type="button"
                  onClick={startVoiceDemo}
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  {voicePlaying ? '停止语音示意' : '语音解释（示意）'}
                </button>
                <button
                  type="button"
                  onClick={() => setSigned(true)}
                  disabled={signed}
                  className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night hover:bg-gold-dim disabled:cursor-default disabled:opacity-60"
                >
                  {signed ? '已请求戒指确认' : '发起签署'}
                </button>
              </div>
              {voicePlaying && (
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-mint transition-[width] duration-75 ease-linear"
                      style={{ width: `${voiceProgress * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-mist">演示用 TTS 进度条 · 非真实语音合成</p>
                </div>
              )}
              {signed && (
                <p className="mt-4 text-sm text-mint">已推送至 Signet · 请在戒指上完成阻尼确认（演示）</p>
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
            className="absolute bottom-[5.5rem] left-1/2 z-30 -translate-x-1/2 rounded-full border border-gold/40 bg-gold/90 px-6 py-2.5 text-xs font-semibold text-night shadow-lg shadow-gold/20 md:px-8 md:py-3 md:text-sm"
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
              className="absolute inset-x-3 bottom-[5.75rem] top-[30%] z-40 flex flex-col overflow-hidden rounded-2xl border border-gold/40 bg-night/95 shadow-[0_0_48px_rgba(212,168,83,0.2)] backdrop-blur-md ring-1 ring-white/10 md:inset-x-6 md:bottom-[6rem] md:top-[28%]"
            >
              {instantGenerating && (
                <div className="flex flex-1 flex-col justify-center p-6">
                  <p className="text-sm font-medium text-white">正在理解意图并渲染界面…</p>
                  <p className="mt-2 text-xs text-mist">若为聊天 / 地图类需求，将直接弹出拟真 UI（前端模拟，约 1.6s）</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold via-mint to-gold"
                      initial={{ width: '6%' }}
                      animate={{ width: '94%' }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
              {!instantGenerating && instantPreview && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 口述即产品</p>
                      <p className="truncate font-display text-base font-semibold text-white md:text-lg">{instantPreview.productName}</p>
                      <p className="text-xs text-mint">{instantPreview.tagline}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInstantPreview(null)}
                      className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-mist hover:bg-white/10 hover:text-white"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <p className="text-[11px] text-mist">
                      你的说法：<span className="text-white/90">「{instantPreview.userIntentEcho}」</span>
                    </p>
                    <p className="mt-1 text-[10px] text-mint/90">{instantPreview.etaLine}</p>

                    {(instantPreview.uiMode === 'chat' || instantPreview.uiMode === 'map' || instantPreview.uiMode === 'split') && (
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gold">即时界面预览</p>
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
                              <p className="text-xs font-semibold text-white">{m.name}</p>
                              <p className="mt-1 text-[11px] leading-relaxed text-mist">{m.desc}</p>
                            </motion.div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">结构示意（非聊天/地图类）</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {instantPreview.screens.map((s) => (
                              <div
                                key={s.label}
                                className={`flex min-h-[56px] min-w-[72px] flex-1 flex-col justify-between rounded-xl border px-2 py-2 text-[11px] font-medium ${screenTone(s.tone)}`}
                              >
                                <span>{s.label}</span>
                                <span className="text-[9px] font-normal opacity-80">占位</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {instantPreview.codeSnippet && (
                          <div className={`${jitCardClass(sensitivity)} mt-4 !p-0 !ring-0 overflow-hidden`}>
                            <div className="border-b border-white/10 bg-black/40 px-3 py-1.5 text-[10px] text-mist">routes（演示）</div>
                            <pre className="max-h-28 overflow-auto p-3 text-[10px] leading-relaxed text-mint/90">
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
          <div className={`${jitCardClass(sensitivity)} !flex !flex-col gap-2 !p-3 md:!flex-row md:!items-end`}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 口述需求</p>
              <textarea
                value={instantIntent}
                onChange={(e) => setInstantIntent(e.target.value)}
                rows={2}
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-void/70 px-3 py-2 text-[12px] text-white outline-none ring-gold/30 focus:ring-1 md:text-sm"
                placeholder="例如：给妈妈发消息我想吃糖醋排骨 / 带我去图书馆并生成地图（演示：前端按意图弹出聊天或地图 UI）"
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={instantGenerating || instantIntent.trim().length < 6}
                onClick={runInstantAppDemo}
                className="rounded-full bg-gold px-5 py-2.5 text-xs font-semibold text-night hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-50"
              >
                {instantGenerating ? '生成中…' : '即刻生成'}
              </button>
            </div>
          </div>
        </div>

        {/* JIT queue — right rail inside viewport */}
        <div className="absolute bottom-[5.75rem] right-3 z-20 flex w-[min(100%,240px)] flex-col gap-2 md:right-5 md:w-[min(100%,260px)]">
          <div className={jitCardClass(sensitivity) + ' !p-3'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 队列</p>
            <p className="mt-1 text-[11px] text-mist">点击固定到主浮窗上下文（演示）。</p>
            <ul className="mt-3 space-y-2">
              {queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => togglePin(item.id)}
                    className={`flex w-full flex-col rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      pinnedId === item.id
                        ? 'border-gold/50 bg-gold/10 text-white'
                        : 'border-white/10 bg-white/5 text-mist hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="font-medium text-white">{item.label}</span>
                    <span className="text-[10px] text-mist">{item.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* JIT AI — bottom left inside viewport（与底栏错开） */}
        <div className="absolute bottom-[5.75rem] left-3 z-20 w-[min(100%,min(92vw,340px))] md:left-5 md:max-w-[380px]">
          <div className={jitCardClass(sensitivity)}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · AI 解释</p>
            <p className="mt-1 text-[11px] text-mist">实时调用后端，不暴露密钥。Endpoint: {API_BASE_URL}/v1/ai/generate</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl border border-white/10 bg-void/70 px-3 py-2 text-xs text-white outline-none ring-gold/40 focus:ring-1"
              placeholder="输入希望 AI 解释的条款或问题"
            />
            <div className="mt-3 flex flex-wrap gap-2">
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
                className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-night hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading ? '生成中…' : '实时解释'}
              </button>
              <button
                type="button"
                disabled={!aiResult}
                onClick={async () => {
                  await navigator.clipboard.writeText(aiResult)
                }}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-40"
              >
                复制
              </button>
            </div>
            {aiMeta && <p className="mt-2 text-[10px] text-mint">{aiMeta}</p>}
            {aiError && <p className="mt-2 rounded-lg bg-rose/10 p-2 text-xs text-rose">{aiError}</p>}
            {aiResult && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-void/80 p-3 text-xs leading-relaxed text-white">
                {aiResult}
              </div>
            )}
          </div>
        </div>

        {/* JIT trust + pupil — 顶角（避开顶栏） */}
        <div className="absolute left-3 top-[7.5rem] z-20 hidden max-w-[190px] md:left-5 md:top-[8.25rem] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-3'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 信任圈</p>
            <p className="mt-2 text-[11px] leading-relaxed text-mist">
              绿环：人源认证链路。灰问号：未验证，信息克制展示，降低冒充风险。
            </p>
          </div>
        </div>
        <div className="absolute right-3 top-[8.5rem] z-20 hidden w-48 md:right-5 md:top-[9rem] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-3'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 生物采样</p>
            <svg viewBox="0 0 280 56" className="mt-2 h-14 w-full" aria-hidden>
              <path d={pupilPath} fill="none" stroke="rgba(52,211,191,0.9)" strokeWidth="2" />
              <line x1="0" y1="28" x2="280" y2="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </svg>
            <p className="mt-1 text-[10px] text-mist">瞳孔波形仅为隐喻 · 非医学数据</p>
          </div>
        </div>
      </div>
    </div>
  )
}
