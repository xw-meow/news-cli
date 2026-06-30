import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: '首页' },
  { to: '/install', label: '安装' },
  { to: '/commands', label: '命令' },
  { to: '/sources', label: '新闻源' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-1.5 font-mono text-lg font-bold text-green-400 hover:text-green-300 transition-colors"
        >
          <span className="text-gray-500">~/</span>news
          <span className="text-green-400 animate-pulse">▸</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`
                  relative px-3 py-1.5 text-sm rounded-lg transition-colors
                  ${active ? 'text-gray-200' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'}
                `}
              >
                {l.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-gray-900 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-gray-200 rounded transition-transform ${
              open ? 'rotate-45 translate-y-1.5' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-200 rounded transition-opacity ${
              open ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-200 rounded transition-transform ${
              open ? '-rotate-45 -translate-y-1.5' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <nav className="bg-gray-950/95 border-t border-gray-800 px-6 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`
                px-3 py-2 rounded-lg text-sm transition-colors
                ${pathname === l.to ? 'text-green-400 bg-green-400/8' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'}
              `}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
