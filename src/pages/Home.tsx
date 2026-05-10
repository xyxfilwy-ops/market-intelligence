import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

/* ─── Data Types ─── */
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
function HeroSection() {
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
          src="/hero-bg.jpg"
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
          2026年5月7日 — 8日 · 海外市场深度分析
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
          AI半导体超级周期驱动下的市场重估 —— 日经225创历史最大单日点数涨幅，全球CSP资本支出突破8,300亿美元
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
        <p className="text-fall-red text-center">数据加载失败</p>
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
            三大市场核心指数 · 2026年5月7日收盘
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* US Index Cards — same style as Nikkei/KOSPI */}
          {usIndices.map((idx, i) => (
            <div
              key={idx.symbol}
              className="us-index-card rounded-xl p-10 border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)]"
              style={{ borderLeftWidth: '3px', borderLeftColor: '#FF6B6B' }}
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
                <span className="font-mono text-[2rem] font-normal text-fall-red">
                  {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
                <span className="font-body text-[0.8125rem] text-fall-red">
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}点
                </span>
              </div>

              <p className="font-body text-[0.9375rem] text-light-gold mb-4">
                {idx.symbol === '^DJI' ? '盘中首破50,000点' : idx.symbol === '^GSPC' ? '从盘中历史纪录回落' : '纳指100逆势收涨+0.17%'}
              </p>

              <div className="pt-4 border-t border-dim">
                <p className="font-body text-[0.8125rem] text-muted">
                  {idx.symbol === '^DJI' ? '道指30只成分股中20只下跌' : idx.symbol === '^GSPC' ? '84%公司盈利超预期' : '大型科技股韧性显现'}
                </p>
              </div>
            </div>
          ))}

          {/* Card 2 — Nikkei */}
          {nikkei && (
            <div className="rounded-xl p-10 border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)]" style={{ borderLeftWidth: '3px', borderLeftColor: '#1DB954' }}>
              <h3 className="font-body text-2xl font-medium text-platinum mb-1">日经225指数</h3>
              <p className="font-body text-[0.8125rem] text-muted tracking-wider mb-6">Japan</p>

              <div className="mb-4">
                <span ref={nikkeiRef} className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none">{nikkei.close.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <span className="font-mono text-[2rem] font-normal text-rise-green">+{nikkei.changePercent.toFixed(2)}%</span>
                <span className="font-body text-[0.8125rem] text-rise-green">+{nikkei.change >= 1000 ? (nikkei.change / 1000).toFixed(0) + ',' + (nikkei.change % 1000).toFixed(0).padStart(3, '0') : Math.round(nikkei.change).toLocaleString()}点</span>
              </div>

              <p className="font-body text-[0.9375rem] text-light-gold mb-4">
                创历史最大单日点数涨幅
              </p>

              <div className="pt-4 border-t border-dim">
                <p className="font-body text-[0.8125rem] text-muted">
                  AI半导体超级周期驱动，盘中一度飙升至62,932.81
                </p>
              </div>
            </div>
          )}

          {/* Card 3 — KOSPI */}
          {kospi && (
            <div className="rounded-xl p-10 border border-dim bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)]" style={{ borderLeftWidth: '3px', borderLeftColor: '#1DB954' }}>
              <h3 className="font-body text-2xl font-medium text-platinum mb-1">韩国KOSPI指数</h3>
              <p className="font-body text-[0.8125rem] text-muted tracking-wider mb-6">South Korea</p>

              <div className="mb-4">
                <span ref={kospiRef} className="font-mono text-[3.5rem] font-medium text-platinum tracking-[-0.03em] leading-none">{kospi.close.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <span className="font-mono text-[2rem] font-normal text-rise-green">+{kospi.changePercent.toFixed(2)}%</span>
              </div>

              <p className="font-body text-[0.8125rem] text-light-gold mb-4">
                盘中创历史新高 7,531.88
              </p>

              <div className="pt-4 border-t border-dim">
                <p className="font-body text-[0.8125rem] text-muted">
                  SK海力士与三星电子双轮驱动
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
function HighlightsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const highlightData = [
    { target: 18.4, suffix: '%', label: '软银集团单日涨幅', sub: 'OpenAI/Arm投资驱动', prefix: '' },
    { target: 5.58, suffix: '%', label: '日经225单日涨幅', sub: '创历史最大单日点数涨幅', prefix: '' },
    { target: 756, suffix: '%', label: '三星电子Q1利润增长', sub: '市值突破万亿美元', prefix: '' },
    { target: 8300, suffix: '亿', label: '全球CSP资本支出', sub: '美元，AI基建竞赛白热化', prefix: '' },
    { target: 62, suffix: '%', label: 'SK海力士HBM市占率', sub: '毛利率高达79%', prefix: '57-' },
  ]

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

/* ─── Home Page ─── */
export default function Home() {
  return (
    <div className="bg-obsidian">
      <HeroSection />
      <MarketPulseSection />
      <HighlightsSection />
      <DeepDiveSection />
    </div>
  )
}
