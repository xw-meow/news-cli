import { useI18n } from '../i18n/I18nProvider';
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
import { Link } from 'react-router-dom';

const teaserSources = ['hackernews', 'weibo', '36kr', 'bbc', 'pengpai', 'ithome', 'huxiu', 'google-news'];

export function HomePage() {
  const { t, lang } = useI18n();
  const featured = sources.filter((s) => teaserSources.includes(s.name));

  const featureIcons: Record<string, React.ReactNode> = {
    '17 个新闻源': <SourcesIcon size={22} />,
    '分类 & 过滤': <FilterIcon size={22} />,
    '管道友好': <PipeIcon size={22} />,
    '插件扩展': <PluginsIcon size={22} />,
    '代理友好': <ProxyIcon size={22} />,
  };

  const featureIconsEn: Record<string, React.ReactNode> = {
    '17 Sources': <SourcesIcon size={22} />,
    'Categories & Filters': <FilterIcon size={22} />,
    'Pipe Friendly': <PipeIcon size={22} />,
    'Plugin Extensible': <PluginsIcon size={22} />,
    'Proxy Friendly': <ProxyIcon size={22} />,
  };

  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <span className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/25 rounded-full px-4 py-1.5 text-xs text-green-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {t.heroTag}
        </span>

        <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight">
          <span className="text-gradient">{t.heroTitle1}</span>
          <br />
          <span className="text-gray-200">{t.heroTitle2}</span>
        </h1>

        <p className="text-gray-400 max-w-xl mx-auto mb-8 text-base leading-relaxed">
          {t.heroDesc}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <Link
            to="/install"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25"
          >
            {t.ctaStart}
          </Link>
          <Link
            to="/commands"
            className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-green-400/50 hover:bg-gray-900 text-gray-300 font-medium text-sm px-6 py-3 rounded-xl transition-all"
          >
            {t.ctaCommands}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          <StatBadge
            value="17"
            label={t.statSources}
            icon={<div className="text-green-400"><SourcesIcon size={20} /></div>}
          />
          <StatBadge
            value="5"
            label={t.statCommands}
            color="amber"
            icon={<div className="text-amber-400"><CommandsIcon size={20} /></div>}
          />
          <StatBadge
            value="∞"
            label={t.statExtensible}
            icon={<div className="text-green-400"><PluginsIcon size={20} /></div>}
          />
        </div>

        <div className="text-left max-w-2xl mx-auto">
          <TypingTerminal />
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-200 mb-2">{t.featuresTitle}</h2>
          <p className="text-sm text-gray-500">{t.featuresSubtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <GlowCard key={f.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800/80 border border-gray-700 flex items-center justify-center text-green-400 flex-shrink-0">
                  {(lang === 'en' ? featureIconsEn[f.title] : featureIcons[f.title]) ?? featureIcons[f.title]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-1.5">
                    {lang === 'en' ? f.titleEn : f.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {lang === 'en' ? f.descriptionEn : f.description}
                  </p>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-1">{t.sourcesTitle}</h2>
            <p className="text-sm text-gray-500">{t.sourcesSubtitle}</p>
          </div>
          <Link
            to="/sources"
            className="text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            {t.viewAll}
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
