export function hasPdfFileName(fileName: string): boolean {
  return /\.pdf$/i.test(fileName.trim());
}

export type DroppedFileLike = {
  name: string;
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

export type MergePdfAcceptance =
  | { accepted: true; files: DroppedFileLike[] }
  | { accepted: false; reason: 'unsupported_type' | 'empty' };

export function acceptMergePdfDrop(files: DroppedFileLike[]): MergePdfAcceptance {
  if (files.length === 0) {
    return { accepted: false, reason: 'empty' };
  }
  const pdfs = files.filter((file) => hasPdfFileName(file.name));
  if (pdfs.length === 0) {
    return { accepted: false, reason: 'unsupported_type' };
  }
  if (pdfs.length !== files.length) {
    return { accepted: false, reason: 'unsupported_type' };
  }
  return { accepted: true, files: pdfs };
}

export function isSameFilePath(a: string, b: string): boolean {
  return a.replace(/\\/g, '/').toLowerCase() === b.replace(/\\/g, '/').toLowerCase();
}
