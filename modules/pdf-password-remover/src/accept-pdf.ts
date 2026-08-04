/**
 * Pure helpers for Phase 3A single-PDF acceptance (no Node FS).
 */

export function hasPdfFileName(fileName: string): boolean {
  return /\.pdf$/i.test(fileName.trim());
}

export type DroppedFileLike = {
  name: string;
  type?: string;
};

export type PdfAcceptance =
  | { accepted: true }
  | { accepted: false; reason: 'unsupported_type' | 'multiple_files' | 'empty' };

export function acceptSinglePdfDrop(files: DroppedFileLike[]): PdfAcceptance {
  if (files.length === 0) {
    return { accepted: false, reason: 'empty' };
  }
  if (files.length > 1) {
    return { accepted: false, reason: 'multiple_files' };
  }
  const file = files[0];
  if (!file || !hasPdfFileName(file.name)) {
    return { accepted: false, reason: 'unsupported_type' };
  }
  return { accepted: true };
}
