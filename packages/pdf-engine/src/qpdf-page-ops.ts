import { randomUUID } from 'node:crypto';
import { access, constants, mkdir, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';
import {
  areSameResolvedPath,
  assertPdfDestinationPath,
  assertPdfSourcePath,
  sanitizePathForLogs,
} from '@cm-flow-manager/file-utils';
import { parsePageRange } from './page-range';
import type {
  PdfExtractPagesInput,
  PdfExtractPagesResult,
  PdfInspectionResult,
  PdfMergeInput,
  PdfMergeResult,
  PdfToolFailureCategory,
} from './types';

export type QpdfExecResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export type QpdfPageOpsLogger = {
  log: (event: {
    level: 'info' | 'warn' | 'error';
    message: string;
    category?: string;
    durationMs?: number;
    sourceFile?: string;
  }) => void;
};

export type QpdfPageOpsDeps = {
  inspect: (filePath: string) => Promise<PdfInspectionResult>;
  exec: (args: string[]) => Promise<QpdfExecResult>;
  now: () => number;
  logger: QpdfPageOpsLogger;
};

function isSuccessfulExit(exitCode: number | null): boolean {
  return exitCode === 0 || exitCode === 3;
}

type ToolFailure = {
  status: 'failed';
  category: PdfToolFailureCategory;
  message: string;
  fileName?: string;
};

const SAFE_PAGES_SPEC = /^\d+(,\d+)*$/;
const ALL_PAGES_SPEC = '1-z';

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function fail(category: PdfToolFailureCategory, message: string, fileName?: string): ToolFailure {
  return fileName ? { status: 'failed', category, message, fileName } : { status: 'failed', category, message };
}

function mapRangeCode(code: string): PdfToolFailureCategory {
  if (code === 'page_out_of_bounds') return 'PageOutOfBounds';
  return 'InvalidPageRange';
}

function mapQpdfStderr(stderr: string): PdfToolFailureCategory {
  const text = stderr.toLowerCase();
  if (text.includes('invalid pdf') || text.includes('not a pdf') || text.includes('unable to find trailer')) {
    return 'InvalidPdf';
  }
  if (text.includes('invalid password') || text.includes('password required') || text.includes('encrypted')) {
    return 'EncryptedPdf';
  }
  if (text.includes('permission denied') || text.includes('access is denied')) {
    return 'SourceFileAccess';
  }
  return 'PdfProcessing';
}

async function validateDestination(destinationPath: string, sourcePaths: readonly string[]): Promise<
  | { ok: true }
  | { ok: false; result: ToolFailure }
> {
  try {
    assertPdfDestinationPath(destinationPath);
  } catch {
    return { ok: false, result: fail('InvalidPdf', 'Destination must be a .pdf path.') };
  }
  if (!isAbsolute(destinationPath)) {
    return { ok: false, result: fail('Internal', 'Destination path must be absolute.') };
  }
  for (const sourcePath of sourcePaths) {
    if (areSameResolvedPath(sourcePath, destinationPath)) {
      return { ok: false, result: fail('DestinationExists', 'Destination must differ from every source file.') };
    }
  }
  if (await pathExists(destinationPath)) {
    return { ok: false, result: fail('DestinationExists', 'Destination PDF already exists.') };
  }
  try {
    await mkdir(dirname(destinationPath), { recursive: true });
  } catch {
    return { ok: false, result: fail('DestinationAccess', 'Destination directory is not writable.') };
  }
  return { ok: true };
}

async function writeViaSiblingTemp(
  destinationPath: string,
  write: (tempPath: string) => Promise<{ ok: true } | { ok: false; result: ToolFailure }>,
): Promise<{ ok: true; tempPath: string } | { ok: false; result: ToolFailure }> {
  const tempPath = join(dirname(destinationPath), `.cmflow-${randomUUID()}.pdf`);
  try {
    const written = await write(tempPath);
    if (!written.ok) {
      if (await pathExists(tempPath)) {
        await rm(tempPath, { force: true });
      }
      return written;
    }
    if (!(await pathExists(tempPath))) {
      return { ok: false, result: fail('PdfProcessing', 'Processing produced no output file.') };
    }
    const info = await stat(tempPath);
    if (!info.isFile() || info.size <= 0) {
      await rm(tempPath, { force: true });
      return { ok: false, result: fail('PdfProcessing', 'Processing produced an empty output file.') };
    }
    return { ok: true, tempPath };
  } catch {
    if (await pathExists(tempPath)) {
      await rm(tempPath, { force: true });
    }
    return { ok: false, result: fail('DestinationAccess', 'Could not write temporary output.') };
  }
}

async function promoteTemp(tempPath: string, destinationPath: string): Promise<ToolFailure | { status: 'ok' }> {
  try {
    if (await pathExists(destinationPath)) {
      await rm(tempPath, { force: true });
      return fail('DestinationExists', 'Destination PDF already exists.');
    }
    await rename(tempPath, destinationPath);
    return { status: 'ok' };
  } catch {
    if (await pathExists(tempPath)) {
      await rm(tempPath, { force: true });
    }
    if (await pathExists(destinationPath)) {
      await rm(destinationPath, { force: true });
    }
    return fail('DestinationAccess', 'Could not write destination PDF.');
  }
}

async function inspectForTool(
  deps: QpdfPageOpsDeps,
  filePath: string,
): Promise<
  | { ok: true; pageCount: number; fileName: string }
  | { ok: false; result: ToolFailure }
> {
  try {
    assertPdfSourcePath(filePath);
  } catch {
    return { ok: false, result: fail('InvalidPdf', 'Source path must point to a .pdf file.', basename(filePath)) };
  }
  if (!isAbsolute(filePath)) {
    return { ok: false, result: fail('Internal', 'Source path must be absolute.', basename(filePath)) };
  }

  try {
    await access(filePath, constants.R_OK);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const fileName = basename(filePath);
    if (code === 'ENOENT') {
      return { ok: false, result: fail('SourceFileNotFound', 'Source PDF was not found.', fileName) };
    }
    return { ok: false, result: fail('SourceFileAccess', 'Source PDF could not be read.', fileName) };
  }

  const inspection = await deps.inspect(filePath);
  const fileName = basename(filePath);
  if (inspection.status === 'unavailable') {
    return { ok: false, result: fail('EngineUnavailable', inspection.reason, fileName) };
  }
  if (inspection.status === 'invalid') {
    return { ok: false, result: fail('InvalidPdf', inspection.reason, fileName) };
  }
  if (inspection.status === 'encrypted') {
    return { ok: false, result: fail('EncryptedPdf', 'This PDF is password-protected.', fileName) };
  }

  let pageCount = inspection.pageCount;
  if (pageCount === undefined) {
    const shown = await deps.exec(['--show-npages', filePath]);
    if (!isSuccessfulExit(shown.exitCode)) {
      return { ok: false, result: fail('InvalidPdf', 'Unable to determine page count.', fileName) };
    }
    pageCount = Number.parseInt(shown.stdout.trim(), 10);
  }
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return { ok: false, result: fail('InvalidPdf', 'The PDF has no extractable pages.', fileName) };
  }
  return { ok: true, pageCount, fileName };
}

export async function extractPdfPages(
  deps: QpdfPageOpsDeps,
  input: PdfExtractPagesInput,
): Promise<PdfExtractPagesResult> {
  const started = deps.now();
  const sourceLabel = sanitizePathForLogs(input.sourcePath);

  const inspected = await inspectForTool(deps, input.sourcePath);
  if (!inspected.ok) {
    return inspected.result;
  }

  const parsed = parsePageRange(input.pageSelection, inspected.pageCount);
  if (!parsed.ok) {
    return fail(mapRangeCode(parsed.code), parsed.message);
  }
  if (!SAFE_PAGES_SPEC.test(parsed.qpdfPagesSpec)) {
    return fail('Internal', 'Page specification failed safety checks.');
  }

  const destCheck = await validateDestination(input.destinationPath, [input.sourcePath]);
  if (!destCheck.ok) {
    return destCheck.result;
  }

  const written = await writeViaSiblingTemp(input.destinationPath, async (tempPath) => {
    const result = await deps.exec([
      '--empty',
      '--pages',
      input.sourcePath,
      parsed.qpdfPagesSpec,
      '--',
      tempPath,
    ]);
    if (!isSuccessfulExit(result.exitCode)) {
      return { ok: false, result: fail(mapQpdfStderr(result.stderr), 'PDF page extraction failed.') };
    }
    return { ok: true };
  });
  if (!written.ok) {
    return written.result;
  }

  const verify = await deps.inspect(written.tempPath);
  if (verify.status !== 'unencrypted') {
    await rm(written.tempPath, { force: true });
    return fail('PdfProcessing', 'Extracted PDF could not be verified.');
  }
  const outPages = verify.pageCount ?? parsed.pages.length;
  if (verify.pageCount !== undefined && verify.pageCount !== parsed.pages.length) {
    await rm(written.tempPath, { force: true });
    return fail('PdfProcessing', 'Extracted PDF page count did not match the selection.');
  }

  const promoted = await promoteTemp(written.tempPath, input.destinationPath);
  if (promoted.status !== 'ok') {
    return promoted;
  }

  deps.logger.log({
    level: 'info',
    message: 'PDF page extraction completed',
    category: 'Extracted',
    durationMs: deps.now() - started,
    sourceFile: sourceLabel,
  });

  return {
    status: 'extracted',
    destinationPath: input.destinationPath,
    pageCount: outPages,
  };
}

export async function mergePdfFiles(deps: QpdfPageOpsDeps, input: PdfMergeInput): Promise<PdfMergeResult> {
  const started = deps.now();
  const sourcePaths = [...input.sourcePaths];

  if (sourcePaths.length < 2) {
    return fail('NotEnoughFiles', 'Merge requires at least two PDF files.');
  }

  for (const sourcePath of sourcePaths) {
    try {
      assertPdfSourcePath(sourcePath);
    } catch {
      return fail('InvalidPdf', 'Every source path must point to a .pdf file.', basename(sourcePath));
    }
    if (!isAbsolute(sourcePath)) {
      return fail('Internal', 'Source paths must be absolute.', basename(sourcePath));
    }
  }

  for (let i = 0; i < sourcePaths.length; i += 1) {
    const current = sourcePaths[i];
    if (!current) continue;
    for (let j = i + 1; j < sourcePaths.length; j += 1) {
      const other = sourcePaths[j];
      if (other && areSameResolvedPath(current, other)) {
        return fail('DuplicateFile', 'The same PDF cannot be included twice.', basename(current));
      }
    }
  }

  const destCheck = await validateDestination(input.destinationPath, sourcePaths);
  if (!destCheck.ok) {
    return destCheck.result;
  }

  let expectedPages = 0;
  for (const sourcePath of sourcePaths) {
    const inspected = await inspectForTool(deps, sourcePath);
    if (!inspected.ok) {
      return inspected.result;
    }
    expectedPages += inspected.pageCount;
  }

  const pageArgs: string[] = [];
  for (const sourcePath of sourcePaths) {
    pageArgs.push(sourcePath, ALL_PAGES_SPEC);
  }

  const written = await writeViaSiblingTemp(input.destinationPath, async (tempPath) => {
    const result = await deps.exec(['--empty', '--pages', ...pageArgs, '--', tempPath]);
    if (!isSuccessfulExit(result.exitCode)) {
      return { ok: false, result: fail(mapQpdfStderr(result.stderr), 'PDF merge failed.') };
    }
    return { ok: true };
  });
  if (!written.ok) {
    return written.result;
  }

  const verify = await deps.inspect(written.tempPath);
  if (verify.status !== 'unencrypted') {
    await rm(written.tempPath, { force: true });
    return fail('PdfProcessing', 'Merged PDF could not be verified.');
  }
  if (verify.pageCount !== undefined && verify.pageCount !== expectedPages) {
    await rm(written.tempPath, { force: true });
    return fail('PdfProcessing', 'Merged PDF page count did not match the inputs.');
  }

  const promoted = await promoteTemp(written.tempPath, input.destinationPath);
  if (promoted.status !== 'ok') {
    return promoted;
  }

  deps.logger.log({
    level: 'info',
    message: 'PDF merge completed',
    category: 'Merged',
    durationMs: deps.now() - started,
    sourceFile: sanitizePathForLogs(sourcePaths[0] ?? input.destinationPath),
  });

  return {
    status: 'merged',
    destinationPath: input.destinationPath,
    pageCount: verify.pageCount ?? expectedPages,
  };
}
