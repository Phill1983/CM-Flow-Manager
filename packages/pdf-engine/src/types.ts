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

export type PdfExtractPagesInput = {
  sourcePath: string;
  destinationPath: string;
  /** User page-selection text. Parsed in-engine; never passed raw to a shell. */
  pageSelection: string;
};

export type PdfMergeInput = {
  sourcePaths: readonly string[];
  destinationPath: string;
};

export type PdfToolFailureCategory =
  | 'InvalidPdf'
  | 'EncryptedPdf'
  | 'InvalidPageRange'
  | 'PageOutOfBounds'
  | 'NotEnoughFiles'
  | 'DuplicateFile'
  | 'SourceFileNotFound'
  | 'SourceFileAccess'
  | 'DestinationAccess'
  | 'DestinationExists'
  | 'PdfProcessing'
  | 'Cancelled'
  | 'Internal'
  | 'EngineUnavailable';

export type PdfExtractPagesResult =
  | {
      status: 'extracted';
      destinationPath: string;
      pageCount: number;
    }
  | {
      status: 'failed';
      category: PdfToolFailureCategory;
      message: string;
      fileName?: string;
    };

export type PdfMergeResult =
  | {
      status: 'merged';
      destinationPath: string;
      pageCount: number;
    }
  | {
      status: 'failed';
      category: PdfToolFailureCategory;
      message: string;
      fileName?: string;
    };

/** Unlock plus local Split/Merge operations. Renderer never receives qpdf argv. */
export interface PdfEngineService extends PdfUnlockService {
  extractPages(input: PdfExtractPagesInput): Promise<PdfExtractPagesResult>;
  mergePdfs(input: PdfMergeInput): Promise<PdfMergeResult>;
}
