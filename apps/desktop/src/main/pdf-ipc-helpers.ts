import { access, constants, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute } from 'node:path';
import { shell } from 'electron';
import type { PdfPrepareSourceResult, ShellOpenFolderResult } from '@cm-flow-manager/ipc-contracts';
import type { PdfUnlockService } from '@cm-flow-manager/pdf-engine';
import { hasPdfExtension, resolveCollisionSafeUnlockedPath } from '@cm-flow-manager/file-utils';

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
  pdfUnlockService: PdfUnlockService,
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
