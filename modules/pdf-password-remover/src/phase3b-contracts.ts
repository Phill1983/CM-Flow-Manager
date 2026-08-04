/**
 * Phase 3B conceptual contracts only — do not implement in Phase 3A.
 *
 * Future flow:
 * Unlocked PDF → extract text → detect plate → normalize → search configured roots
 * → resolve folder → show destination → save after confirmation → Save As fallback.
 *
 * Rules (future):
 * - never scan the entire computer by default
 * - only scan user-configured root folders
 * - one exact match → propose; multiple → ask user; none → Save As
 * - never save silently without showing destination
 * - OCR remains a later phase
 */

/** Raw plate candidate extracted from document text (Phase 3B). */
export type ExtractedPlateCandidate = {
  rawValue: string;
  confidence?: number;
  source?: 'pdf-text';
};

/**
 * Extracts vehicle registration plate candidates from an unlocked PDF's text layer.
 * Phase 3A: interface only — no implementation.
 */
export interface VehiclePlateExtractor {
  extractFromPdf(filePath: string): Promise<ExtractedPlateCandidate[]>;
}

/**
 * Normalizes plate strings for folder matching (spacing, country prefixes, case).
 * Phase 3A: interface only — no implementation.
 */
export interface PlateNormalizer {
  normalize(rawValue: string): string;
}

export type CaseFolderMatch =
  | { status: 'exact'; folderPath: string }
  | { status: 'multiple'; folderPaths: string[] }
  | { status: 'none' };

/**
 * Resolves a case/work folder under user-configured roots only.
 * Phase 3A: interface only — no implementation.
 */
export interface CaseFolderResolver {
  resolve(normalizedPlate: string, configuredRoots: readonly string[]): Promise<CaseFolderMatch>;
}
