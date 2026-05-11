import { useState, useEffect } from 'react'

function useReportDate() {
  const [dateStr, setDateStr] = useState('海外市场分析报告')
  useEffect(() => {
    fetch('./data/meta.json')
      .then(r => r.json())
      .then((d: { lastUpdated?: string }) => {
        if (d.lastUpdated) {
          const dt = new Date(d.lastUpdated)
          const y = dt.getFullYear()
          const m = dt.getMonth() + 1
          const day = dt.getDate()
          setDateStr(`${y}年${m}月${day}日 海外市场分析报告`)
        }
      })
      .catch(() => {})
  }, [])
  return dateStr
}

function useCloseDate() {
  const [dateStr, setDateStr] = useState('数据更新中')
  useEffect(() => {
    fetch('./data/market-data.json')
      .then(r => r.json())
      .then((d: { lastUpdated?: string }) => {
        if (d.lastUpdated) {
          const dt = new Date(d.lastUpdated)
          const y = dt.getFullYear()
          const m = dt.getMonth() + 1
          const day = dt.getDate()
          setDateStr(`数据截止: ${y}年${m}月${day}日收盘`)
        }
      })
      .catch(() => {})
  }, [])
  return dateStr
}

export default function Footer() {
  const reportDate = useReportDate()
  const closeDate = useCloseDate()

  return (
    <footer className="bg-obsidian border-t border-dim">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <p className="font-body text-[0.8125rem] text-muted leading-relaxed tracking-wider">
              {reportDate}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <p className="font-body text-[0.8125rem] text-muted leading-relaxed">
              本报告仅供信息参考，不构成投资建议
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-body text-[0.8125rem] text-muted leading-relaxed tracking-wider">
              {closeDate}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
