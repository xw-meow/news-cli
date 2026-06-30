export function Footer() {
  return (
    <footer className="relative mt-auto">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-green-400">
            <span className="text-gray-500">~/</span>news
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a href="#" className="hover:text-green-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-green-400 transition-colors">Issues</a>
            <a href="#" className="hover:text-green-400 transition-colors">文档</a>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-gray-600">
          news-cli · 命令行新闻聚合器 · 17 个新闻源 · 插件扩展
        </div>
      </div>
    </footer>
  );
}
