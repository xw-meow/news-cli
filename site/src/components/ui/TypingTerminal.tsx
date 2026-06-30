import { useEffect, useState } from 'react';
import { TerminalBlock } from './TerminalBlock';
import { useI18n } from '../../i18n/I18nProvider';

interface CommandDemo {
  input: string;
  outputLines: string[];
}

const demosZh: CommandDemo[] = [
  {
    input: 'news list',
    outputLines: [
      '  google-news   weibo         cls        ithome',
      '  pengpai       chinanews     sspai      aibase',
      '  tencent-news  36kr          people-cn  huxiu',
      '  yicai         autohome      bbc        hackernews',
      '  ---',
      '  当前已收录 17 个新闻源',
    ],
  },
  {
    input: 'news get hackernews -c ask -l 3',
    outputLines: [
      '  #  Ask HN: 如何优雅地设计 CLI 工具？',
      '  #  Ask HN: 你们是怎么做 RSS 解析测试的？',
      '  #  Ask HN: 2026 年最值得学的技术栈？',
    ],
  },
  {
    input: 'news get weibo -l 3 --json | jq \'.[].title\'',
    outputLines: [
      '  "阿根廷球迷今天全体计划有变"',
      '  "豆包每天收入不足百万"',
      '  "文化中国行看端午仪式感"',
    ],
  },
];

const demosEn: CommandDemo[] = [
  {
    input: 'news list',
    outputLines: [
      '  google-news   weibo         cls        ithome',
      '  pengpai       chinanews     sspai      aibase',
      '  tencent-news  36kr          people-cn  huxiu',
      '  yicai         autohome      bbc        hackernews',
      '  ---',
      '  17 sources available',
    ],
  },
  {
    input: 'news get hackernews -c ask -l 3',
    outputLines: [
      '  #  Ask HN: How do you design a clean CLI tool?',
      '  #  Ask HN: How do you test RSS parsers?',
      '  #  Ask HN: Best tech stack to learn in 2026?',
    ],
  },
  {
    input: 'news get weibo -l 3 --json | jq \'.[].title\'',
    outputLines: [
      '  "Argentina fans change plans today"',
      '  "Doubao daily revenue under 10M"',
      '  "Cultural China Dragon Boat rituals"',
    ],
  },
];

export function TypingTerminal() {
  const { lang } = useI18n();
  const [demoIndex, setDemoIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'erasing'>('typing');

  const demos = lang === 'en' ? demosEn : demosZh;
  const current = demos[demoIndex]!;

  useEffect(() => {
    if (phase === 'typing') {
      if (typed.length < current.input.length) {
        const t = setTimeout(() => setTyped(current.input.slice(0, typed.length + 1)), 60);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setShowOutput(true);
        setPhase('waiting');
      }, 400);
      return () => clearTimeout(t);
    }

    if (phase === 'waiting') {
      const t = setTimeout(() => {
        setShowOutput(false);
        setPhase('erasing');
      }, 2800);
      return () => clearTimeout(t);
    }

    if (phase === 'erasing') {
      if (typed.length > 0) {
        const t = setTimeout(() => setTyped(current.input.slice(0, typed.length - 1)), 30);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setDemoIndex((i) => (i + 1) % demos.length);
        setPhase('typing');
      }, 200);
      return () => clearTimeout(t);
    }
  }, [phase, typed, current, demoIndex, demos]);

  return (
    <TerminalBlock
      lines={[
        `$ ${typed}${phase === 'typing' ? '▋' : ''}`,
        ...(showOutput ? current.outputLines : []),
      ]}
      showDots
      showPrompt={false}
    />
  );
}
