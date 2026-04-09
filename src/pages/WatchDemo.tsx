import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'

export function WatchDemo() {
  const { t, m, locale } = useI18n()
  const steps = m.watch.steps

  const [running, setRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState(-1)
  const [verified, setVerified] = useState(false)
  const [slmBusy, setSlmBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [now, setNow] = useState(() => new Date())

  const timeLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const pushLog = useCallback(
    (line: string) => {
      const ts = new Date().toLocaleTimeString(timeLocale)
      setLog((prev) => [`${ts} · ${line}`, ...prev].slice(0, 10))
    },
    [timeLocale],
  )

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
    pushLog(t('watch.logStart'))
    setSlmBusy(true)
    for (let i = 0; i < steps.length; i++) {
      setStepIndex(i)
      pushLog(`${steps[i].label} · ${steps[i].detail}`)
      await new Promise((r) => setTimeout(r, steps[i].ms))
    }
    setSlmBusy(false)
    setVerified(true)
    setRunning(false)
    pushLog(t('watch.logDone'))
  }, [running, pushLog, steps, t])

  const timeStr = now.toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">{t('watch.title')}</h1>
        <p className="mt-4 text-mist">{t('watch.lead')}</p>
      </div>

      <div className="mt-12 flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
        <div className="relative shrink-0">
          <motion.div
            className="relative flex h-[380px] w-[380px] items-center justify-center rounded-3xl border border-stone-400 bg-[#f0ebe3] p-3 shadow-[inset_0_2px_8px_rgba(255,255,255,0.75)] md:h-[420px] md:w-[420px]"
            layout
          >
            <div className="absolute inset-3 rounded-2xl border border-stone-300 bg-[#faf8f5]" />
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
                    stroke="rgba(15,118,110,0.35)"
                    strokeWidth={i % 5 === 0 ? 2 : 1}
                  />
                )
              })}
            </svg>
            <div className="relative z-10 flex h-[300px] w-[300px] flex-col items-center justify-between rounded-full border border-stone-300 bg-gradient-to-b from-white to-stone-100 p-6 shadow-inner md:h-[320px] md:w-[320px]">
              <div className="flex w-full items-start justify-between gap-2">
                <span className="rounded-sm border border-stone-300 bg-white px-2 py-0.5 text-[10px] text-mist">
                  {t('watch.hubSlm')}
                </span>
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[10px] ${
                    slmBusy ? 'border-mint/40 bg-mint/10 text-mint' : 'border-stone-300 bg-white text-mist'
                  }`}
                >
                  {slmBusy ? t('watch.slmBusy') : t('watch.slmIdle')}
                </span>
              </div>
              <div className="text-center">
                <p className="font-display text-5xl font-semibold tabular-nums text-ink md:text-6xl">{timeStr}</p>
                <p className="mt-1 text-xs text-mist">{t('watch.clockDemo')}</p>
              </div>
              <AnimatePresence mode="wait">
                {verified ? (
                  <motion.div
                    key="ok"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-sm border border-mint/40 bg-mint/10 px-4 py-2 text-sm font-medium text-mint"
                  >
                    <span className="inline-block h-2 w-2 animate-pulse rounded-sm bg-mint" />
                    {t('watch.verified')}
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-mist"
                  >
                    {t('watch.waiting')}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex w-full items-center justify-between text-[10px] text-mist">
                <span className="rounded-sm border border-stone-300 bg-white px-2 py-1">{t('watch.seLock')}</span>
                <span className="rounded-sm border border-stone-300 bg-white px-2 py-1">{t('watch.lensConnected')}</span>
                <span className="rounded-sm border border-stone-300 bg-white px-2 py-1">{t('watch.signetConnected')}</span>
              </div>
            </div>
          </motion.div>
          <p className="mt-4 text-center text-xs text-mist">{t('watch.dialCaption')}</p>
        </div>

        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runPeh}
              disabled={running}
              className="rounded-md border border-gold-dim bg-gold px-6 py-3 text-sm font-semibold text-white transition enabled:hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? t('watch.running') : t('watch.runHandshake')}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={running}
              className="metallic-surface rounded-md px-6 py-3 text-sm font-medium text-ink transition hover:border-stone-500 disabled:opacity-40"
            >
              {t('watch.reset')}
            </button>
          </div>

          <ol className="space-y-3" aria-label={t('watch.stepsAria')}>
            {steps.map((s, i) => {
              const active = running && i === stepIndex
              const done = verified || stepIndex > i
              return (
                <li
                  key={s.id}
                  className={`flex gap-4 rounded-md border px-4 py-3 transition ${
                    active
                      ? 'border-gold/50 bg-teal-50/80'
                      : done
                        ? 'border-mint/30 bg-mint/5'
                        : 'border-stone-300 bg-white/90'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                      active
                        ? 'bg-gold text-white'
                        : done
                          ? 'border border-mint/30 bg-mint/15 text-mint'
                          : 'border border-stone-300 bg-stone-100 text-mist'
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

          <div className="metallic-surface rounded-md p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{t('watch.logTitle')}</p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-mist">
              {log.length === 0 ? <li>{t('watch.logEmpty')}</li> : log.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
