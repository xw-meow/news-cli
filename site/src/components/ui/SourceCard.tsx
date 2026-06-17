import type { SourceData } from '../../data/sources';

interface SourceCardProps {
  source: SourceData;
}

const typeStyles: Record<SourceData['type'], { bg: string; text: string }> = {
  RSS: { bg: 'bg-green-400/10', text: 'text-green-400' },
  JSON: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  HTML: { bg: 'bg-green-400/10', text: 'text-green-400' },
};

const maxVisibleCategories = 3;

export function SourceCard({ source }: SourceCardProps) {
  const visibleCategories = source.categories.slice(0, maxVisibleCategories);
  const remaining = source.categories.length - maxVisibleCategories;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-green-400/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-green-400 font-mono text-sm font-semibold">{source.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeStyles[source.type].bg} ${typeStyles[source.type].text}`}>
          {source.type}
        </span>
      </div>
      <p className="text-gray-400 text-xs mb-2.5 leading-relaxed">{source.description}</p>
      {visibleCategories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {visibleCategories.map((cat) => (
            <span key={cat} className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
              {cat}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">+{remaining}</span>
          )}
        </div>
      )}
    </div>
  );
}
