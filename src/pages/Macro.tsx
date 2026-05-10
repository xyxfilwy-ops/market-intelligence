import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts'
import macroBg from '../assets/macro-bg.jpg'

gsap.registerPlugin(ScrollTrigger)

/* ─── Data Types ─── */
interface RingNode {
  label: string
  sub?: string
  angle?: number
  r?: number
}

interface RingNodes {
  center: RingNode
  inner: RingNode[]
  outer: RingNode[]
}

interface MacroData {
  lastUpdated: string
  ringNodes?: RingNodes
  supercycle: {
    arguments: Array<{
      title: string
      content: string
    }>
    stats: Array<{
      value: string
      label: string
    }>
  }
  geopolitics: {
    leftColumn: {
      title: string
      content: string
      impacts: string[]
    }
    rightColumn: {
      title: string
      content: string
      data: Array<{
        value: string
        label: string
        color?: string
      }>
    }
    summary: string
  }
  capex: {
    total: number
    unit: string
    description: string
    data: Array<{
      name: string
      value: number
      color: string
      desc: string
    }>
    trend: {
      title: string
      content: string
    }
    conclusion: string
  }
  summary: string
}

/* ─── Data Loading Hook ─── */
function useMacroData() {
  const [data, setData] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('./data/macro-data.json')
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
        <p className="text-silver text-center">加载宏观数据...</p>
      </div>
    </div>
  )
}

function ErrorSection() {
  return (
    <div className="bg-obsidian py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-red-500 text-center">数据加载失败</p>
      </div>
    </div>
  )
}

const DEFAULT_RING_NODES: RingNodes = {
  center: { label: 'AI芯片', r: 50 },
  inner: [
    { label: '设计', sub: 'NVIDIA / AMD', angle: -90 },
    { label: '存储', sub: 'SK海力士 / 三星', angle: 30 },
    { label: '设备', sub: '东京电子 / 爱德万', angle: 150 },
  ],
  outer: [
    { label: '微软', sub: 'Azure', angle: -30 },
    { label: '亚马逊', sub: 'AWS', angle: 90 },
    { label: '谷歌', sub: 'GCP', angle: 210 },
  ],
}

function RingChart({ ringNodes }: { ringNodes?: RingNodes }) {
  const nodes = ringNodes || DEFAULT_RING_NODES
  const cx = 250
  const cy = 250
  const innerR = 140
  const outerR = 210

  const polar = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  })

  return (
    <svg viewBox="0 0 500 500" className="w-full max-w-[500px] mx-auto">
      {/* Orbit rings */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#3A3A3A" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#3A3A3A" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

      {/* Connecting lines */}
      {nodes.inner.map((node) => {
        const p1 = polar(node.angle ?? 0, nodes.center.r ?? 50 + 4)
        const p2 = polar(node.angle ?? 0, innerR - 42)
        return (
          <line
            key={`line-inner-${node.label}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#C9A962"
            strokeWidth="1"
            opacity="0.5"
          />
        )
      })}
      {nodes.outer.map((node) => {
        const innerAngle = nodes.inner[0]?.angle ?? -90
        const p1 = polar(innerAngle, innerR + 42)
        const p2 = polar(node.angle ?? 0, outerR - 40)
        return (
          <line
            key={`line-outer-${node.label}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#C9A962"
            strokeWidth="1"
            opacity="0.3"
          />
        )
      })}

      {/* Center node */}
      <circle cx={cx} cy={cy} r={nodes.center.r ?? 50} fill="#141414" stroke="#C9A962" strokeWidth="2" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#C9A962" fontSize="14" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">
        {nodes.center.label}
      </text>
      <circle cx={cx} cy={cy} r={4} fill="#C9A962">
        <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Inner ring nodes */}
      {nodes.inner.map((node) => {
        const p = polar(node.angle ?? 0, innerR)
        return (
          <g key={`inner-${node.label}`} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r={42} fill="#141414" stroke="#C9A962" strokeWidth="1.5" opacity="0.8" className="transition-all duration-300 group-hover:opacity-100 group-hover:stroke-[#E8D5A3]" />
            <text x={p.x} y={p.y - 4} textAnchor="middle" fill="#E8E4E0" fontSize="13" fontFamily="'Noto Sans SC', sans-serif">{node.label}</text>
            <text x={p.x} y={p.y + 14} textAnchor="middle" fill="#6A6A6A" fontSize="10" fontFamily="'JetBrains Mono', monospace">{node.sub}</text>
          </g>
        )
      })}

      {/* Outer ring nodes */}
      {nodes.outer.map((node) => {
        const p = polar(node.angle ?? 0, outerR)
        return (
          <g key={`outer-${node.label}`} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r={40} fill="#141414" stroke="#B0B0B0" strokeWidth="1" opacity="0.7" className="transition-all duration-300 group-hover:opacity-100 group-hover:stroke-[#C9A962]" />
            <text x={p.x} y={p.y - 4} textAnchor="middle" fill="#B0B0B0" fontSize="13" fontFamily="'Noto Sans SC', sans-serif">{node.label}</text>
            <text x={p.x} y={p.y + 14} textAnchor="middle" fill="#6A6A6A" fontSize="10" fontFamily="'JetBrains Mono', monospace">{node.sub}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── CAPEX Active Shape ─── */
function CapexPieChart({ capexData, total }: { capexData: MacroData['capex']['data']; total: number }) {
  const [capexHover, setCapexHover] = useState<number | null>(null)
  const bigNumberRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!bigNumberRef.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: total,
      duration: 2.5,
      ease: 'power3.out',
      delay: 0.2,
      scrollTrigger: {
        trigger: '.capex-section',
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        if (bigNumberRef.current) {
          bigNumberRef.current.textContent = Math.round(obj.val).toLocaleString()
        }
      },
    })
  })

  return (
    <>
      {/* Big number */}
      <div className="flex items-baseline gap-3 mb-12">
        <span
          ref={bigNumberRef}
          className="font-mono text-[64px] md:text-[96px] text-gold leading-none tracking-[-0.03em]"
          style={{ textShadow: '0 0 40px rgba(201,169,98,0.15)' }}
        >
          0
        </span>
        <span className="capex-unit font-body text-[1.5rem] text-platinum opacity-0">美元</span>
      </div>

      {/* Donut chart + legend */}
      <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
        <div className="capex-chart-wrap w-full lg:w-[50%] h-[360px] opacity-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capexData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={130}
                paddingAngle={2}
                dataKey="value"
                animationBegin={300}
                animationDuration={2000}
                onMouseEnter={(_, index) => setCapexHover(index)}
                onMouseLeave={() => setCapexHover(null)}
                activeIndex={capexHover ?? undefined}
                activeShape={(props: any) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
                  return (
                    <g>
                      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#C9A962" fontSize={28} fontFamily="'JetBrains Mono', monospace">
                        {capexData[capexHover!]?.value}%
                      </text>
                      <text x={cx} y={cy} dy={18} textAnchor="middle" fill="#B0B0B0" fontSize={12} fontFamily="'Noto Sans SC', sans-serif">
                        {capexData[capexHover!]?.name}
                      </text>
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 6}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                      />
                    </g>
                  )
                }}
              >
                {capexData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={capexHover === null || capexHover === index ? 1 : 0.5}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #3A3A3A',
                  borderRadius: '8px',
                  color: '#E8E4E0',
                  fontFamily: '"Noto Sans SC", sans-serif',
                  fontSize: '13px',
                }}
                itemStyle={{ color: '#C9A962' }}
                formatter={(value: number, name: string, props: any) => [`${value}%`, `${name} — ${props?.payload?.desc}`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          {capexData.map((item, index) => (
            <div
              key={item.name}
              className="capex-legend-item flex items-center gap-3 cursor-pointer opacity-0"
              onMouseEnter={() => setCapexHover(index)}
              onMouseLeave={() => setCapexHover(null)}
            >
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="font-body text-[0.9375rem] text-silver">
                {item.name}
                <span className="text-muted ml-2">{item.value}%</span>
              </span>
              <span className="font-body text-[0.8125rem] text-muted ml-1">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ─── Macro Page ─── */
export default function Macro() {
  const { data, loading, error } = useMacroData()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || !data || loading) return

    const ctx = gsap.context(() => {
      // Hero background zoom
      gsap.to('.macro-hero-bg', {
        scale: 1.05,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'none',
      })

      // Hero text sequence
      gsap.fromTo('.macro-hero-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      gsap.fromTo('.macro-hero-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.3 })
      gsap.fromTo('.macro-hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.6 })

      // Section 2: AI Supercycle
      ScrollTrigger.create({
        trigger: '.supercycle-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.supercycle-label', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
          gsap.fromTo('.supercycle-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 })
          gsap.fromTo('.supercycle-arg', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out', delay: 0.2 })
          gsap.fromTo('.supercycle-stat', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out', delay: 0.6 })
          gsap.fromTo('.ring-chart-wrap', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', delay: 0.4 })
        },
      })

      // Section 3: Geopolitics
      ScrollTrigger.create({
        trigger: '.geopolitics-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.geo-header', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
          gsap.fromTo('.geo-left', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.2 })
          gsap.fromTo('.geo-right', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.3 })
          gsap.fromTo('.geo-impact-item', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.4 })
          gsap.fromTo('.geo-data', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', delay: 0.5 })
          gsap.fromTo('.geo-summary', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.6 })
          gsap.fromTo('.geo-line', { width: 0 }, { width: 60, duration: 1, ease: 'power3.out', delay: 0.6 })
        },
      })

      // Section 4: Capital Expenditure
      ScrollTrigger.create({
        trigger: '.capex-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.capex-header', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
          gsap.fromTo('.capex-unit', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 2.0 })
          gsap.fromTo('.capex-chart-wrap', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', delay: 0.4 })
          gsap.fromTo('.capex-legend-item', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 1.2 })
          gsap.fromTo('.capex-trend', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.8 })
          gsap.fromTo('.capex-conclusion', { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out', delay: 1.0 })
        },
      })

      // Section 5: Summary
      ScrollTrigger.create({
        trigger: '.summary-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.summary-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
          gsap.fromTo('.summary-line-top', { width: 0 }, { width: 40, duration: 1, ease: 'power3.out', delay: 0.3 })
          gsap.fromTo('.summary-text', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.5 })
          gsap.fromTo('.summary-line-bot', { width: 0 }, { width: 40, duration: 1, ease: 'power3.out', delay: 0.8 })
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef, dependencies: [data, loading] })

  if (loading) {
    return (
      <div ref={containerRef} className="bg-obsidian">
        <LoadingSection />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div ref={containerRef} className="bg-obsidian">
        <ErrorSection />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="bg-obsidian">
      {/* ===== Section 1: Hero ===== */}
      <section className="relative w-full overflow-hidden" style={{ height: '60vh', minHeight: '500px' }}>
        <div
          className="macro-hero-bg absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${macroBg})`, transformOrigin: 'center center' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,10,0.5)' }} />
        <div className="relative z-10 max-w-[900px] mx-auto px-6 md:px-20 h-full flex flex-col justify-center">
          <Link to="/" className="absolute top-24 left-6 md:left-20 font-body text-sm text-silver hover:text-gold transition-colors duration-300">
            ← 返回首页
          </Link>
          <p className="macro-hero-label font-body text-[0.8125rem] text-gold tracking-[0.12em] mb-4 opacity-0">
            MACRO LANDSCAPE
          </p>
          <h1 className="macro-hero-title font-display text-[3rem] md:text-[3rem] text-platinum leading-[1.15] tracking-[-0.01em] mb-6 opacity-0">
            宏观全景
          </h1>
          <p className="macro-hero-sub font-body text-[1.0625rem] text-silver leading-[1.7] max-w-[650px] opacity-0">
            AI半导体超级周期、地缘政治与市场资本流向的深度解析
          </p>
        </div>
      </section>

      {/* ===== Section 2: AI Supercycle ===== */}
      <section className="supercycle-section py-[120px] bg-obsidian">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Text area */}
            <div className="lg:w-[55%]">
              <p className="supercycle-label font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3 opacity-0">
                SUPERCYCLE
              </p>
              <h2 className="supercycle-title font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-10 opacity-0">
                AI半导体超级周期
              </h2>

              <div className="space-y-8">
                {data.supercycle.arguments.map((arg, i) => (
                  <div key={i} className="supercycle-arg opacity-0">
                    <h3 className="font-body text-[1.125rem] text-platinum font-medium mb-2">{arg.title}</h3>
                    <p className="font-body text-[1.0625rem] text-silver leading-[1.7]">
                      {arg.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Key data highlights */}
              <div className="flex flex-wrap gap-8 mt-12">
                {data.supercycle.stats.map((stat, i) => (
                  <div key={i} className="supercycle-stat opacity-0">
                    <p className="font-mono text-[2rem] text-gold leading-[1.1] tracking-[-0.02em]">{stat.value}</p>
                    <p className="font-body text-[0.8125rem] text-silver tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual area */}
            <div className="lg:w-[45%] flex items-center justify-center ring-chart-wrap opacity-0">
              <RingChart />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 3: Geopolitics ===== */}
      <section className="geopolitics-section py-[120px] bg-charcoal">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20">
          <div className="geo-header mb-12 opacity-0">
            <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3">GEOPOLITICS</p>
            <h2 className="font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em]">
              地缘政治与市场波动
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left column */}
            <div className="geo-left opacity-0">
              <h3 className="font-body text-[1.5rem] text-platinum font-medium mb-4">{data.geopolitics.leftColumn.title}</h3>
              <p className="font-body text-[1.0625rem] text-silver leading-[1.7] mb-8">
                {data.geopolitics.leftColumn.content}
              </p>

              <div className="space-y-4">
                {data.geopolitics.leftColumn.impacts.map((item, i) => (
                  <div key={i} className="geo-impact-item flex items-start gap-3 opacity-0">
                    <div className="w-[2px] h-full min-h-[40px] bg-muted rounded-full mt-1" />
                    <p className="font-body text-[0.9375rem] text-silver leading-[1.6]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="geo-right opacity-0">
              <h3 className="font-body text-[1.5rem] text-platinum font-medium mb-4">{data.geopolitics.rightColumn.title}</h3>
              <p className="font-body text-[1.0625rem] text-silver leading-[1.7] mb-8">
                {data.geopolitics.rightColumn.content}
              </p>

              <div className="flex flex-wrap gap-8 mt-8">
                {data.geopolitics.rightColumn.data.map((d, i) => (
                  <div key={i} className="geo-data opacity-0">
                    <p className={`font-mono text-[2rem] leading-[1.1] tracking-[-0.02em] ${d.color === 'rise-green' ? 'text-rise-green' : 'text-platinum'}`}>{d.value}</p>
                    <p className="font-body text-[0.8125rem] text-silver tracking-wider mt-1">{d.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom summary */}
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="geo-line h-[1px] bg-gold mb-8" style={{ width: 0, opacity: 0.6 }} />
            <p className="geo-summary font-body text-[1.0625rem] text-light-gold italic leading-[1.7] max-w-[800px] opacity-0">
              {data.geopolitics.summary}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Section 4: Capital Expenditure ===== */}
      <section className="capex-section py-[120px] bg-obsidian">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20">
          <div className="capex-header mb-12 opacity-0">
            <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3">CAPITAL EXPENDITURE</p>
            <h2 className="font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em]">
              全球CSP资本支出全景
            </h2>
          </div>

          <p className="font-body text-[1.0625rem] text-silver leading-[1.7] mb-16">
            {data.capex.description}
          </p>

          <CapexPieChart capexData={data.capex.data} total={data.capex.total} />

          {/* Trend paragraph */}
          <div className="capex-trend mb-12 opacity-0">
            <h4 className="font-body text-[1.125rem] text-platinum mb-3">{data.capex.trend.title}</h4>
            <p className="font-body text-[1.0625rem] text-silver leading-[1.7] max-w-[800px]">
              {data.capex.trend.content}
            </p>
          </div>

          {/* Key conclusion */}
          <div className="capex-conclusion max-w-[720px] mx-auto opacity-0">
            <div
              className="font-body text-[0.9375rem] text-light-gold text-center leading-[1.6] px-8 py-6 rounded-lg"
              style={{ backgroundColor: 'rgba(201,169,98,0.08)' }}
            >
              {data.capex.conclusion}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 5: Macro Summary ===== */}
      <section className="summary-section py-[100px] bg-charcoal">
        <div className="max-w-[900px] mx-auto px-6 md:px-20 text-center">
          <h2 className="summary-title font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-8 opacity-0">
            宏观总结
          </h2>

          <div className="summary-line-top h-[1px] bg-gold mx-auto mb-8" style={{ width: 0, opacity: 0.6 }} />

          <p className="summary-text font-body text-[1.0625rem] text-platinum leading-[1.9] opacity-0">
            {data.summary}
          </p>

          <div className="summary-line-bot h-[1px] bg-gold mx-auto mt-8" style={{ width: 0, opacity: 0.6 }} />
        </div>
      </section>
    </div>
  )
}
