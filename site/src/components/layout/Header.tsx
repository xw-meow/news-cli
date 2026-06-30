import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { lang, setLang, t } = useI18n();

  const links = [
    { to: '/', label: t.home },
    { to: '/install', label: t.install },
    { to: '/commands', label: t.commands },
    { to: '/sources', label: t.sources },
  ];

  const toggleLang = () => setLang(lang === 'zh' ? 'en' : 'zh');

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
          <button
            onClick={toggleLang}
            className="ml-2 px-2.5 py-1 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-green-400/40 hover:text-green-400 transition-colors"
            aria-label="Toggle language"
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
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
          ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}
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
          <button
            onClick={() => {
              toggleLang();
              setOpen(false);
            }}
            className="text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
          >
            {lang === 'zh' ? 'Switch to English' : '切换为中文'}
          </button>
        </nav>
      </div>
    </header>
  );
}
