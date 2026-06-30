import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerminalBlock } from './TerminalBlock';

describe('TerminalBlock', () => {
  it('renders all lines', () => {
    render(<TerminalBlock lines={['$ hello', '# comment', '  output']} />);
    // $ prompt is rendered in its own green span
    expect(screen.getByText('$')).toBeDefined();
    // text after $ is in a separate span (testing-library normalizes whitespace, so match 'hello')
    expect(screen.getByText('hello')).toBeDefined();
    // comment line rendered as-is
    expect(screen.getByText('# comment')).toBeDefined();
    // plain output line (whitespace-normalized)
    expect(screen.getByText('output')).toBeDefined();
  });

  it('renders dots by default', () => {
    const { container } = render(<TerminalBlock lines={['$ test']} />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('hides dots when showDots is false', () => {
    const { container } = render(<TerminalBlock lines={['$ test']} showDots={false} />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(0);
  });

  it('hides prompt when showPrompt is false', () => {
    const { container } = render(<TerminalBlock lines={['$ test', 'output']} showPrompt={false} />);
    // The green $ prompt span should not exist
    expect(container.querySelector('.text-green-400')).toBeNull();
  });

  it('renders table when table prop is provided', () => {
    render(<TerminalBlock
      lines={['$ news get weibo -l 3']}
      table={{
        headers: ['#', 'Title', 'Source'],
        rows: [
          ['1', '微博热搜标题', '微博热搜'],
          ['2', '另一条新闻', '微博热搜'],
        ],
      }}
    />);
    expect(screen.getByText('#')).toBeDefined();
    expect(screen.getByText('Title')).toBeDefined();
    expect(screen.getByText('Source')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('微博热搜标题')).toBeDefined();
    expect(screen.getByText('另一条新闻')).toBeDefined();
  });

  it('renders without lines (table-only)', () => {
    render(<TerminalBlock
      table={{
        headers: ['Name'],
        rows: [['test']],
      }}
    />);
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('test')).toBeDefined();
  });
});
