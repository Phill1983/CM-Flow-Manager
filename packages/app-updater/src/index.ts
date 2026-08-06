export { UPDATE_CHANNELS, DEFAULT_UPDATE_CHANNEL, isUpdateChannel } from './domain/channels.js';
export type { UpdateChannel } from './domain/channels.js';

export { UPDATE_POLICIES, isUpdatePolicy } from './domain/policy.js';
export type { UpdatePolicy } from './domain/policy.js';

export { compareVersions, isOlderThan, isValidVersionString, parseVersion } from './domain/version.js';
export type { ParsedVersion } from './domain/version.js';

export { MANIFEST_SCHEMA_VERSION } from './domain/manifest.js';
export type { ArtifactIntegrity, ManifestSigningInfo, VersionManifest } from './domain/manifest.js';

export {
  NotConfiguredEmergencySecurityUpdate,
  NotConfiguredLicenseRevocation,
} from './domain/lifecycle-stubs.js';
export type {
  EmergencySecurityUpdatePort,
  EmergencySecurityUpdateResult,
  LicenseRevocationCheckResult,
  LicenseRevocationPort,
} from './domain/lifecycle-stubs.js';

export { validateVersionManifest } from './application/validate-manifest.js';
export type { ManifestValidationResult } from './application/validate-manifest.js';

export { evaluateUpdate } from './application/evaluate-update.js';
export type { UpdateEvaluation } from './application/evaluate-update.js';

export type {
  AppUpdateTransportPort,
  IntegrityVerifyResult,
  ManifestFetcherPort,
  PackageIntegrityPort,
  PackageSignaturePort,
  SignatureVerifyResult,
  UpdateCheckTransportResult,
  UpdateDownloadResult,
} from './application/ports.js';
