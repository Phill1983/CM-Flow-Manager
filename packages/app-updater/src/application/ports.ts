import type { VersionManifest } from '../domain/manifest.js';

export type IntegrityVerifyResult =
  | { ok: true }
  | { ok: false; code: 'mismatch' | 'missing_file' | 'read_error'; expected?: string; actual?: string };

export interface PackageIntegrityPort {
  verifySha256(filePath: string, expectedSha256: string): Promise<IntegrityVerifyResult>;
}

export type SignatureVerifyResult =
  | { ok: true }
  | { ok: false; code: 'not_implemented' | 'invalid_signature' | 'missing_file' };

export interface PackageSignaturePort {
  verifyAuthenticode(filePath: string): Promise<SignatureVerifyResult>;
}

export interface ManifestFetcherPort {
  fetch(channel: string): Promise<VersionManifest | null>;
}

export type UpdateCheckTransportResult =
  | { status: 'available'; version: string; releaseName?: string }
  | { status: 'not-available' }
  | { status: 'offline' | 'error'; message?: string };

export type UpdateDownloadResult = { ok: true; filePath?: string } | { ok: false; code: string; message?: string };

export interface AppUpdateTransportPort {
  checkForUpdates(): Promise<UpdateCheckTransportResult>;
  downloadUpdate(): Promise<UpdateDownloadResult>;
  quitAndInstall(): void;
  isSupported(): boolean;
}
