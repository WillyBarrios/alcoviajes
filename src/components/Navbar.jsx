import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Plane } from 'lucide-react'

const navLinks = [
  { label: 'Inicio', path: '/' },
  { label: 'Destinos', path: '/destinos' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-white/10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" id="nav-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-110">
            <Plane size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Alco<span className="text-cyan-400">viajes</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                id={`nav-${link.label.toLowerCase()}`}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.path
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          id="nav-mobile-toggle"
          className="md:hidden text-slate-300 hover:text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  id={`nav-mobile-${link.label.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.path
                      ? 'text-cyan-400 bg-cyan-400/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
