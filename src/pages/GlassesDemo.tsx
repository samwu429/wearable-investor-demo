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

function looksLikeLegalQuery(q: string) {
  return /第\s*\d+|条款|违约|合同|NDA|保密|终止|解释|风险|建议|附件|管辖/.test(q)
}

function InlineMap({ data }: { data: InstantMapUi }) {
  return (
    <div className="glasses-chat-card mt-2 overflow-hidden !p-0">
      <div className="border-b border-cyan-500/40 px-2 py-0.5 text-[10px] text-slate-200">
        <span className="text-amber-400">MAP</span> {data.headline}
      </div>
      <svg className="h-20 w-full" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M 40 130 Q 120 24 280 40"
          fill="none"
          stroke="rgba(52,211,153,0.9)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <rect x="31" y="121" width="14" height="14" fill="none" stroke="rgba(56,189,248,0.95)" strokeWidth="2" />
        <rect x="273" y="31" width="14" height="14" fill="none" stroke="rgba(251,113,133,0.95)" strokeWidth="2" />
      </svg>
      <div className="border-t border-cyan-500/40 px-2 py-0.5 text-[9px] text-slate-300">
        {data.fromLabel} → {data.toLabel} · {data.travelMode} ~{data.minutes}min
      </div>
    </div>
  )
}

function InlineChatSnippet({ data }: { data: InstantChatUi }) {
  return (
    <div className="glasses-chat-card mt-2 !p-0">
      <div className="border-b border-cyan-500/40 px-2 py-0.5 text-[9px] text-slate-300">
        与 <span className="text-white">{data.peerName}</span> · {data.peerStatus}
      </div>
      <div className="max-h-24 space-y-0.5 overflow-y-auto px-2 py-1">
        {data.bubbles.slice(0, 5).map((b, i) => (
          <p key={i} className="text-[9px] text-slate-200">
            <span className={b.role === 'me' ? 'text-cyan-400' : 'text-slate-500'}>{b.role === 'me' ? '你: ' : '对方: '}</span>
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
    <div className="glasses-chat-card mt-2 space-y-0.5 p-1.5">
      <p className="text-[9px] text-amber-300">界面草稿</p>
      <ul className="text-[9px] text-slate-300">
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
    <div className="mt-1.5 border-l-2 border-cyan-400/60 pl-2">
      <p className="text-[10px] font-medium text-slate-200">{preview.productName}</p>
      {preview.uiMode === 'chat' && preview.chatUi && <InlineChatSnippet data={preview.chatUi} />}
      {preview.uiMode === 'map' && preview.mapUi && <InlineMap data={preview.mapUi} />}
      {preview.uiMode === 'split' && preview.chatUi && preview.mapUi && (
        <div className="grid gap-1.5 md:grid-cols-2">
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
        '去 App 化：直接说一句话。我会在这里生成草稿（聊天/地图/界面结构）或解释条款。视野做宽做矮，像镜片横在眼睛前，不挡路。',
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
          text: `已按你的话排了一版草稿（仍在对话里，无独立 App）。`,
          preview,
          loading: false,
        })
      } else {
        patchMsg(aid, {
          text: '再说具体一点：例如发消息、导航、做小店工具，或问「第7.2条有什么风险」。',
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
    <div className="mx-auto max-w-[min(100%,1320px)] px-3 py-5 md:px-8 md:py-8">
      <p className="mb-4 text-center text-xs text-slate-600 md:text-left">
        Part 2 · 宽视场镜片布局（左时右话）— 压低高度，少挡下方路况。
      </p>

      <div className="glasses-frame-bezel p-2.5 md:p-4">
        {/* 横向双镜片 + 下沿语音条：整体呈「护目镜」比例，非手机竖屏 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex min-h-[200px] flex-row items-stretch gap-2 md:min-h-[260px] md:gap-0">
            {/* 左镜片：窄条 + 大时间（始终横排，避免竖长手机感） */}
            <div className="relative flex w-[min(32%,150px)] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-white/35 to-sky-100/25 px-2.5 py-2 shadow-inner backdrop-blur-md sm:w-[min(30%,180px)] sm:px-3 sm:py-3 md:w-[min(26%,220px)] md:rounded-l-[2.75rem] md:rounded-r-xl md:rounded-t-[2.75rem] md:px-4">
              <div className="pointer-events-none absolute inset-x-3 top-1.5 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent md:inset-x-4 md:top-2" />
              <p className="text-[8px] font-bold uppercase tracking-wider text-sky-900/70 sm:text-[10px] sm:tracking-[0.2em]">左目</p>
              <div className="flex flex-1 flex-col justify-center py-1">
                <p className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
                  {timeStr}
                </p>
                <p className="mt-1 text-[9px] text-slate-600 md:mt-2 md:text-[10px]">本地</p>
              </div>
              <p className="hidden text-[9px] leading-snug text-slate-500 sm:block">余光</p>
            </div>

            {/* 鼻梁 */}
            <div className="hidden shrink-0 flex-col items-center justify-center px-0.5 sm:flex md:px-1" aria-hidden>
              <div className="h-10 w-0.5 rounded-full bg-gradient-to-b from-slate-300/80 via-slate-400/45 to-slate-300/80 shadow-inner md:h-12 md:w-1" />
            </div>

            {/* 右镜片：对话主视野 */}
            <div className="relative flex min-h-[200px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-bl from-white/30 to-sky-50/20 shadow-inner backdrop-blur-md md:rounded-l-xl md:rounded-r-[2.75rem] md:rounded-t-[2.75rem]">
              <div className="pointer-events-none absolute inset-x-4 top-2 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-400/15 px-3 py-1.5 md:px-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-900/75">右目 · 对话</p>
                <p className="truncate text-[10px] text-slate-600">一句话 → 界面草稿 / 条款解释</p>
              </div>
              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2 md:px-4"
                role="log"
                aria-label="对话记录"
              >
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={
                          m.role === 'user'
                            ? 'max-w-[min(92%,520px)] rounded-lg rounded-br-sm border border-sky-500/45 bg-sky-600/90 px-2.5 py-1.5 text-left text-xs text-white shadow-md backdrop-blur-sm'
                            : 'max-w-[min(98%,640px)] rounded-lg rounded-bl-sm border border-slate-600/30 bg-slate-900/70 px-2.5 py-1.5 text-xs leading-relaxed text-slate-100 shadow-md backdrop-blur-sm'
                        }
                      >
                        {m.loading ? (
                          <span className="text-slate-400">…</span>
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
            </div>
          </div>

          {/* 下沿：整条输入，像镜腿根部的麦克风条 */}
          <footer className="rounded-2xl border border-slate-400/25 bg-white/45 px-3 py-2.5 shadow-inner backdrop-blur-md md:rounded-3xl md:px-4">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
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
                className="min-h-[44px] w-full flex-1 rounded-xl border border-slate-400/35 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 shadow-inner outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || input.trim().length < 2}
                className="shrink-0 rounded-xl bg-sky-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? '处理中' : '发送'}
              </button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  )
}
