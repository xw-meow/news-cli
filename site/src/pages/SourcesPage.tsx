import { useMemo, useState } from 'react';
import { SourceCard } from '../components/ui/SourceCard';
import { GlowCard } from '../components/ui/GlowCard';
import { sources } from '../data/sources';

const typeFilters: Array<'All' | 'RSS' | 'JSON' | 'HTML'> = ['All', 'RSS', 'JSON', 'HTML'];

export function SourcesPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<typeof typeFilters[number]>('All');

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.categories.some((c) => c.toLowerCase().includes(q));
      const matchesType = typeFilter === 'All' || s.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [query, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { RSS: 0, JSON: 0, HTML: 0 };
    for (const s of sources) {
      counts[s.type] = (counts[s.type] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">新闻源</h1>
        <p className="text-sm text-gray-500">
          内置 {sources.length} 个新闻源，覆盖中英文主流媒体与科技社区
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {typeFilters.map((t) => (
          <GlowCard
            key={t}
            hover={false}
            className={`p-4 cursor-pointer ${
              typeFilter === t ? 'border-green-400/40 bg-green-400/5' : ''
            }`}
          >
            <button
              onClick={() => setTypeFilter(t)}
              className="w-full text-left"
            >
              <div className="text-2xl font-bold text-gray-200">
                {t === 'All' ? sources.length : typeCounts[t]}
              </div>
              <div className="text-xs text-gray-500">{t === 'All' ? '全部' : t}</div>
            </button>
          </GlowCard>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索新闻源、分类…"
          className="flex-1 bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-green-400/40 transition-colors"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <SourceCard key={s.name} source={s} />
        ))}
      </div>

      {filtered.length === 0 && (
        <GlowCard className="text-center py-16">
          <div className="text-4xl mb-3">🔭</div>
          <p className="text-gray-500 text-sm">没有匹配的新闻源</p>
          <button
            onClick={() => {
              setQuery('');
              setTypeFilter('All');
            }}
            className="mt-3 text-xs text-green-400 hover:text-green-300"
          >
            清除筛选
          </button>
        </GlowCard>
      )}
    </div>
  );
}
