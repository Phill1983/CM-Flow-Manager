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
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = join(dir, buildUnlockedFileName(basename(sourcePath), attempt));
    if (!(await exists(candidate))) {
      return candidate;
    }
  }
  throw new Error('Unable to resolve a unique unlocked output path');
}
