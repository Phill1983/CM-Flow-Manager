import type { UpdateChannel } from './channels.js';
import type { UpdatePolicy } from './policy.js';

export const MANIFEST_SCHEMA_VERSION = 1 as const;

export type ArtifactIntegrity = {
  fileName: string;
  sha256: string;
};

export type ManifestSigningInfo = {
  authenticodeRequired: boolean;
  status: 'unsigned' | 'signed' | 'unknown';
};

export type VersionManifest = {
  schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
  channel: UpdateChannel;
  latestVersion: string;
  minimumSupportedVersion: string;
  policy: UpdatePolicy;
  updateRequired: boolean;
  message: string;
  releaseNotesUrl: string;
  publishedAt: string;
  artifacts: {
    nsis?: ArtifactIntegrity;
    portable?: ArtifactIntegrity;
  };
  signing: ManifestSigningInfo;
};
