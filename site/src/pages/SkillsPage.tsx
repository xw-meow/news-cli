import { Link } from 'react-router-dom';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { GlowCard } from '../components/ui/GlowCard';
import { SparklesIcon } from '../components/ui/Icon';
import { useI18n } from '../i18n/I18nProvider';
import { skills } from '../data/skills';

export function SkillsPage() {
  const { t, lang } = useI18n();

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">{t.skillsPageTitle}</h1>
        <p className="text-sm text-gray-500">{t.skillsPageSubtitle}</p>
      </div>

      <div className="space-y-4">
        {skills.map((skill) => (
          <GlowCard key={skill.id} className="p-5" hover={false}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                <SparklesIcon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-200 mb-1">{lang === 'zh' ? skill.name : skill.nameEn}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{lang === 'zh' ? skill.description : skill.descriptionEn}</p>

                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">{t.skillCardInstall}</div>
                  <TerminalBlock lines={[`$ ${skill.installCommand}`]} breakAll />
                </div>

                <Link
                  to={`/skills/${skill.id}`}
                  className="inline-flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  {t.skillCardView}
                </Link>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
