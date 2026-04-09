import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ApiError } from '../lib/apiClient'
import { generateInsight, generateJitUiFromPrompt } from '../lib/ai'
import {
  generateInstantAppPreview,
  type InstantAppPreview,
  type InstantMapUi,
} from '../lib/mockInstantApp'
import { useI18n } from '../i18n/I18nContext'
import { interpolate } from '../i18n/messages'

const FPV_IMAGE = `${import.meta.env.BASE_URL}glasses-fpv-cycling.jpg`
const FPV_PHOTO_PAGE = 'https://unsplash.com/photos/pKDEdPTH7ow'

/** 中英关键词：界面语言与提问语言可不一致 */
function looksLikeLegalQuery(q: string) {
  if (/第\s*\d+|条款|违约|合同|NDA|保密|终止|解释|风险|建议|附件|管辖/.test(q)) return true
  if (
    /\b(section|article)\s*\d+|\bclause(s)?\b|\bcontract\b|\bNDA\b|confidential|termination|liability|\brisk(s)?\b|breach|jurisdiction|indemnif/i.test(
      q,
    )
  )
    return true
  return false
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
          'radial-gradient(ellipse 62% 50% at 50% 38%, rgba(255,255,255,0.07) 0%, transparent 58%)',
      }}
      aria-hidden
    />
  )
}

function TuiWindowControls({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <div className="font-jit-mono flex items-center gap-1 text-[10px] tracking-tight" aria-hidden>
      <span className="rounded border border-stone-600/80 bg-stone-950 px-1.5 py-0.5 text-stone-500">─</span>
      <span className="rounded border border-stone-600/80 bg-stone-950 px-1.5 py-0.5 text-stone-500">□</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded border border-rose-900/40 bg-stone-950 px-2 py-0.5 font-jit-mono text-rose-300/90 transition hover:border-rose-500/50 hover:bg-rose-950/30"
        aria-label={t('glasses.closeWindow')}
      >
        ×
      </button>
    </div>
  )
}

/** 内框角标：像 HUD 里的取景刻线，弱化纯终端感 */
function JitInnerCorners({ className = '' }: { className?: string }) {
  const b = 'pointer-events-none absolute border-teal-400/25'
  return (
    <div className={`pointer-events-none absolute inset-2 md:inset-3 ${className}`} aria-hidden>
      <div className={`${b} left-0 top-0 h-5 w-5 rounded-tl border-l border-t`} />
      <div className={`${b} right-0 top-0 h-5 w-5 rounded-tr border-r border-t`} />
      <div className={`${b} bottom-0 left-0 h-5 w-5 rounded-bl border-b border-l`} />
      <div className={`${b} bottom-0 right-0 h-5 w-5 rounded-br border-b border-r`} />
    </div>
  )
}

function JitWindowChrome({
  title,
  subtitle,
  onClose,
  footer,
  children,
  variant = 'hud',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
  /** hud：暗色磷光终端；paper：法务浅色稿纸 */
  variant?: 'hud' | 'paper'
}) {
  const { t } = useI18n()
  const shell = variant === 'paper' ? 'jit-field jit-field--paper rounded-lg' : 'jit-field rounded-lg'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex max-h-[min(88vh,920px)] w-[min(96vw,1100px)] min-h-0 flex-col rounded-lg"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${shell} flex max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden`}
      >
        <div className="jit-field-inner flex max-h-full min-h-0 flex-col">
        <div
          className={
            variant === 'paper'
              ? 'flex h-12 shrink-0 items-center gap-3 border-b border-stone-300/80 bg-[#ebe6dc] px-3'
              : 'flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-stone-950/48 px-3 backdrop-blur-xl'
          }
        >
          <div className="flex items-center gap-2">
            <span className="font-jit-mono text-[10px] font-semibold tracking-[0.2em] text-teal-400/95">TF</span>
            <span
              className={
                variant === 'paper'
                  ? 'hidden text-[9px] font-medium uppercase tracking-[0.35em] text-stone-500 sm:inline'
                  : 'hidden text-[9px] font-medium uppercase tracking-[0.35em] text-amber-200/40 sm:inline'
              }
            >
              field_glass
            </span>
          </div>
          <div className="min-w-0 flex-1 px-2 text-center">
            <p
              className={
                variant === 'paper'
                  ? 'truncate font-jit-mono text-[11px] font-medium tracking-wide text-stone-800'
                  : 'truncate font-jit-mono text-[11px] font-medium tracking-wide text-[#ebe8e2]'
              }
            >
              {title}
            </p>
            <div
              className={
                variant === 'paper'
                  ? 'mx-auto mt-1 h-px max-w-[min(100%,280px)] bg-gradient-to-r from-transparent via-amber-700/25 to-transparent'
                  : 'mx-auto mt-1 h-px max-w-[min(100%,280px)] bg-gradient-to-r from-transparent via-teal-400/25 to-transparent'
              }
            />
          </div>
          <TuiWindowControls onClose={onClose} />
        </div>
        {subtitle ? (
          <p
            className={
              variant === 'paper'
                ? 'shrink-0 border-b border-stone-300/60 bg-[#f0ebe3] px-4 py-2 font-jit-mono text-[10px] text-stone-600'
                : 'shrink-0 border-b border-white/8 bg-stone-950/42 px-4 py-2 font-jit-mono text-[10px] text-stone-400 backdrop-blur-lg'
            }
          >
            <span className={variant === 'paper' ? 'text-teal-700/80' : 'text-teal-400/70'}>{'// '}</span>
            {subtitle}
          </p>
        ) : null}
        <div
          className={
            variant === 'paper'
              ? 'relative min-h-0 flex-1 overflow-y-auto bg-[#faf8f3]'
              : 'relative min-h-0 flex-1 overflow-y-auto bg-transparent'
          }
        >
          {variant === 'hud' ? <JitInnerCorners /> : null}
          {children}
        </div>
        {footer ? (
          <div
            className={
              variant === 'paper'
                ? 'shrink-0 border-t border-stone-300/80 bg-[#ebe6dc] px-4 py-2 font-jit-mono text-[10px] text-stone-600'
                : 'shrink-0 border-t border-white/10 bg-stone-950/48 px-4 py-2 font-jit-mono text-[10px] text-stone-400 backdrop-blur-xl'
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-2">{footer}</div>
            <p
              className={
                variant === 'paper'
                  ? 'mt-1.5 border-t border-dotted border-stone-400/40 pt-1.5 text-[9px] text-stone-500'
                  : 'mt-1.5 border-t border-dotted border-stone-600/50 pt-1.5 text-[9px] text-stone-600'
              }
            >
              {t('glasses.windowFooterHud')}
            </p>
          </div>
        ) : variant === 'paper' ? (
          <div className="shrink-0 border-t border-stone-300/80 bg-[#ebe6dc] px-4 py-2 font-jit-mono text-[9px] text-stone-500">
            {t('glasses.windowFooterClause')}
          </div>
        ) : null}
        </div>
      </div>
    </motion.div>
  )
}

function BigMapCanvas({ data }: { data: InstantMapUi }) {
  const { t } = useI18n()
  const rid = useId().replace(/:/g, '')
  const gid = `jit-grid-${rid}`
  const vid = `jit-vig-${rid}`
  return (
    <div className="relative min-h-[220px] flex-1 bg-stone-950/35 backdrop-blur-md md:min-h-[280px]">
      <svg className="absolute inset-0 h-full w-full opacity-95" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id={gid} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(94,234,212,0.06)" strokeWidth="1" />
          </pattern>
          <radialGradient id={vid} cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="rgba(20,35,32,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="rgba(12, 22, 20, 0.38)" />
        <rect width="100%" height="100%" fill={`url(#${gid})`} />
        <rect width="100%" height="100%" fill={`url(#${vid})`} />
        <path
          d="M 48 180 Q 160 40 340 56"
          fill="none"
          stroke="rgba(251,191,36,0.85)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="10 7"
        />
        <circle cx="48" cy="180" r="6" fill="none" stroke="rgba(94,234,212,0.9)" strokeWidth="2" />
        <circle cx="340" cy="56" r="6" fill="rgba(251,191,36,0.25)" stroke="rgba(251,191,36,0.8)" strokeWidth="1.5" />
      </svg>
      <div className="absolute left-3 top-3 max-w-[min(100%,280px)] border border-teal-400/35 bg-stone-950/45 px-2.5 py-1.5 font-jit-mono text-[10px] leading-snug text-teal-50 shadow-[0_0_24px_rgba(45,212,191,0.06)] backdrop-blur-lg">
        <span className="text-amber-300/90">{t('glasses.mapBadge')}</span>
        {data.headline}
      </div>
    </div>
  )
}

function JitMapPage({ preview }: { preview: InstantAppPreview }) {
  const { t } = useI18n()
  const m = preview.mapUi!
  return (
    <div className="relative z-[1] flex h-full min-h-[320px] flex-col md:flex-row">
      <BigMapCanvas data={m} />
      <aside className="flex w-full shrink-0 flex-col gap-0 border-t border-white/10 bg-stone-950/42 p-0 backdrop-blur-lg md:w-[300px] md:border-l md:border-t-0">
        <div className="border-b border-stone-700/80 px-3 py-2 font-jit-mono text-[9px] uppercase tracking-[0.2em] text-amber-200/50">
          {t('glasses.routeSpec')}
        </div>
        <div className="space-y-3 p-4">
          <p className="font-jit-mono text-[11px] text-teal-400/80">
            {'>'} {m.fromLabel}{' '}
            <span className="text-amber-400/70">{t('glasses.routeArrow')}</span> {m.toLabel}
          </p>
          <div className="space-y-1.5 border border-white/10 bg-stone-950/42 p-3 font-jit-mono text-[11px] text-stone-300 backdrop-blur-sm">
            <p>
              <span className="text-stone-600">{t('glasses.mode')}</span>{' '}
              <span className="text-[#ebe8e2]">{m.travelMode}</span>
            </p>
            <p>
              <span className="text-stone-600">{t('glasses.eta')}</span>{' '}
              <span className="tabular-nums text-amber-200/90">{m.minutes}</span>
              <span className="text-stone-500"> {t('glasses.min')}</span>
            </p>
          </div>
          <div className="border border-dashed border-amber-400/25 bg-stone-950/38 p-3 text-[11px] leading-relaxed text-stone-400 backdrop-blur-sm">
            <p className="mb-1 font-jit-mono text-[9px] uppercase tracking-wider text-stone-600">{t('glasses.intentEchoBlock')}</p>
            <p className="text-stone-400">{preview.userIntentEcho}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

function JitChatAppPage({ preview }: { preview: InstantAppPreview }) {
  const { t } = useI18n()
  const c = preview.chatUi!
  return (
    <div className="relative z-[1] flex h-full min-h-[360px] flex-col bg-transparent">
      <header className="flex items-center gap-3 border-b border-white/10 bg-stone-950/48 px-4 py-3 backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-950/35 font-jit-mono text-xs font-bold text-amber-200">
          {c.peerName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-jit-mono text-xs font-medium tracking-wide text-[#ebe8e2]">{c.peerName}</p>
          <p className="truncate font-jit-mono text-[10px] text-teal-500/70">{c.peerStatus}</p>
        </div>
        <span className="hidden font-jit-mono text-[9px] text-stone-600 sm:inline">{t('glasses.chatChan')}</span>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-950/40 px-3 py-4 backdrop-blur-md">
        {c.bubbles.map((b, i) => (
          <div key={i} className={`flex ${b.role === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                b.role === 'me'
                  ? 'max-w-[88%] border border-teal-400/35 bg-teal-950/32 px-3 py-2 font-jit-mono text-[12px] leading-relaxed text-teal-50 backdrop-blur-md'
                  : 'max-w-[88%] border border-white/12 bg-stone-950/45 px-3 py-2 font-jit-mono text-[12px] leading-relaxed text-stone-200 backdrop-blur-md'
              }
            >
              <span className={b.role === 'me' ? 'text-teal-500/80' : 'text-amber-500/70'}>
                {b.role === 'me' ? t('glasses.chatYou') : t('glasses.chatPeer')}
              </span>
              {b.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 bg-stone-950/48 px-3 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-2 border border-white/12 bg-stone-950/40 px-3 py-2 font-jit-mono text-[11px] text-stone-400 backdrop-blur-md">
          <span className="text-teal-500/80">{'>'}</span>
          <span className="jit-cursor-blink text-amber-200/90">▍</span>
          <span className="ml-2 text-stone-600">{t('glasses.compose')}</span>
          <span className="ml-auto text-[9px] text-stone-600">{t('glasses.demoNoSend')}</span>
        </div>
      </div>
    </div>
  )
}

function JitSplitPage({ preview }: { preview: InstantAppPreview }) {
  const { t } = useI18n()
  const c = preview.chatUi!
  const m = preview.mapUi!
  return (
    <div className="relative z-[1] grid min-h-[400px] grid-cols-1 divide-y divide-amber-500/10 md:grid-cols-2 md:divide-x md:divide-y-0">
      <div className="flex min-h-[280px] flex-col bg-transparent md:min-h-0">
        <div className="shrink-0 border-b border-white/10 bg-stone-950/48 px-3 py-2 font-jit-mono text-[9px] uppercase tracking-[0.25em] text-amber-200/55 backdrop-blur-xl">
          {t('glasses.paneMessage')}
        </div>
        <header className="flex items-center gap-3 border-b border-stone-700/60 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center border border-amber-500/25 bg-amber-950/35 font-jit-mono text-[10px] font-bold text-amber-200">
            {c.peerName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-jit-mono text-[11px] text-[#ebe8e2]">{c.peerName}</p>
            <p className="truncate font-jit-mono text-[9px] text-teal-500/65">{c.peerStatus}</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-stone-950/40 px-3 py-3 backdrop-blur-md">
          {c.bubbles.map((b, i) => (
            <div key={i} className={`flex ${b.role === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={
                  b.role === 'me'
                    ? 'max-w-[90%] border border-teal-400/30 bg-teal-950/32 px-2.5 py-1.5 font-jit-mono text-[11px] text-teal-50 backdrop-blur-sm'
                    : 'max-w-[90%] border border-white/12 bg-stone-950/45 px-2.5 py-1.5 font-jit-mono text-[11px] text-stone-200 backdrop-blur-md'
                }
              >
                <span className={b.role === 'me' ? 'text-teal-500/75' : 'text-amber-500/65'}>
                  {b.role === 'me' ? t('glasses.chatYou') : t('glasses.chatPeer')}
                </span>
                {b.text}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-h-[280px] flex-col md:min-h-0">
        <div className="shrink-0 border-b border-white/10 bg-stone-950/48 px-3 py-2 font-jit-mono text-[9px] uppercase tracking-[0.25em] text-amber-200/55 backdrop-blur-xl">
          {t('glasses.paneNav')}
        </div>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <BigMapCanvas data={m} />
          <aside className="flex w-full shrink-0 flex-col justify-center gap-2 border-t border-white/10 bg-stone-950/42 p-3 font-jit-mono text-[11px] text-stone-300 backdrop-blur-lg md:w-[188px] md:border-l md:border-t-0">
            <p className="text-amber-200/80">
              {m.fromLabel} <span className="text-teal-500/60">{t('glasses.routeArrow')}</span> {m.toLabel}
            </p>
            <p>
              {m.travelMode} · <span className="tabular-nums text-stone-200">{m.minutes}</span>m
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

const toneClass: Record<string, string> = {
  gold: 'border-amber-500/35 bg-amber-950/38 text-amber-100 backdrop-blur-md',
  mint: 'border-teal-500/35 bg-teal-950/34 text-teal-50 backdrop-blur-md',
  rose: 'border-rose-500/35 bg-rose-950/36 text-rose-100 backdrop-blur-md',
}

function JitScaffoldPage({ preview }: { preview: InstantAppPreview }) {
  const { t } = useI18n()
  const screens = preview.screens ?? []
  const modules = preview.modules ?? []
  return (
    <div className="relative z-[1] flex min-h-[380px] flex-col md:flex-row">
      <nav className="flex shrink-0 gap-1 border-b border-white/10 bg-stone-950/48 p-2 font-jit-mono backdrop-blur-xl md:w-52 md:flex-col md:border-b-0 md:border-r md:border-white/10">
        <p className="hidden px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-stone-600 md:block">{t('glasses.stackNav')}</p>
        {screens.length ? (
          screens.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`border px-3 py-2 text-left text-[11px] backdrop-blur-sm md:text-xs ${toneClass[s.tone] ?? 'border-white/12 bg-stone-950/48 text-stone-200'}`}
            >
              <span className="text-stone-600">[{i + 1}]</span> {s.label}
            </button>
          ))
        ) : (
          <span className="px-2 py-2 text-[10px] text-stone-600">{t('glasses.stackRoot')}</span>
        )}
      </nav>
      <main className="min-w-0 flex-1 bg-transparent p-4">
        <p className="mb-4 border-l-2 border-teal-500/40 pl-3 font-jit-mono text-[11px] leading-relaxed text-stone-500">
          {preview.tagline}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => (
            <li
              key={m.name}
              className="border border-white/10 bg-stone-950/42 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
            >
              <p className="font-jit-mono text-[11px] font-medium uppercase tracking-wide text-amber-200/85">{m.name}</p>
              <p className="mt-2 font-jit-mono text-[11px] leading-relaxed text-stone-500">{m.desc}</p>
            </li>
          ))}
        </ul>
        {preview.codeSnippet ? (
          <pre className="mt-4 overflow-x-auto border border-teal-500/25 bg-stone-950/48 p-3 font-jit-mono text-[10px] leading-relaxed text-teal-100/95 backdrop-blur-md">
            {preview.codeSnippet}
          </pre>
        ) : null}
      </main>
    </div>
  )
}

function LegalDocPage({ text }: { text: string }) {
  const { t } = useI18n()
  return (
    <article className="relative z-[1] min-h-[360px] px-5 py-8 text-stone-900 md:px-10">
      <div className="mb-6 border-b border-dashed border-stone-400/50 pb-4">
        <h1 className="font-jit-mono text-sm font-semibold uppercase tracking-[0.25em] text-teal-800">clause_jit</h1>
        <p className="mt-2 font-jit-mono text-[11px] text-stone-600">{t('glasses.legalDocDisclaimer')}</p>
      </div>
      <div className="font-jit-mono text-[12px] leading-[1.75] tracking-tight text-stone-800 md:text-[13px]">
        <div className="whitespace-pre-wrap">{text}</div>
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
  const { t, locale } = useI18n()
  const timeLocale = locale === 'zh' ? 'zh-CN' : 'en-US'
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
        const padded = q.length >= 8 ? q : `${q}\n${t('glasses.legalPromptPad')}`
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
            ? interpolate(t('glasses.toastFallbackWithErr'), { msg: e.message })
            : t('glasses.toastFallback')
        setToast(msg)
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('glasses.toastNetwork')
      setToast(msg)
      setPanel({ kind: 'idle' })
    } finally {
      setBusy(false)
    }
  }, [busy, input, t])

  const timeStr = now.toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const showOverlay = panel.kind === 'loading' || panel.kind === 'jit' || panel.kind === 'legal'

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,1680px)] flex-1 flex-col px-3 pb-4 pt-3 md:px-8 md:pb-6 md:pt-4">
      <p className="mb-2 max-w-3xl shrink-0 text-xs leading-relaxed text-mist md:mb-3 md:text-sm">{t('glasses.intro')}</p>

      <div className="glasses-frame-bezel glasses-frame-bezel--walk flex min-h-0 flex-1 flex-col p-2 md:p-3">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_48px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/10">
          <div
            className="glasses-fpv-drift glasses-fpv-daylight absolute inset-0 scale-[1.1] bg-cover bg-center"
            style={{
              backgroundImage: `url(${FPV_IMAGE})`,
            }}
            role="img"
            aria-label={t('glasses.streetAria')}
          />
          <div className="absolute inset-0 bg-amber-950/[0.07] mix-blend-overlay" aria-hidden />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background: [
                /* 白天感：整体压暗更轻，保留路面与车把可读 */
                'linear-gradient(180deg, rgba(12,10,8,0.22) 0%, rgba(12,10,8,0.02) 28%, rgba(12,10,8,0) 45%, rgba(12,10,8,0.05) 72%, rgba(12,10,8,0.28) 100%)',
                'radial-gradient(ellipse 96% 88% at 50% 38%, rgba(0,0,0,0) 0%, rgba(12,10,8,0.1) 100%)',
              ].join(', '),
            }}
            aria-hidden
          />
          <SoftCenterGlow />
          <HudCorners />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-stone-950/32 px-4 py-2.5 backdrop-blur-md md:px-6 md:py-3">
              <div className="min-w-0 pt-0.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-100/55">{t('glasses.hudEyebrow')}</p>
                <p className="mt-1 truncate text-sm font-medium tracking-tight text-stone-50 drop-shadow-sm md:text-base">
                  {t('glasses.hudTitle')}
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-amber-200/20 bg-stone-950/48 px-3 py-2 text-right shadow-sm backdrop-blur-md md:px-4">
                <p className="text-[9px] font-medium uppercase tracking-wider text-stone-500">{t('glasses.localTime')}</p>
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
                    aria-label={t('glasses.backdropClose')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 cursor-default border-0 bg-stone-950/35 backdrop-blur-lg"
                    onClick={closePanel}
                  />
                ) : null}
              </AnimatePresence>

              {panel.kind === 'idle' && (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="max-w-sm text-sm text-stone-200/90 drop-shadow-md">
                    {t('glasses.idleHintBefore')}
                    <span className="text-amber-100">{t('glasses.idleHintEm')}</span>
                    {t('glasses.idleHintAfter')}
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
                    <div className="jit-field pointer-events-auto max-w-md rounded-lg px-6 py-5 text-left shadow-2xl">
                      <div className="jit-field-inner relative">
                        <p className="font-jit-mono text-[10px] uppercase tracking-[0.35em] text-teal-400/80">{t('glasses.loadingBrand')}</p>
                        <p className="mt-2 font-jit-mono text-sm font-medium text-[#ebe8e2]">{t('glasses.loadingTitle')}</p>
                        <p className="mt-2 font-jit-mono text-[11px] text-stone-500">{t('glasses.loadingSub')}</p>
                        <p className="mt-4 font-jit-mono text-xs text-amber-200/80">
                          <span className="text-teal-500/70">{'>'}</span>{' '}
                          <span className="jit-cursor-blink">▍</span>
                        </p>
                      </div>
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
                        variant="paper"
                        title={t('glasses.legalWindowTitle')}
                        subtitle={t('glasses.legalSubtitle')}
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
                          <div className="flex flex-wrap items-center justify-between gap-2 text-stone-500">
                            <span className="text-stone-500">{panel.preview.etaLine}</span>
                            <span className={panel.source === 'ai' ? 'text-teal-400/90' : 'text-amber-400/90'}>
                              {panel.source === 'ai' ? '[SRC: model]' : '[SRC: fallback]'}
                            </span>
                          </div>
                        }
                      >
                        <div className="relative z-[1] border-b border-white/10 bg-stone-950/48 px-4 py-2.5 font-jit-mono text-[11px] leading-relaxed text-stone-300 backdrop-blur-lg">
                          <span className="text-teal-500/70">{t('glasses.intentEchoPrefix')}</span>
                          <span className="text-stone-400">{panel.preview.userIntentEcho}</span>
                        </div>
                        <JitBody preview={panel.preview} />
                      </JitWindowChrome>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <footer className="relative z-40 shrink-0 border-t border-white/10 bg-gradient-to-t from-stone-950/55 via-stone-950/32 to-stone-950/18 px-4 py-3 backdrop-blur-lg md:px-6 md:py-4">
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
                  {t('glasses.inputLabel')}
                </label>
                <input
                  id="glasses-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy}
                  placeholder={t('glasses.inputPlaceholder')}
                  className="min-h-[48px] w-full flex-1 rounded-2xl border border-stone-500/35 bg-stone-950/42 px-4 py-2.5 text-base text-stone-100 placeholder:text-stone-500 outline-none ring-offset-2 ring-offset-transparent backdrop-blur-md focus:border-amber-400/55 focus:ring-2 focus:ring-amber-400/25 disabled:opacity-50 md:min-h-[52px] md:text-lg"
                />
                <button
                  type="submit"
                  disabled={busy || input.trim().length < 2}
                  className="shrink-0 rounded-2xl bg-amber-500 px-8 py-2.5 text-base font-semibold text-stone-950 shadow-lg shadow-amber-900/25 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-10"
                >
                  {busy ? t('glasses.submitting') : t('glasses.submit')}
                </button>
              </form>
              <p className="mt-2.5 flex flex-wrap items-center justify-end gap-x-1 text-[10px] text-stone-500">
                <span>{t('glasses.photoCreditBg')}</span>
                <span className="text-stone-600">·</span>
                <span>{t('glasses.photoCreditScene')}</span>
                <span className="text-stone-600">·</span>
                <a
                  href={FPV_PHOTO_PAGE}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-amber-200/80 underline decoration-amber-200/30 underline-offset-2 hover:text-amber-100"
                >
                  {t('glasses.photoCreditLink')}
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
