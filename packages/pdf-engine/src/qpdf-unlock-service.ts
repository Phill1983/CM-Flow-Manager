import { existsSync } from 'node:fs';
import { access, constants, mkdir, mkdtemp, open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  areSameResolvedPath,
  assertPdfDestinationPath,
  assertPdfSourcePath,
  sanitizePathForLogs,
} from '@cm-flow-manager/file-utils';
import type {
  PdfInspectionResult,
  PdfUnlockInput,
  PdfUnlockResult,
  PdfUnlockService,
} from './types';

export type PdfEngineLogEvent = {
  level: 'info' | 'warn' | 'error';
  message: string;
  category?: string;
  durationMs?: number;
  qpdfVersion?: string;
  sourceFile?: string;
};

export type PdfEngineLogger = {
  log: (event: PdfEngineLogEvent) => void;
};

export type QpdfUnlockServiceOptions = {
  qpdfPath?: string;
  logger?: PdfEngineLogger;
  now?: () => number;
};

type RunResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

const DEFAULT_LOGGER: PdfEngineLogger = {
  log: () => {
    // no-op by default; tests inject a capturing logger
  },
};

function qpdfBinaryName(): string {
  return process.platform === 'win32' ? 'qpdf.exe' : 'qpdf';
}

/**
 * Candidate locations for the vendored qpdf binary.
 * Electron bundles this module into `apps/desktop/out/main`, so a single
 * relative path from `import.meta.url` is not enough — also try cwd roots.
 */
export function listQpdfCandidatePaths(moduleDir = fileURLToPath(new URL('.', import.meta.url))): string[] {
  const bin = qpdfBinaryName();
  const rel = join('vendor', 'qpdf', 'bin', bin);
  return [
    // packages/pdf-engine/src|dist → repo root
    resolve(moduleDir, '../../..', rel),
    // apps/desktop/out/main (electron-vite bundle) → repo root
    resolve(moduleDir, '../../../..', rel),
    // pnpm dev / scripts often start with cwd = repo root
    resolve(process.cwd(), rel),
    // pnpm --filter desktop may use cwd = apps/desktop
    resolve(process.cwd(), '../..', rel),
  ];
}

export function resolveQpdfExecutable(explicit?: string): string | null {
  if (explicit) {
    return existsSync(explicit) ? explicit : null;
  }
  if (process.env['CMFLOW_QPDF_PATH']) {
    const fromEnv = process.env['CMFLOW_QPDF_PATH'];
    return existsSync(fromEnv) ? fromEnv : null;
  }
  for (const candidate of listQpdfCandidatePaths()) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function assertReadableFile(filePath: string): Promise<'missing' | 'access' | 'ok'> {
  try {
    await access(filePath, constants.R_OK);
    const info = await stat(filePath);
    if (!info.isFile()) {
      return 'access';
    }
    return 'ok';
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return 'missing';
    }
    return 'access';
  }
}

function redactSecrets(text: string, secrets: string[]): string {
  let result = text;
  for (const secret of secrets) {
    if (!secret) continue;
    result = result.split(secret).join('[REDACTED]');
  }
  return result;
}

function mapUnlockFailure(
  exitCode: number | null,
  stderr: string,
  secrets: string[],
): PdfUnlockResult {
  const safeStderr = redactSecrets(stderr, secrets).toLowerCase();

  if (
    safeStderr.includes('invalid password') ||
    safeStderr.includes('incorrect password') ||
    safeStderr.includes('password is incorrect')
  ) {
    return { status: 'incorrect_password' };
  }
  if (safeStderr.includes('invalid pdf') || safeStderr.includes('not a pdf') || safeStderr.includes('unable to find trailer')) {
    return {
      status: 'failed',
      category: 'InvalidPdf',
      message: 'The file is not a valid PDF.',
    };
  }
  if (safeStderr.includes('unsupported') && safeStderr.includes('encrypt')) {
    return {
      status: 'failed',
      category: 'UnsupportedEncryption',
      message: 'This PDF uses unsupported encryption.',
    };
  }
  if (safeStderr.includes('permission denied') || safeStderr.includes('access is denied')) {
    return {
      status: 'failed',
      category: 'SourceFileAccess',
      message: 'The source PDF could not be read.',
    };
  }

  return {
    status: 'failed',
    category: 'PdfProcessing',
    message: `PDF processing failed${exitCode == null ? '' : ` (exit ${exitCode})`}.`,
  };
}

/** qpdf exit 0 = clean; exit 3 = completed with warnings only. */
export function isQpdfSuccessfulExit(exitCode: number | null): boolean {
  return exitCode === 0 || exitCode === 3;
}

export class QpdfUnlockService implements PdfUnlockService {
  private readonly qpdfPath: string;
  private readonly logger: PdfEngineLogger;
  private readonly now: () => number;
  private cachedVersion: string | null = null;

  constructor(options: QpdfUnlockServiceOptions = {}) {
    const resolved = resolveQpdfExecutable(options.qpdfPath);
    if (!resolved) {
      throw new Error('qpdf executable path could not be resolved');
    }
    this.qpdfPath = resolved;
    this.logger = options.logger ?? DEFAULT_LOGGER;
    this.now = options.now ?? (() => Date.now());
  }

  async getQpdfVersion(): Promise<string> {
    if (this.cachedVersion) {
      return this.cachedVersion;
    }
    const result = await this.runQpdf(['--version'], []);
    const match = result.stdout.match(/qpdf version\s+([^\r\n]+)/i);
    this.cachedVersion = match?.[1]?.trim() ?? 'unknown';
    return this.cachedVersion;
  }

  async inspect(filePath: string): Promise<PdfInspectionResult> {
    try {
      assertPdfSourcePath(filePath);
    } catch {
      return { status: 'invalid', reason: 'Path must point to a .pdf file.' };
    }

    if (!isAbsolute(filePath)) {
      return { status: 'invalid', reason: 'Source path must be absolute.' };
    }

    const readable = await assertReadableFile(filePath);
    if (readable === 'missing') {
      return { status: 'invalid', reason: 'Source file was not found.' };
    }
    if (readable === 'access') {
      return { status: 'invalid', reason: 'Source file could not be read.' };
    }

    const encryptedCheck = await this.runQpdf(['--is-encrypted', filePath], []);
    const stderr = encryptedCheck.stderr.toLowerCase();
    if (
      stderr.includes('unable to find trailer') ||
      stderr.includes('not a pdf') ||
      stderr.includes('invalid pdf') ||
      (stderr.includes('file is damaged') && stderr.includes('trailer'))
    ) {
      return {
        status: 'invalid',
        reason: 'The file could not be validated as a PDF.',
      };
    }

    if (encryptedCheck.exitCode === 0) {
      return { status: 'encrypted' };
    }
    if (encryptedCheck.exitCode === 2) {
      // Do not require `qpdf --check` success: empty/minimal PDFs may warn while still usable.
      return { status: 'unencrypted' };
    }

    return {
      status: 'invalid',
      reason: 'Unable to determine encryption status.',
    };
  }

  async unlock(input: PdfUnlockInput): Promise<PdfUnlockResult> {
    const started = this.now();
    const secrets = [input.password];
    const sourceLabel = sanitizePathForLogs(input.sourcePath);

    try {
      assertPdfSourcePath(input.sourcePath);
      assertPdfDestinationPath(input.destinationPath);
    } catch {
      return {
        status: 'failed',
        category: 'InvalidPdf',
        message: 'Source and destination must be .pdf paths.',
      };
    }

    if (!isAbsolute(input.sourcePath) || !isAbsolute(input.destinationPath)) {
      return {
        status: 'failed',
        category: 'Internal',
        message: 'Source and destination paths must be absolute.',
      };
    }

    if (areSameResolvedPath(input.sourcePath, input.destinationPath)) {
      return {
        status: 'failed',
        category: 'DestinationExists',
        message: 'Destination must differ from the source file.',
      };
    }

    const readable = await assertReadableFile(input.sourcePath);
    if (readable === 'missing') {
      return {
        status: 'failed',
        category: 'SourceFileNotFound',
        message: 'Source PDF was not found.',
      };
    }
    if (readable === 'access') {
      return {
        status: 'failed',
        category: 'SourceFileAccess',
        message: 'Source PDF could not be read.',
      };
    }

    if (await pathExists(input.destinationPath)) {
      return {
        status: 'failed',
        category: 'DestinationExists',
        message: 'Destination PDF already exists.',
      };
    }

    try {
      await mkdir(dirname(input.destinationPath), { recursive: true });
    } catch {
      return {
        status: 'failed',
        category: 'DestinationAccess',
        message: 'Destination directory is not writable.',
      };
    }

    const inspection = await this.inspect(input.sourcePath);
    if (inspection.status === 'invalid') {
      return {
        status: 'failed',
        category: 'InvalidPdf',
        message: inspection.reason,
      };
    }

    if (inspection.status === 'unencrypted') {
      // Defined Phase 2 behavior: create a verified copy without encryption step.
      try {
        const bytes = await readFile(input.sourcePath);
        await writeFile(input.destinationPath, bytes);
        const verify = await this.inspect(input.destinationPath);
        if (verify.status !== 'unencrypted') {
          await rm(input.destinationPath, { force: true });
          return {
            status: 'failed',
            category: 'PdfProcessing',
            message: 'Failed to verify unencrypted output copy.',
          };
        }
        const version = await this.getQpdfVersion();
        this.logger.log({
          level: 'info',
          message: 'PDF already unencrypted; verified copy written',
          category: 'AlreadyUnencrypted',
          durationMs: this.now() - started,
          qpdfVersion: version,
          sourceFile: sourceLabel,
        });
        return { status: 'unlocked', destinationPath: input.destinationPath };
      } catch {
        return {
          status: 'failed',
          category: 'DestinationAccess',
          message: 'Could not write destination PDF.',
        };
      }
    }

    const passwordFile = await this.writePasswordFile(input.password);
    try {
      const version = await this.getQpdfVersion();
      this.logger.log({
        level: 'info',
        message: 'PDF unlock started',
        qpdfVersion: version,
        sourceFile: sourceLabel,
      });

      const result = await this.runQpdf(
        [
          `--password-file=${passwordFile}`,
          '--decrypt',
          input.sourcePath,
          input.destinationPath,
        ],
        secrets,
      );

      // qpdf: 0 = clean success, 3 = success with warnings (e.g. invalid /ID in trailer).
      const completedWithWarnings = result.exitCode === 3;
      const failed = !isQpdfSuccessfulExit(result.exitCode);

      if (failed) {
        if (await pathExists(input.destinationPath)) {
          await rm(input.destinationPath, { force: true });
        }
        const mapped = mapUnlockFailure(result.exitCode, result.stderr, secrets);
        this.logger.log({
          level: 'warn',
          message: 'PDF unlock failed',
          category:
            mapped.status === 'incorrect_password'
              ? 'IncorrectPassword'
              : mapped.status === 'failed'
                ? mapped.category
                : 'PdfProcessing',
          durationMs: this.now() - started,
          qpdfVersion: version,
          sourceFile: sourceLabel,
        });
        return mapped;
      }

      if (!(await pathExists(input.destinationPath))) {
        return {
          status: 'failed',
          category: 'PdfProcessing',
          message:
            completedWithWarnings
              ? 'Unlock reported warnings but produced no output file.'
              : 'Unlock produced no output file.',
        };
      }

      const outStat = await stat(input.destinationPath);
      if (!outStat.isFile() || outStat.size <= 0) {
        await rm(input.destinationPath, { force: true });
        return {
          status: 'failed',
          category: 'PdfProcessing',
          message: 'Unlock produced an empty output file.',
        };
      }

      const outInspect = await this.inspect(input.destinationPath);
      if (outInspect.status !== 'unencrypted') {
        await rm(input.destinationPath, { force: true });
        return {
          status: 'failed',
          category: 'PdfProcessing',
          message: 'Output PDF is still encrypted or invalid.',
        };
      }

      this.logger.log({
        level: 'info',
        message: completedWithWarnings
          ? 'PDF unlock completed with warnings'
          : 'PDF unlock completed',
        category: 'Unlocked',
        durationMs: this.now() - started,
        qpdfVersion: version,
        sourceFile: sourceLabel,
      });

      return { status: 'unlocked', destinationPath: input.destinationPath };
    } catch (error) {
      if (await pathExists(input.destinationPath)) {
        await rm(input.destinationPath, { force: true });
      }
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      const safeMessage = redactSecrets(message, secrets);
      this.logger.log({
        level: 'error',
        message: 'PDF unlock crashed',
        category: 'Internal',
        durationMs: this.now() - started,
        sourceFile: sourceLabel,
      });
      return {
        status: 'failed',
        category: 'Internal',
        message: safeMessage,
      };
    } finally {
      await rm(passwordFile, { force: true });
      await rm(dirname(passwordFile), { recursive: true, force: true });
    }
  }

  private async writePasswordFile(password: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'cmflow-qpdf-'));
    const filePath = join(dir, 'password.txt');
    // Prefer exclusive create; restrict as much as Node allows on Windows.
    const handle = await open(filePath, 'wx', 0o600);
    try {
      await handle.writeFile(`${password}\n`, { encoding: 'utf8' });
    } finally {
      await handle.close();
    }
    return filePath;
  }

  private runQpdf(args: string[], secrets: string[]): Promise<RunResult> {
    return new Promise((resolvePromise, reject) => {
      // Never use shell. Password is passed via --password-file, not argv plaintext when possible.
      const child = spawn(this.qpdfPath, args, {
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          // Avoid leaking locale-specific noise; keep PATH for DLL resolution beside qpdf.exe
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });
      child.on('error', (error) => {
        reject(error);
      });
      child.on('close', (exitCode) => {
        resolvePromise({
          exitCode,
          stdout: redactSecrets(stdout, secrets),
          stderr: redactSecrets(stderr, secrets),
        });
      });
    });
  }
}
