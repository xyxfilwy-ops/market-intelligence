import { useState, useEffect } from 'react'

interface MetaData {
  reportDate: string
  lastUpdated: string
  title: string
  subtitle: string
  disclaimer: string
}

export default function LastUpdated() {
  const [meta, setMeta] = useState<MetaData | null>(null)

  useEffect(() => {
    fetch('/data/meta.json')
      .then(r => r.json())
      .then(d => setMeta(d))
      .catch(() => setMeta(null))
  }, [])

  if (!meta) return null

  const date = new Date(meta.lastUpdated)
  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  return (
    <span className="font-body text-[0.6875rem] text-muted tracking-wider hidden lg:inline-block">
      数据更新于: {formatted}
    </span>
  )
}
