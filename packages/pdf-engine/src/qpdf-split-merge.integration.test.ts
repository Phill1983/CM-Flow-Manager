import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { QpdfUnlockService, resolveQpdfExecutable } from './qpdf-unlock-service';

const FIXTURES = fileURLToPath(new URL('../fixtures', import.meta.url));

function qpdfAvailable(): boolean {
  const path = resolveQpdfExecutable();
  return Boolean(path && existsSync(path));
}

const describeQpdf = qpdfAvailable() ? describe : describe.skip;

function buildMinimalOnePagePdf(marker: string, mediaBox: readonly [number, number] = [612, 792]): Buffer {
  const stream = `% ${marker.replace(/[^\w.-]/g, '_')}\n`;
  const [width, height] = mediaBox;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << >> /Contents 4 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream\nendobj\n`,
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += object;
  }
  const xrefStart = Buffer.byteLength(body, 'latin1');
  let xref = 'xref\n0 5\n0000000000 65535 f \n';
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body + xref + trailer, 'latin1');
}

function firstPageMediaBox(filePath: string): number[] | undefined {
  const qpdf = resolveQpdfExecutable();
  if (!qpdf) return undefined;
  const result = spawnSync(qpdf, ['--json', filePath], { encoding: 'utf8', shell: false, windowsHide: true });
  if (result.status !== 0 && result.status !== 3) return undefined;
  const match = /"\/MediaBox"\s*:\s*\[([^\]]+)\]/.exec(result.stdout);
  if (!match?.[1]) return undefined;
  const box = match[1].split(',').map((part) => Number(part.trim()));
  return box.length === 4 && box.every((value) => Number.isFinite(value)) ? box : undefined;
}

async function sha256(filePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

describeQpdf('QpdfUnlockService split/merge', () => {
  let service: QpdfUnlockService;
  let workRoot: string;
  let pageA: string;
  let pageB: string;
  let pageC: string;
  let threePage: string;

  beforeAll(async () => {
    service = new QpdfUnlockService();
    workRoot = await mkdtemp(join(tmpdir(), 'cmflow-pdf-sm-'));
    pageA = join(workRoot, 'page-a.pdf');
    pageB = join(workRoot, 'page-b.pdf');
    pageC = join(workRoot, 'page-c.pdf');
    threePage = join(workRoot, 'three.pdf');
    await writeFile(pageA, buildMinimalOnePagePdf('CMFLOW-PAGE-A', [612, 792]));
    await writeFile(pageB, buildMinimalOnePagePdf('CMFLOW-PAGE-B', [300, 300]));
    await writeFile(pageC, buildMinimalOnePagePdf('CMFLOW-PAGE-C', [200, 500]));
    const mergedAbc = await service.mergePdfs({
      sourcePaths: [pageA, pageB, pageC],
      destinationPath: threePage,
    });
    if (mergedAbc.status !== 'merged') {
      throw new Error(`Failed to seed three-page fixture: ${JSON.stringify(mergedAbc)}`);
    }
  });

  afterAll(async () => {
    await rm(workRoot, { recursive: true, force: true });
  });

  it('inspect reports page counts for unencrypted PDFs', async () => {
    const one = await service.inspect(pageA);
    expect(one).toEqual({ status: 'unencrypted', pageCount: 1 });
    const three = await service.inspect(threePage);
    expect(three).toEqual({ status: 'unencrypted', pageCount: 3 });
  });

  it('extracts a single first page and preserves the source', async () => {
    const before = await sha256(threePage);
    const destination = join(workRoot, 'first.pdf');
    const result = await service.extractPages({
      sourcePath: threePage,
      destinationPath: destination,
      pageSelection: '1',
    });
    expect(result.status).toBe('extracted');
    if (result.status !== 'extracted') return;
    expect(result.pageCount).toBe(1);
    expect(await sha256(threePage)).toBe(before);
    expect((await stat(destination)).size).toBeGreaterThan(0);
    const inspectOut = await service.inspect(destination);
    expect(inspectOut).toEqual({ status: 'unencrypted', pageCount: 1 });
  });

  it('extracts the last page and a non-contiguous selection', async () => {
    const last = await service.extractPages({
      sourcePath: threePage,
      destinationPath: join(workRoot, 'last.pdf'),
      pageSelection: '3',
    });
    expect(last.status).toBe('extracted');
    if (last.status === 'extracted') expect(last.pageCount).toBe(1);

    const mixed = await service.extractPages({
      sourcePath: threePage,
      destinationPath: join(workRoot, 'mixed.pdf'),
      pageSelection: '1,3',
    });
    expect(mixed.status).toBe('extracted');
    if (mixed.status === 'extracted') expect(mixed.pageCount).toBe(2);
  });

  it('extracts a contiguous range', async () => {
    const result = await service.extractPages({
      sourcePath: threePage,
      destinationPath: join(workRoot, 'range.pdf'),
      pageSelection: '1-2',
    });
    expect(result.status).toBe('extracted');
    if (result.status === 'extracted') expect(result.pageCount).toBe(2);
  });

  it('rejects invalid and out-of-bounds page selections without creating output', async () => {
    const invalidDest = join(workRoot, 'invalid-out.pdf');
    const invalid = await service.extractPages({
      sourcePath: threePage,
      destinationPath: invalidDest,
      pageSelection: 'abc',
    });
    expect(invalid.status).toBe('failed');
    if (invalid.status === 'failed') expect(invalid.category).toBe('InvalidPageRange');
    expect(existsSync(invalidDest)).toBe(false);

    const oobDest = join(workRoot, 'oob-out.pdf');
    const oob = await service.extractPages({
      sourcePath: threePage,
      destinationPath: oobDest,
      pageSelection: '9',
    });
    expect(oob.status).toBe('failed');
    if (oob.status === 'failed') expect(oob.category).toBe('PageOutOfBounds');
    expect(existsSync(oobDest)).toBe(false);
  });

  it('rejects encrypted split input with EncryptedPdf', async () => {
    const destination = join(workRoot, 'encrypted-split.pdf');
    const result = await service.extractPages({
      sourcePath: join(FIXTURES, 'encrypted-known-password.pdf'),
      destinationPath: destination,
      pageSelection: '1',
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('EncryptedPdf');
    }
    expect(existsSync(destination)).toBe(false);
  });

  it('merges two and three PDFs with summed page counts', async () => {
    const twoDest = join(workRoot, 'merged-two.pdf');
    const two = await service.mergePdfs({
      sourcePaths: [pageA, pageB],
      destinationPath: twoDest,
    });
    expect(two.status).toBe('merged');
    if (two.status === 'merged') expect(two.pageCount).toBe(2);

    const threeDest = join(workRoot, 'merged-three.pdf');
    const three = await service.mergePdfs({
      sourcePaths: [pageA, pageB, pageC],
      destinationPath: threeDest,
    });
    expect(three.status).toBe('merged');
    if (three.status === 'merged') expect(three.pageCount).toBe(3);
  });

  it('preserves merge order and changes when inputs are reordered', async () => {
    const baDest = join(workRoot, 'order-ba.pdf');
    const ba = await service.mergePdfs({
      sourcePaths: [pageB, pageA],
      destinationPath: baDest,
    });
    expect(ba.status).toBe('merged');

    const firstOfBa = join(workRoot, 'order-ba-p1.pdf');
    const extracted = await service.extractPages({
      sourcePath: baDest,
      destinationPath: firstOfBa,
      pageSelection: '1',
    });
    expect(extracted.status).toBe('extracted');
    expect(firstPageMediaBox(firstOfBa)).toEqual([0, 0, 300, 300]);

    const abDest = join(workRoot, 'order-ab.pdf');
    await service.mergePdfs({
      sourcePaths: [pageA, pageB],
      destinationPath: abDest,
    });
    const firstOfAb = join(workRoot, 'order-ab-p1.pdf');
    await service.extractPages({
      sourcePath: abDest,
      destinationPath: firstOfAb,
      pageSelection: '1',
    });
    expect(firstPageMediaBox(firstOfAb)).toEqual([0, 0, 612, 792]);
  });

  it('rejects a single merge input and duplicate paths', async () => {
    const one = await service.mergePdfs({
      sourcePaths: [pageA],
      destinationPath: join(workRoot, 'one-merge.pdf'),
    });
    expect(one.status).toBe('failed');
    if (one.status === 'failed') expect(one.category).toBe('NotEnoughFiles');

    const dup = await service.mergePdfs({
      sourcePaths: [pageA, pageA],
      destinationPath: join(workRoot, 'dup-merge.pdf'),
    });
    expect(dup.status).toBe('failed');
    if (dup.status === 'failed') expect(dup.category).toBe('DuplicateFile');
  });

  it('rejects invalid and encrypted merge inputs without writing destination', async () => {
    const invalidDest = join(workRoot, 'merge-invalid.pdf');
    const invalid = await service.mergePdfs({
      sourcePaths: [pageA, join(FIXTURES, 'corrupted.pdf')],
      destinationPath: invalidDest,
    });
    expect(invalid.status).toBe('failed');
    if (invalid.status === 'failed') {
      expect(invalid.category).toBe('InvalidPdf');
      expect(invalid.fileName).toBe('corrupted.pdf');
    }
    expect(existsSync(invalidDest)).toBe(false);

    const encryptedDest = join(workRoot, 'merge-encrypted.pdf');
    const encrypted = await service.mergePdfs({
      sourcePaths: [pageA, join(FIXTURES, 'encrypted-known-password.pdf')],
      destinationPath: encryptedDest,
    });
    expect(encrypted.status).toBe('failed');
    if (encrypted.status === 'failed') {
      expect(encrypted.category).toBe('EncryptedPdf');
      expect(encrypted.fileName).toBe('encrypted-known-password.pdf');
    }
    expect(existsSync(encryptedDest)).toBe(false);
  });

  it('preserves merge sources and supports Unicode/space paths', async () => {
    const unicodeDir = join(workRoot, 'запис test folder');
    await mkdir(unicodeDir, { recursive: true });
    const sourceA = join(unicodeDir, 'zażółć-a.pdf');
    const sourceB = join(unicodeDir, 'тест b.pdf');
    await copyFile(pageA, sourceA);
    await copyFile(pageB, sourceB);
    const hashA = await sha256(sourceA);
    const hashB = await sha256(sourceB);
    const destination = join(unicodeDir, 'merged-unicode.pdf');
    const result = await service.mergePdfs({
      sourcePaths: [sourceA, sourceB],
      destinationPath: destination,
    });
    expect(result.status).toBe('merged');
    expect(existsSync(destination)).toBe(true);
    expect(await sha256(sourceA)).toBe(hashA);
    expect(await sha256(sourceB)).toBe(hashB);

    const splitDest = join(unicodeDir, 'split unicode.pdf');
    const split = await service.extractPages({
      sourcePath: destination,
      destinationPath: splitDest,
      pageSelection: '1-2',
    });
    expect(split.status).toBe('extracted');
    expect(await sha256(destination)).not.toBe('');
    expect(existsSync(sourceA)).toBe(true);
  });

  it('does not leave a final destination after a failed extract of a missing file', async () => {
    const destination = join(workRoot, 'missing-extract.pdf');
    const result = await service.extractPages({
      sourcePath: join(workRoot, 'no-such.pdf'),
      destinationPath: destination,
      pageSelection: '1',
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('SourceFileNotFound');
    }
    expect(existsSync(destination)).toBe(false);
  });
});
