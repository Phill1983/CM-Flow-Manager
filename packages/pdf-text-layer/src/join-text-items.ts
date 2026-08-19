/**
 * Conservative PDF.js text-item → lines.
 * Does not infer table columns. Groups by Y, then joins by X order.
 */

export type TextItemLike = {
  readonly str?: string;
  readonly transform?: readonly number[];
  readonly height?: number;
  readonly hasEOL?: boolean;
};

const DEFAULT_Y_GAP = 2;

export function joinPdfTextItems(items: readonly TextItemLike[]): string {
  const usable = items
    .map((item) => {
      const str = item.str ?? '';
      const transform = item.transform;
      if (!str || !transform || transform.length < 6) return null;
      return {
        str,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        height: item.height ?? DEFAULT_Y_GAP,
        hasEOL: item.hasEOL === true,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  usable.sort((a, b) => {
    const yGap = Math.max(DEFAULT_Y_GAP, (a.height + b.height) / 4);
    if (Math.abs(a.y - b.y) > yGap) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let current = '';
  let lastY: number | undefined;
  let lastHeight = DEFAULT_Y_GAP;

  const flush = () => {
    const trimmed = current.replace(/[ \t]+$/g, '');
    if (trimmed.length > 0) lines.push(trimmed);
    current = '';
  };

  for (const item of usable) {
    const yGap = Math.max(DEFAULT_Y_GAP, (item.height + lastHeight) / 4);
    if (lastY !== undefined && Math.abs(item.y - lastY) > yGap) {
      flush();
    } else if (current.length > 0 && !current.endsWith(' ') && !item.str.startsWith(' ')) {
      current += ' ';
    }
    current += item.str;
    lastY = item.y;
    lastHeight = item.height;
    if (item.hasEOL) flush();
  }
  flush();
  return lines.join('\n');
}
