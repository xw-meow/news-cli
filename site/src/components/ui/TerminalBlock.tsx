interface TerminalBlockProps {
  lines: string[];
  /** 是否显示 prompt 符号 $，默认 true */
  showPrompt?: boolean;
  /** 是否显示红黄绿圆点，默认 true */
  showDots?: boolean;
}

export function TerminalBlock({ lines, showPrompt = true, showDots = true }: TerminalBlockProps) {
  return (
    <div className="bg-black border border-gray-800 rounded-lg p-5 font-mono text-sm leading-normal text-left overflow-x-auto">
      {showDots && (
        <div className="flex gap-1.5 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
      )}
      {lines.map((line, i) => (
        <div key={i}>
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
    </div>
  );
}
