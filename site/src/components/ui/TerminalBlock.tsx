interface TerminalBlockTable {
  headers: string[];
  rows: string[][];
}

interface TerminalBlockProps {
  lines?: string[];
  table?: TerminalBlockTable;
  /** 是否显示 prompt 符号 $，默认 true */
  showPrompt?: boolean;
  /** 是否显示红黄绿圆点，默认 true */
  showDots?: boolean;
  className?: string;
}

export function TerminalBlock({
  lines = [],
  table,
  showPrompt = true,
  showDots = true,
  className = '',
}: TerminalBlockProps) {
  return (
    <div
      className={`
        bg-black/80 border border-gray-800 rounded-xl
        p-5 font-mono text-sm leading-normal text-left overflow-x-auto
        glow-green
        ${className}
      `}
    >
      {showDots && (
        <div className="flex gap-1.5 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
      )}

      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {showPrompt && line.startsWith('$ ') ? (
            <>
              <span className="text-green-400">$</span>
              <span className="text-gray-200">{line.slice(1)}</span>
            </>
          ) : line.startsWith('# ') ? (
            <span className="text-gray-500">{line}</span>
          ) : (
            <span className="text-gray-400">{line}</span>
          )}
        </div>
      ))}

      {table && (
        <table className="w-full border-collapse mt-1">
          <thead>
            <tr className="border-b border-gray-600">
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-2 py-0.5 text-left text-gray-200 font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-gray-800 last:border-0">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-0.5 text-gray-400 whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
