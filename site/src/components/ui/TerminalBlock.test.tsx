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
});
