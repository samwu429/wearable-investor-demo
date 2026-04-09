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

/** 对话里嵌套的精简地图 */
function InlineMap({ data }: { data: InstantMapUi }) {
  return (
    <div className="glasses-chat-card mt-2 overflow-hidden !p-0">
      <div className="border-b border-cyan-500/40 px-2 py-1 text-slate-200">
        <span className="text-amber-400">MAP</span> {data.headline}
      </div>
      <svg className="h-28 w-full" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" aria-hidden>
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
      <div className="border-t border-cyan-500/40 px-2 py-1 text-[10px] text-slate-300">
        {data.fromLabel} → {data.toLabel} · {data.travelMode} ~{data.minutes}min
      </div>
    </div>
  )
}

/** 对话里嵌套的精简会话预览 */
function InlineChatSnippet({ data }: { data: InstantChatUi }) {
  return (
    <div className="glasses-chat-card mt-2 !p-0">
      <div className="border-b border-cyan-500/40 px-2 py-1 text-[10px] text-slate-300">
        与 <span className="text-white">{data.peerName}</span> · {data.peerStatus}
      </div>
      <div className="max-h-32 space-y-1 overflow-y-auto px-2 py-1.5">
        {data.bubbles.slice(0, 6).map((b, i) => (
          <p key={i} className="text-[10px] text-slate-200">
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
    <div className="glasses-chat-card mt-2 space-y-1 p-2">
      <p className="text-[10px] text-amber-300">界面草稿</p>
      <ul className="text-[10px] text-slate-300">
        {preview.modules.slice(0, 5).map((m) => (
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
    <div className="mt-2 border-l-2 border-cyan-400/60 pl-2">
      <p className="text-[11px] font-medium text-slate-700">{preview.productName}</p>
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
        '这是「去 App 化」演示：不用找应用，直接说一句话。我会帮你生成界面草稿、导航示意或聊天草稿，也可以问合同条款（走真实 AI）。下面随便说一句试试。',
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
          text: `好，按你的这句话排了一版界面草稿（仍是对话里生成，没有单独 App）。`,
          preview,
          loading: false,
        })
      } else {
        patchMsg(aid, {
          text: '再具体一点就好。例如：给妈妈发消息说想吃糖醋排骨、导航去图书馆、或者问「第7.2条延期有什么风险」。',
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
    <div className="mx-auto max-w-[min(100%,720px)] px-4 py-6 md:px-6 md:py-8">
      <p className="mb-3 text-center text-xs text-slate-600 md:text-left">
        Part 2 · 智能眼镜视野 — 单通道对话；界面由话生成，不堆面板。
      </p>

      <div className="glasses-frame-bezel p-2 md:p-2.5">
        <div className="glasses-lens-field flex min-h-[min(82vh,820px)] flex-col border border-sky-300/35">
          {/* 顶：极简状态 + 时间（看路优先） */}
          <header className="flex shrink-0 items-start justify-between gap-3 px-3 pb-2 pt-3 md:px-4">
            <div className="rounded-sm border border-white/50 bg-white/55 px-2.5 py-1.5 shadow-sm backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-800">JIT / 对话</p>
              <p className="text-[11px] text-slate-700">说一句话，要啥出啥</p>
            </div>
            <div
              className="tabular-nums rounded-sm border border-slate-800/15 bg-slate-900/75 px-3 py-2 text-right shadow-md backdrop-blur-md"
              aria-live="polite"
            >
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">本地时间</p>
              <p className="font-display text-2xl font-semibold leading-none text-white md:text-3xl">{timeStr}</p>
            </div>
          </header>

          {/* 对话区 */}
          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-2 md:px-4"
            role="log"
            aria-label="对话记录"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[92%] rounded-lg rounded-br-sm border border-sky-400/40 bg-sky-600/85 px-3 py-2 text-sm text-white shadow-md backdrop-blur-sm md:max-w-[85%]'
                        : 'max-w-[94%] rounded-lg rounded-bl-sm border border-slate-600/25 bg-slate-900/65 px-3 py-2 text-sm leading-relaxed text-slate-100 shadow-md backdrop-blur-sm md:max-w-[90%]'
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

          {/* 单输入条 */}
          <footer className="shrink-0 border-t border-slate-400/20 bg-white/30 p-3 backdrop-blur-md md:px-4">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <label className="sr-only" htmlFor="glasses-input">
                一句话需求
              </label>
              <textarea
                id="glasses-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
                placeholder="一句话：发消息、导航、做工具、问条款…"
                className="min-h-[44px] flex-1 resize-none rounded-md border border-slate-400/35 bg-white/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 shadow-inner outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/50 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || input.trim().length < 2}
                className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
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
