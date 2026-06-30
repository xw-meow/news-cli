import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceCard } from './SourceCard';
import type { SourceData } from '../../data/sources';

const mockSource: SourceData = {
  name: 'test-source',
  description: 'A test source',
  descriptionEn: 'A test source',
  type: 'JSON',
  categories: ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'],
};

describe('SourceCard', () => {
  it('renders source name and description', () => {
    render(<SourceCard source={mockSource} />);
    expect(screen.getByText('test-source')).toBeDefined();
    expect(screen.getByText('A test source')).toBeDefined();
  });

  it('renders type badge', () => {
    render(<SourceCard source={mockSource} />);
    expect(screen.getByText('JSON')).toBeDefined();
  });

  it('renders max 3 categories plus remainder', () => {
    render(<SourceCard source={mockSource} />);
    expect(screen.getByText('cat1')).toBeDefined();
    expect(screen.getByText('cat2')).toBeDefined();
    expect(screen.getByText('cat3')).toBeDefined();
    expect(screen.queryByText('cat4')).toBeNull();
    expect(screen.getByText('+2')).toBeDefined();
  });

  it('renders no category tags when categories is empty', () => {
    render(<SourceCard source={{ ...mockSource, categories: [] }} />);
    expect(screen.queryByText('cat1')).toBeNull();
  });
});
