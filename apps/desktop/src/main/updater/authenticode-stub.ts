import type { PackageSignaturePort, SignatureVerifyResult } from '@cm-flow-manager/app-updater';

/**
 * Future Authenticode verification. Not implemented in Phase 3.6 (unsigned Alpha).
 */
export class AuthenticodeStub implements PackageSignaturePort {
  async verifyAuthenticode(_filePath: string): Promise<SignatureVerifyResult> {
    return { ok: false, code: 'not_implemented' };
  }
}
