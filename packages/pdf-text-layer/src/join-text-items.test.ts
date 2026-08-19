import { describe, expect, it } from 'vitest';
import { joinPdfTextItems } from './join-text-items.js';

describe('joinPdfTextItems', () => {
  it('groups items on the same Y into one line, left to right', () => {
    const text = joinPdfTextItems([
      { str: 'B', transform: [1, 0, 0, 1, 40, 100], height: 10 },
      { str: 'A', transform: [1, 0, 0, 1, 10, 100], height: 10 },
    ]);
    expect(text).toBe('A B');
  });

  it('starts a new line when Y changes', () => {
    const text = joinPdfTextItems([
      { str: 'top', transform: [1, 0, 0, 1, 10, 200], height: 10 },
      { str: 'bottom', transform: [1, 0, 0, 1, 10, 20], height: 10 },
    ]);
    expect(text).toBe('top\nbottom');
  });

  it('ignores marked-content items without str', () => {
    const text = joinPdfTextItems([{ type: 'beginMarkedContent' } as never, { str: 'ok', transform: [1, 0, 0, 1, 0, 0] }]);
    expect(text).toBe('ok');
  });
});
