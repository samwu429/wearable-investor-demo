import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ApiError } from '../lib/apiClient'
import { generateInsight, generateJitUiFromPrompt } from '../lib/ai'
import {
  generateInstantAppPreview,
  type InstantAppPreview,
  type InstantMapUi,
} from '../lib/mockInstantApp'

const WALK_IMAGE = `${import.meta.env.BASE_URL}glasses-walking-eye.jpg`
const WALK_PHOTO_PAGE = 'https://unsplash.com/photos/W7M6dlO7M_Y'

function looksLikeLegalQuery(q: string) {
  return /第\s*\d+|条款|违约|合同|NDA|保密|终止|解释|风险|建议|附件|管辖/.test(q)
}

function HudCorners() {
  const c = 'pointer-events-none absolute border-amber-100/35'
  return (
    <div className="pointer-events-none absolute inset-3 md:inset-6" aria-hidden>
      <div className={`${c} left-0 top-0 h-10 w-10 rounded-tl-xl border-l border-t`} />
      <div className={`${c} right-0 top-0 h-10 w-10 rounded-tr-xl border-r border-t`} />
      <div className={`${c} bottom-0 left-0 h-10 w-10 rounded-bl-xl border-b border-l`} />
      <div className={`${c} bottom-0 right-0 h-10 w-10 rounded-br-xl border-b border-r`} />
    </div>
  )
}

function SoftCenterGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        background:
          'radial-gradient(ellipse 58% 48% at 50% 44%, rgba(255,255,255,0.06) 0%, transparent 62%)',
      }}
      aria-hidden
    />
  )
}

function TrafficLights() {
  return (
    <span className="flex gap-1.5" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
    </span>
  )
}

function JitWindowChrome({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex max-h-[min(88vh,920px)] w-[min(96vw,1100px)] flex-col overflow-hidden rounded-xl border border-stone-600/80 bg-stone-900 shadow-[0_32px_120px_rgba(0,0,0,0.55)]"
    >
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-stone-700 bg-gradient-to-b from-stone-800 to-stone-850 px-3">
        <TrafficLights />
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs font-medium text-stone-200">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-lg leading-none text-stone-400 transition hover:bg-stone-700 hover:text-white"
          aria-label="关闭窗口"
        >
          ×
        </button>
      </div>
      {subtitle ? (
        <p className="shrink-0 border-b border-stone-800 bg-stone-900 px-4 py-2 text-[11px] text-stone-500">{subtitle}</p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto bg-stone-100">{children}</div>
      {footer ? (
        <div className="shrink-0 border-t border-stone-700 bg-stone-900 px-4 py-2 text-[10px] text-stone-500">{footer}</div>
      ) : null}
    </motion.div>
  )
}

function BigMapCanvas({ data }: { data: InstantMapUi }) {
  return (
    <div className="relative min-h-[220px] flex-1 bg-gradient-to-br from-sky-100 via-stone-100 to-amber-50 md:min-h-[280px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(120,113,108,0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <path
          d="M 48 180 Q 160 40 340 56"
          fill="none"
          stroke="rgba(217,119,6,0.95)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <circle cx="48" cy="180" r="7" fill="rgba(5,150,105,0.95)" />
        <circle cx="340" cy="56" r="7" fill="rgba(220,38,38,0.9)" />
      </svg>
      <div className="absolute left-3 top-3 rounded-lg border border-stone-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-800 shadow-sm backdrop-blur-sm">
        {data.headline}
      </div>
    </div>
  )
}

function JitMapPage({ preview }: { preview: InstantAppPreview }) {
  const m = preview.mapUi!
  return (
    <div className="flex h-full min-h-[320px] flex-col md:flex-row">
      <BigMapCanvas data={m} />
      <aside className="flex w-full shrink-0 flex-col gap-3 border-t border-stone-200 bg-white p-4 md:w-[300px] md:border-l md:border-t-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">路线</p>
        <p className="text-lg font-semibold text-stone-900">
          {m.fromLabel} → {m.toLabel}
        </p>
        <p className="text-sm text-stone-600">
          {m.travelMode} · 约 <span className="font-mono font-semibold">{m.minutes}</span> 分钟
        </p>
        <div className="mt-auto space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
          <p className="font-medium text-stone-800">意图</p>
          <p>{preview.userIntentEcho}</p>
        </div>
      </aside>
    </div>
  )
}

function JitChatAppPage({ preview }: { preview: InstantAppPreview }) {
  const c = preview.chatUi!
  return (
    <div className="flex h-full min-h-[360px] flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
          {c.peerName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-stone-900">{c.peerName}</p>
          <p className="truncate text-xs text-stone-500">{c.peerStatus}</p>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#ecece8] px-4 py-4">
        {c.bubbles.map((b, i) => (
          <div key={i} className={`flex ${b.role === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                b.role === 'me'
                  ? 'max-w-[85%] rounded-2xl rounded-br-md bg-sky-500 px-3 py-2 text-sm text-white shadow-sm'
                  : 'max-w-[85%] rounded-2xl rounded-bl-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm'
              }
            >
              {b.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200 bg-stone-100 px-3 py-2">
        <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs text-stone-400">
          输入消息…
          <span className="ml-auto text-[10px] text-stone-400">演示 · 非真实发送</span>
        </div>
      </div>
    </div>
  )
}

function JitSplitPage({ preview }: { preview: InstantAppPreview }) {
  const c = preview.chatUi!
  const m = preview.mapUi!
  return (
    <div className="grid min-h-[400px] grid-cols-1 divide-y divide-stone-200 md:grid-cols-2 md:divide-x md:divide-y-0">
      <div className="flex min-h-[280px] flex-col bg-white md:min-h-0">
        <div className="shrink-0 border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
          聊天 App
        </div>
        <header className="flex items-center gap-3 border-b border-stone-200 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
            {c.peerName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">{c.peerName}</p>
            <p className="truncate text-[10px] text-stone-500">{c.peerStatus}</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#ecece8] px-3 py-3">
          {c.bubbles.map((b, i) => (
            <div key={i} className={`flex ${b.role === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={
                  b.role === 'me'
                    ? 'max-w-[90%] rounded-2xl rounded-br-md bg-sky-500 px-2.5 py-1.5 text-xs text-white'
                    : 'max-w-[90%] rounded-2xl rounded-bl-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800'
                }
              >
                {b.text}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-h-[280px] flex-col md:min-h-0">
        <div className="shrink-0 border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
          导航
        </div>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <BigMapCanvas data={m} />
          <aside className="flex w-full shrink-0 flex-col justify-center gap-2 border-t border-stone-200 bg-white p-3 text-xs md:w-[200px] md:border-l md:border-t-0">
            <p className="font-semibold text-stone-900">
              {m.fromLabel} → {m.toLabel}
            </p>
            <p className="text-stone-600">
              {m.travelMode} · 约 {m.minutes} 分钟
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

const toneClass: Record<string, string> = {
  gold: 'bg-amber-100 text-amber-900 border-amber-200',
  mint: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  rose: 'bg-rose-100 text-rose-900 border-rose-200',
}

function JitScaffoldPage({ preview }: { preview: InstantAppPreview }) {
  const screens = preview.screens ?? []
  const modules = preview.modules ?? []
  return (
    <div className="flex min-h-[380px] flex-col md:flex-row">
      <nav className="flex shrink-0 gap-1 border-b border-stone-200 bg-stone-900 p-2 md:w-48 md:flex-col md:border-b-0 md:border-r">
        {screens.length ? (
          screens.map((s) => (
            <button
              key={s.label}
              type="button"
              className={`rounded-lg border px-3 py-2 text-left text-xs font-medium md:text-sm ${toneClass[s.tone] ?? 'border-stone-600 bg-stone-800 text-stone-200'}`}
            >
              {s.label}
            </button>
          ))
        ) : (
          <span className="px-2 py-2 text-xs text-stone-500">导航</span>
        )}
      </nav>
      <main className="min-w-0 flex-1 bg-stone-50 p-4">
        <p className="mb-4 text-sm text-stone-600">{preview.tagline}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => (
            <li key={m.name} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-stone-900">{m.name}</p>
              <p className="mt-1 text-sm text-stone-600">{m.desc}</p>
            </li>
          ))}
        </ul>
        {preview.codeSnippet ? (
          <pre className="mt-4 overflow-x-auto rounded-lg border border-stone-200 bg-stone-900 p-3 text-[10px] leading-relaxed text-emerald-200">
            {preview.codeSnippet}
          </pre>
        ) : null}
      </main>
    </div>
  )
}

function LegalDocPage({ text }: { text: string }) {
  return (
    <article className="min-h-[360px] bg-white px-6 py-8 text-stone-900 md:px-12">
      <h1 className="font-display text-xl font-bold text-stone-900 md:text-2xl">条款 / 法务 JIT</h1>
      <p className="mt-2 text-xs text-stone-500">以下为模型根据你当前问题生成的说明稿（演示，不构成法律意见）。</p>
      <div className="prose prose-stone mt-6 max-w-none whitespace-pre-wrap text-sm leading-relaxed md:text-base">
        {text}
      </div>
    </article>
  )
}

function JitBody({ preview }: { preview: InstantAppPreview }) {
  switch (preview.uiMode) {
    case 'map':
      return <JitMapPage preview={preview} />
    case 'chat':
      return <JitChatAppPage preview={preview} />
    case 'split':
      return <JitSplitPage preview={preview} />
    case 'scaffold':
      return <JitScaffoldPage preview={preview} />
    default:
      return null
  }
}

type PanelState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'jit'; preview: InstantAppPreview; source: 'ai' | 'fallback' }
  | { kind: 'legal'; text: string }

export function GlassesDemo() {
  const [now, setNow] = useState(() => new Date())
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [panel, setPanel] = useState<PanelState>({ kind: 'idle' })
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const closePanel = useCallback(() => setPanel({ kind: 'idle' }), [])

  const runIntent = useCallback(async () => {
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    setBusy(true)
    setToast(null)
    setPanel({ kind: 'loading' })

    try {
      if (looksLikeLegalQuery(q)) {
        const padded = q.length >= 8 ? q : `${q}\n请结合上述问题给出简要要点与风险提示（演示）。`
        const result = await generateInsight({ prompt: padded })
        setPanel({ kind: 'legal', text: result.text })
        return
      }

      try {
        const { preview } = await generateJitUiFromPrompt(q)
        setPanel({ kind: 'jit', preview, source: 'ai' })
      } catch (e) {
        const preview = generateInstantAppPreview(q)
        setPanel({ kind: 'jit', preview, source: 'fallback' })
        const msg =
          e instanceof ApiError
            ? `已用本地规则生成界面（${e.message}）`
            : '已用本地规则生成界面'
        setToast(msg)
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '请求失败，请稍后重试。'
      setToast(msg)
      setPanel({ kind: 'idle' })
    } finally {
      setBusy(false)
    }
  }, [busy, input])

  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const showOverlay = panel.kind === 'loading' || panel.kind === 'jit' || panel.kind === 'legal'

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,1680px)] flex-1 flex-col px-3 pb-4 pt-3 md:px-8 md:pb-6 md:pt-4">
      <p className="mb-2 max-w-3xl shrink-0 text-xs leading-relaxed text-mist md:mb-3 md:text-sm">
        Part 2 · <span className="font-medium text-ink">行人视角 + JIT 整页弹出</span>
        ：不保留对话记录；你说一句，系统理解意图后弹出「像电脑窗口一样」的界面。聊天类意图呈现的是
        <span className="font-medium text-ink">即时聊天 App 画面</span>，不是和助理来回聊。
      </p>

      <div className="glasses-frame-bezel glasses-frame-bezel--walk flex min-h-0 flex-1 flex-col p-2 md:p-3">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_48px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/10">
          <div
            className="absolute inset-0 scale-[1.04] bg-cover"
            style={{
              backgroundImage: `url(${WALK_IMAGE})`,
              backgroundPosition: 'center 48%',
            }}
            role="img"
            aria-label="模拟走路时透过镜片看到的前方街景（行人眼高、静态照片）"
          />
          <div className="absolute inset-0 bg-amber-950/[0.07] mix-blend-overlay" aria-hidden />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background: [
                'linear-gradient(180deg, rgba(12,10,8,0.52) 0%, rgba(12,10,8,0.06) 28%, rgba(12,10,8,0.02) 45%, rgba(12,10,8,0.12) 72%, rgba(12,10,8,0.62) 100%)',
                'radial-gradient(ellipse 92% 88% at 50% 46%, rgba(0,0,0,0) 0%, rgba(12,10,8,0.2) 100%)',
              ].join(', '),
            }}
            aria-hidden
          />
          <SoftCenterGlow />
          <HudCorners />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-stone-950/35 px-4 py-2.5 backdrop-blur-2xl md:px-6 md:py-3">
              <div className="min-w-0 pt-0.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-100/55">on foot · jit</p>
                <p className="mt-1 truncate text-sm font-medium tracking-tight text-stone-50 drop-shadow-sm md:text-base">
                  口述一句 → 整页界面
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-amber-200/20 bg-stone-950/40 px-3 py-2 text-right shadow-sm backdrop-blur-md md:px-4">
                <p className="text-[9px] font-medium uppercase tracking-wider text-stone-500">本地时间</p>
                <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-amber-50 drop-shadow-md md:text-3xl lg:text-4xl">
                  {timeStr}
                </p>
              </div>
            </header>

            <div className="relative min-h-0 flex-1">
              <AnimatePresence>
                {showOverlay ? (
                  <motion.button
                    key="backdrop"
                    type="button"
                    aria-label="点击关闭当前界面"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 cursor-default border-0 bg-black/45 backdrop-blur-[3px]"
                    onClick={closePanel}
                  />
                ) : null}
              </AnimatePresence>

              {panel.kind === 'idle' && (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="max-w-sm text-sm text-stone-200/90 drop-shadow-md">
                    下方输入一句需求。界面会像电脑窗口从视野里弹出，<span className="text-amber-100">不累计聊天记录</span>。
                  </p>
                </div>
              )}

              <AnimatePresence>
                {panel.kind === 'loading' ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-4"
                  >
                    <div className="pointer-events-auto rounded-xl border border-white/15 bg-stone-950/85 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
                      <p className="text-sm font-medium text-stone-100">正在理解你说的…</p>
                      <p className="mt-1 text-xs text-stone-400">生成整页 JIT 界面（由模型解析意图）</p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {(panel.kind === 'jit' || panel.kind === 'legal') && (
                  <div
                    className="absolute inset-0 z-30 flex items-center justify-center p-3 md:p-6"
                    onClick={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    {panel.kind === 'legal' ? (
                      <JitWindowChrome
                        title="法务 JIT · 文档视图"
                        subtitle="非对话模式 · 单页说明"
                        onClose={closePanel}
                        footer={null}
                      >
                        <LegalDocPage text={panel.text} />
                      </JitWindowChrome>
                    ) : (
                      <JitWindowChrome
                        title={panel.preview.productName}
                        subtitle={panel.preview.tagline}
                        onClose={closePanel}
                        footer={
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>{panel.preview.etaLine}</span>
                            <span className={panel.source === 'ai' ? 'text-emerald-400/90' : 'text-amber-300/90'}>
                              {panel.source === 'ai' ? '由模型理解意图生成' : '本地规则兜底生成'}
                            </span>
                          </div>
                        }
                      >
                        <div className="border-b border-stone-200 bg-amber-50/80 px-4 py-2 text-xs text-stone-700">
                          <span className="font-semibold text-stone-900">意图复述：</span>
                          {panel.preview.userIntentEcho}
                        </div>
                        <JitBody preview={panel.preview} />
                      </JitWindowChrome>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <footer className="relative z-40 shrink-0 border-t border-white/10 bg-gradient-to-t from-stone-950/80 via-stone-950/50 to-stone-950/30 px-4 py-3 backdrop-blur-2xl md:px-6 md:py-4">
              {toast ? (
                <p className="mb-2 text-center text-[11px] text-amber-200/90" role="status">
                  {toast}
                </p>
              ) : null}
              <form
                className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
                onSubmit={(e) => {
                  e.preventDefault()
                  void runIntent()
                }}
              >
                <label className="sr-only" htmlFor="glasses-input">
                  口述需求
                </label>
                <input
                  id="glasses-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy}
                  placeholder="说一句：导航去××、给××发消息、做个库存看板、问第7.2条风险…"
                  className="min-h-[48px] w-full flex-1 rounded-2xl border border-stone-500/35 bg-stone-950/35 px-4 py-2.5 text-base text-stone-100 placeholder:text-stone-500 outline-none ring-offset-2 ring-offset-transparent backdrop-blur-md focus:border-amber-400/55 focus:ring-2 focus:ring-amber-400/25 disabled:opacity-50 md:min-h-[52px] md:text-lg"
                />
                <button
                  type="submit"
                  disabled={busy || input.trim().length < 2}
                  className="shrink-0 rounded-2xl bg-amber-500 px-8 py-2.5 text-base font-semibold text-stone-950 shadow-lg shadow-amber-900/25 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-10"
                >
                  {busy ? '生成中' : '生成界面'}
                </button>
              </form>
              <p className="mt-2.5 flex flex-wrap items-center justify-end gap-x-1 text-[10px] text-stone-500">
                <span>背景</span>
                <span className="text-stone-600">·</span>
                <span>行人眼高街景</span>
                <span className="text-stone-600">·</span>
                <a
                  href={WALK_PHOTO_PAGE}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-amber-200/80 underline decoration-amber-200/30 underline-offset-2 hover:text-amber-100"
                >
                  Unsplash（Claudio Schwarz）
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
