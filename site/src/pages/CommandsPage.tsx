import { useState } from 'react';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { GlowCard } from '../components/ui/GlowCard';
import { commands, type CommandData } from '../data/commands';
import { useI18n } from '../i18n/I18nProvider';

function groupCommands(cmds: CommandData[]): Map<string, CommandData[]> {
  const map = new Map<string, CommandData[]>();
  for (const c of cmds) {
    const group = map.get(c.group) ?? [];
    group.push(c);
    map.set(c.group, group);
  }
  return map;
}

export function CommandsPage() {
  const { t, lang } = useI18n();
  const grouped = groupCommands(commands);
  const groupNames = [...grouped.keys()];
  const firstCmd = groupNames[0] ? grouped.get(groupNames[0])?.[0] : null;
  const [selected, setSelected] = useState<CommandData | null>(firstCmd ?? null);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">{t.commandsTitle}</h1>
        <p className="text-sm text-gray-500">{t.commandsSubtitle}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 flex-shrink-0">
          <GlowCard className="p-3" hover={false}>
            {groupNames.map((group) => (
              <div key={group} className="mb-4 last:mb-0">
                <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 px-2">
                  {lang === 'en' ? group.replace('基础命令', 'Basic').replace('插件命令', 'Plugin') : group}
                </div>
                <div className="flex flex-col gap-0.5">
                  {(grouped.get(group) ?? []).map((cmd) => {
                    const active = selected?.name === cmd.name;
                    return (
                      <button
                        key={cmd.name}
                        onClick={() => setSelected(cmd)}
                        className={`
                          text-left px-3 py-2 rounded-lg text-sm transition-all relative overflow-hidden
                          ${
                            active
                              ? 'text-green-400 bg-green-400/8 font-medium'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                          }
                        `}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-green-400 rounded-full" />
                        )}
                        <span className="pl-2">{cmd.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </GlowCard>
        </aside>

        <div className="flex-1 min-w-0">
          {selected && (
            <GlowCard className="p-6" hover={false}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-1 font-mono">
                    news {selected.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {lang === 'en' ? selected.descriptionEn : selected.description}
                  </p>
                </div>
                <button
                  className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-gray-500 border border-gray-800 rounded-lg px-2.5 py-1.5 hover:border-green-400/40 hover:text-green-400 transition-colors"
                  onClick={() => navigator.clipboard?.writeText(`news ${selected.usage.replace(/^news /, '')}`)}
                >
                  {t.copyCommand}
                </button>
              </div>

              <div className="text-xs text-gray-400 mb-2 font-medium">{t.usage}</div>
              <div className="mb-6">
                <TerminalBlock lines={[`$ ${selected.usage}`]} />
              </div>

              {selected.options.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2 font-medium">{t.options}</div>
                  <div className="flex flex-col gap-2 mb-6">
                    {selected.options.map((opt) => (
                      <div
                        key={opt.flag}
                        className="flex items-start gap-3 px-4 py-3 bg-black/40 border border-gray-800 rounded-xl"
                      >
                        <code className="text-amber-400 text-[11px] font-mono whitespace-nowrap flex-shrink-0">
                          {opt.flag}
                        </code>
                        <span className="text-gray-400 text-xs">
                          {lang === 'en' ? opt.descriptionEn : opt.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selected.examples.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2 font-medium">{t.examples}</div>
                  <TerminalBlock
                    lines={selected.examples.flatMap((ex, i) => {
                      const parts: string[] = [`$ ${ex}`];
                      if (i < selected.examples.length - 1) parts.push('');
                      return parts;
                    })}
                  />
                </>
              )}
            </GlowCard>
          )}
        </div>
      </div>
    </div>
  );
}
