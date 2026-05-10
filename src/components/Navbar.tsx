import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import LastUpdated from './LastUpdated'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/markets', label: '市场指数' },
  { path: '/leaders', label: '领涨核心' },
  { path: '/macro', label: '宏观分析' },
  { path: '/chain', label: '产业链地图' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home'
    }
    return location.pathname === path
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-colors duration-500"
        style={{
          backgroundColor: scrolled || menuOpen ? 'rgba(10,10,10,0.9)' : 'transparent',
          backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
          borderBottom: scrolled || menuOpen ? '1px solid #3A3A3A' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-20 flex items-center justify-between">
          <Link to="/" className="font-display text-xl text-gold tracking-wide relative z-50">
            全球资本的脉搏
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative font-body text-sm text-silver hover:text-gold transition-colors duration-300 group"
              >
                {link.label}
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] h-[1px] bg-gold transition-all duration-300"
                  style={{ width: isActive(link.path) ? '100%' : '0%' }}
                />
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] h-[1px] bg-gold w-0 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
            <LastUpdated />
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden relative z-50 w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-[1px] bg-gold transition-all duration-300" style={{ transform: menuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none' }} />
            <span className="block w-6 h-[1px] bg-gold transition-all duration-300" style={{ opacity: menuOpen ? 0 : 1 }} />
            <span className="block w-6 h-[1px] bg-gold transition-all duration-300" style={{ transform: menuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center transition-all duration-500 md:hidden"
        style={{
          backgroundColor: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(30px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        <div className="flex flex-col items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="font-display text-3xl tracking-wide transition-colors duration-300"
              style={{ color: isActive(link.path) ? '#C9A962' : '#E8E4E0' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="font-body text-xs text-muted tracking-[0.15em] uppercase">
            数据截止: 2026年5月7日收盘
          </p>
        </div>
      </div>
    </>
  )
}
