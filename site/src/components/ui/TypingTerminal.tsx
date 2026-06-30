import { useEffect, useState } from 'react';
import { TerminalBlock } from './TerminalBlock';

interface CommandDemo {
  input: string;
  outputLines: string[];
}

const demos: CommandDemo[] = [
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

export function TypingTerminal() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'erasing'>('typing');

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
  }, [phase, typed, current, demoIndex]);

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
