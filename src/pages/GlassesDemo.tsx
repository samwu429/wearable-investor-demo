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
      <div className="border-b border-stone-600 px-2 py-0.5 text-[10px] text-stone-300">
        <span className="text-amber-200">地图</span> {data.headline}
      </div>
      <svg className="h-20 w-full" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M 40 130 Q 120 24 280 40"
          fill="none"
          stroke="rgba(110,231,183,0.85)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <rect x="31" y="121" width="14" height="14" fill="none" stroke="rgba(153,246,228,0.9)" strokeWidth="2" />
        <rect x="273" y="31" width="14" height="14" fill="none" stroke="rgba(252,165,165,0.95)" strokeWidth="2" />
      </svg>
      <div className="border-t border-stone-600 px-2 py-0.5 text-[9px] text-stone-400">
        {data.fromLabel} → {data.toLabel} · {data.travelMode} ~{data.minutes}min
      </div>
    </div>
  )
}

function InlineChatSnippet({ data }: { data: InstantChatUi }) {
  return (
    <div className="glasses-chat-card mt-2 !p-0">
      <div className="border-b border-stone-600 px-2 py-0.5 text-[9px] text-stone-400">
        与 <span className="text-stone-100">{data.peerName}</span> · {data.peerStatus}
      </div>
      <div className="max-h-24 space-y-0.5 overflow-y-auto px-2 py-1">
        {data.bubbles.slice(0, 5).map((b, i) => (
          <p key={i} className="text-[9px] text-stone-200">
            <span className={b.role === 'me' ? 'text-teal-300' : 'text-stone-500'}>
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
    <div className="glasses-chat-card mt-2 space-y-0.5 p-1.5">
      <p className="text-[9px] text-amber-200">界面草稿</p>
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
    <div className="mt-1.5 border-l-2 border-gold pl-2">
      <p className="text-[10px] font-medium text-stone-700">{preview.productName}</p>
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
        '人眼会把视野合成一片：这里也是一整块——上面是时间，下面是同一场对话。去 App 化就是一句话要啥出啥；需要聊天、地图或条款解释，都在这条线程里完成。',
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
          text: `按你的话排了一版草稿（仍在对话里，没有单独 App）。`,
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
        Part 2 · 单片视野：时间与对话同一视场；整块区域铺满导航与页脚之间的空间，模拟宽画幅眼镜。
      </p>

      <div className="glasses-frame-bezel flex min-h-0 flex-1 flex-col p-2 md:p-3">
        <div className="glasses-lens-field flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 同一视场：说明 + 时间 */}
          <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 border-b border-stone-300/80 bg-white/50 px-4 py-3 md:px-6 md:py-4">
            <div>
              <p className="text-xs font-medium text-mist md:text-sm">眼镜 HUD · 演示</p>
              <p className="text-sm text-ink md:text-base">一句话 → 草稿或条款解释</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-mist md:text-xs">时间</p>
              <p className="font-display text-3xl font-semibold tabular-nums text-ink md:text-4xl lg:text-5xl">{timeStr}</p>
            </div>
          </header>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 md:space-y-4 md:px-6 md:py-4"
            role="log"
            aria-label="对话记录"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[min(92%,720px)] rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-50 md:px-4 md:py-2.5 md:text-base'
                        : 'max-w-[min(96%,min(1400px,92vw))] rounded-md border border-stone-300 bg-[#fffcf7] px-3 py-2 text-sm leading-relaxed text-ink md:px-5 md:py-3 md:text-base'
                    }
                  >
                    {m.loading ? (
                      <span className="text-stone-400">…</span>
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

          <footer className="shrink-0 border-t border-stone-300/80 bg-white/40 px-4 py-3 md:px-6 md:py-4">
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
                className="min-h-[48px] w-full flex-1 rounded-md border border-stone-400 bg-white px-4 py-2.5 text-base text-ink placeholder:text-stone-500 outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 disabled:opacity-60 md:min-h-[52px] md:text-lg"
              />
              <button
                type="submit"
                disabled={busy || input.trim().length < 2}
                className="shrink-0 rounded-md border border-gold-dim bg-gold px-8 py-2.5 text-base font-semibold text-white transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-50 sm:px-10"
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
