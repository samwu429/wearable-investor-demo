import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Step = {
  id: string
  label: string
  detail: string
  ms: number
}

const STEPS: Step[] = [
  { id: 'light', label: '光脉冲', detail: '眼镜发出受控微光刺激', ms: 900 },
  { id: 'pupil', label: '瞳孔动力学', detail: '采集主序列约束内的动态响应', ms: 1100 },
  { id: 'ppg', label: '戒指 rPPG', detail: '心血管相位与刺激对齐校验', ms: 1000 },
  { id: 'se', label: 'SE / PUF', detail: '安全域签名与硬件指纹绑定', ms: 900 },
  { id: 'token', label: '人源令牌', detail: '生成可验证摘要（隐私不裸传）', ms: 800 },
]

export function WatchDemo() {
  const [running, setRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(-1)
  const [verified, setVerified] = useState(false)
  const [slmBusy, setSlmBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} · ${line}`, ...prev].slice(0, 10))
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    setStepIndex(-1)
    setVerified(false)
    setSlmBusy(false)
    setLog([])
  }, [])

  const runPeh = useCallback(async () => {
    if (running) return
    setRunning(true)
    setVerified(false)
    setStepIndex(-1)
    pushLog('开始 PEH 脉冲—视线握手（模拟）')
    setSlmBusy(true)
    for (let i = 0; i < STEPS.length; i++) {
      setStepIndex(i)
      pushLog(`${STEPS[i].label} · ${STEPS[i].detail}`)
      await new Promise((r) => setTimeout(r, STEPS[i].ms))
    }
    setSlmBusy(false)
    setVerified(true)
    setRunning(false)
    pushLog('握手完成 · Human-Source 令牌已签发（演示）')
  }, [running, pushLog])

  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Part 1 · 手表中枢演示</h1>
        <p className="mt-4 text-mist">
          模拟 Hub：端侧小模型状态、SE 安全域、与眼镜/戒指协同的 PEH（脉冲—视线握手）时间线。点击「运行握手」观看逐步动画；全程无需后端与硬件。
        </p>
      </div>

      <div className="mt-12 flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
        <div className="relative shrink-0">
          <div
            className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-400/20 via-transparent to-mint/15 blur-2xl"
            aria-hidden
          />
          {/* 外框：金属表壳 */}
          <motion.div
            className="relative flex h-[380px] w-[380px] items-center justify-center rounded-[3rem] border border-slate-200/90 bg-gradient-to-b from-slate-100 via-white to-slate-200 p-3 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_24px_48px_rgba(37,99,235,0.12),0_0_0_1px_rgba(148,163,184,0.25)] md:h-[420px] md:w-[420px]"
            layout
          >
            <div className="absolute inset-3 rounded-[2.6rem] border border-white/80 bg-gradient-to-b from-slate-50 to-slate-100/90 shadow-inner" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" aria-hidden>
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2 - Math.PI / 2
                const x1 = 200 + Math.cos(a) * 178
                const y1 = 200 + Math.sin(a) * 178
                const x2 = 200 + Math.cos(a) * (i % 5 === 0 ? 162 : 170)
                const y2 = 200 + Math.sin(a) * (i % 5 === 0 ? 162 : 170)
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(37,99,235,0.35)"
                    strokeWidth={i % 5 === 0 ? 2 : 1}
                  />
                )
              })}
            </svg>
            {/* 表盘：亮面 + 内凹 */}
            <div className="relative z-10 flex h-[300px] w-[300px] flex-col items-center justify-between rounded-full border border-slate-200/90 bg-gradient-to-b from-white via-[#f4f8ff] to-[#e2ecfa] p-6 shadow-[inset_0_4px_20px_rgba(255,255,255,0.9),inset_0_-8px_24px_rgba(37,99,235,0.06)] md:h-[320px] md:w-[320px]">
              <div className="flex w-full items-start justify-between gap-2">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-mist ring-1 ring-slate-200/80 shadow-sm">
                  Hub · SLM
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                    slmBusy ? 'bg-mint/15 text-mint ring-mint/35' : 'bg-white/90 text-mist ring-slate-200/80'
                  }`}
                >
                  {slmBusy ? '编排中…' : '待机'}
                </span>
              </div>
              <div className="text-center">
                <p className="font-display text-5xl font-semibold tabular-nums text-ink md:text-6xl">{timeStr}</p>
                <p className="mt-1 text-xs text-mist">本地时钟 · 演示</p>
              </div>
              <AnimatePresence mode="wait">
                {verified ? (
                  <motion.div
                    key="ok"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-full bg-mint/12 px-4 py-2 text-sm font-medium text-mint ring-1 ring-mint/35 shadow-sm"
                  >
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mint" />
                    Human-Source 已验证
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-mist"
                  >
                    等待 PEH 握手
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex w-full items-center justify-between text-[10px] text-mist">
                <span className="rounded-md bg-white/95 px-2 py-1 ring-1 ring-slate-200/70 shadow-sm">SE 锁定</span>
                <span className="rounded-md bg-white/95 px-2 py-1 ring-1 ring-slate-200/70 shadow-sm">Lens 已连接</span>
                <span className="rounded-md bg-white/95 px-2 py-1 ring-1 ring-slate-200/70 shadow-sm">Signet 已连接</span>
              </div>
            </div>
          </motion.div>
          <p className="mt-4 text-center text-xs text-mist">表盘为视觉示意 · 非真实 OS 截图</p>
        </div>

        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runPeh}
              disabled={running}
              className="rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_20px_rgba(37,99,235,0.3)] transition enabled:hover:from-blue-600 enabled:hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? '握手进行中…' : '运行 PEH 握手'}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={running}
              className="metallic-surface rounded-full px-6 py-3 text-sm font-medium text-ink transition hover:ring-2 hover:ring-blue-200/80 disabled:opacity-40"
            >
              重置
            </button>
          </div>

          <ol className="space-y-3" aria-label="PEH 步骤">
            {STEPS.map((s, i) => {
              const active = running && i === stepIndex
              const done = verified || stepIndex > i
              return (
                <li
                  key={s.id}
                  className={`flex gap-4 rounded-xl border px-4 py-3 transition ${
                    active
                      ? 'border-blue-300/80 bg-blue-50/90 shadow-sm ring-1 ring-blue-200/60'
                      : done
                        ? 'border-mint/35 bg-mint/5 ring-1 ring-mint/15'
                        : 'border-slate-200/90 bg-white/70 ring-1 ring-slate-100'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active
                        ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm'
                        : done
                          ? 'bg-mint/20 text-mint ring-1 ring-mint/25'
                          : 'bg-slate-100 text-mist ring-1 ring-slate-200/80'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{s.label}</p>
                    <p className="text-sm text-mist">{s.detail}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="metallic-surface rounded-xl p-4 ring-1 ring-slate-200/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">事件日志</p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-mist">
              {log.length === 0 ? <li>暂无</li> : log.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
