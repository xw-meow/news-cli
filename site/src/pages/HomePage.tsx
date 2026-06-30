import { Link } from 'react-router-dom';
import { TypingTerminal } from '../components/ui/TypingTerminal';
import { StatBadge } from '../components/ui/StatBadge';
import { GlowCard } from '../components/ui/GlowCard';
import {
  SourcesIcon,
  CommandsIcon,
  PluginsIcon,
  FilterIcon,
  PipeIcon,
  ProxyIcon,
} from '../components/ui/Icon';
import { SourceCard } from '../components/ui/SourceCard';
import { features } from '../data/features';
import { sources } from '../data/sources';

const teaserSources = ['hackernews', 'weibo', '36kr', 'bbc', 'pengpai', 'ithome', 'huxiu', 'google-news'];

const featureIcons: Record<string, React.ReactNode> = {
  '17 个新闻源': <SourcesIcon size={22} />,
  '分类 & 过滤': <FilterIcon size={22} />,
  '管道友好': <PipeIcon size={22} />,
  '插件扩展': <PluginsIcon size={22} />,
  '代理友好': <ProxyIcon size={22} />,
};

export function HomePage() {
  const featured = sources.filter((s) => teaserSources.includes(s.name));

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <span className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/25 rounded-full px-4 py-1.5 text-xs text-green-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          17 个新闻源 · CLI 工具 · 插件扩展
        </span>

        <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight">
          <span className="text-gradient">命令行里的</span>
          <br />
          <span className="text-gray-200">新闻聚合器</span>
        </h1>

        <p className="text-gray-400 max-w-xl mx-auto mb-8 text-base leading-relaxed">
          一条命令聚合 17 个新闻源。支持分类浏览、关键词过滤、JSON 输出、插件扩展，以及自动代理识别。
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <Link
            to="/install"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25"
          >
            快速开始
          </Link>
          <Link
            to="/commands"
            className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-green-400/50 hover:bg-gray-900 text-gray-300 font-medium text-sm px-6 py-3 rounded-xl transition-all"
          >
            命令参考
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          <StatBadge
            value="17"
            label="新闻源"
            icon={<div className="text-green-400"><SourcesIcon size={20} /></div>}
          />
          <StatBadge
            value="5"
            label="命令组"
            color="amber"
            icon={<div className="text-amber-400"><CommandsIcon size={20} /></div>}
          />
          <StatBadge
            value="∞"
            label="可扩展"
            icon={<div className="text-green-400"><PluginsIcon size={20} /></div>}
          />
        </div>

        {/* Terminal */}
        <div className="text-left max-w-2xl mx-auto">
          <TypingTerminal />
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-200 mb-2">核心特性</h2>
          <p className="text-sm text-gray-500">为命令行爱好者打造的新闻阅读体验</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <GlowCard key={f.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800/80 border border-gray-700 flex items-center justify-center text-green-400 flex-shrink-0">
                  {featureIcons[f.title]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* Source teaser */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-1">热门新闻源</h2>
            <p className="text-sm text-gray-500">内置 17 个新闻源，覆盖科技与主流媒体</p>
          </div>
          <Link
            to="/sources"
            className="text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {featured.map((s) => (
            <SourceCard key={s.name} source={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
