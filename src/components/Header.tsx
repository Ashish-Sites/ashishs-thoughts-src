import { Link, useRouterState } from '@tanstack/react-router'
import {
  BookOpen,
  Edit3,
  Github,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Essays', path: '/' },
    { label: 'Topics', path: '/topics' },
    { label: 'Dialogues & Questions', path: '/questions' },
    { label: 'GitHub Backup', path: '/backup' },
    { label: 'Studio', path: '/studio' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#202736] bg-[#0c0e12]/90 backdrop-blur-md transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#181e2b] border border-[#2d3748] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/60 group-hover:scale-105 transition-all shadow-inner">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif text-lg font-medium tracking-tight text-[#f0f3f8] group-hover:text-[#d4af37] transition-colors">
              OBSIDIAN &amp; INK
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest text-[#5e6b7e] border border-[#222938] px-1.5 py-0.5 rounded">
              Essays
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(link.path)

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wider font-medium transition-all ${
                  isActive
                    ? 'text-[#f0f3f8] bg-[#1a202c] border border-[#2d3748] shadow-sm'
                    : 'text-[#9aa5b8] hover:text-[#f0f3f8] hover:bg-[#151a24]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Action Pill */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/backup"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#151a24] hover:bg-[#1c2230] text-[#9aa5b8] hover:text-[#3fb950] border border-[#222938] hover:border-[#3fb950]/40 transition-all shadow-xs"
            title="GitHub Backup & Sync Hub"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></span>
            <Github className="w-3.5 h-3.5" />
            <span>Git Sync</span>
          </Link>

          <Link
            to="/studio"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-md text-[#9aa5b8] hover:text-[#f0f3f8] hover:bg-[#151a24]"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-[#202736] bg-[#0e1117] px-4 py-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => {
            const isActive =
              link.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(link.path)

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'text-[#f0f3f8] bg-[#1a202c] border border-[#2d3748]'
                    : 'text-[#9aa5b8] hover:text-[#f0f3f8]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-3 border-t border-[#202736] flex items-center justify-between">
            <Link
              to="/backup"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-xs font-mono text-[#3fb950]"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Backup Center</span>
            </Link>
            <Link
              to="/studio"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-1 rounded text-xs font-medium bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30"
            >
              Compose Essay
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
