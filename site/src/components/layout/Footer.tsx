import { useI18n } from '../../i18n/I18nProvider';

export function Footer() {
  const { lang, setLang, t } = useI18n();

  return (
    <footer className="relative mt-auto">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-green-400">
            <span className="text-gray-500">~/</span>news
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a
              href="https://github.com/xw-meow/news-cli"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/xw-meow/news-cli/issues"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              Issues
            </a>
            <a
              href="https://github.com/xw-meow/news-cli#readme"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              {lang === 'zh' ? '文档' : 'Docs'}
            </a>
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="hover:text-green-400 transition-colors"
              aria-label="Toggle language"
            >
              {lang === 'zh' ? 'English' : '中文'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-gray-600">
          news-cli · {t.footerBuilt} · 17 {t.statSources}
        </div>
      </div>
    </footer>
  );
}
