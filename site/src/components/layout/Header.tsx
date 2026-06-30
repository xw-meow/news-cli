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

  const linkClass = (to: string) =>
    `text-sm transition-colors ${
      pathname === to ? 'text-gray-200' : 'text-gray-500 hover:text-gray-300'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/85 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 font-mono text-lg font-bold text-green-400">
          ~/news <span className="text-green-400">▸</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-200 rounded transition-transform ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-200 rounded transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-200 rounded transition-transform ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-gray-950 border-t border-gray-800 px-6 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkClass(l.to)}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
