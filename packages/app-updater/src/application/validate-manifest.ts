import { isUpdateChannel } from '../domain/channels.js';
import type { VersionManifest } from '../domain/manifest.js';
import { MANIFEST_SCHEMA_VERSION } from '../domain/manifest.js';
import { isUpdatePolicy } from '../domain/policy.js';
import { isValidVersionString } from '../domain/version.js';

export type ManifestValidationResult =
  | { ok: true; manifest: VersionManifest }
  | { ok: false; errors: string[] };

const SHA256_RE = /^[a-f0-9]{64}$/;
const ALLOWED_RELEASE_HOSTS = new Set(['github.com', 'www.github.com']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateArtifact(
  value: unknown,
  label: string,
  errors: string[],
): { fileName: string; sha256: string } | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isPlainObject(value)) {
    errors.push(`${label} must be an object`);
    return undefined;
  }
  const fileName = value.fileName;
  const sha256 = value.sha256;
  if (typeof fileName !== 'string' || fileName.trim().length === 0) {
    errors.push(`${label}.fileName must be a non-empty string`);
  }
  if (typeof sha256 !== 'string' || !SHA256_RE.test(sha256)) {
    errors.push(`${label}.sha256 must be 64 lowercase hex characters`);
  }
  if (typeof fileName === 'string' && typeof sha256 === 'string' && SHA256_RE.test(sha256)) {
    return { fileName: fileName.trim(), sha256 };
  }
  return undefined;
}

function isAllowedReleaseNotesUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    return ALLOWED_RELEASE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateVersionManifest(input: unknown): ManifestValidationResult {
  const errors: string[] = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: ['manifest must be a JSON object'] };
  }

  if (input.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`);
  }
  if (!isUpdateChannel(input.channel)) {
    errors.push('channel must be stable|beta|alpha|development');
  }
  if (!isValidVersionString(input.latestVersion)) {
    errors.push('latestVersion must be a valid semver string');
  }
  if (!isValidVersionString(input.minimumSupportedVersion)) {
    errors.push('minimumSupportedVersion must be a valid semver string');
  }
  if (!isUpdatePolicy(input.policy)) {
    errors.push('policy must be optional|recommended|mandatory');
  }
  if (typeof input.updateRequired !== 'boolean') {
    errors.push('updateRequired must be a boolean');
  }
  if (typeof input.message !== 'string') {
    errors.push('message must be a string');
  }
  if (typeof input.releaseNotesUrl !== 'string' || !isAllowedReleaseNotesUrl(input.releaseNotesUrl)) {
    errors.push('releaseNotesUrl must be an https://github.com URL');
  }
  if (typeof input.publishedAt !== 'string' || Number.isNaN(Date.parse(input.publishedAt))) {
    errors.push('publishedAt must be an ISO date string');
  }

  if (!isPlainObject(input.artifacts)) {
    errors.push('artifacts must be an object');
  }

  const nsis = isPlainObject(input.artifacts)
    ? validateArtifact(input.artifacts.nsis, 'artifacts.nsis', errors)
    : undefined;
  const portable = isPlainObject(input.artifacts)
    ? validateArtifact(input.artifacts.portable, 'artifacts.portable', errors)
    : undefined;

  if (!nsis && !portable) {
    errors.push('artifacts must include nsis and/or portable with sha256');
  }

  if (!isPlainObject(input.signing)) {
    errors.push('signing must be an object');
  } else {
    if (typeof input.signing.authenticodeRequired !== 'boolean') {
      errors.push('signing.authenticodeRequired must be a boolean');
    }
    if (
      input.signing.status !== 'unsigned' &&
      input.signing.status !== 'signed' &&
      input.signing.status !== 'unknown'
    ) {
      errors.push('signing.status must be unsigned|signed|unknown');
    }
  }

  if (
    typeof input.updateRequired === 'boolean' &&
    input.updateRequired === true &&
    isUpdatePolicy(input.policy) &&
    input.policy !== 'mandatory'
  ) {
    errors.push('updateRequired true requires policy mandatory');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    manifest: {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      channel: input.channel as VersionManifest['channel'],
      latestVersion: input.latestVersion as string,
      minimumSupportedVersion: input.minimumSupportedVersion as string,
      policy: input.policy as VersionManifest['policy'],
      updateRequired: input.updateRequired as boolean,
      message: input.message as string,
      releaseNotesUrl: input.releaseNotesUrl as string,
      publishedAt: input.publishedAt as string,
      artifacts: {
        ...(nsis ? { nsis } : {}),
        ...(portable ? { portable } : {}),
      },
      signing: {
        authenticodeRequired: (input.signing as { authenticodeRequired: boolean }).authenticodeRequired,
        status: (input.signing as { status: VersionManifest['signing']['status'] }).status,
      },
    },
  };
}
