import type { VersionManifest } from '../domain/manifest.js';
import type { UpdatePolicy } from '../domain/policy.js';
import { isOlderThan } from '../domain/version.js';

export type UpdateEvaluation = {
  hasUpdate: boolean;
  policy: UpdatePolicy;
  softBlockWorkSurfaces: boolean;
  belowMinimumSupported: boolean;
  reason:
    | 'up_to_date'
    | 'optional_available'
    | 'recommended_available'
    | 'mandatory_available'
    | 'below_minimum_supported';
};

/**
 * Pure policy evaluation. Offline / missing manifest is handled by the caller
 * (app must remain fully usable).
 */
export function evaluateUpdate(currentVersion: string, manifest: VersionManifest): UpdateEvaluation {
  const belowMinimum = isOlderThan(currentVersion, manifest.minimumSupportedVersion);
  const hasUpdate = isOlderThan(currentVersion, manifest.latestVersion);

  let policy: UpdatePolicy = manifest.policy;
  if (manifest.updateRequired || belowMinimum) {
    policy = 'mandatory';
  }

  if (!hasUpdate && !belowMinimum) {
    return {
      hasUpdate: false,
      policy: 'optional',
      softBlockWorkSurfaces: false,
      belowMinimumSupported: false,
      reason: 'up_to_date',
    };
  }

  if (belowMinimum || policy === 'mandatory') {
    return {
      hasUpdate: hasUpdate || belowMinimum,
      policy: 'mandatory',
      softBlockWorkSurfaces: true,
      belowMinimumSupported: belowMinimum,
      reason: belowMinimum ? 'below_minimum_supported' : 'mandatory_available',
    };
  }

  if (policy === 'recommended') {
    return {
      hasUpdate: true,
      policy: 'recommended',
      softBlockWorkSurfaces: false,
      belowMinimumSupported: false,
      reason: 'recommended_available',
    };
  }

  return {
    hasUpdate: true,
    policy: 'optional',
    softBlockWorkSurfaces: false,
    belowMinimumSupported: false,
    reason: 'optional_available',
  };
}
