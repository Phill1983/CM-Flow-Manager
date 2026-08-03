export type PdfInspectionResult =
  | {
      status: 'encrypted';
      pageCount?: number;
    }
  | {
      status: 'unencrypted';
      pageCount?: number;
    }
  | {
      status: 'invalid';
      reason: string;
    }
  | {
      status: 'unavailable';
      reason: string;
    };

export type PdfUnlockResult =
  | {
      status: 'unlocked';
      destinationPath: string;
    }
  | {
      status: 'incorrect_password';
    }
  | {
      status: 'failed';
      category:
        | 'InvalidPdf'
        | 'UnsupportedEncryption'
        | 'SourceFileNotFound'
        | 'SourceFileAccess'
        | 'DestinationAccess'
        | 'DestinationExists'
        | 'PdfProcessing'
        | 'Cancelled'
        | 'Internal'
        | 'EngineUnavailable';
      message: string;
    };

export type PdfUnlockInput = {
  sourcePath: string;
  destinationPath: string;
  password: string;
};

/**
 * Replaceable PDF unlock port. Phase 1 ships an unavailable mock only — no qpdf.
 */
export interface PdfUnlockService {
  inspect(filePath: string): Promise<PdfInspectionResult>;
  unlock(input: PdfUnlockInput): Promise<PdfUnlockResult>;
}
