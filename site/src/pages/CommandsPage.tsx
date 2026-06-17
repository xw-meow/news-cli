import { useState } from 'react';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { commands, type CommandData } from '../data/commands';

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
  const grouped = groupCommands(commands);
  const groupNames = [...grouped.keys()];
  const firstCmd = groupNames[0] ? grouped.get(groupNames[0])?.[0] : null;
  const [selected, setSelected] = useState<CommandData | null>(firstCmd ?? null);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
      <h1 className="text-2xl font-bold text-gray-200 mb-1">命令参考</h1>
      <p className="text-sm text-gray-500 mb-8">news-cli 完整命令列表</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-48 flex-shrink-0">
          {groupNames.map((group) => (
            <div key={group} className="mb-4">
              <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">{group}</div>
              <div className="flex flex-col gap-0.5">
                {(grouped.get(group) ?? []).map((cmd) => (
                  <button
                    key={cmd.name}
                    onClick={() => setSelected(cmd)}
                    className={`text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                      selected?.name === cmd.name
                        ? 'text-green-400 bg-green-400/8 font-medium'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {cmd.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {selected && (
            <>
              <h3 className="text-lg font-semibold text-gray-200 mb-0.5 font-mono">news {selected.name}</h3>
              <p className="text-xs text-gray-500 mb-5">{selected.description}</p>

              <div className="text-xs text-gray-400 mb-2">用法：</div>
              <div className="mb-5">
                <TerminalBlock lines={[`$ ${selected.usage}`]} />
              </div>

              {selected.options.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2">选项：</div>
                  <div className="flex flex-col gap-1.5 mb-5">
                    {selected.options.map((opt) => (
                      <div
                        key={opt.flag}
                        className="flex items-start gap-2.5 px-3 py-2 bg-gray-900 border border-gray-800 rounded-md"
                      >
                        <code className="text-amber-400 text-[11px] font-mono whitespace-nowrap flex-shrink-0">
                          {opt.flag}
                        </code>
                        <span className="text-gray-400 text-[11px]">{opt.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selected.examples.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2">示例：</div>
                  <TerminalBlock
                    lines={selected.examples.flatMap((ex, i) => {
                      const parts: string[] = [`$ ${ex}`];
                      if (i < selected.examples.length - 1) parts.push('');
                      return parts;
                    })}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
