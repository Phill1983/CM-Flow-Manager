/**
 * Locale-agnostic byte formatting for file size display.
 * UI may still localize surrounding labels.
 */
export function formatFileSizeBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const kib = bytes / 1024;
  if (kib < 1024) {
    const value = kib < 10 && !Number.isInteger(kib) ? kib.toFixed(1) : String(Math.round(kib));
    return `${value} KB`;
  }
  const mib = kib / 1024;
  const value = mib < 10 && !Number.isInteger(mib) ? mib.toFixed(1) : String(Math.round(mib));
  return `${value} MB`;
}
