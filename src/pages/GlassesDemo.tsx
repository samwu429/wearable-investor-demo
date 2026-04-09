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

/** 行人眼高、沿人行道向前的街景（非航拍/鸟瞰），便于传达「走在路上看世界」 */
const WALK_IMAGE = `${import.meta.env.BASE_URL}glasses-walking-eye.jpg`
const WALK_PHOTO_PAGE = 'https://unsplash.com/photos/W7M6dlO7M_Y'

function looksLikeLegalQuery(q: string) {
  return /第\s*\d+|条款|违约|合同|NDA|保密|终止|解释|风险|建议|附件|管辖/.test(q)
}

/** 取景框：轻、暖，像光学镜片边缘的标记 */
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

/** 极淡的「注视中心」提示：不抢眼，暗示前方是主视野 */
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

function InlineMap({ data }: { data: InstantMapUi }) {
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-amber-200/25 bg-stone-950/55 !p-0 shadow-lg backdrop-blur-md">
      <div className="border-b border-white/10 px-2.5 py-1 text-[10px] text-stone-100">
        <span className="font-semibold text-amber-300">地图</span> {data.headline}
      </div>
      <svg className="h-20 w-full" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M 40 130 Q 120 24 280 40"
          fill="none"
          stroke="rgba(251,191,36,0.92)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <rect x="31" y="121" width="14" height="14" fill="none" stroke="rgba(253,224,200,0.95)" strokeWidth="2" />
        <rect x="273" y="31" width="14" height="14" fill="none" stroke="rgba(252,211,77,0.9)" strokeWidth="2" />
      </svg>
      <div className="border-t border-white/10 px-2.5 py-1 text-[9px] text-stone-300">
        {data.fromLabel} → {data.toLabel} · {data.travelMode} ~{data.minutes}min
      </div>
    </div>
  )
}

function InlineChatSnippet({ data }: { data: InstantChatUi }) {
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-amber-200/25 bg-stone-950/55 !p-0 shadow-lg backdrop-blur-md">
      <div className="border-b border-white/10 px-2.5 py-1 text-[9px] text-stone-400">
        与 <span className="font-medium text-stone-100">{data.peerName}</span> · {data.peerStatus}
      </div>
      <div className="max-h-24 space-y-0.5 overflow-y-auto px-2.5 py-1.5">
        {data.bubbles.slice(0, 5).map((b, i) => (
          <p key={i} className="text-[9px] text-stone-100">
            <span className={b.role === 'me' ? 'font-medium text-amber-300' : 'text-stone-500'}>
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
    <div className="mt-2 space-y-1 rounded-lg border border-amber-200/25 bg-stone-950/50 p-2.5 shadow-lg backdrop-blur-md">
      <p className="text-[9px] font-semibold text-amber-200">界面草稿</p>
      <ul className="text-[9px] text-stone-300">
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
    <div className="mt-2 border-l-2 border-amber-500/70 pl-2.5">
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
        '这是「走在路上」的视角：照片在行人眼高拍摄，前方是人行道与城市纵深（不是航拍街景）。HUD 叠在四周与上下，中间尽量留给「你看路」的感觉。你可以一句话生成草稿，或问合同条款——界面配色按日光路上的暖灰 + 琥珀强调做了成套设计。',
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
          text: `已按你的意图生成界面草稿（像浮在视野边缘，而不是占满整屏 App）。`,
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
      <p className="mb-2 max-w-3xl shrink-0 text-xs leading-relaxed text-mist md:mb-3 md:text-sm">
        Part 2 · <span className="font-medium text-ink">行人视角</span>
        ：模拟你走路时眼睛的高度与朝向——前方是路面与街景纵深。HUD 为日光暖调玻璃，与「在户外路上」一致；中间区域刻意少遮，方便讲「看世界 + 轻界面」的故事。
      </p>

      <div className="glasses-frame-bezel glasses-frame-bezel--walk flex min-h-0 flex-1 flex-col p-2 md:p-3">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_48px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/10">
          {/* 行人眼高街景：略偏上保留更多路面/透视 */}
          <div
            className="absolute inset-0 scale-[1.04] bg-cover"
            style={{
              backgroundImage: `url(${WALK_IMAGE})`,
              backgroundPosition: 'center 48%',
            }}
            role="img"
            aria-label="模拟走路时透过镜片看到的前方街景（行人眼高、静态照片）"
          />
          {/* 日光色罩：略暖，像镜片镀膜 */}
          <div className="absolute inset-0 bg-amber-950/[0.07] mix-blend-overlay" aria-hidden />
          {/* 周缘压暗 + 上下易读带：中间更透 = 「主视野在路上」 */}
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
            {/* 顶栏：薄、信息靠两侧，少占垂直空间 */}
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-stone-950/35 px-4 py-2.5 backdrop-blur-2xl md:px-6 md:py-3">
              <div className="min-w-0 pt-0.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-100/55">on foot · hud</p>
                <p className="mt-1 truncate text-sm font-medium tracking-tight text-stone-50 drop-shadow-sm md:text-base">
                  路上视野 <span className="text-stone-400">·</span> 轻量叠显
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-amber-200/20 bg-stone-950/40 px-3 py-2 text-right shadow-sm backdrop-blur-md md:px-4">
                <p className="text-[9px] font-medium uppercase tracking-wider text-stone-500">本地时间</p>
                <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-amber-50 drop-shadow-md md:text-3xl lg:text-4xl">
                  {timeStr}
                </p>
              </div>
            </header>

            <div
              ref={listRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 md:space-y-4 md:px-8 md:py-5"
              role="log"
              aria-label="对话记录"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[min(92%,640px)] rounded-2xl border border-amber-500/25 bg-stone-950/78 px-4 py-2.5 text-sm text-amber-50/95 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:text-base'
                          : 'max-w-[min(96%,min(1400px,92vw))] rounded-2xl border border-amber-100/35 bg-[#faf7f2]/[0.93] px-4 py-3 text-sm leading-relaxed text-stone-900 shadow-[0_14px_50px_rgba(28,25,23,0.2)] backdrop-blur-xl md:px-5 md:py-3.5 md:text-base'
                      }
                    >
                      {m.loading ? (
                        <span className="text-stone-500">…</span>
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

            {/* 底栏：像握持视线下方的指令条 */}
            <footer className="shrink-0 border-t border-white/10 bg-gradient-to-t from-stone-950/75 via-stone-950/45 to-stone-950/25 px-4 py-3 backdrop-blur-2xl md:px-6 md:py-4">
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
                  placeholder="走在路上说一句：发消息、导航、做工具、问条款…"
                  className="min-h-[48px] w-full flex-1 rounded-2xl border border-stone-500/35 bg-stone-950/35 px-4 py-2.5 text-base text-stone-100 placeholder:text-stone-500 outline-none ring-offset-2 ring-offset-transparent backdrop-blur-md focus:border-amber-400/55 focus:ring-2 focus:ring-amber-400/25 disabled:opacity-50 md:min-h-[52px] md:text-lg"
                />
                <button
                  type="submit"
                  disabled={busy || input.trim().length < 2}
                  className="shrink-0 rounded-2xl bg-amber-500 px-8 py-2.5 text-base font-semibold text-stone-950 shadow-lg shadow-amber-900/25 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-10"
                >
                  {busy ? '处理中' : '发送'}
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
