import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

/* ─── Data Types ─── */
interface StockData {
  id: number
  name: string
  nameEn: string
  code: string
  market: string
  change: number
  weight: string
  contribution: string
  tag: string
  logo: string
  analysis: string[]
  isMirror: boolean
}

interface LeadersData {
  lastUpdated: string
  stocks: StockData[]
  maxChange: number
}

/* ─── Data Loading Hook ─── */
function useLeadersData() {
  const [data, setData] = useState<LeadersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/leaders-data.json')
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
        <p className="text-silver text-center">加载领涨数据...</p>
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

/* ─── Counter Component ─── */
interface CounterProps {
  target: number
  suffix?: string
  decimals?: number
}

function Counter({ target, suffix = '', decimals = 2 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        if (ref.current) {
          const sign = obj.val >= 0 ? '+' : ''
          ref.current.textContent = sign + obj.val.toFixed(decimals) + suffix
        }
      },
    })
  })

  const initial = (target >= 0 ? '+' : '') + (0).toFixed(decimals) + suffix
  return <span ref={ref}>{initial}</span>
}

/* ─── Stock Card ─── */
function StockCard({ stock, maxChange }: { stock: StockData; maxChange: number }) {
  const barHeight = (stock.change / maxChange) * 100

  return (
    <section
      className={`stock-card py-20 ${stock.isMirror ? 'bg-charcoal' : 'bg-obsidian'}`}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div
          className={`flex flex-col ${
            stock.isMirror ? 'md:flex-row-reverse' : 'md:flex-row'
          } gap-8 md:gap-0 rounded-2xl border border-dim p-8 md:p-12 bg-[rgba(20,20,20,0.9)] hover:border-[rgba(201,169,98,0.3)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,169,98,0.08)] transition-all duration-300`}
        >
          {/* Brand side */}
          <div className="flex-1 flex flex-col justify-center border-l-[3px] border-gold pl-6 md:pl-8 md:pr-8">
            <img
              className="card-logo w-20 h-20 mb-6 object-contain filter brightness-90 hover:brightness-110 transition-all duration-300"
              src={stock.logo}
              alt={stock.name}
            />
            <h3 className="card-animate font-display text-2xl text-platinum mb-2">
              {stock.name}
            </h3>
            <p className="card-animate font-mono text-sm text-muted mb-4">
              {stock.code}
            </p>
            <span className="card-animate inline-block self-start px-3 py-1 rounded bg-[rgba(201,169,98,0.12)] text-gold text-xs tracking-wider font-body">
              {stock.tag}
            </span>
          </div>

          {/* Data side */}
          <div className="flex-[1.5] flex flex-col justify-center">
            <div className="card-animate mb-2">
              <span className="font-mono text-[3.5rem] font-medium leading-none text-rise-green tracking-tight">
                <Counter target={stock.change} suffix="%" />
              </span>
            </div>
            <p className="card-animate text-xs text-light-gold mb-6 tracking-wide font-body">
              {stock.market} 核心贡献股
            </p>

            <div className="card-animate grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-muted mb-1 font-body">指数权重</p>
                <p className="font-mono text-lg text-platinum">{stock.weight}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1 font-body">贡献点数</p>
                <p className="font-mono text-lg text-platinum">{stock.contribution}</p>
              </div>
            </div>

            <div className="border-t border-dim pt-6">
              <ul className="space-y-3">
                {stock.analysis.map((point, i) => (
                  <li
                    key={i}
                    className="card-animate flex items-start gap-3"
                  >
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                    <p className="text-sm text-silver leading-relaxed font-body">
                      {point}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Comparison Section ─── */
function ComparisonSection({ stocks, maxChange }: { stocks: StockData[]; maxChange: number }) {
  return (
    <section className="comparison-section bg-charcoal py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <h2 className="comparison-title font-display text-[2.25rem] text-platinum font-medium tracking-tight text-center mb-16">
          五强对比
        </h2>

        <div className="border border-dim rounded-xl p-8 md:p-10 bg-[rgba(20,20,20,0.6)]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {stocks.map((stock) => {
              const barHeight = (stock.change / maxChange) * 100
              return (
                <div
                  key={stock.id}
                  className="comparison-col flex flex-col items-center text-center"
                >
                  <img
                    src={stock.logo}
                    alt={stock.name}
                    className="w-10 h-10 object-contain mb-3"
                  />
                  <p className="font-body text-[0.8125rem] text-platinum mb-4">
                    {stock.name}
                  </p>

                  {/* Bar chart */}
                  <div className="w-full h-32 flex items-end justify-center mb-3 px-2">
                    <div className="comparison-bar-inner w-full max-w-[60px] rounded-t bg-gradient-to-t from-gold to-light-gold relative" style={{ height: `${barHeight}%` }}>
                      <div className="absolute inset-0 bg-gold/20 rounded-t" />
                    </div>
                  </div>

                  <p className="font-mono text-[1.125rem] text-rise-green mb-1">
                    +{stock.change}%
                  </p>
                  <p className="font-body text-[0.8125rem] text-muted">
                    {stock.tag.split(' · ')[0]}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Leaders Page ─── */
export default function Leaders() {
  const { data, loading, error } = useLeadersData()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || !data || loading) return

    const ctx = gsap.context(() => {
      // Hero entrance animations
      gsap.from('.hero-label', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      })
      gsap.from('.hero-title', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power4.out',
        delay: 0.2,
      })
      gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.5,
      })
      gsap.from('.hero-back', {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        delay: 0.1,
      })

      // Stock card scroll-triggered animations
      gsap.utils.toArray<HTMLElement>('.stock-card').forEach((card) => {
        const animateElements = card.querySelectorAll('.card-animate')
        const logoElement = card.querySelector('.card-logo')

        gsap.from(animateElements, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true,
          },
        })

        if (logoElement) {
          gsap.from(logoElement, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              once: true,
            },
            delay: 0.2,
          })
        }
      })

      // Comparison section animations
      gsap.from('.comparison-title', {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.comparison-section',
          start: 'top 85%',
          once: true,
        },
      })

      gsap.from('.comparison-col', {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.comparison-section',
          start: 'top 85%',
          once: true,
        },
      })

      gsap.from('.comparison-bar-inner', {
        scaleY: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out',
        transformOrigin: 'bottom',
        scrollTrigger: {
          trigger: '.comparison-section',
          start: 'top 85%',
          once: true,
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef, dependencies: [data, loading] })

  return (
    <div ref={containerRef}>
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex flex-col items-center justify-center bg-obsidian overflow-hidden">
        <div className="absolute top-8 left-6 md:left-20 z-10">
          <Link
            to="/"
            className="hero-back font-body text-[0.8125rem] text-muted hover:text-gold transition-colors duration-300"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="text-center px-6 max-w-[800px]">
          <p className="hero-label font-body text-[0.8125rem] text-gold tracking-[0.12em] mb-4 uppercase">
            CORE LEADERS
          </p>
          <h1 className="hero-title font-display text-[3rem] md:text-[3rem] lg:text-[3.5rem] text-platinum font-medium tracking-tight leading-tight mb-6">
            领涨核心
          </h1>
          <p className="hero-subtitle font-body text-[1.0625rem] text-silver leading-relaxed max-w-[700px] mx-auto">
            五只领涨股的深层投资逻辑拆解 — 从软银的AI生态投资到SK海力士的HBM帝国
          </p>
        </div>

        {/* Gold gradient glow at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(201,169,98,0.03) 0%, transparent 100%)',
          }}
        />
      </section>

      {/* Stock Cards */}
      {loading && <LoadingSection />}
      {error && <ErrorSection />}
      {data && (
        <>
          {data.stocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} maxChange={data.maxChange} />
          ))}
          <ComparisonSection stocks={data.stocks} maxChange={data.maxChange} />
        </>
      )}
    </div>
  )
}
