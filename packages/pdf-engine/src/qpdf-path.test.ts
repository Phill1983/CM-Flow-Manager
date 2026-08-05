import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listQpdfCandidatePaths, resolveQpdfExecutable } from './qpdf-unlock-service';

describe('resolveQpdfExecutable', () => {
  it('finds the vendored qpdf binary from the repo', () => {
    const resolved = resolveQpdfExecutable();
    expect(resolved).toBeTruthy();
    expect(existsSync(resolved!)).toBe(true);
    expect(resolved!.toLowerCase().endsWith('qpdf.exe') || resolved!.endsWith('qpdf')).toBe(true);
  });

  it('includes an Electron out/main-style candidate that reaches repo vendor', () => {
    const fakeOutMain = 'D:\\Projects\\cm-flow-manager\\apps\\desktop\\out\\main\\';
    const candidates = listQpdfCandidatePaths(fakeOutMain);
    const hit = candidates.find((path) => existsSync(path));
    expect(hit).toBeTruthy();
  });

  it('lists packaged resourcesPath candidate first when available', () => {
    const proc = process as NodeJS.Process & { resourcesPath?: string };
    const previous = proc.resourcesPath;
    Object.defineProperty(process, 'resourcesPath', {
      value: 'D:\\fake-app\\resources',
      configurable: true,
    });
    try {
      const candidates = listQpdfCandidatePaths();
      expect(candidates[0]?.replace(/\\/g, '/')).toContain('resources/qpdf/');
    } finally {
      Object.defineProperty(process, 'resourcesPath', {
        value: previous,
        configurable: true,
      });
    }
  });
});
