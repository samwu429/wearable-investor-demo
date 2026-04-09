import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ApiError, API_BASE_URL } from '../lib/apiClient'
import { generateInsight } from '../lib/ai'

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

  return (
    <div className="mx-auto max-w-[min(100%,1400px)] px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
            JIT UI · 眼镜视野
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">Part 2 · 即时披露（JIT）演示</h1>
          <p className="mt-3 max-w-2xl text-sm text-mist md:text-base">
            主视区放大为路演焦点：合同要点、风险与 AI 解释都以 JIT 浮窗出现，模拟「看到什么、立刻推什么」的穿戴式体验。
          </p>
        </div>
        <div className={jitCardClass(sensitivity)}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 敏感度</p>
          <p className="mt-1 text-xs text-mist">拉高后浮窗描边与光晕更强，便于投屏演示。</p>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="mt-3 w-full accent-gold"
            aria-label="JIT 视觉敏感度"
          />
          <div className="mt-1 flex justify-between text-[10px] text-mist">
            <span>克制</span>
            <span>标准</span>
            <span>路演</span>
          </div>
        </div>
      </div>

      {/* Primary AR canvas — large */}
      <div className="relative mt-8 min-h-[min(78vh,880px)] w-full overflow-hidden rounded-[2rem] border-2 border-gold/25 bg-gradient-to-br from-[#1a2030] via-[#0f141c] to-[#070b14] shadow-[0_0_80px_rgba(212,168,83,0.12)]">
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

        {/* Top JIT status bar */}
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 px-2">
          <span className={jitCardClass(sensitivity) + ' !py-2 !px-4 text-xs text-white'}>
            <span className="text-gold">JIT</span> 会话 · 跨境合同草案
          </span>
          <button
            type="button"
            onClick={() => setHideUnverified((v) => !v)}
            className={jitCardClass(sensitivity) + ' !py-2 !px-4 text-xs text-mist hover:text-white'}
          >
            {hideUnverified ? '显示未验证头像' : '隐藏未验证联系人'}
          </button>
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
              className={`absolute left-1/2 top-[14%] z-30 w-[min(96%,640px)] -translate-x-1/2 ${jitCardClass(sensitivity)} !p-6 md:!p-8`}
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
            className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-gold/40 bg-gold/90 px-8 py-3 text-sm font-semibold text-night shadow-lg shadow-gold/20"
          >
            重新打开 JIT 主浮窗
          </button>
        )}

        {/* JIT queue — right rail inside viewport */}
        <div className={`absolute bottom-6 right-4 z-20 hidden w-[min(100%,280px)] flex-col gap-2 md:flex`}>
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

        {/* JIT AI — bottom left inside viewport */}
        <div className={`absolute bottom-6 left-4 z-20 w-[min(100%,min(92vw,420px))]`}>
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

        {/* JIT trust + pupil — top corners small */}
        <div className="absolute left-4 top-20 z-20 hidden max-w-[200px] md:block">
          <div className={jitCardClass(sensitivity) + ' !p-3'}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 信任圈</p>
            <p className="mt-2 text-[11px] leading-relaxed text-mist">
              绿环：人源认证链路。灰问号：未验证，信息克制展示，降低冒充风险。
            </p>
          </div>
        </div>
        <div className="absolute right-4 top-24 z-20 hidden w-52 md:block">
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

      {/* Mobile: stack JIT queue + trust below canvas */}
      <div className="mt-6 grid gap-4 md:hidden">
        <div className={jitCardClass(sensitivity)}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">JIT · 队列</p>
          <ul className="mt-3 flex flex-col gap-2">
            {queue.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => togglePin(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-xs ${
                    pinnedId === item.id ? 'border-gold/50 bg-gold/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="font-medium text-white">{item.label}</span>
                  <span className="block text-[10px] text-mist">{item.sub}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
