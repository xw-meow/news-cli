import { TerminalBlock } from '../components/ui/TerminalBlock';
import { GlowCard } from '../components/ui/GlowCard';
import { WarningIcon, GlobeIcon } from '../components/ui/Icon';
import { useI18n } from '../i18n/I18nProvider';

export function InstallPage() {
  const { t } = useI18n();

  const steps = [
    {
      title: t.stepInstall,
      command: 'npm install -g xw-news-cli',
      description: t.installCmdDesc,
    },
    {
      title: t.stepVerify,
      command: 'news list',
      description: t.verifyCmdDesc,
    },
    {
      title: t.stepTry,
      command: 'news get hackernews -c ask -l 5',
      description: t.tryCmdDesc,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">{t.installTitle}</h1>
        <p className="text-sm text-gray-500">{t.installSubtitle}</p>
      </div>

      <GlowCard className="p-4 mb-8 border-amber-400/20 bg-amber-400/5" hover={false}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 flex-shrink-0">
            <WarningIcon size={20} />
          </div>
          <div>
            <div className="text-amber-400 text-xs font-semibold mb-1">{t.prereqTitle}</div>
            <div className="text-gray-400 text-xs">{t.prereqText}</div>
          </div>
        </div>
      </GlowCard>

      <div className="relative mb-10">
        <div className="absolute left-5 top-8 bottom-8 w-px bg-gradient-to-b from-green-400/30 via-gray-800 to-transparent" />
        {steps.map((step, i) => (
          <div key={step.title} className="relative flex gap-4 mb-8 last:mb-0">
            <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-sm font-bold text-green-400 z-10 flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-sm font-semibold text-gray-200 mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{step.description}</p>
              <TerminalBlock lines={[`$ ${step.command}`]} />
            </div>
          </div>
        ))}
      </div>

      <GlowCard className="p-5" hover={false}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-400/10 flex items-center justify-center text-green-400 flex-shrink-0">
            <GlobeIcon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-1">{t.proxyTitle}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.proxyDesc}</p>
            <TerminalBlock
              lines={[
                '$ export https_proxy=http://127.0.0.1:8118',
                '$ export http_proxy=http://127.0.0.1:8118',
                '$ news get hackernews -c top -l 5',
              ]}
            />
          </div>
        </div>
      </GlowCard>
    </div>
  );
}
