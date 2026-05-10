export default function Footer() {
  return (
    <footer className="bg-obsidian border-t border-dim">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <p className="font-body text-[0.8125rem] text-muted leading-relaxed tracking-wider">
              2026年5月7日 — 8日 海外市场分析报告
            </p>
          </div>
          <div className="flex items-center justify-center">
            <p className="font-body text-[0.8125rem] text-muted leading-relaxed">
              本报告仅供信息参考，不构成投资建议
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-body text-[0.8125rem] text-muted leading-relaxed tracking-wider">
              数据截止: 2026年5月7日收盘
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
