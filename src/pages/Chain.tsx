import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import chipBg from '../assets/chip-abstract.jpg'

gsap.registerPlugin(ScrollTrigger)

/* ─── Types ─── */
interface ChainCompany {
  name: string
  label: string
  highlight: boolean
}

interface ChainStat {
  value: string
  label: string
}

interface ChainLayer {
  id: string
  title: string
  short: string
  companies: ChainCompany[]
  desc: string
  bg: string
  layout: string
  marketSize?: string
  bigNumber?: { value: string; label: string }
  stats?: ChainStat[]
  llmGenerated?: boolean
  llmCached?: boolean
}

interface ChainInvestment {
  title: string
  desc: string
  portfolio: { name: string; role: string }[]
}

interface NewsItem {
  title: string
  summary: string
  pubDate: string
  symbol: string
}

interface ChainData {
  lastUpdated: string
  layers: ChainLayer[]
  investment: ChainInvestment
  summary: string
  llmGenerated?: boolean
  llmCached?: boolean
  newsHighlights?: Record<string, NewsItem[]>
}

interface MarketIndex {
  symbol: string
  name: string
  close: number
  changePercent: number
  trend: string
}

/* ─── Data Loading Hooks ─── */
function useMarketData() {
  const [data, setData] = useState<{ lastUpdated: string; indices: MarketIndex[] } | null>(null)
  useEffect(() => {
    fetch('./data/market-data.json')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
  }, [])
  return data
}

function useChainData() {
  const [data, setData] = useState<ChainData | null>(null)
  useEffect(() => {
    fetch('./data/chain-data.json')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
  }, [])
  return data
}

/* ─── Chain Pulse Bar ─── */
function ChainPulseBar({ indices }: { indices: MarketIndex[] }) {
  const keyStocks = ['NVDA', 'AMD', 'TSM', 'ASML', 'MU', 'INTC', 'AVGO', 'QCOM']
  const stocks = indices
    .filter(i => keyStocks.includes(i.symbol))
    .slice(0, 8)

  if (!stocks.length) return null

  return (
    <section className="pulse-section py-6 bg-obsidian border-b border-dim/50">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
          <span className="font-body text-[0.6875rem] text-muted tracking-wider whitespace-nowrap">CHAIN PULSE</span>
          {stocks.map((s) => {
            const isUp = s.changePercent >= 0
            return (
              <div key={s.symbol} className="pulse-item flex items-center gap-2 opacity-0 whitespace-nowrap">
                <span className="font-mono text-[0.8125rem] text-platinum">{s.symbol}</span>
                <span className="font-mono text-[0.8125rem] text-silver">{s.close?.toFixed?.(2) ?? '--'}</span>
                <span className={`font-mono text-[0.75rem] ${isUp ? 'text-rise-green' : 'text-fall-red'}`}>
                  {isUp ? '+' : ''}{s.changePercent?.toFixed?.(2) ?? '0.00'}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Intelligence Feed ─── */
function IntelligenceFeed({ newsHighlights }: { newsHighlights?: Record<string, NewsItem[]> }) {
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  if (!newsHighlights) return null
  const themes = Object.keys(newsHighlights)

  if (!themes.length) return null

  return (
    <section className="intelligence-section py-[100px] bg-charcoal">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div className="intelligence-header mb-10 opacity-0">
          <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3">INTELLIGENCE FEED</p>
          <h2 className="font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em]">
            新闻驱动的深度观察
          </h2>
          <p className="font-body text-[0.9375rem] text-silver mt-3 max-w-[600px]">
            实时抓取全球AI半导体产业链关键新闻，按主题分类并关联市场影响
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {themes.map((theme) => {
              const count = (newsHighlights[theme] ?? []).length
              const isActive = activeTheme === theme
              return (
                <button
                  key={theme}
                  onClick={() => setActiveTheme(isActive ? null : theme)}
                  className={`intelligence-tab w-full text-left px-4 py-3 rounded-lg border transition-all duration-300 opacity-0 ${
                    isActive
                      ? 'border-gold/40 bg-gold/5'
                      : 'border-dim/30 bg-charcoal hover:border-gold/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-body text-[0.9375rem] ${isActive ? 'text-gold' : 'text-platinum'}`}>
                      {theme}
                    </span>
                    <span className="font-mono text-[0.75rem] text-muted bg-obsidian px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:col-span-3">
            {activeTheme ? (
              <div className="intelligence-panel opacity-0">
                <div className="border border-dim/40 rounded-lg p-6 bg-obsidian">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-dim/30">
                    <div className="w-1 h-5 bg-gold rounded-full" />
                    <h3 className="font-body text-[1.125rem] text-platinum font-medium">{activeTheme}</h3>
                  </div>

                  <div className="space-y-5">
                    {(newsHighlights[activeTheme] ?? []).map((item, i) => (
                      <div key={i} className="group">
                        <p className="font-body text-[0.9375rem] text-platinum leading-[1.6] mb-2 group-hover:text-gold transition-colors">
                          {item.title}
                        </p>
                        <p className="font-body text-[0.8125rem] text-silver leading-[1.6] mb-2 line-clamp-2">
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[0.6875rem] text-gold bg-gold/5 px-2 py-0.5 rounded">
                            {item.symbol}
                          </span>
                          <span className="font-body text-[0.6875rem] text-muted">
                            {item.pubDate ? item.pubDate.slice(0, 10) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="intelligence-panel opacity-0 h-full flex items-center justify-center border border-dim/30 rounded-lg bg-obsidian/50">
                <p className="font-body text-[0.9375rem] text-muted">选择左侧主题查看相关新闻</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Icons ─── */
function ChipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="1.5" className="w-8 h-8">
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <path d="M6 10H4M6 14H4M20 10h-2M20 14h-2M10 6V4M14 6V4M10 20v-2M14 20v-2" />
    </svg>
  )
}

function MemoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="1.5" className="w-8 h-8">
      <rect x="4" y="6" width="16" height="4" rx="1" />
      <rect x="4" y="12" width="16" height="4" rx="1" />
      <rect x="4" y="18" width="16" height="2" rx="1" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="1.5" className="w-8 h-8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m10 10l2.12 2.12M4.93 19.07l2.12-2.12m10-10l2.12-2.12" />
    </svg>
  )
}

function FactoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="1.5" className="w-8 h-8">
      <path d="M3 21h18M6 21v-9l4-2v11M14 21v-9l4-2v11" />
      <rect x="7" y="4" width="10" height="6" rx="1" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="1.5" className="w-8 h-8">
      <path d="M18 19a4 4 0 1 0 0-8h-.5A6.5 6.5 0 0 0 6 9.5V10a4 4 0 0 0 0 8h1" />
    </svg>
  )
}

const ICONS = [ChipIcon, MemoryIcon, GearIcon, FactoryIcon, CloudIcon]

/* ─── Layer News Filter ─── */
const LAYER_NEWS_MAP: Record<string, string[]> = {
  '01': ['AI芯片', 'AI Capex'],
  '02': ['HBM/存储'],
  '03': ['AI芯片', '地缘/关税'],
  '04': ['AI芯片', '地缘/关税'],
  '05': ['AI Capex', '货币政策'],
}

function getLayerNews(layerId: string, newsHighlights?: Record<string, NewsItem[]>) {
  if (!newsHighlights) return []
  const keys = LAYER_NEWS_MAP[layerId] || []
  const out: NewsItem[] = []
  for (const k of keys) {
    if (newsHighlights[k]) out.push(...newsHighlights[k].slice(0, 2))
  }
  return out.slice(0, 3)
}

/* ─── Desktop Diagram ─── */
function DesktopDiagram({ layers, onNodeClick }: { layers: ChainLayer[]; onNodeClick: (id: string) => void }) {
  const nodeX = [130, 380, 630, 880, 1130]
  const nodeY = 340
  const investX = 630
  const investY = 100

  return (
    <svg viewBox="0 0 1260 480" className="w-full h-auto hidden lg:block">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {nodeX.slice(0, -1).map((x, i) => (
        <line key={`main-line-${i}`} x1={x + 110} y1={nodeY} x2={nodeX[i + 1] - 110} y2={nodeY} stroke="#3A3A3A" strokeWidth="1" strokeDasharray="6 6" opacity="0.6" />
      ))}

      {nodeX.map((x, i) => (
        <line key={`inv-line-${i}`} x1={investX} y1={investY + 50} x2={x} y2={nodeY - 80} stroke="#3A3A3A" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.35" />
      ))}

      {layers.map((layer, i) => {
        const x = nodeX[i]
        const Icon = ICONS[i]
        return (
          <g key={layer.id} className="cursor-pointer" onClick={() => onNodeClick(`layer-${layer.id}`)}>
            <rect x={x - 110} y={nodeY - 80} width="220" height="160" rx="12" fill="#141414" stroke="#C9A962" strokeWidth="1" strokeOpacity="0.3" className="transition-all duration-300 hover:stroke-opacity-100" style={{ filter: 'drop-shadow(0 8px 24px rgba(201,169,98,0.06))' }} />
            <text x={x} y={nodeY - 45} textAnchor="middle" fill="#E8E4E0" fontSize="16" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">{layer.title}</text>
            <g transform={`translate(${x - 16}, ${nodeY - 28})`}><Icon /></g>
            {layer.companies.slice(0, 3).map((c, j) => (
              <text key={j} x={x} y={nodeY + 20 + j * 18} textAnchor="middle" fill={c.highlight ? '#C9A962' : '#6A6A6A'} fontSize="11" fontFamily="'JetBrains Mono', monospace">{c.name}</text>
            ))}
          </g>
        )
      })}

      <g className="cursor-pointer" onClick={() => onNodeClick('investment')}>
        <polygon points={`${investX},${investY - 50} ${investX + 55},${investY} ${investX},${investY + 50} ${investX - 55},${investY}`} fill="#141414" stroke="#C9A962" strokeWidth="1.5" strokeOpacity="0.6" className="transition-all duration-300 hover:stroke-opacity-100" style={{ filter: 'drop-shadow(0 8px 24px rgba(201,169,98,0.08))' }} />
        <text x={investX} y={investY - 6} textAnchor="middle" fill="#E8E4E0" fontSize="13" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">投资层</text>
        <text x={investX} y={investY + 14} textAnchor="middle" fill="#C9A962" fontSize="10" fontFamily="'JetBrains Mono', monospace">软银集团</text>
      </g>
    </svg>
  )
}

/* ─── Mobile Chain ─── */
function MobileChain({ layers, onNodeClick }: { layers: ChainLayer[]; onNodeClick: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-6 lg:hidden">
      {layers.map((layer, i) => {
        const Icon = ICONS[i]
        return (
          <div key={layer.id} className="relative">
            {i > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 overflow-hidden">
                <div className="w-full h-full border-l border-dashed border-gold opacity-60" />
              </div>
            )}
            <button onClick={() => onNodeClick(`layer-${layer.id}`)} className="w-full text-left bg-charcoal border border-dim rounded-xl p-5 transition-all duration-300 hover:border-gold hover:shadow-lg active:scale-[0.98]" style={{ boxShadow: '0 8px 24px rgba(201,169,98,0.04)' }}>
              <div className="flex items-center gap-3 mb-3">
                <Icon />
                <span className="font-body text-lg text-platinum font-medium">{layer.title}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {layer.companies.map((c, j) => (
                  <span key={j} className={`font-mono text-xs px-2 py-1 rounded ${c.highlight ? 'text-gold bg-gold/10' : 'text-muted bg-white/5'}`}>{c.name}</span>
                ))}
              </div>
            </button>
          </div>
        )
      })}

      <div className="relative flex justify-center mt-4">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 overflow-hidden">
          <div className="w-full h-full border-l border-dashed border-muted opacity-50" />
        </div>
        <button onClick={() => onNodeClick('investment')} className="bg-charcoal border border-dim rounded-xl px-6 py-4 text-center transition-all duration-300 hover:border-gold active:scale-[0.98]">
          <p className="font-body text-sm text-platinum mb-1">投资层</p>
          <p className="font-mono text-xs text-gold">软银集团 — 全栈AI投资</p>
        </button>
      </div>
    </div>
  )
}

/* ─── Investment Star ─── */
function InvestmentStar({ portfolio }: { portfolio: { name: string; role: string }[] }) {
  const cx = 200, cy = 150, radius = 100
  const angles = [-90, 0, 90, 180]

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-[400px] mx-auto">
      {angles.map((angle, i) => {
        const x = cx + radius * Math.cos((angle * Math.PI) / 180)
        const y = cy + radius * Math.sin((angle * Math.PI) / 180)
        return <line key={`line-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#6A6A6A" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      })}

      {portfolio.map((item, i) => {
        const angle = angles[i]
        const x = cx + radius * Math.cos((angle * Math.PI) / 180)
        const y = cy + radius * Math.sin((angle * Math.PI) / 180)
        return (
          <g key={item.name}>
            <circle cx={x} cy={y} r={28} fill="#141414" stroke="#6A6A6A" strokeWidth="1" />
            <text x={x} y={y - 4} textAnchor="middle" fill="#B0B0B0" fontSize="11" fontFamily="'Noto Sans SC', sans-serif">{item.name}</text>
            <text x={x} y={y + 10} textAnchor="middle" fill="#6A6A6A" fontSize="9" fontFamily="'Noto Sans SC', sans-serif">{item.role}</text>
          </g>
        )
      })}

      <circle cx={cx} cy={cy} r={40} fill="#141414" stroke="#C9A962" strokeWidth="2" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#C9A962" fontSize="13" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">软银集团</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#E8E4E0" fontSize="10" fontFamily="'JetBrains Mono', monospace">愿景基金</text>
    </svg>
  )
}

/* ─── Chain Page ─── */
export default function Chain() {
  const containerRef = useRef<HTMLDivElement>(null)
  const marketData = useMarketData()
  const chainData = useChainData()
  const nikkei = marketData?.indices.find(i => i.symbol === '^N225')
  const layers = chainData?.layers ?? []
  const investment = chainData?.investment

  const investmentDesc = (
    investment?.desc ??
    '软银集团作为产业链的投资层，通过愿景基金持有全球AI生态的关键节点：OpenAI（生成式AI）、Arm（芯片架构）、波士顿动力（机器人）、以及数十家AI初创企业。它不直接参与任何一层的产品竞争，却在每一层都有战略投资布局。'
  )

  const chainSummary = chainData?.summary ?? (
    nikkei
      ? `全球AI半导体产业链已形成清晰的价值流转路径：云服务商的大规模资本支出驱动芯片设计厂商订单爆发，进而拉动HBM存储、半导体设备和晶圆代工的全链条需求。软银集团作为投资层，横跨整个链条捕获价值。当前日经225${nikkei.changePercent >= 0 ? '上涨' : '调整'}${Math.abs(nikkei.changePercent).toFixed(2)}%，反映市场对全产业链的系统性${nikkei.changePercent >= 0 ? '重估' : '再定价'}。`
      : '全球AI半导体产业链已形成清晰的价值流转路径：云服务商的资本支出驱动芯片设计厂商订单爆发，进而拉动HBM存储、半导体设备和晶圆代工的全链条需求。软银集团作为投资层，横跨整个链条捕获价值。'
  )

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.chain-hero-bg', { scale: 1 }, { scale: 1.05, duration: 15, repeat: -1, yoyo: true, ease: 'none' })
      gsap.fromTo('.chain-hero-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      gsap.fromTo('.chain-hero-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.3 })
      gsap.fromTo('.chain-hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.6 })

      gsap.fromTo('.pulse-item', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.8 })

      ScrollTrigger.create({
        trigger: '.chain-diagram-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.chain-node-desktop', { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.2, ease: 'power2.out' })
          gsap.fromTo('.chain-line', { opacity: 0 }, { opacity: 0.25, duration: 1, stagger: 0.15, delay: 0.3, ease: 'power2.out' })
          gsap.fromTo('.investment-node-svg', { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 1.2, ease: 'power2.out' })
          gsap.fromTo('.chain-node-mobile', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' })
        },
      })

      gsap.utils.toArray('.detail-section').forEach((section) => {
        ScrollTrigger.create({
          trigger: section as Element,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.fromTo((section as Element).querySelectorAll('.detail-fade'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out' })
          },
        })
      })

      ScrollTrigger.create({
        trigger: '.investment-detail-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.investment-detail-fade', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out' })
          gsap.fromTo('.star-node', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, stagger: 0.15, duration: 0.6, delay: 0.5, ease: 'power2.out' })
        },
      })

      ScrollTrigger.create({
        trigger: '.intelligence-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.intelligence-header', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
          gsap.fromTo('.intelligence-tab', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.3 })
          gsap.fromTo('.intelligence-panel', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.5 })
        },
      })

      ScrollTrigger.create({
        trigger: '.chain-summary-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.chain-summary-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToDiagram = () => {
    const el = document.getElementById('chain-diagram')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={containerRef} className="bg-obsidian">
      {/* ===== Hero ===== */}
      <section className="relative w-full overflow-hidden" style={{ height: '50vh', minHeight: '420px' }}>
        <div className="chain-hero-bg absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${chipBg})`, transformOrigin: 'center center' }} />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,10,0.6)' }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-6 md:px-20 h-full flex flex-col justify-center">
          <Link to="/" className="absolute top-24 left-6 md:left-20 font-body text-sm text-silver hover:text-gold transition-colors duration-300">← 返回首页</Link>
          <p className="chain-hero-label font-body text-[0.8125rem] text-gold tracking-[0.12em] mb-4 opacity-0">SUPPLY CHAIN</p>
          <h1 className="chain-hero-title font-display text-[3rem] text-platinum leading-[1.15] tracking-[-0.01em] mb-6 opacity-0">产业链地图</h1>
          <p className="chain-hero-sub font-body text-[1.0625rem] text-silver leading-[1.7] opacity-0">从芯片设计到云服务 — 全球AI半导体产业链全景图</p>
        </div>
      </section>

      {/* ===== Chain Pulse ===== */}
      <ChainPulseBar indices={marketData?.indices ?? []} />

      {/* ===== Chain Diagram ===== */}
      <section id="chain-diagram" className="chain-diagram-section py-[120px] bg-obsidian">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20">
          <div className="mb-12">
            <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3">CHAIN VISUALIZATION</p>
            <h2 className="font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em]">产业链可视化</h2>
          </div>

          <div className="chain-node-desktop hidden lg:block opacity-0">
            <DesktopDiagram layers={layers} onNodeClick={scrollTo} />
          </div>

          <div className="chain-node-mobile lg:hidden">
            <MobileChain layers={layers} onNodeClick={scrollTo} />
          </div>
        </div>
      </section>

      {/* ===== Layer Detail Sections ===== */}
      {layers.map((layer) => {
        const layerNews = getLayerNews(layer.id, chainData?.newsHighlights)
        const hasLlm = layer.llmGenerated || layer.llmCached

        return (
          <section key={layer.id} id={`layer-${layer.id}`} className={`detail-section py-20 ${layer.bg === 'charcoal' ? 'bg-charcoal' : 'bg-obsidian'}`}>
            <div className="max-w-[1200px] mx-auto px-6 md:px-20">
              <button onClick={scrollToDiagram} className="detail-fade mb-8 font-body text-sm text-muted hover:text-gold transition-colors duration-300 flex items-center gap-1 opacity-0">↑ 返回产业链图</button>

              <div className={`flex flex-col ${layer.layout === 'mirror' ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-start`}>
                {/* Data side */}
                <div className="lg:w-[40%]">
                  <p className="detail-fade font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3 opacity-0">LAYER {layer.id}</p>
                  <h2 className="detail-fade font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-6 opacity-0">{layer.title}</h2>

                  {layer.marketSize && (
                    <p className="detail-fade font-mono text-[2rem] text-gold leading-[1.1] tracking-[-0.02em] mb-2 opacity-0">{layer.marketSize}</p>
                  )}

                  {layer.bigNumber && (
                    <div className="detail-fade mb-6 opacity-0">
                      <p className="font-mono text-[3.5rem] text-gold leading-none tracking-[-0.03em]">{layer.bigNumber.value}</p>
                      <p className="font-body text-[0.8125rem] text-silver tracking-wider mt-1">{layer.bigNumber.label}</p>
                    </div>
                  )}

                  {layer.stats && (
                    <div className="flex flex-wrap gap-8 mb-6">
                      {layer.stats.map((s, i) => (
                        <div key={i} className="detail-fade opacity-0">
                          <p className="font-mono text-[2rem] text-gold leading-[1.1] tracking-[-0.02em]">{s.value}</p>
                          <p className="font-body text-[0.8125rem] text-silver tracking-wider mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {layer.companies.map((c, i) => (
                      <span key={i} className={`detail-fade font-mono text-xs px-3 py-1.5 rounded-md border opacity-0 ${c.highlight ? 'text-gold border-gold/30 bg-gold/5' : 'text-muted border-dim bg-white/5'}`}>
                        {c.name}<span className="ml-1.5 text-[10px] opacity-70">{c.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Text side */}
                <div className="lg:w-[60%]">
                  {/* Layer Analysis Box */}
                  <div className={`detail-fade mb-8 rounded-lg border-l-[3px] pl-6 py-4 opacity-0 ${hasLlm ? 'border-gold bg-gold/5' : 'border-dim bg-charcoal/50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      <span className="font-body text-[0.75rem] text-gold tracking-wider">
                        {hasLlm ? (layer.llmCached ? 'AI 深度分析 · 缓存' : 'AI 深度分析 · 实时') : '产业链分析'}
                      </span>
                    </div>
                    <p className="font-body text-[1.0625rem] text-platinum leading-[1.7]">{layer.desc}</p>
                  </div>

                  {/* Related News */}
                  {layerNews.length > 0 && (
                    <div className="detail-fade opacity-0">
                      <p className="font-body text-[0.75rem] text-muted tracking-wider mb-3">相关新闻</p>
                      <div className="space-y-3">
                        {layerNews.map((n, i) => (
                          <div key={i} className="border border-dim/30 rounded-lg p-4 bg-obsidian/50">
                            <p className="font-body text-[0.875rem] text-platinum leading-[1.5] mb-1">{n.title}</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[0.6875rem] text-gold">{n.symbol}</span>
                              <span className="font-body text-[0.6875rem] text-muted">{n.pubDate ? n.pubDate.slice(0, 10) : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* ===== Investment Detail ===== */}
      <section id="investment" className="investment-detail-section py-20 bg-obsidian border-t border-dim">
        <div className="max-w-[800px] mx-auto px-6 md:px-20 text-center">
          <button onClick={scrollToDiagram} className="investment-detail-fade mb-8 font-body text-sm text-muted hover:text-gold transition-colors duration-300 flex items-center gap-1 mx-auto opacity-0">↑ 返回产业链图</button>

          <p className="investment-detail-fade font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3 opacity-0">INVESTMENT LAYER</p>
          <h2 className="investment-detail-fade font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-8 opacity-0">{investment?.title ?? '投资层: 软银集团'}</h2>

          <p className="investment-detail-fade font-body text-[1.0625rem] text-silver leading-[1.8] mb-12 opacity-0">{investmentDesc}</p>

          <div className="star-node opacity-0">
            <InvestmentStar portfolio={investment?.portfolio ?? [
              { name: 'OpenAI', role: '生成式AI' },
              { name: 'Arm', role: '芯片架构' },
              { name: '波士顿动力', role: '机器人' },
              { name: '其他AI投资', role: '初创组合' },
            ]} />
          </div>
        </div>
      </section>

      {/* ===== Intelligence Feed ===== */}
      <IntelligenceFeed newsHighlights={chainData?.newsHighlights} />

      {/* ===== Chain Summary ===== */}
      <section className="chain-summary-section py-[100px] bg-charcoal">
        <div className="max-w-[900px] mx-auto px-6 md:px-20">
          <div className="chain-summary-card opacity-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em]">
                  CHAIN OUTLOOK
                  {(chainData?.llmGenerated || chainData?.llmCached) && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[0.6875rem] px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#C9A962"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" /></svg>
                      {chainData?.llmCached ? '缓存分析' : '实时生成'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="relative pl-6 border-l-[3px] border-gold/60">
              <p className="font-body text-[1.125rem] text-platinum leading-[1.8] italic">
                {chainSummary}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
