import { access, constants, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute } from 'node:path';
import { shell } from 'electron';
import type {
  PdfPrepareExtractSourceResult,
  PdfPrepareMergeFileResult,
  PdfPrepareSourceResult,
  ShellOpenFolderResult,
} from '@cm-flow-manager/ipc-contracts';
import type { PdfEngineService } from '@cm-flow-manager/pdf-engine';
import { formatPagesForFileName, parsePageRange } from '@cm-flow-manager/pdf-engine';
import {
  hasPdfExtension,
  resolveCollisionSafeExtractedPath,
  resolveCollisionSafeMergedPath,
  resolveCollisionSafeUnlockedPath,
} from '@cm-flow-manager/file-utils';

export function isSafePdfAbsolutePath(filePath: unknown): filePath is string {
  return typeof filePath === 'string' && isAbsolute(filePath) && hasPdfExtension(filePath);
}

export function isSafeAbsolutePath(filePath: unknown): filePath is string {
  return typeof filePath === 'string' && filePath.length > 0 && isAbsolute(filePath);
}

export async function pathExists(candidate: string): Promise<boolean> {
  try {
    await access(candidate, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function preparePdfSource(
  filePath: string,
  pdfUnlockService: PdfEngineService,
): Promise<PdfPrepareSourceResult> {
  if (!isSafePdfAbsolutePath(filePath)) {
    return { ok: false, code: 'bad_path' };
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return { ok: false, code: 'not_found' };
    }

    const inspection = await pdfUnlockService.inspect(filePath);
    if (inspection.status === 'invalid') {
      return { ok: false, code: 'invalid_pdf' };
    }
    if (inspection.status === 'unavailable') {
      return { ok: false, code: 'unavailable' };
    }

    let suggestedDestinationPath: string;
    try {
      suggestedDestinationPath = await resolveCollisionSafeUnlockedPath(
        filePath,
        undefined,
        pathExists,
      );
    } catch {
      return { ok: false, code: 'destination_error' };
    }

    return {
      ok: true,
      filePath,
      fileName: basename(filePath),
      fileSizeBytes: fileStat.size,
      sourceDirectory: dirname(filePath),
      suggestedDestinationPath,
      encryptionStatus: inspection.status,
      pageCount: inspection.pageCount,
    };
  } catch {
    return { ok: false, code: 'not_found' };
  }
}

export async function prepareExtractSource(
  filePath: string,
  pdfService: PdfEngineService,
  pageSelection?: string,
  destinationDirectory?: string,
): Promise<PdfPrepareExtractSourceResult> {
  if (!isSafePdfAbsolutePath(filePath)) {
    return { ok: false, code: 'bad_path' };
  }
  if (destinationDirectory !== undefined && !isSafeAbsolutePath(destinationDirectory)) {
    return { ok: false, code: 'bad_path' };
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return { ok: false, code: 'not_found' };
    }

    const inspection = await pdfService.inspect(filePath);
    if (inspection.status === 'invalid') {
      return { ok: false, code: 'invalid_pdf' };
    }
    if (inspection.status === 'unavailable') {
      return { ok: false, code: 'unavailable' };
    }

    let pagesLabel = 'pages';
    if (typeof pageSelection === 'string' && pageSelection.trim().length > 0 && inspection.pageCount) {
      const parsed = parsePageRange(pageSelection, inspection.pageCount);
      if (parsed.ok) {
        pagesLabel = formatPagesForFileName(parsed.pages);
      }
    }

    let suggestedDestinationPath: string;
    try {
      suggestedDestinationPath = await resolveCollisionSafeExtractedPath(
        filePath,
        pagesLabel,
        destinationDirectory,
        pathExists,
      );
    } catch {
      return { ok: false, code: 'destination_error' };
    }

    return {
      ok: true,
      filePath,
      fileName: basename(filePath),
      fileSizeBytes: fileStat.size,
      sourceDirectory: dirname(filePath),
      suggestedDestinationPath,
      encryptionStatus: inspection.status,
      pageCount: inspection.pageCount,
    };
  } catch {
    return { ok: false, code: 'not_found' };
  }
}

export async function prepareMergeFile(
  filePath: string,
  pdfService: PdfEngineService,
): Promise<PdfPrepareMergeFileResult> {
  if (!isSafePdfAbsolutePath(filePath)) {
    return { ok: false, code: 'bad_path', fileName: typeof filePath === 'string' ? basename(filePath) : undefined };
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return { ok: false, code: 'not_found', fileName: basename(filePath) };
    }

    const inspection = await pdfService.inspect(filePath);
    const fileName = basename(filePath);
    if (inspection.status === 'invalid') {
      return { ok: false, code: 'invalid_pdf', fileName };
    }
    if (inspection.status === 'unavailable') {
      return { ok: false, code: 'unavailable', fileName };
    }
    if (inspection.status === 'encrypted') {
      return { ok: false, code: 'encrypted_pdf', fileName };
    }
    if (!inspection.pageCount || inspection.pageCount < 1) {
      return { ok: false, code: 'invalid_pdf', fileName };
    }

    let suggestedDestinationPath: string;
    try {
      suggestedDestinationPath = await resolveCollisionSafeMergedPath(dirname(filePath), pathExists);
    } catch {
      return { ok: false, code: 'destination_error', fileName };
    }

    return {
      ok: true,
      filePath,
      fileName,
      fileSizeBytes: fileStat.size,
      sourceDirectory: dirname(filePath),
      suggestedDestinationPath,
      encryptionStatus: inspection.status,
      pageCount: inspection.pageCount,
    };
  } catch {
    return { ok: false, code: 'not_found', fileName: basename(filePath) };
  }
}

/**
 * Opens only a validated existing folder (or the parent folder of an existing file).
 * No arbitrary shell execution.
 */
export async function openValidatedFolder(targetPath: string): Promise<ShellOpenFolderResult> {
  if (!isSafeAbsolutePath(targetPath)) {
    return { ok: false, code: 'invalid_path' };
  }

  try {
    const targetStat = await stat(targetPath);
    const folderPath = targetStat.isDirectory() ? targetPath : dirname(targetPath);
    const folderStat = await stat(folderPath);
    if (!folderStat.isDirectory()) {
      return { ok: false, code: 'not_found' };
    }

    const openError = await shell.openPath(folderPath);
    if (openError) {
      return { ok: false, code: 'open_failed' };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: 'not_found' };
  }
}
