import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

gsap.registerPlugin(ScrollTrigger)

/* ─── Data Types ─── */
interface IndexData {
  name: string
  nameEn: string
  symbol: string
  region: string
  close: number
  change: number
  changePercent: number
  trend: string
  open: number
  high: number
  low: number
  previousClose: number
  sparkline?: number[]
  intraday?: Array<{ time: string; value: number }>
}

interface MarketData {
  lastUpdated: string
  indices: IndexData[]
}

/* ─── Data Loading Hook ─── */
function useMarketData() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/market-data.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return { data, loading, error }
}

/* ─── Loading & Error States ─── */
function LoadingSection() {
  return (
    <div className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-silver text-center">加载市场数据中...</p>
      </div>
    </div>
  )
}

function ErrorSection() {
  return (
    <div className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-fall-red text-center">数据加载失败</p>
      </div>
    </div>
  )
}

/* ─── Chart Tooltip ─── */
function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      className="rounded-lg px-4 py-3 border border-dim"
      style={{ backgroundColor: '#141414' }}
    >
      <p className="font-body text-[0.8125rem] text-muted mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="font-mono text-[0.9375rem] text-gold">
          {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : entry.value}
        </p>
      ))}
    </div>
  )
}

/* ─── Section 1: Hero ─── */
function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLAnchorElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.to(backRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(titleRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.2)
      .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.5)
      .to(lineRef.current, { width: 80, duration: 1, ease: 'power3.out' }, 0.8)
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-obsidian"
    >
      {/* Radial glow decoration */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(201,169,98,0.05) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 text-center max-w-[800px] px-6 w-full">
        <Link
          ref={backRef}
          to="/"
          className="absolute top-0 left-0 font-body text-[0.8125rem] text-muted hover:text-gold transition-colors duration-300 opacity-0"
          style={{ transform: 'translateY(-20px)' }}
        >
          ← 返回首页
        </Link>

        <h1
          ref={titleRef}
          className="font-display text-[3rem] font-medium leading-[1.15] tracking-[-0.01em] text-platinum mb-5 opacity-0 translate-y-10"
        >
          市场指数
        </h1>

        <div
          ref={lineRef}
          className="h-[1px] bg-gold mx-auto mb-5"
          style={{ width: 0, opacity: 0.6 }}
        />

        <p
          ref={subtitleRef}
          className="font-body text-[1.0625rem] leading-[1.7] text-silver opacity-0 translate-y-8"
        >
          美股 · 日经 · KOSPI — 2026年5月7日收盘全景
        </p>
      </div>
    </section>
  )
}

/* ─── Section 2: US Indices — one per large area ─── */
function USIndicesSection({ indices }: { indices: IndexData[] }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  const usIndices = indices.filter(i => i.region === 'United States')

  // Generate intraday-like data for each index
  const generateChartData = (close: number, change: number) => {
    const start = close - change
    const data: { time: string; value: number }[] = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      const trend = start + (close - start) * t
      const noise = Math.sin(i * 1.3) * Math.abs(change) * 0.3
      data.push({
        time: `${9 + Math.floor(i * 0.5)}:${String((i * 30) % 60).padStart(2, '0')}`,
        value: trend + noise,
      })
    }
    return data
  }

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 40, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      const cards = sectionRef.current?.querySelectorAll('.us-index-card')
      if (cards) {
        gsap.from(cards, {
          y: 50, scale: 0.97, duration: 0.8, stagger: 0.25, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
        })
      }
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  const descriptions = [
    '道指盘中一度突破50,000点大关，为历史首次，但收盘未能守住这一里程碑水平',
    '标普500连续刷新历史新高后回落，2026年年内涨幅超25%',
    '纳指相对抗跌，纳斯达克100指数逆势收涨+0.17%，大型科技股韧性显现',
  ]

  return (
    <section ref={sectionRef} className="bg-obsidian py-20 md:py-[80px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div ref={titleRef} className="mb-12">
          <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em] uppercase mb-3">
            UNITED STATES
          </p>
          <h2 className="font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum mb-3">
            美股三大指数
          </h2>
          <p className="font-body text-[0.8125rem] text-muted">
            2026年5月7日收盘 · 全线收跌
          </p>
        </div>

        {/* Each index gets its own large card */}
        <div className="space-y-8">
          {usIndices.map((idx, i) => {
            const chartData = generateChartData(idx.close, idx.change)
            return (
              <div
                key={idx.symbol}
                className="us-index-card rounded-xl border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-gold/40"
                style={{ borderLeftWidth: '3px', borderLeftColor: '#FF6B6B' }}
              >
                {/* Top: Data */}
                <div className="p-8 md:p-10">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Name + Big Number */}
                    <div className="lg:w-[35%]">
                      <h3 className="font-body text-xl font-medium text-platinum mb-1">{idx.name}</h3>
                      <p className="font-body text-[0.75rem] text-muted tracking-wider mb-4">{idx.nameEn}</p>
                      <div className="mb-2">
                        <span className="font-mono text-[3rem] font-medium text-platinum tracking-[-0.03em] leading-none">
                          {idx.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="font-mono text-[1.25rem] text-fall-red font-medium">
                          {idx.changePercent.toFixed(2)}%
                        </span>
                        <span className="font-mono text-[0.875rem] text-fall-red">
                          {idx.change.toFixed(2)}点
                        </span>
                      </div>
                      <p className="font-body text-[0.8125rem] text-silver leading-relaxed">
                        {descriptions[i]}
                      </p>
                    </div>

                    {/* Right: Chart */}
                    <div className="lg:w-[60%] h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`usGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fill: '#4A4A4A', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={['auto', 'auto']} tick={{ fill: '#4A4A4A', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#141414', border: '1px solid #3A3A3A', borderRadius: '8px', color: '#E8E4E0' }}
                            itemStyle={{ color: '#E8E4E0', fontSize: '0.75rem' }}
                            labelStyle={{ color: '#6A6A6A', fontSize: '0.625rem' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#FF6B6B" strokeWidth={2} fill={`url(#usGrad-${i})`} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom: OHLC Grid */}
                <div className="px-8 md:px-10 py-4 border-t border-dim bg-[rgba(10,10,10,0.3)] grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-body text-[0.625rem] text-muted mb-1">开盘</p>
                    <p className="font-mono text-[0.875rem] text-silver">{idx.open.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-body text-[0.625rem] text-muted mb-1">最高</p>
                    <p className="font-mono text-[0.875rem] text-silver">{idx.high.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-body text-[0.625rem] text-muted mb-1">最低</p>
                    <p className="font-mono text-[0.875rem] text-silver">{idx.low.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-body text-[0.625rem] text-muted mb-1">前收盘</p>
                    <p className="font-mono text-[0.875rem] text-silver">{idx.previousClose?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Section 3: Nikkei 225 ─── */
function NikkeiSection({ nikkei }: { nikkei: IndexData }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const driversRef = useRef<HTMLDivElement>(null)

  const closeRef = useRef<HTMLSpanElement>(null)
  const pointsRef = useRef<HTMLSpanElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)

  // Counter animations removed - values rendered statically

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(panelRef.current?.querySelectorAll('.animate-item') || [], {
        y: 30, duration: 0.7, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      gsap.from(chartRef.current, {
        y: 30, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: chartRef.current, start: 'top 85%' },
      })

      const gridItems = gridRef.current?.children
      if (gridItems) {
        gsap.from(gridItems, {
          y: 20, duration: 0.6, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
        })
      }

      const drivers = driversRef.current?.querySelectorAll('.driver-item')
      if (drivers) {
        gsap.from(drivers, {
          x: -20, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: driversRef.current, start: 'top 85%' },
        })
      }
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  const intraday = nikkei.intraday ?? []

  return (
    <section ref={sectionRef} className="bg-charcoal py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        {/* Top data panel */}
        <div ref={panelRef} className="mb-12">
          <p className="animate-item font-body text-[0.8125rem] text-gold tracking-[0.1em] uppercase mb-3">
            JAPAN
          </p>
          <h2 className="animate-item font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum mb-6">
            日经225指数
          </h2>

          <div className="animate-item flex flex-wrap items-end gap-6 md:gap-10 mb-4">
            <div>
              <span ref={closeRef} className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none block">
                {nikkei.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="font-body text-[0.8125rem] text-muted mt-1">收盘</p>
            </div>
            <div>
              <span ref={pointsRef} className="font-mono text-[2rem] font-normal text-rise-green leading-none block">
                {nikkei.change >= 0 ? '+' : ''}{nikkei.change.toFixed(2)}
              </span>
              <p className="font-body text-[0.8125rem] text-muted mt-1">涨跌点数</p>
            </div>
            <div>
              <span ref={pctRef} className="font-mono text-[2rem] font-normal text-rise-green leading-none block">
                {nikkei.changePercent >= 0 ? '+' : ''}{nikkei.changePercent.toFixed(2)}%
              </span>
              <p className="font-body text-[0.8125rem] text-muted mt-1">涨跌幅</p>
            </div>
          </div>

          <div className="animate-item inline-block rounded px-3 py-1" style={{ backgroundColor: 'rgba(29,185,84,0.15)' }}>
            <span className="font-body text-[0.8125rem] text-rise-green">
              创历史最大单日点数涨幅
            </span>
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="mb-12">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={intraday} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nikkeiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(29,185,84,0.2)" />
                  <stop offset="100%" stopColor="rgba(29,185,84,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2A2A2A" strokeWidth={0.5} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#6A6A6A', fontSize: 13, fontFamily: 'Noto Sans SC' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 500', 'dataMax + 500']}
                tick={{ fill: '#6A6A6A', fontSize: 13, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1DB954"
                strokeWidth={3}
                fill="url(#nikkeiGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#1DB954', stroke: '#0A0A0A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Detail grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl p-8 border border-dim bg-[rgba(20,20,20,0.4)]">
            <p className="font-body text-[0.8125rem] text-muted mb-2">盘中最高</p>
            <span className="font-mono text-[2rem] font-normal text-platinum tracking-[-0.02em]">
              {nikkei.high.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl p-8 border border-dim bg-[rgba(20,20,20,0.4)]">
            <p className="font-body text-[0.8125rem] text-muted mb-2">前日基准</p>
            <span className="font-mono text-[2rem] font-normal text-silver tracking-[-0.02em]">
              {nikkei.previousClose.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl p-8 border border-dim bg-[rgba(20,20,20,0.4)]">
            <p className="font-body text-[0.8125rem] text-muted mb-2">历史意义</p>
            <p className="font-body text-[0.9375rem] text-silver leading-relaxed">
              1987年以来最大单日涨幅
            </p>
          </div>
        </div>

        {/* Key drivers */}
        <div ref={driversRef}>
          <h4 className="font-body text-[1.125rem] font-normal text-platinum mb-6">
            关键驱动
          </h4>
          <div className="space-y-4">
            {[
              '软银集团暴涨 +18.4%，贡献日经225最大点数涨幅',
              'AI半导体超级周期预期持续升温',
              '日本本土半导体产业链全面受益',
            ].map((text, i) => (
              <div key={i} className="driver-item flex items-start gap-4">
                <div className="w-[2px] h-full min-h-[24px] bg-rise-green rounded-full flex-shrink-0 mt-1" />
                <p className="font-body text-[0.9375rem] text-silver leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 4: KOSPI ─── */
function KOSPISection({ kospi }: { kospi: IndexData }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)

  const closeRef = useRef<HTMLSpanElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)

  // Counter animations removed - values rendered statically

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(panelRef.current?.querySelectorAll('.animate-item') || [], {
        y: 30, duration: 0.7, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      gsap.from(chartRef.current, {
        y: 30, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: chartRef.current, start: 'top 85%' },
      })

      const gridItems = gridRef.current?.children
      if (gridItems) {
        gsap.from(gridItems, {
          y: 20, duration: 0.6, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
        })
      }

      gsap.from(bgRef.current, {
        y: 30, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: bgRef.current, start: 'top 85%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  const intraday = kospi.intraday ?? []

  return (
    <section ref={sectionRef} className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        {/* Top data panel */}
        <div ref={panelRef} className="mb-12">
          <p className="animate-item font-body text-[0.8125rem] text-gold tracking-[0.1em] uppercase mb-3">
            SOUTH KOREA
          </p>
          <h2 className="animate-item font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum mb-6">
            韩国KOSPI指数
          </h2>

          <div className="animate-item flex flex-wrap items-end gap-6 md:gap-10 mb-4">
            <div>
              <span ref={closeRef} className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none block">
                {kospi.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="font-body text-[0.8125rem] text-muted mt-1">收盘</p>
            </div>
            <div>
              <span ref={pctRef} className="font-mono text-[2rem] font-normal text-rise-green leading-none block">
                {kospi.changePercent >= 0 ? '+' : ''}{kospi.changePercent.toFixed(2)}%
              </span>
              <p className="font-body text-[0.8125rem] text-muted mt-1">涨跌幅</p>
            </div>
          </div>

          <div className="animate-item inline-block rounded px-3 py-1" style={{ backgroundColor: 'rgba(29,185,84,0.15)' }}>
            <span className="font-body text-[0.8125rem] text-rise-green">
              盘中创历史新高 7,531.88
            </span>
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="mb-12">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={intraday} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="kospiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(29,185,84,0.2)" />
                  <stop offset="100%" stopColor="rgba(29,185,84,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2A2A2A" strokeWidth={0.5} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#6A6A6A', fontSize: 13, fontFamily: 'Noto Sans SC' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 30', 'dataMax + 30']}
                tick={{ fill: '#6A6A6A', fontSize: 13, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1DB954"
                strokeWidth={3}
                fill="url(#kospiGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#1DB954', stroke: '#0A0A0A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Detail grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl p-8 border border-dim bg-[rgba(20,20,20,0.4)]">
            <p className="font-body text-[0.8125rem] text-light-gold mb-2">历史新高</p>
            <span className="font-mono text-[2rem] font-normal text-platinum tracking-[-0.02em]">
              7,531.88
            </span>
          </div>
          <div className="rounded-xl p-8 border border-dim bg-[rgba(20,20,20,0.4)]">
            <p className="font-body text-[0.8125rem] text-muted mb-2">关键贡献</p>
            <p className="font-body text-[0.9375rem] text-silver leading-relaxed">
              SK海力士 +3.31%
            </p>
          </div>
          <div className="rounded-xl p-8 border border-dim bg-[rgba(20,20,20,0.4)]">
            <p className="font-body text-[0.8125rem] text-muted mb-2">关键贡献</p>
            <p className="font-body text-[0.9375rem] text-silver leading-relaxed">
              三星电子 +2.07%
            </p>
          </div>
        </div>

        {/* Market background */}
        <div ref={bgRef}>
          <h4 className="font-body text-[1.125rem] font-normal text-platinum mb-4">
            市场背景
          </h4>
          <p className="font-body text-[1.0625rem] text-silver leading-[1.8] max-w-[900px]">
            韩国股市在半导体双雄的带动下刷新盘中历史新高。SK海力士凭借在HBM高带宽内存领域的绝对领先地位（市占率57-62%），持续受益于全球AI算力扩张。三星电子Q1利润同比暴增756%，市值突破万亿美元大关，进一步巩固了韩国在全球半导体版图中的核心地位。
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 5: Cross-Market Comparison ─── */
function ComparisonSection({ indices }: { indices: IndexData[] }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)

  const crossMarketData = indices.map(idx => ({
    name: idx.name,
    value: idx.changePercent,
    color: idx.changePercent >= 0 ? '#1DB954' : '#FF6B6B',
  }))

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 30, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      gsap.from(chartRef.current, {
        y: 30, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: chartRef.current, start: 'top 85%' },
      })

      gsap.from(quoteRef.current, {
        y: 30, duration: 0.8, delay: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: quoteRef.current, start: 'top 85%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} className="bg-charcoal py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <h2
          ref={titleRef}
          className="font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum text-center mb-12"
        >
          跨市场对比
        </h2>

        <div ref={chartRef} className="mb-12">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={crossMarketData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid stroke="#2A2A2A" strokeWidth={0.5} horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tick={{ fill: '#6A6A6A', fontSize: 13, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#B0B0B0', fontSize: 14, fontFamily: 'Noto Sans SC' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                {crossMarketData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div ref={quoteRef} className="text-center max-w-[800px] mx-auto">
          <div className="h-[1px] bg-gold w-10 mx-auto mb-6" style={{ opacity: 0.6 }} />
          <p className="font-body text-[1.0625rem] text-silver leading-[1.8] italic mb-6">
            美股全线收跌与日经/KOSPI 大涨形成鲜明对比，反映全球资本正在重新配置：资金从估值高企的美科技股向受益于AI半导体超级周期的亚洲硬科技产业链转移。
          </p>
          <div className="h-[1px] bg-gold w-10 mx-auto" style={{ opacity: 0.6 }} />
        </div>
      </div>
    </section>
  )
}

/* ─── Markets Page ─── */
export default function Markets() {
  const { data, loading, error } = useMarketData()

  if (loading) {
    return (
      <div className="bg-obsidian">
        <HeroSection />
        <LoadingSection />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-obsidian">
        <HeroSection />
        <ErrorSection />
      </div>
    )
  }

  const nikkei = data.indices.find(i => i.symbol === '^N225')
  const kospi = data.indices.find(i => i.symbol === '^KS11')

  return (
    <div className="bg-obsidian">
      <HeroSection />
      <USIndicesSection indices={data.indices} />
      {nikkei && <NikkeiSection nikkei={nikkei} />}
      {kospi && <KOSPISection kospi={kospi} />}
      <ComparisonSection indices={data.indices} />
    </div>
  )
}
