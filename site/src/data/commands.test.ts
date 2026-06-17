import { describe, it, expect } from 'vitest';
import { commands } from './commands';

describe('commands data', () => {
  it('has 7 commands', () => {
    expect(commands).toHaveLength(7);
  });

  it('every command has required fields', () => {
    for (const c of commands) {
      expect(c.name).toBeTruthy();
      expect(c.group).toBeTruthy();
      expect(c.usage).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(Array.isArray(c.options)).toBe(true);
      expect(Array.isArray(c.examples)).toBe(true);
    }
  });

  it('every command name is unique', () => {
    const names = commands.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
