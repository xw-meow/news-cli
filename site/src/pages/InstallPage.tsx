import { TerminalBlock } from '../components/ui/TerminalBlock';

export function InstallPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-12 pb-16">
      <h1 className="text-2xl font-bold text-gray-200 mb-1">安装</h1>
      <p className="text-sm text-gray-500 mb-8">一行命令全局安装，即可使用</p>

      {/* Prerequisites */}
      <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 mb-8">
        <span className="text-amber-400 text-base flex-shrink-0 mt-0.5">⚠</span>
        <div>
          <div className="text-amber-400 text-xs font-semibold mb-1">前置要求</div>
          <div className="text-gray-400 text-xs">Node.js ≥ 18</div>
        </div>
      </div>

      {/* Install */}
      <h3 className="text-sm font-semibold text-gray-200 mb-3">安装命令</h3>
      <div className="mb-8">
        <TerminalBlock lines={['$ npm install -g news-cli']} />
      </div>

      {/* Verify */}
      <h3 className="text-sm font-semibold text-gray-200 mb-3">验证安装</h3>
      <div className="mb-8">
        <TerminalBlock
          lines={[
            '$ news list',
            '  google-news  weibo  cls  ithome  bbc  …  (16 个新闻源)',
          ]}
        />
      </div>

      {/* Quick start */}
      <div className="border-t border-gray-800 pt-8">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">快速体验</h3>
        <TerminalBlock
          lines={[
            '$ news get weibo -l 5',
            '# 获取微博热搜前 5 条',
            '',
            '$ news get 36kr -c AI --json | jq \'.[].title\'',
            '# JSON 输出 36氪 AI 频道标题',
          ]}
        />
      </div>
    </div>
  );
}
