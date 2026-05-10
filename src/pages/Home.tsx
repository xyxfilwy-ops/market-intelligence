import { useRef, useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import heroBg from '../assets/hero-bg.jpg'

gsap.registerPlugin(ScrollTrigger)

/* ─── Trend Color Helpers ─── */
const trendClass = (change: number) => change >= 0 ? 'text-rise-green' : 'text-fall-red'
const trendBorderColor = (change: number) => change >= 0 ? '#FF6B6B' : '#1DB954'

/* ─── Data Types ─── */
interface IndexAnalysis {
  comment: string
  subComment: string
  drivers: string[]
  topContributors: Array<{
    name: string
    nameEn: string
    changePercent: number
    contribution: string
    sector: string
    analysis: string[]
  }>
}

interface MarketData {
  lastUpdated: string
  indices: Array<{
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
    analysis?: IndexAnalysis
  }>
}

/* ─── Data Loading Hook ─── */
function useMarketData() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('./data/market-data.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return { data, loading, error }
}

/* ─── Hero Section ─── */
function HeroSection({ data, loading }: { data: MarketData | null; loading: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.to(labelRef.current, { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' })
      .to(titleRef.current, { opacity: 1, y: 0, duration: 0.9, delay: 0, ease: 'power3.out' }, '-=0.3')
      .to(lineRef.current, { width: 120, duration: 1.2, delay: 0, ease: 'power3.out' }, '-=0.6')
      .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.8, delay: 0, ease: 'power2.out' }, '-=0.7')
      .to(scrollRef.current, { opacity: 1, duration: 0.5, delay: 0, ease: 'power2.out' }, '-=0.3')

    gsap.to(bgRef.current, { scale: 1, duration: 6, ease: 'power2.out' })
  }, { scope: sectionRef })

  const dateLabel = data ? formatDateLabel(data.lastUpdated) : (loading ? '数据加载中...' : '海外市场深度分析')
  const subtitle = data ? generateHeroSubtitle(data.indices) : '全球市场动态监测，实时把握AI半导体产业链脉搏'

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 z-0"
        style={{ transform: 'scale(0.95)' }}
      >
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(10,10,10,0.4)]" />
      </div>

      <div className="relative z-10 text-center max-w-[900px] px-6">
        <p
          ref={labelRef}
          className="font-body text-[0.8125rem] text-muted tracking-[0.08em] uppercase mb-8 opacity-0 translate-y-5"
        >
          {dateLabel} · 海外市场深度分析
        </p>

        <h1
          ref={titleRef}
          className="font-display text-[3rem] md:text-[4.5rem] font-semibold leading-[1.1] tracking-[-0.02em] mb-6 opacity-0 translate-y-10"
          style={{
            background: 'linear-gradient(135deg, #C9A962 0%, #E8D5A3 50%, #C9A962 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          全球资本的脉搏
        </h1>

        <div
          ref={lineRef}
          className="h-[1px] bg-gold mx-auto mb-6"
          style={{ width: 0, opacity: 0.6 }}
        />

        <p
          ref={subtitleRef}
          className="font-body text-[1.0625rem] leading-[1.7] text-silver max-w-[720px] mx-auto opacity-0 translate-y-8"
        >
          {subtitle}
        </p>
      </div>

      <div
        ref={scrollRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-0"
      >
        <div className="w-10 h-10 rounded-full border border-muted flex items-center justify-center animate-bounce">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  )
}

/* ─── Market Pulse Section ─── */
function MarketPulseSection() {
  const { data, loading, error } = useMarketData()
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const dowRef = useRef<HTMLSpanElement>(null)
  const spRef = useRef<HTMLSpanElement>(null)
  const nasdaqRef = useRef<HTMLSpanElement>(null)
  const nikkeiRef = useRef<HTMLSpanElement>(null)
  const kospiRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!data || loading) return
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 40, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      const cards = cardsRef.current?.children
      if (cards) {
        gsap.from(cards, {
          y: 60, scale: 0.9, duration: 0.8, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: { trigger: cardsRef.current, start: 'top 90%' },
        })
      }

      // Counter animations — all 5 indices
      const usIdx = data.indices.filter(i => i.region === 'United States')
      const nikkei = data.indices.find(i => i.symbol === '^N225')
      const kospi = data.indices.find(i => i.symbol === '^KS11')

      const animateCounter = (ref: React.RefObject<HTMLSpanElement | null>, target: number, delay: number) => {
        if (!ref.current) return
        const obj = { val: 0 }
        gsap.to(obj, {
          val: target, duration: 1.5, delay, ease: 'power2.out',
          scrollTrigger: { trigger: cardsRef.current, start: 'top 85%' },
          onUpdate: () => {
            if (ref.current) ref.current.textContent = obj.val.toFixed(2)
          },
        })
      }

      animateCounter(dowRef, usIdx[0]?.close ?? 0, 0.3)
      animateCounter(spRef, usIdx[1]?.close ?? 0, 0.45)
      animateCounter(nasdaqRef, usIdx[2]?.close ?? 0, 0.6)
      animateCounter(nikkeiRef, nikkei?.close ?? 0, 0.75)
      animateCounter(kospiRef, kospi?.close ?? 0, 0.9)
    }, sectionRef)

    return () => ctx.revert()
  }, { scope: sectionRef, dependencies: [data, loading] })

  if (loading) return (
    <div className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-silver text-center">加载市场数据中...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-red-500 text-center">数据加载失败</p>
      </div>
    </div>
  )

  const usIndices = data.indices.filter(i => i.region === 'United States')
  const nikkei = data.indices.find(i => i.symbol === '^N225')
  const kospi = data.indices.find(i => i.symbol === '^KS11')

  return (
    <section ref={sectionRef} className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div ref={titleRef} className="mb-12">
          <h2 className="font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum mb-4">
            市场脉动
          </h2>
          <p className="font-body text-[0.9375rem] text-muted">
            三大市场核心指数 · {data ? formatDateLabel(data.lastUpdated) : '最新收盘'}
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* US Index Cards — same style as Nikkei/KOSPI */}
          {usIndices.map((idx, i) => (
            <div
              key={idx.symbol}
              className="us-index-card rounded-xl p-10 border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)]"
              style={{ borderLeftWidth: '3px', borderLeftColor: trendBorderColor(idx.change) }}
            >
              <h3 className="font-body text-2xl font-medium text-platinum mb-1">{idx.name}</h3>
              <p className="font-body text-[0.8125rem] text-muted tracking-wider mb-6">{idx.nameEn}</p>

              <div className="mb-4">
                <span
                  ref={i === 0 ? dowRef : i === 1 ? spRef : nasdaqRef}
                  className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none"
                >
                  0.00
                </span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <span className={`font-mono text-[2rem] font-normal ${trendClass(idx.change)}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
                <span className={`font-body text-[0.8125rem] ${trendClass(idx.change)}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}点
                </span>
              </div>

              <p className="font-body text-[0.9375rem] text-light-gold mb-4">
                {generateIndexComment(idx)}
              </p>

              <div className="pt-4 border-t border-dim">
                <p className="font-body text-[0.8125rem] text-muted">
                  {generateIndexSubComment(idx)}
                </p>
              </div>
            </div>
          ))}

          {/* Card 2 — Nikkei */}
          {nikkei && (
            <div className="rounded-xl p-10 border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)]" style={{ borderLeftWidth: '3px', borderLeftColor: trendBorderColor(nikkei.change) }}>
              <h3 className="font-body text-2xl font-medium text-platinum mb-1">日经225指数</h3>
              <p className="font-body text-[0.8125rem] text-muted tracking-wider mb-6">Japan</p>

              <div className="mb-4">
                <span ref={nikkeiRef} className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none">{nikkei.close.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <span className={`font-mono text-[2rem] font-normal ${trendClass(nikkei.change)}`}>{nikkei.change >= 0 ? '+' : ''}{nikkei.changePercent.toFixed(2)}%</span>
                <span className={`font-body text-[0.8125rem] ${trendClass(nikkei.change)}`}>{nikkei.change >= 0 ? '+' : ''}{nikkei.change >= 1000 ? (nikkei.change / 1000).toFixed(0) + ',' + (nikkei.change % 1000).toFixed(0).padStart(3, '0') : Math.round(nikkei.change).toLocaleString()}点</span>
              </div>

              <p className="font-body text-[0.9375rem] text-light-gold mb-4">
                {generateIndexComment(nikkei)}
              </p>

              <div className="pt-4 border-t border-dim">
                <p className="font-body text-[0.8125rem] text-muted">
                  {generateIndexSubComment(nikkei)}
                </p>
              </div>
            </div>
          )}

          {/* Card 3 — KOSPI */}
          {kospi && (
            <div className="rounded-xl p-10 border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)]" style={{ borderLeftWidth: '3px', borderLeftColor: trendBorderColor(kospi.change) }}>
              <h3 className="font-body text-2xl font-medium text-platinum mb-1">韩国KOSPI指数</h3>
              <p className="font-body text-[0.8125rem] text-muted tracking-wider mb-6">South Korea</p>

              <div className="mb-4">
                <span ref={kospiRef} className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none">{kospi.close.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <span className={`font-mono text-[2rem] font-normal ${trendClass(kospi.change)}`}>{kospi.change >= 0 ? '+' : ''}{kospi.changePercent.toFixed(2)}%</span>
              </div>

              <p className="font-body text-[0.8125rem] text-light-gold mb-4">
                {generateIndexComment(kospi)}
              </p>

              <div className="pt-4 border-t border-dim">
                <p className="font-body text-[0.8125rem] text-muted">
                  {generateIndexSubComment(kospi)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─── Highlights Section ─── */
function HighlightsSection({ data }: { data: MarketData | null }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const highlightData = useMemo(() => {
    if (!data || !data.indices.length) {
      return [
        { target: 0, suffix: '%', label: '数据加载中', sub: '等待市场数据更新', prefix: '' },
      ]
    }

    const indices = data.indices
    // Find biggest gainer and loser
    const sorted = [...indices].sort((a, b) => b.changePercent - a.changePercent)
    const topGainer = sorted[0]
    const topLoser = sorted[sorted.length - 1]

    const us = indices.filter(i => i.region === 'United States')
    const usAvg = us.length ? us.reduce((s, i) => s + i.changePercent, 0) / us.length : 0

    const items: Array<{ target: number; suffix: string; label: string; sub: string; prefix: string }> = []

    if (topGainer && topGainer.changePercent > 0) {
      items.push({
        target: Math.abs(topGainer.changePercent),
        suffix: '%',
        label: `${topGainer.name}领涨`,
        sub: `当日收盘 ${topGainer.change >= 0 ? '+' : ''}${topGainer.change.toFixed(2)}点`,
        prefix: '+',
      })
    }

    if (topLoser && topLoser.changePercent < 0 && topLoser.symbol !== topGainer.symbol) {
      items.push({
        target: Math.abs(topLoser.changePercent),
        suffix: '%',
        label: `${topLoser.name}领跌`,
        sub: `当日收盘 ${topLoser.change.toFixed(2)}点`,
        prefix: '-',
      })
    }

    if (us.length) {
      items.push({
        target: Math.abs(usAvg),
        suffix: '%',
        label: '美股平均涨跌幅',
        sub: `道指 / 标普 / 纳指综合表现`,
        prefix: usAvg >= 0 ? '+' : '-',
      })
    }

    const asia = indices.filter(i => i.region !== 'United States')
    const asiaUp = asia.filter(i => i.changePercent > 0).length
    const asiaDown = asia.filter(i => i.changePercent < 0).length
    if (asia.length) {
      items.push({
        target: asiaUp,
        suffix: '涨',
        label: `亚洲市场 ${asiaUp}涨${asiaDown}跌`,
        sub: '日韩市场收盘分化',
        prefix: '',
      })
    }

    // Volatility: biggest intraday range
    const mostVolatile = [...indices].sort((a, b) =>
      ((b.high - b.low) / b.previousClose * 100) - ((a.high - a.low) / a.previousClose * 100)
    )[0]
    if (mostVolatile) {
      const range = ((mostVolatile.high - mostVolatile.low) / mostVolatile.previousClose * 100)
      items.push({
        target: range,
        suffix: '%',
        label: '最大日内振幅',
        sub: `${mostVolatile.name} 高低点落差`,
        prefix: '',
      })
    }

    return items.slice(0, 5)
  }, [data])

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 40, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      const cards = cardsRef.current?.children
      if (cards) {
        gsap.from(cards, {
          y: 30, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: cardsRef.current, start: 'top 85%' },
        })
      }

      // Counter animations removed — values rendered directly
    }, sectionRef)

    return () => ctx.revert()
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} className="bg-charcoal py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div ref={titleRef} className="mb-12">
          <h2 className="font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum mb-4">
            核心亮点
          </h2>
          <div className="h-[1px] bg-gold w-full" ref={(el) => {
            if (el) {
              gsap.to(el, { width: '100%', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
            }
          }} />
        </div>

        <div ref={cardsRef} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-stretch">
          {highlightData.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-5 bg-charcoal border border-dim transition-all duration-300 hover:border-gold/30 hover:-translate-y-0.5 h-full flex flex-col"
            >
              <div className="font-mono text-[2rem] font-normal text-gold tracking-[-0.02em] mb-3">
                {item.prefix && <span>{item.prefix}</span>}
                <span>{item.target.toFixed(item.target < 10 ? 2 : 0)}</span>
                <span>{item.suffix}</span>
              </div>
              <p className="font-body text-[0.9375rem] text-silver leading-relaxed mb-1">
                {item.label}
              </p>
              <p className="font-body text-[0.8125rem] text-muted">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Deep Dive Section ─── */
function DeepDiveSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 40, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })

      const cards = cardsRef.current?.children
      if (cards) {
        gsap.from(cards, {
          y: 30, scale: 0.95, duration: 0.7, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: cardsRef.current, start: 'top 85%' },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, { scope: sectionRef })

  const items = [
    {
      title: '市场指数',
      path: '/markets',
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#C9A962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 48L24 32L36 40L56 16" />
          <circle cx="56" cy="16" r="3" fill="#C9A962" />
          <path d="M8 56h48" />
        </svg>
      ),
      desc: '美股、日经、KOSPI 完整数据与趋势分析',
    },
    {
      title: '领涨核心',
      path: '/leaders',
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#C9A962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="12" y="36" width="8" height="16" rx="1" />
          <rect x="28" y="24" width="8" height="28" rx="1" />
          <rect x="44" y="12" width="8" height="40" rx="1" />
        </svg>
      ),
      desc: '软银、SK海力士、三星、东京电子、爱德万测试深度拆解',
    },
    {
      title: '宏观分析',
      path: '/macro',
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#C9A962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="22" />
          <ellipse cx="32" cy="32" rx="10" ry="22" />
          <path d="M10 32h44" />
          <path d="M14 20h36" />
          <path d="M14 44h36" />
        </svg>
      ),
      desc: 'AI半导体超级周期、地缘政治、资本支出全景',
    },
    {
      title: '产业链地图',
      path: '/chain',
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#C9A962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="6" />
          <circle cx="48" cy="16" r="6" />
          <circle cx="16" cy="48" r="6" />
          <circle cx="48" cy="48" r="6" />
          <circle cx="32" cy="32" r="4" fill="#C9A962" />
          <path d="M22 16h20M16 22v20M32 28v-6M32 36v6M28 32h-6M36 32h6" />
        </svg>
      ),
      desc: '从芯片设计到云服务的全球AI半导体产业链',
    },
  ]

  return (
    <section ref={sectionRef} className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-platinum mb-4">
            深度分析
          </h2>
          <p className="font-body text-[0.9375rem] text-muted">
            点击下方板块，探索完整分析
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group rounded-2xl p-6 sm:p-8 md:p-10 border border-dim bg-[rgba(20,20,20,0.8)] transition-all duration-500 hover:border-gold/50 hover:-translate-y-1.5 relative overflow-hidden"
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, rgba(201,169,98,0.15) 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-body text-xl sm:text-2xl font-medium text-platinum mb-2">{item.title}</h3>
                <p className="font-body text-[0.8125rem] sm:text-[0.9375rem] text-silver leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Helpers ─── */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function generateHeroSubtitle(indices: MarketData['indices']): string {
  const nikkei = indices.find(i => i.symbol === '^N225')
  const kospi = indices.find(i => i.symbol === '^KS11')
  const us = indices.filter(i => i.region === 'United States')
  const usAvg = us.length ? us.reduce((s, i) => s + i.changePercent, 0) / us.length : 0

  const upIndices = indices.filter(i => i.changePercent > 0)
  const downIndices = indices.filter(i => i.changePercent < 0)

  if (upIndices.length === indices.length) {
    return `全球市场普涨，${us[0]?.name || '美股'}与${nikkei?.name || '日经'}协同走强，AI产业链仍是跨市场核心主线`
  }
  if (downIndices.length === indices.length) {
    return `全球主要市场同步调整，避险情绪阶段性升温，关注AI硬科技产业链的回调布局机会`
  }
  if (nikkei && nikkei.changePercent >= 1.5) {
    return `日经225强势上涨${nikkei.changePercent.toFixed(2)}%，AI半导体超级周期持续驱动亚洲市场重估`
  }
  if (kospi && kospi.changePercent >= 1.5) {
    return `KOSPI强势上涨${kospi.changePercent.toFixed(2)}%，韩国半导体双雄领涨大盘`
  }
  if (nikkei && nikkei.changePercent <= -1.5) {
    return `日经225显著回调${Math.abs(nikkei.changePercent).toFixed(2)}%，短期获利回吐压力显现，中长期向上逻辑未变`
  }
  if (kospi && kospi.changePercent <= -1.5) {
    return `KOSPI显著回调${Math.abs(kospi.changePercent).toFixed(2)}%，外资减持权重标的，关注存储芯片龙头韧性`
  }
  if (usAvg >= 1) {
    return `美股全线走强，道指与纳指协同上涨，全球风险偏好持续回升`
  }
  if (usAvg <= -1) {
    return `美股集体回调，避险情绪阶段性升温，关注AI产业链韧性`
  }
  return `全球主要市场收盘分化，${upIndices.length}涨${downIndices.length}跌，AI产业链仍是跨市场核心主线`
}

function generateIndexComment(idx: MarketData['indices'][0]): string {
  // Prefer dynamic analysis from data file
  if (idx.analysis?.comment) return idx.analysis.comment

  const cp = idx.changePercent
  if (idx.symbol === '^DJI') {
    if (cp >= 1) return '道指成分股普涨，工业与金融板块协同发力'
    if (cp >= 0.3) return '道指温和上涨，权重股表现分化'
    if (cp >= -0.3) return '道指窄幅整理，等待方向选择'
    if (cp >= -1) return '道指小幅回调，防御板块相对抗跌'
    return '道指明显回落，关注下方支撑力度'
  }
  if (idx.symbol === '^GSPC') {
    if (cp >= 1) return '标普500普涨，各行业板块共振上行'
    if (cp >= 0.3) return '标普500温和收涨，大盘蓝筹稳健'
    if (cp >= -0.3) return '标普500窄幅波动，市场观望情绪较浓'
    if (cp >= -1) return '标普500小幅调整，成长股承压'
    return '标普500显著回落，注意风险控制'
  }
  if (idx.symbol === '^IXIC') {
    if (cp >= 1.5) return '纳指强势领涨，科技股风险偏好回升'
    if (cp >= 0.5) return '纳指表现活跃，AI概念股受追捧'
    if (cp >= -0.5) return '纳指窄幅震荡，科技股分化明显'
    if (cp >= -1.5) return '纳指小幅回调，高估值板块承压'
    return '纳指大幅回落，科技板块集体调整'
  }
  if (idx.symbol === '^N225') {
    if (cp >= 1.5) return '日经225强势上攻，半导体设备股领涨'
    if (cp >= 0.5) return '日经225稳步上行，出口型企业受益'
    if (cp >= -0.5) return '日经225窄幅整理，等待美股指引'
    if (cp >= -1.5) return '日经225小幅回调，获利盘兑现压力'
    return '日经225显著回落，外资流出迹象显现'
  }
  if (idx.symbol === '^KS11') {
    if (cp >= 1) return 'KOSPI放量上涨，半导体双雄领涨大盘'
    if (cp >= 0.3) return 'KOSPI温和收涨，芯片股表现亮眼'
    if (cp >= -0.3) return 'KOSPI横盘整理，市场等待催化剂'
    if (cp >= -1) return 'KOSPI小幅调整，电池板块承压'
    return 'KOSPI明显回落，外资减持权重标的'
  }
  return ''
}

function generateIndexSubComment(idx: MarketData['indices'][0]): string {
  // Prefer dynamic analysis from data file
  if (idx.analysis?.subComment) return idx.analysis.subComment

  const cp = idx.changePercent
  if (idx.symbol === '^DJI') {
    if (cp >= 0) return '道指30只成分股中涨跌互现，金融与工业板块分化'
    return '道指30只成分股中跌多涨少，周期性板块承压'
  }
  if (idx.symbol === '^GSPC') {
    if (cp >= 0) return '标普11大板块多数收红，科技与通信服务领涨'
    return '标普11大板块多数收跌，可选消费与房地产领跌'
  }
  if (idx.symbol === '^IXIC') {
    if (cp >= 0) return '大型科技股韧性显现，半导体设备股持续强势'
    return '高估值成长股承压，芯片设计龙头跌幅居前'
  }
  if (idx.symbol === '^N225') {
    if (cp >= 0) return 'AI半导体超级周期驱动，外资持续净流入日本市场'
    return '日元走强压制出口股，半导体板块获利回吐'
  }
  if (idx.symbol === '^KS11') {
    if (cp >= 0) return 'SK海力士与三星电子双轮驱动，芯片股引领市场'
    return '存储芯片股回调拖累大盘，外资净卖出权重标的'
  }
  return ''
}

/* ─── Home Page ─── */
export default function Home() {
  const { data, loading } = useMarketData()

  return (
    <div className="bg-obsidian">
      <HeroSection data={data} loading={loading} />
      <MarketPulseSection />
      <HighlightsSection data={data} />
      <DeepDiveSection />
    </div>
  )
}
