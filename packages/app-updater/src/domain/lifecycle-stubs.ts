/**
 * Architecture-only stubs for future lifecycle controls.
 * Never used to disable the app in Phase 3.6.
 */

export type LicenseRevocationCheckResult =
  | { status: 'not_configured' }
  | { status: 'ok' }
  | { status: 'revoked'; reason: string };

export type EmergencySecurityUpdateResult =
  | { status: 'not_configured' }
  | { status: 'none' }
  | { status: 'available'; version: string; message: string };

export interface LicenseRevocationPort {
  check(): Promise<LicenseRevocationCheckResult>;
}

export interface EmergencySecurityUpdatePort {
  check(): Promise<EmergencySecurityUpdateResult>;
}

export class NotConfiguredLicenseRevocation implements LicenseRevocationPort {
  async check(): Promise<LicenseRevocationCheckResult> {
    return { status: 'not_configured' };
  }
}

export class NotConfiguredEmergencySecurityUpdate implements EmergencySecurityUpdatePort {
  async check(): Promise<EmergencySecurityUpdateResult> {
    return { status: 'not_configured' };
  }
}
