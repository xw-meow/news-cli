import type { SourceData } from '../../data/sources';
import { GlowCard } from './GlowCard';
import { useI18n } from '../../i18n/I18nProvider';

interface SourceCardProps {
  source: SourceData;
}

const typeStyles: Record<SourceData['type'], { bg: string; text: string; border: string }> = {
  RSS: { bg: 'bg-green-400/10', text: 'text-green-400', border: 'border-green-400/20' },
  JSON: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/20' },
  HTML: { bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/20' },
};

const maxVisibleCategories = 3;

export function SourceCard({ source }: SourceCardProps) {
  const { lang } = useI18n();
  const visibleCategories = source.categories.slice(0, maxVisibleCategories);
  const remaining = source.categories.length - maxVisibleCategories;
  const styles = typeStyles[source.type];

  return (
    <GlowCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-green-400 font-mono text-sm font-semibold truncate">{source.name}</span>
        <span
          className={`
            text-[10px] px-1.5 py-0.5 rounded border
            ${styles.bg} ${styles.text} ${styles.border}
          `}
        >
          {source.type}
        </span>
      </div>
      <p className="text-gray-400 text-xs mb-3 leading-relaxed flex-1">
        {lang === 'en' ? source.descriptionEn : source.description}
      </p>
      {visibleCategories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {visibleCategories.map((cat) => (
            <span
              key={cat}
              className="text-[10px] text-gray-400 bg-gray-800/80 border border-gray-700/50 px-1.5 py-0.5 rounded"
            >
              {cat}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-[10px] text-gray-500 bg-gray-800/80 border border-gray-700/50 px-1.5 py-0.5 rounded">
              +{remaining}
            </span>
          )}
        </div>
      )}
    </GlowCard>
  );
}
