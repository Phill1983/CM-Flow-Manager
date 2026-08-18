import { basename, dirname, extname, join, resolve } from 'node:path';

const PDF_EXTENSION = '.pdf';

export function hasPdfExtension(filePath: string): boolean {
  return extname(filePath).toLowerCase() === PDF_EXTENSION;
}

export function sanitizePathForLogs(filePath: string): string {
  return basename(filePath);
}

export function assertPdfSourcePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Source path is required');
  }
  if (!hasPdfExtension(filePath)) {
    throw new Error('Source path must end with .pdf');
  }
}

export function assertPdfDestinationPath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Destination path is required');
  }
  if (!hasPdfExtension(filePath)) {
    throw new Error('Destination path must end with .pdf');
  }
}

export function areSameResolvedPath(a: string, b: string): boolean {
  return resolve(a).toLowerCase() === resolve(b).toLowerCase();
}

/**
 * Default unlocked name: `<name>_unlocked.pdf`
 * Collisions: `_unlocked_2.pdf`, `_unlocked_3.pdf`, …
 */
export function buildUnlockedFileName(originalFileName: string, attempt = 1): string {
  const base = basename(originalFileName, extname(originalFileName));
  if (attempt <= 1) {
    return `${base}_unlocked.pdf`;
  }
  return `${base}_unlocked_${attempt}.pdf`;
}

export function buildUnlockedPath(sourcePath: string, destinationDirectory?: string): string {
  const dir = destinationDirectory ?? dirname(sourcePath);
  return join(dir, buildUnlockedFileName(basename(sourcePath)));
}

export async function resolveCollisionSafeUnlockedPath(
  sourcePath: string,
  destinationDirectory: string | undefined,
  exists: (candidate: string) => Promise<boolean>,
  maxAttempts = 1000,
): Promise<string> {
  const dir = destinationDirectory ?? dirname(sourcePath);
  return resolveCollisionSafeNamedPath(dir, (attempt) => buildUnlockedFileName(basename(sourcePath), attempt), exists, maxAttempts);
}

const INVALID_FILE_CHARS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);

/** Strip characters that are illegal in Windows file names. */
export function sanitizeFileNamePart(value: string): string {
  let cleaned = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    cleaned += code < 32 || INVALID_FILE_CHARS.has(char) ? '_' : char;
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : 'document';
}

/**
 * Split extract name: `<name>_pages_<selection>.pdf`
 * Empty / placeholder selection: `<name>_pages.pdf` (never `_pages_pages.pdf`).
 * Collisions: `_2`, `_3`, …
 */
export function buildExtractedFileName(
  originalFileName: string,
  pagesLabel: string,
  attempt = 1,
): string {
  const base = sanitizeFileNamePart(basename(originalFileName, extname(originalFileName)));
  const raw = typeof pagesLabel === 'string' ? pagesLabel.trim() : '';
  const suffix = raw.length > 0 ? sanitizeFileNamePart(raw) : '';
  const hasSelection = suffix.length > 0 && suffix !== 'pages';
  if (!hasSelection) {
    if (attempt <= 1) {
      return `${base}_pages.pdf`;
    }
    return `${base}_pages_${attempt}.pdf`;
  }
  if (attempt <= 1) {
    return `${base}_pages_${suffix}.pdf`;
  }
  return `${base}_pages_${suffix}_${attempt}.pdf`;
}

/**
 * Merge default name: `merged.pdf`
 * Collisions: `merged_2.pdf`, …
 */
export function buildMergedFileName(attempt = 1): string {
  if (attempt <= 1) {
    return 'merged.pdf';
  }
  return `merged_${attempt}.pdf`;
}

export async function resolveCollisionSafeNamedPath(
  directory: string,
  buildName: (attempt: number) => string,
  exists: (candidate: string) => Promise<boolean>,
  maxAttempts = 1000,
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = join(directory, buildName(attempt));
    if (!(await exists(candidate))) {
      return candidate;
    }
  }
  throw new Error('Unable to resolve a unique output path');
}

export async function resolveCollisionSafeExtractedPath(
  sourcePath: string,
  pagesLabel: string,
  destinationDirectory: string | undefined,
  exists: (candidate: string) => Promise<boolean>,
  maxAttempts = 1000,
): Promise<string> {
  const dir = destinationDirectory ?? dirname(sourcePath);
  return resolveCollisionSafeNamedPath(
    dir,
    (attempt) => buildExtractedFileName(basename(sourcePath), pagesLabel, attempt),
    exists,
    maxAttempts,
  );
}

export async function resolveCollisionSafeMergedPath(
  destinationDirectory: string,
  exists: (candidate: string) => Promise<boolean>,
  maxAttempts = 1000,
): Promise<string> {
  return resolveCollisionSafeNamedPath(destinationDirectory, (attempt) => buildMergedFileName(attempt), exists, maxAttempts);
}
