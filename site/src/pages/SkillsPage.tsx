import { useState } from 'react';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { GlowCard } from '../components/ui/GlowCard';
import { SparklesIcon, NewspaperIcon, CheckIcon, CopyIcon } from '../components/ui/Icon';
import { useI18n } from '../i18n/I18nProvider';

const INSTALL_COMMAND =
  'curl -LO https://raw.githubusercontent.com/xw-meow/news-cli/main/skills/professional-daily-report.zip';

export function SkillsPage() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const examples = [
    '帮我写一份今天的 AI 行业日报，面向 AI 从业者，正式风格，10 条左右，保存到 docs/ai-daily.md',
    '帮我生成一份今天的 AI 行业 HTML 大字报，旧报纸风格',
  ];

  const formats = [
    {
      icon: <SparklesIcon size={20} />,
      title: t.skillMarkdownTitle,
      desc: t.skillMarkdownDesc,
    },
    {
      icon: <NewspaperIcon size={20} />,
      title: t.skillHtmlTitle,
      desc: t.skillHtmlDesc,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">{t.skillsPageTitle}</h1>
        <p className="text-sm text-gray-500">{t.skillsPageSubtitle}</p>
      </div>

      <GlowCard className="p-5 mb-8 border-purple-400/20 bg-purple-400/5" hover={false}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center text-purple-400 flex-shrink-0">
            <SparklesIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-200 mb-1">{t.skillInstallTitle}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.skillInstallDesc}</p>
            <div className="relative group">
              <TerminalBlock lines={[`$ ${INSTALL_COMMAND}`]} breakAll />
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 p-1.5 rounded text-gray-500 hover:text-green-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Copy command"
                title="Copy"
              >
                {copied ? <CheckIcon size={16} className="text-green-400" /> : <CopyIcon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </GlowCard>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{t.skillUsageTitle}</h3>
        <div className="space-y-3">
          {examples.map((example, i) => (
            <TerminalBlock key={i} lines={[example]} showPrompt={false} breakAll />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{t.skillOutputTitle}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {formats.map((format) => (
            <GlowCard key={format.title} className="p-4" hover={false}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-400/10 flex items-center justify-center text-green-400 flex-shrink-0">
                  {format.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-1">{format.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{format.desc}</p>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>

      <a
        href="https://github.com/xw-meow/news-cli/blob/main/skills/professional-daily-report/SKILL.md"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition-colors"
      >
        {t.skillDetailLink}
      </a>
    </div>
  );
}
