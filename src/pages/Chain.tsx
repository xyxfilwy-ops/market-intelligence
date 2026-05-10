import { useRef } from 'react'
import { Link } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const LAYERS = [
  {
    id: '01',
    title: '芯片设计',
    short: '设计',
    companies: [
      { name: 'NVIDIA', label: 'AI计算霸主', highlight: true },
      { name: 'AMD', label: '追赶者', highlight: false },
    ],
    marketSize: 'AI芯片市场: 1,800亿美元',
    desc: '芯片设计是AI产业链的顶层，决定算力上限。NVIDIA凭借CUDA生态和Blackwell架构垄断AI训练市场90%份额。AMD通过MI350系列追赶，在推理市场取得突破。',
    bg: 'obsidian',
    layout: 'data-left' as const,
  },
  {
    id: '02',
    title: 'HBM存储',
    short: '存储',
    companies: [
      { name: 'SK海力士', label: '市占率57-62%', highlight: true },
      { name: '三星电子', label: '追赶者', highlight: false },
      { name: '美光', label: '~10%', highlight: false },
    ],
    stats: [
      { value: '57-62%', label: 'SK海力士市占率' },
      { value: '79%', label: 'SK海力士毛利率' },
    ],
    desc: 'HBM（High Bandwidth Memory）是AI芯片的性能瓶颈与核心瓶颈。从HBM2E到HBM3E再到HBM4，每一代堆叠层数翻倍，带宽提升40%以上。SK海力士凭借与NVIDIA的深度绑定和率先量产能力，建立了难以逾越的技术护城河。',
    bg: 'charcoal',
    layout: 'mirror' as const,
  },
  {
    id: '03',
    title: '半导体设备',
    short: '设备',
    companies: [
      { name: '东京电子', label: '刻蚀龙头', highlight: true },
      { name: '爱德万测试', label: '测试核心', highlight: true },
      { name: 'ASML', label: '光刻垄断', highlight: false },
      { name: 'Applied Materials', label: '沉积巨头', highlight: false },
    ],
    stats: [
      { value: '#1', label: '东京电子刻蚀市占率' },
      { value: '#1', label: '爱德万SoC测试市占率' },
    ],
    desc: '半导体设备是晶圆厂扩产的前提条件。每一座先进制程晶圆厂需要投资150-200亿美元设备。东京电子在刻蚀和沉积设备领域占据全球第一，爱德万测试是SoC测试设备的绝对龙头，两家公司合计贡献日经225当日涨幅的相当一部分。',
    bg: 'obsidian',
    layout: 'data-left' as const,
  },
  {
    id: '04',
    title: '晶圆代工',
    short: '代工',
    companies: [
      { name: '台积电', label: '先进制程垄断', highlight: false },
      { name: '三星代工', label: '追赶者', highlight: false },
      { name: 'Intel Foundry', label: '破局者', highlight: false },
    ],
    desc: '晶圆代工是芯片从设计到物理实现的桥梁。台积电以3nm工艺领先，占据全球先进代工90%份额。三星代工在3nm GAA工艺上取得突破，试图打破台积电垄断。晶圆厂的产能利用率直接决定设备需求和材料消耗。',
    bg: 'charcoal',
    layout: 'mirror' as const,
  },
  {
    id: '05',
    title: '云服务商',
    short: '云服务',
    companies: [
      { name: '微软 Azure', label: '最大买家', highlight: true },
      { name: '亚马逊 AWS', label: '自研芯片', highlight: false },
      { name: '谷歌 GCP', label: 'TPU生态', highlight: false },
      { name: 'Meta', label: 'AI算力中心', highlight: false },
    ],
    bigNumber: { value: '8,300亿', label: '美元资本支出' },
    desc: '云服务商是整个产业链的终端买单方。微软Azure、亚马逊AWS、谷歌GCP三家合计占据全球云市场60%份额，它们的资本支出决定上游所有环节的需求强度。2026年8,300亿美元的AI基建投资，正在创造半导体行业历史上最大的需求浪潮。',
    bg: 'obsidian',
    layout: 'data-left' as const,
  },
]

const INVESTMENT = {
  title: '投资层: 软银集团',
  desc: '软银集团作为产业链的投资层，通过愿景基金持有全球AI生态的关键节点：OpenAI（生成式AI）、Arm（芯片架构）、波士顿动力（机器人）、以及数十家AI初创企业。它不直接参与任何一层的产品竞争，却在每一层都有战略投资布局。+18.4%的涨幅，正是市场对这种"全栈AI投资"模式的认可。',
  portfolio: [
    { name: 'OpenAI', role: '生成式AI' },
    { name: 'Arm', role: '芯片架构' },
    { name: '波士顿动力', role: '机器人' },
    { name: '其他AI投资', role: '初创组合' },
  ],
}

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

function DesktopDiagram({ onNodeClick }: { onNodeClick: (id: string) => void }) {
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

      {/* Subtle dotted connector between nodes */}
      {nodeX.slice(0, -1).map((x, i) => (
        <line
          key={`main-line-${i}`}
          x1={x + 110}
          y1={nodeY}
          x2={nodeX[i + 1] - 110}
          y2={nodeY}
          stroke="#3A3A3A"
          strokeWidth="1"
          strokeDasharray="6 6"
          opacity="0.6"
        />
      ))}

      {/* Dashed lines from investment to each node */}
      {nodeX.map((x, i) => (
        <line
          key={`inv-line-${i}`}
          x1={investX}
          y1={investY + 50}
          x2={x}
          y2={nodeY - 80}
          stroke="#3A3A3A"
          strokeWidth="0.75"
          strokeDasharray="4 4"
          opacity="0.35"
        />
      ))}

      {/* Main nodes */}
      {LAYERS.map((layer, i) => {
        const x = nodeX[i]
        const Icon = ICONS[i]
        return (
          <g key={layer.id} className="cursor-pointer" onClick={() => onNodeClick(`layer-${layer.id}`)}>
            {/* Glow rect */}
            <rect
              x={x - 110}
              y={nodeY - 80}
              width="220"
              height="160"
              rx="12"
              fill="#141414"
              stroke="#C9A962"
              strokeWidth="1"
              strokeOpacity="0.3"
              className="transition-all duration-300 hover:stroke-opacity-100"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(201,169,98,0.06))' }}
            />
            {/* Title */}
            <text
              x={x}
              y={nodeY - 45}
              textAnchor="middle"
              fill="#E8E4E0"
              fontSize="16"
              fontFamily="'Noto Sans SC', sans-serif"
              fontWeight="500"
            >
              {layer.title}
            </text>
            {/* Icon */}
            <g transform={`translate(${x - 16}, ${nodeY - 28})`}>
              <Icon />
            </g>
            {/* Company tags */}
            {layer.companies.slice(0, 3).map((c, j) => (
              <text
                key={j}
                x={x}
                y={nodeY + 20 + j * 18}
                textAnchor="middle"
                fill={c.highlight ? '#C9A962' : '#6A6A6A'}
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
              >
                {c.name}
              </text>
            ))}
          </g>
        )
      })}

      {/* Investment diamond node */}
      <g className="cursor-pointer" onClick={() => onNodeClick('investment')}>
        <polygon
          points={`${investX},${investY - 50} ${investX + 55},${investY} ${investX},${investY + 50} ${investX - 55},${investY}`}
          fill="#141414"
          stroke="#C9A962"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          className="transition-all duration-300 hover:stroke-opacity-100"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(201,169,98,0.08))' }}
        />
        <text
          x={investX}
          y={investY - 6}
          textAnchor="middle"
          fill="#E8E4E0"
          fontSize="13"
          fontFamily="'Noto Sans SC', sans-serif"
          fontWeight="500"
        >
          投资层
        </text>
        <text
          x={investX}
          y={investY + 14}
          textAnchor="middle"
          fill="#C9A962"
          fontSize="10"
          fontFamily="'JetBrains Mono', monospace"
        >
          软银集团
        </text>
      </g>
    </svg>
  )
}

function MobileChain({ onNodeClick }: { onNodeClick: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-6 lg:hidden">
      {LAYERS.map((layer, i) => {
        const Icon = ICONS[i]
        return (
          <div key={layer.id} className="relative">
            {i > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 overflow-hidden">
                <div className="w-full h-full border-l border-dashed border-gold opacity-60" />
              </div>
            )}
            <button
              onClick={() => onNodeClick(`layer-${layer.id}`)}
              className="w-full text-left bg-charcoal border border-dim rounded-xl p-5 transition-all duration-300 hover:border-gold hover:shadow-lg active:scale-[0.98]"
              style={{ boxShadow: '0 8px 24px rgba(201,169,98,0.04)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon />
                <span className="font-body text-lg text-platinum font-medium">{layer.title}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {layer.companies.map((c, j) => (
                  <span
                    key={j}
                    className={`font-mono text-xs px-2 py-1 rounded ${c.highlight ? 'text-gold bg-gold/10' : 'text-muted bg-white/5'}`}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </button>
          </div>
        )
      })}

      {/* Investment node */}
      <div className="relative flex justify-center mt-4">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 overflow-hidden">
          <div className="w-full h-full border-l border-dashed border-muted opacity-50" />
        </div>
        <button
          onClick={() => onNodeClick('investment')}
          className="bg-charcoal border border-dim rounded-xl px-6 py-4 text-center transition-all duration-300 hover:border-gold active:scale-[0.98]"
        >
          <p className="font-body text-sm text-platinum mb-1">投资层</p>
          <p className="font-mono text-xs text-gold">软银集团 — 全栈AI投资</p>
        </button>
      </div>
    </div>
  )
}

function InvestmentStar() {
  const cx = 200
  const cy = 150
  const radius = 100
  const angles = [-90, 0, 90, 180]

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-[400px] mx-auto">
      {/* Radiating lines */}
      {angles.map((angle, i) => {
        const x = cx + radius * Math.cos((angle * Math.PI) / 180)
        const y = cy + radius * Math.sin((angle * Math.PI) / 180)
        return (
          <line
            key={`line-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#6A6A6A"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )
      })}

      {/* Radiating nodes */}
      {INVESTMENT.portfolio.map((item, i) => {
        const angle = angles[i]
        const x = cx + radius * Math.cos((angle * Math.PI) / 180)
        const y = cy + radius * Math.sin((angle * Math.PI) / 180)
        return (
          <g key={item.name}>
            <circle cx={x} cy={y} r={28} fill="#141414" stroke="#6A6A6A" strokeWidth="1" />
            <text x={x} y={y - 4} textAnchor="middle" fill="#B0B0B0" fontSize="11" fontFamily="'Noto Sans SC', sans-serif">
              {item.name}
            </text>
            <text x={x} y={y + 10} textAnchor="middle" fill="#6A6A6A" fontSize="9" fontFamily="'Noto Sans SC', sans-serif">
              {item.role}
            </text>
          </g>
        )
      })}

      {/* Center node */}
      <circle cx={cx} cy={cy} r={40} fill="#141414" stroke="#C9A962" strokeWidth="2" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#C9A962" fontSize="13" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">
        软银集团
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#E8E4E0" fontSize="10" fontFamily="'JetBrains Mono', monospace">
        +18.4%
      </text>
    </svg>
  )
}

export default function Chain() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo('.chain-hero-bg', { scale: 1 }, { scale: 1.05, duration: 15, repeat: -1, yoyo: true, ease: 'none' })
      gsap.fromTo('.chain-hero-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      gsap.fromTo('.chain-hero-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.3 })
      gsap.fromTo('.chain-hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.6 })

      // Chain diagram entrance
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

      // Detail sections
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

      // Investment detail
      ScrollTrigger.create({
        trigger: '.investment-detail-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.investment-detail-fade', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out' })
          gsap.fromTo('.star-node', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, stagger: 0.15, duration: 0.6, delay: 0.5, ease: 'power2.out' })
        },
      })

      // Summary
      ScrollTrigger.create({
        trigger: '.chain-summary-section',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo('.chain-summary-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
          gsap.fromTo('.chain-summary-line', { width: 0 }, { width: 60, duration: 1, ease: 'power3.out', delay: 0.3 })
          gsap.fromTo('.chain-summary-text', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.5 })
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const scrollToDiagram = () => {
    const el = document.getElementById('chain-diagram')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div ref={containerRef} className="bg-obsidian">


      {/* ===== Section 1: Hero ===== */}
      <section className="relative w-full overflow-hidden" style={{ height: '55vh', minHeight: '480px' }}>
        <div
          className="chain-hero-bg absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(./chip-abstract.jpg)', transformOrigin: 'center center' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,10,0.6)' }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-6 md:px-20 h-full flex flex-col justify-center">
          <Link to="/" className="absolute top-24 left-6 md:left-20 font-body text-sm text-silver hover:text-gold transition-colors duration-300">
            ← 返回首页
          </Link>
          <p className="chain-hero-label font-body text-[0.8125rem] text-gold tracking-[0.12em] mb-4 opacity-0">
            SUPPLY CHAIN
          </p>
          <h1 className="chain-hero-title font-display text-[3rem] text-platinum leading-[1.15] tracking-[-0.01em] mb-6 opacity-0">
            产业链地图
          </h1>
          <p className="chain-hero-sub font-body text-[1.0625rem] text-silver leading-[1.7] opacity-0">
            从芯片设计到云服务 — 全球AI半导体产业链全景图
          </p>
        </div>
      </section>

      {/* ===== Section 2: Chain Diagram ===== */}
      <section id="chain-diagram" className="chain-diagram-section py-[120px] bg-obsidian">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20">
          <div className="mb-12">
            <p className="font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3">CHAIN VISUALIZATION</p>
            <h2 className="font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em]">
              产业链可视化
            </h2>
          </div>

          {/* Desktop SVG diagram */}
          <div className="chain-node-desktop hidden lg:block opacity-0">
            <DesktopDiagram onNodeClick={scrollTo} />
          </div>

          {/* Mobile HTML diagram */}
          <div className="chain-node-mobile lg:hidden">
            <MobileChain onNodeClick={scrollTo} />
          </div>
        </div>
      </section>

      {/* ===== Layer Detail Sections ===== */}
      {LAYERS.map((layer) => (
        <section
          key={layer.id}
          id={`layer-${layer.id}`}
          className={`detail-section py-20 ${layer.bg === 'charcoal' ? 'bg-charcoal' : 'bg-obsidian'}`}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-20">
            {/* Back button */}
            <button
              onClick={scrollToDiagram}
              className="detail-fade mb-8 font-body text-sm text-muted hover:text-gold transition-colors duration-300 flex items-center gap-1 opacity-0"
            >
              ↑ 返回产业链图
            </button>

            <div
              className={`flex flex-col ${
                layer.layout === 'mirror' ? 'lg:flex-row-reverse' : 'lg:flex-row'
              } gap-12 items-start`}
            >
              {/* Data side */}
              <div className="lg:w-[40%]">
                <p className="detail-fade font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3 opacity-0">
                  LAYER {layer.id}
                </p>
                <h2 className="detail-fade font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-6 opacity-0">
                  {layer.title}
                </h2>

                {layer.marketSize && (
                  <p className="detail-fade font-mono text-[2rem] text-gold leading-[1.1] tracking-[-0.02em] mb-2 opacity-0">
                    {layer.marketSize}
                  </p>
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
                    <span
                      key={i}
                      className={`detail-fade font-mono text-xs px-3 py-1.5 rounded-md border opacity-0 ${
                        c.highlight
                          ? 'text-gold border-gold/30 bg-gold/5'
                          : 'text-muted border-dim bg-white/5'
                      }`}
                    >
                      {c.name}
                      <span className="ml-1.5 text-[10px] opacity-70">{c.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Text side */}
              <div className="lg:w-[60%]">
                <p className="detail-fade font-body text-[1.0625rem] text-silver leading-[1.7] opacity-0">
                  {layer.desc}
                </p>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ===== Investment Detail ===== */}
      <section
        id="investment"
        className="investment-detail-section py-20 bg-obsidian border-t border-dim"
      >
        <div className="max-w-[800px] mx-auto px-6 md:px-20 text-center">
          <button
            onClick={scrollToDiagram}
            className="investment-detail-fade mb-8 font-body text-sm text-muted hover:text-gold transition-colors duration-300 flex items-center gap-1 mx-auto opacity-0"
          >
            ↑ 返回产业链图
          </button>

          <p className="investment-detail-fade font-body text-[0.8125rem] text-gold tracking-[0.1em] mb-3 opacity-0">
            INVESTMENT LAYER
          </p>
          <h2 className="investment-detail-fade font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-8 opacity-0">
            投资层: 软银集团
          </h2>

          <p className="investment-detail-fade font-body text-[1.0625rem] text-silver leading-[1.8] mb-12 opacity-0">
            {INVESTMENT.desc}
          </p>

          <div className="star-node opacity-0">
            <InvestmentStar />
          </div>
        </div>
      </section>

      {/* ===== Chain Summary ===== */}
      <section className="chain-summary-section py-[100px] bg-charcoal">
        <div className="max-w-[900px] mx-auto px-6 md:px-20 text-center">
          <h2 className="chain-summary-title font-display text-[2.25rem] text-platinum leading-[1.2] tracking-[-0.01em] mb-8 opacity-0">
            产业链总结
          </h2>

          <div className="chain-summary-line h-[1px] bg-gold mx-auto mb-8" style={{ width: 0, opacity: 0.6 }} />

          <p className="chain-summary-text font-body text-[1.0625rem] text-platinum leading-[1.9] opacity-0">
            全球AI半导体产业链已形成清晰的价值流转路径：云服务商的8,300亿美元资本支出 → 芯片设计厂商的订单爆发 → HBM存储的技术垄断 → 半导体设备的扩产需求 → 晶圆代工的产能扩张。软银集团作为投资层，横跨整个链条捕获价值。这不是单一环节的景气，而是全产业链的系统性重估。
          </p>
        </div>
      </section>
    </div>
  )
}
