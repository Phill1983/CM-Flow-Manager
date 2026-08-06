import { describe, expect, it } from 'vitest';
import { evaluateUpdate } from './evaluate-update.js';
import { validateVersionManifest } from './validate-manifest.js';
import type { VersionManifest } from '../domain/manifest.js';

const baseManifest = (): VersionManifest => ({
  schemaVersion: 1,
  channel: 'alpha',
  latestVersion: '0.1.1-alpha',
  minimumSupportedVersion: '0.1.0-alpha',
  policy: 'optional',
  updateRequired: false,
  message: '',
  releaseNotesUrl: 'https://github.com/Phill1983/CM-Flow-Manager/releases/tag/v0.1.1-alpha',
  publishedAt: '2026-08-05T00:00:00.000Z',
  artifacts: {
    nsis: {
      fileName: 'CM Flow Manager Setup 0.1.1-alpha.exe',
      sha256: 'a'.repeat(64),
    },
  },
  signing: {
    authenticodeRequired: false,
    status: 'unsigned',
  },
});

describe('validateVersionManifest', () => {
  it('accepts a valid manifest', () => {
    const result = validateVersionManifest(baseManifest());
    expect(result.ok).toBe(true);
  });

  it('rejects bad sha256 and http release notes', () => {
    const bad = {
      ...baseManifest(),
      releaseNotesUrl: 'http://evil.example/notes',
      artifacts: { nsis: { fileName: 'x.exe', sha256: 'deadbeef' } },
    };
    const result = validateVersionManifest(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('sha256'))).toBe(true);
      expect(result.errors.some((e) => e.includes('releaseNotesUrl'))).toBe(true);
    }
  });

  it('requires mandatory policy when updateRequired is true', () => {
    const result = validateVersionManifest({ ...baseManifest(), updateRequired: true, policy: 'optional' });
    expect(result.ok).toBe(false);
  });
});

describe('evaluateUpdate', () => {
  it('marks up to date builds', () => {
    const evaluation = evaluateUpdate('0.1.1-alpha', baseManifest());
    expect(evaluation.hasUpdate).toBe(false);
    expect(evaluation.softBlockWorkSurfaces).toBe(false);
  });

  it('soft-blocks when below minimum supported', () => {
    const evaluation = evaluateUpdate('0.0.9-alpha', {
      ...baseManifest(),
      minimumSupportedVersion: '0.1.0-alpha',
    });
    expect(evaluation.softBlockWorkSurfaces).toBe(true);
    expect(evaluation.policy).toBe('mandatory');
  });

  it('keeps optional updates non-blocking', () => {
    const evaluation = evaluateUpdate('0.1.0-alpha', baseManifest());
    expect(evaluation.hasUpdate).toBe(true);
    expect(evaluation.softBlockWorkSurfaces).toBe(false);
    expect(evaluation.policy).toBe('optional');
  });
});
