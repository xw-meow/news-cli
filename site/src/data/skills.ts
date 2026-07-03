export interface SkillData {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  installCommand: string;
  githubUrl: string;
}

export const skills: SkillData[] = [
  {
    id: 'professional-daily-report',
    name: 'professional-daily-report',
    nameEn: 'professional-daily-report',
    description: '让 AI 自动生成博客 / Newsletter 风格的日报，支持 Markdown 或 HTML 大字报输出。',
    descriptionEn: 'Let AI auto-generate blog / newsletter-style daily reports in Markdown or HTML poster format.',
    installCommand: 'curl -LO https://raw.githubusercontent.com/xw-meow/news-cli/main/skills/professional-daily-report.zip',
    githubUrl: 'https://github.com/xw-meow/news-cli/blob/main/skills/professional-daily-report/SKILL.md',
  },
];
