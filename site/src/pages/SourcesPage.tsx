import { useState, useMemo } from 'react';
import { SourceCard } from '../components/ui/SourceCard';
import { sources } from '../data/sources';

export function SourcesPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
      <h1 className="text-2xl font-bold text-gray-200 mb-1">新闻源</h1>
      <p className="text-sm text-gray-500 mb-6">16 个内置新闻源，覆盖中英文主流媒体</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索新闻源…"
        className="w-full max-w-sm bg-black border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors mb-6"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <SourceCard key={s.name} source={s} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-12">没有匹配的新闻源</p>
      )}
    </div>
  );
}
