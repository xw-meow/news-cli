import { Link } from 'react-router-dom';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { features } from '../data/features';

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block bg-green-400/10 border border-green-400/25 rounded-full px-3.5 py-1 text-xs text-green-400 mb-5">
          16 个新闻源 · CLI 工具
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-200 mb-4 leading-tight">
          命令行里的
          <br />
          新闻聚合器
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
          一条命令，聚合 16 个新闻源。支持分类浏览、关键词过滤、JSON 输出、插件扩展。
        </p>

        <TerminalBlock
          lines={[
            '$ news list',
            '  google-news  weibo  cls  ithome  bbc  …',
            '',
            '$ news get weibo -l 5',
            '  ┌──────┬──────────────────────┬─────────┐',
            '  │ #1   │ 微博实时热搜标题…    │ 12.5万  │',
            '  └──────┴──────────────────────┴─────────┘',
          ]}
        />

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/install"
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            快速开始
          </Link>
          <Link
            to="/commands"
            className="inline-flex items-center gap-1.5 border border-gray-700 hover:border-gray-500 text-gray-300 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            命令参考
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
