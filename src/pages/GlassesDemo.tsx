import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ApiError } from '../lib/apiClient'
import { generateInsight } from '../lib/ai'
import {
  generateInstantAppPreview,
  type InstantAppPreview,
  type InstantChatUi,
  type InstantMapUi,
} from '../lib/mockInstantApp'

const STREET_IMAGE = `${import.meta.env.BASE_URL}glasses-street.jpg`
const STREET_PHOTO_LINK = 'https://unsplash.com/photos/fce0801e5785'

function looksLikeLegalQuery(q: string) {
  return /第\s*\d+|条款|违约|合同|NDA|保密|终止|解释|风险|建议|附件|管辖/.test(q)
}

function HudCorners() {
  const c = 'pointer-events-none absolute border-white/40'
  return (
    <div className="pointer-events-none absolute inset-3 md:inset-5" aria-hidden>
      <div className={`${c} left-0 top-0 h-9 w-9 rounded-tl-lg border-l-2 border-t-2`} />
      <div className={`${c} right-0 top-0 h-9 w-9 rounded-tr-lg border-r-2 border-t-2`} />
      <div className={`${c} bottom-0 left-0 h-9 w-9 rounded-bl-lg border-b-2 border-l-2`} />
      <div className={`${c} bottom-0 right-0 h-9 w-9 rounded-br-lg border-b-2 border-r-2`} />
    </div>
  )
}

function InlineMap({ data }: { data: InstantMapUi }) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-white/15 bg-black/55 !p-0 shadow-lg backdrop-blur-md">
      <div className="border-b border-white/10 px-2 py-1 text-[10px] text-white/90">
        <span className="font-semibold text-teal-300">地图</span> {data.headline}
      </div>
      <svg className="h-20 w-full" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M 40 130 Q 120 24 280 40"
          fill="none"
          stroke="rgba(110,231,183,0.9)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <rect x="31" y="121" width="14" height="14" fill="none" stroke="rgba(153,246,228,0.95)" strokeWidth="2" />
        <rect x="273" y="31" width="14" height="14" fill="none" stroke="rgba(252,165,165,0.95)" strokeWidth="2" />
      </svg>
      <div className="border-t border-white/10 px-2 py-1 text-[9px] text-white/75">
        {data.fromLabel} → {data.toLabel} · {data.travelMode} ~{data.minutes}min
      </div>
    </div>
  )
}

function InlineChatSnippet({ data }: { data: InstantChatUi }) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-white/15 bg-black/55 !p-0 shadow-lg backdrop-blur-md">
      <div className="border-b border-white/10 px-2 py-1 text-[9px] text-white/70">
        与 <span className="font-medium text-white">{data.peerName}</span> · {data.peerStatus}
      </div>
      <div className="max-h-24 space-y-0.5 overflow-y-auto px-2 py-1.5">
        {data.bubbles.slice(0, 5).map((b, i) => (
          <p key={i} className="text-[9px] text-white/90">
            <span className={b.role === 'me' ? 'font-medium text-teal-300' : 'text-white/50'}>
              {b.role === 'me' ? '你: ' : '对方: '}
            </span>
            {b.text}
          </p>
        ))}
      </div>
    </div>
  )
}

function InlineScaffold({ preview }: { preview: InstantAppPreview }) {
  if (!preview.modules?.length) return null
  return (
    <div className="mt-2 space-y-1 rounded-md border border-white/15 bg-black/50 p-2 shadow-lg backdrop-blur-md">
      <p className="text-[9px] font-semibold text-amber-200">界面草稿</p>
      <ul className="text-[9px] text-white/80">
        {preview.modules.slice(0, 4).map((m) => (
          <li key={m.name}>
            · {m.name} — {m.desc}
          </li>
        ))}
      </ul>
    </div>
  )
}

function InlinePreview({ preview }: { preview: InstantAppPreview }) {
  return (
    <div className="mt-2 border-l-2 border-teal-400/80 pl-2">
      <p className="text-[11px] font-semibold text-stone-800">{preview.productName}</p>
      {preview.uiMode === 'chat' && preview.chatUi && <InlineChatSnippet data={preview.chatUi} />}
      {preview.uiMode === 'map' && preview.mapUi && <InlineMap data={preview.mapUi} />}
      {preview.uiMode === 'split' && preview.chatUi && preview.mapUi && (
        <div className="grid gap-2 md:grid-cols-2">
          <InlineChatSnippet data={preview.chatUi} />
          <InlineMap data={preview.mapUi} />
        </div>
      )}
      {preview.uiMode === 'scaffold' && <InlineScaffold preview={preview} />}
    </div>
  )
}

type ChatMsg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  loading?: boolean
  preview?: InstantAppPreview | null
}

export function GlassesDemo() {
  const listRef = useRef<HTMLDivElement>(null)
  const idPrefix = useId()
  const [now, setNow] = useState(() => new Date())
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        '当前为城市街景透视 + HUD 叠显（网页模拟光学透视）。去 App 化：一句话生成聊天/地图/界面草稿，或问合同条款。投资人可看「真实世界 + 轻界面」的叙事张力。',
    },
  ])

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const pushMsg = useCallback((msg: ChatMsg) => {
    setMessages((m) => [...m, msg])
  }, [])

  const patchMsg = useCallback((id: string, patch: Partial<ChatMsg>) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }, [])

  const send = useCallback(async () => {
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    setBusy(true)
    const uid = `${idPrefix}-u-${Date.now()}`
    const aid = `${idPrefix}-a-${Date.now()}`
    pushMsg({ id: uid, role: 'user', text: q })
    pushMsg({ id: aid, role: 'assistant', text: '', loading: true })

    try {
      if (looksLikeLegalQuery(q)) {
        const result = await generateInsight({ prompt: q })
        patchMsg(aid, { text: result.text, loading: false, preview: null })
      } else if (q.length >= 6) {
        await new Promise((r) => setTimeout(r, 500))
        const preview = generateInstantAppPreview(q)
        patchMsg(aid, {
          text: `已按你的意图生成界面草稿（叠在视野里，无独立 App）。`,
          preview,
          loading: false,
        })
      } else {
        patchMsg(aid, {
          text: '再说具体一点：发消息、导航、做工具，或问「第7.2条有什么风险」。',
          loading: false,
        })
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '请求失败，请稍后重试。'
      patchMsg(aid, { text: msg, loading: false })
    } finally {
      setBusy(false)
    }
  }, [busy, idPrefix, input, patchMsg, pushMsg])

  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,1680px)] flex-1 flex-col px-3 pb-4 pt-3 md:px-8 md:pb-6 md:pt-4">
      <p className="mb-2 shrink-0 text-xs text-mist md:mb-3 md:text-sm">
        Part 2 · 光学透视示意：实景街景 + 磨砂 HUD。整块区域铺满导航与页脚之间，便于投屏路演。
      </p>

      <div className="glasses-frame-bezel flex min-h-0 flex-1 flex-col p-2 md:p-3">
        {/* 镜片：街景底 + 叠层 UI */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_40px_rgba(0,0,0,0.2)] ring-1 ring-black/10">
          {/* 实景层 */}
          <div
            className="absolute inset-0 scale-[1.03] bg-cover bg-[center_35%]"
            style={{ backgroundImage: `url(${STREET_IMAGE})` }}
            role="img"
            aria-label="模拟透过镜片看到的街景（静态照片）"
          />
          {/* 压暗与下沿易读区：模拟真实 HUD 在明亮环境下的对比 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/65" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]"
            aria-hidden
          />

          <HudCorners />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-black/25 px-4 py-3 backdrop-blur-2xl md:px-6 md:py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">JIT · 透视 HUD</p>
                <p className="mt-0.5 text-sm font-medium text-white drop-shadow-md md:text-base">一句话 → 草稿 / 条款</p>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-right backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">时间</p>
                <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-white drop-shadow-lg md:text-4xl lg:text-5xl">
                  {timeStr}
                </p>
              </div>
            </header>

            <div
              ref={listRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 md:space-y-4 md:px-6 md:py-5"
              role="log"
              aria-label="对话记录"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[min(92%,720px)] rounded-2xl border border-white/15 bg-teal-950/80 px-4 py-2.5 text-sm text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl md:text-base'
                          : 'max-w-[min(96%,min(1400px,92vw))] rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-sm leading-relaxed text-stone-900 shadow-[0_12px_48px_rgba(0,0,0,0.25)] backdrop-blur-xl md:px-5 md:py-3.5 md:text-base'
                      }
                    >
                      {m.loading ? (
                        <span className="text-white/50">…</span>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          {m.preview && <InlinePreview preview={m.preview} />}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <footer className="shrink-0 border-t border-white/15 bg-black/35 px-4 py-3 backdrop-blur-2xl md:px-6 md:py-4">
              <form
                className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send()
                }}
              >
                <label className="sr-only" htmlFor="glasses-input">
                  一句话需求
                </label>
                <input
                  id="glasses-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy}
                  placeholder="一句话：发消息、导航、做工具、问条款…"
                  className="min-h-[48px] w-full flex-1 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-base text-white placeholder:text-white/45 outline-none ring-offset-2 ring-offset-transparent backdrop-blur-md focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/40 disabled:opacity-50 md:min-h-[52px] md:text-lg"
                />
                <button
                  type="submit"
                  disabled={busy || input.trim().length < 2}
                  className="shrink-0 rounded-xl bg-teal-500 px-8 py-2.5 text-base font-semibold text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-10"
                >
                  {busy ? '处理中' : '发送'}
                </button>
              </form>
              <p className="mt-2 text-right text-[10px] text-white/35">
                街景照片{' '}
                <a
                  href={STREET_PHOTO_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-white/30 underline-offset-2 hover:text-white/60"
                >
                  Unsplash
                </a>
                ，仅演示背景
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
