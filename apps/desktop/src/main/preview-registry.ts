import { randomUUID } from 'node:crypto';
import { isPdfPreviewToken } from '@cm-flow-manager/ipc-contracts';

const MAX_TOKENS = 32;

export function isPreviewToken(value: string): boolean {
  return isPdfPreviewToken(value);
}

/**
 * Maps opaque preview tokens to already-validated absolute PDF paths.
 * Renderer never receives a filesystem API — only these tokens.
 */
export class PdfPreviewRegistry {
  private readonly tokens = new Map<string, string>();

  grant(filePath: string): string {
    for (const [existingToken, existingPath] of this.tokens) {
      if (existingPath === filePath) {
        return existingToken;
      }
    }
    if (this.tokens.size >= MAX_TOKENS) {
      const oldest = this.tokens.keys().next().value;
      if (typeof oldest === 'string') {
        this.tokens.delete(oldest);
      }
    }
    const token = randomUUID();
    this.tokens.set(token, filePath);
    return token;
  }

  resolve(token: string): string | null {
    if (!isPreviewToken(token)) {
      return null;
    }
    return this.tokens.get(token) ?? null;
  }

  revoke(token: string): boolean {
    return this.tokens.delete(token);
  }

  revokeAll(): void {
    this.tokens.clear();
  }

  size(): number {
    return this.tokens.size;
  }
}

export const pdfPreviewRegistry = new PdfPreviewRegistry();
