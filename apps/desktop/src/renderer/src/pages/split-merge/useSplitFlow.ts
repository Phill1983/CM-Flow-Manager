import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acceptSinglePdfDrop,
  canChangeSelection,
  canExtract,
  formatPagesForRangeInput,
  isBusyState,
  mapExtractResult,
  mapPrepareFailure,
  moveItemToIndex,
  parsePageRange,
  resolveThumbnailSelection,
  togglePageSelection,
  type SplitMergeErrorMessageKey,
  type SplitMergeUiState,
  type SplitSourceMeta,
} from '@cm-flow-manager/pdf-split-merge';
import type { MessageKey } from '@/i18n/types';

export type SplitFlow = {
  state: SplitMergeUiState;
  meta: SplitSourceMeta | null;
  destinationPath: string;
  pageSelection: string;
  rangeValid: boolean;
  statusMessageKey: MessageKey | null;
  statusFileName: string | null;
  outputPath: string | null;
  busy: boolean;
  extractEnabled: boolean;
  selectionEnabled: boolean;
  previewToken: string | null;
  selectedPages: readonly number[];
  setPageSelection: (value: string) => void;
  togglePage: (pageNumber: number) => void;
  reorderPages: (fromPage: number, toPage: number) => void;
  selectViaDialog: () => Promise<void>;
  acceptDroppedFiles: (files: File[]) => Promise<void>;
  changeDestination: () => Promise<void>;
  extract: () => Promise<void>;
  openOutputFolder: () => Promise<void>;
  reset: () => void;
};

export function useSplitFlow(): SplitFlow {
  const [state, setState] = useState<SplitMergeUiState>('idle');
  const [meta, setMeta] = useState<SplitSourceMeta | null>(null);
  const [destinationPath, setDestinationPath] = useState('');
  const [destinationCustomized, setDestinationCustomized] = useState(false);
  const [pageSelection, setPageSelectionState] = useState('');
  const [statusMessageKey, setStatusMessageKey] = useState<MessageKey | null>(null);
  const [statusFileName, setStatusFileName] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [lastValidPages, setLastValidPages] = useState<readonly number[]>([]);
  const operationLock = useRef(false);
  const previewTokenRef = useRef<string | null>(null);

  const busy = isBusyState(state);
  const parsed = useMemo(
    () => parsePageRange(pageSelection, meta?.pageCount),
    [pageSelection, meta?.pageCount],
  );
  const rangeValid = parsed.ok;
  const extractEnabled = canExtract(state, meta, rangeValid, destinationPath);
  const selectionEnabled = canChangeSelection(state);
  const selectedPages = resolveThumbnailSelection(pageSelection, meta?.pageCount, lastValidPages);

  const revokePreview = useCallback(async () => {
    const token = previewTokenRef.current;
    previewTokenRef.current = null;
    setPreviewToken(null);
    if (token) {
      await window.cmFlow.revokePdfPreview(token);
    }
  }, []);

  const reset = useCallback(() => {
    if (operationLock.current) return;
    void revokePreview();
    setState('idle');
    setMeta(null);
    setDestinationPath('');
    setDestinationCustomized(false);
    setPageSelectionState('');
    setLastValidPages([]);
    setStatusMessageKey(null);
    setStatusFileName(null);
    setOutputPath(null);
  }, [revokePreview]);

  const refreshDestination = useCallback(
    async (filePath: string, selection: string, directory?: string) => {
      const prepared = await window.cmFlow.prepareExtractSource(filePath, selection, directory);
      if (prepared.ok) {
        setDestinationPath(prepared.suggestedDestinationPath);
      }
    },
    [],
  );

  const loadSourcePath = useCallback(async (filePath: string) => {
    await revokePreview();
    setLastValidPages([]);
    setState('inspecting');
    setStatusMessageKey('pdfSplitMerge.status.inspecting');
    setStatusFileName(null);
    setOutputPath(null);
    setDestinationCustomized(false);
    try {
      const prepared = await window.cmFlow.prepareExtractSource(filePath, pageSelection || undefined);
      if (!prepared.ok) {
        const mapped = mapPrepareFailure(prepared.code);
        setState(mapped.state);
        setStatusMessageKey(mapped.messageKey);
        setMeta(null);
        setDestinationPath('');
        return;
      }
      setMeta({
        filePath: prepared.filePath,
        fileName: prepared.fileName,
        fileSizeBytes: prepared.fileSizeBytes,
        sourceDirectory: prepared.sourceDirectory,
        encryptionStatus: prepared.encryptionStatus,
        pageCount: prepared.pageCount,
      });
      setDestinationPath(prepared.suggestedDestinationPath);
      if (prepared.encryptionStatus === 'encrypted') {
        setState('encrypted');
        setStatusMessageKey('pdfSplitMerge.error.encrypted');
        return;
      }
      const preview = await window.cmFlow.grantPdfPreview(prepared.filePath);
      if (preview.ok) {
        previewTokenRef.current = preview.token;
        setPreviewToken(preview.token);
      }
      setState('ready');
      setStatusMessageKey('pdfSplitMerge.status.ready');
    } catch {
      setState('failed');
      setStatusMessageKey('pdfSplitMerge.error.unexpected');
      setMeta(null);
    }
  }, [pageSelection, revokePreview]);

  const selectViaDialog = useCallback(async () => {
    if (!selectionEnabled || operationLock.current) return;
    operationLock.current = true;
    setState('selecting');
    try {
      const dialog = await window.cmFlow.openPdfDialog();
      if (dialog.canceled || !dialog.filePath) {
        setState(meta ? 'ready' : 'cancelled');
        setStatusMessageKey(meta ? 'pdfSplitMerge.status.ready' : null);
        return;
      }
      await loadSourcePath(dialog.filePath);
    } catch {
      setState('failed');
      setStatusMessageKey('pdfSplitMerge.error.unexpected');
    } finally {
      operationLock.current = false;
    }
  }, [loadSourcePath, meta, selectionEnabled]);

  const acceptDroppedFiles = useCallback(
    async (files: File[]) => {
      if (!selectionEnabled || operationLock.current) return;
      const acceptance = acceptSinglePdfDrop(files);
      if (!acceptance.accepted) {
        const key: SplitMergeErrorMessageKey =
          acceptance.reason === 'multiple_files'
            ? 'pdfSplitMerge.error.multipleFiles'
            : 'pdfSplitMerge.error.unsupportedFile';
        setState('failed');
        setStatusMessageKey(key);
        return;
      }
      const file = files[0];
      if (!file) return;
      operationLock.current = true;
      try {
        const filePath = window.cmFlow.getPathForFile(file);
        if (!filePath) {
          setState('failed');
          setStatusMessageKey('pdfSplitMerge.error.sourceUnavailable');
          return;
        }
        await loadSourcePath(filePath);
      } catch {
        setState('failed');
        setStatusMessageKey('pdfSplitMerge.error.unexpected');
      } finally {
        operationLock.current = false;
      }
    },
    [loadSourcePath, selectionEnabled],
  );

  const setPageSelection = useCallback(
    (value: string) => {
      setPageSelectionState(value);
      if (!meta || destinationCustomized) return;
      void refreshDestination(meta.filePath, value);
    },
    [destinationCustomized, meta, refreshDestination],
  );

  useEffect(() => {
    if (pageSelection.trim() === '') {
      setLastValidPages([]);
      return;
    }
    const next = parsePageRange(pageSelection, meta?.pageCount);
    if (next.ok) {
      setLastValidPages(next.pages);
    }
  }, [meta?.pageCount, pageSelection]);

  const togglePage = useCallback(
    (pageNumber: number) => {
      if (busy || state === 'success' || !meta || meta.encryptionStatus === 'encrypted') return;
      const current = resolveThumbnailSelection(pageSelection, meta.pageCount, lastValidPages);
      const next = togglePageSelection(current, pageNumber);
      setPageSelection(formatPagesForRangeInput(next));
    },
    [busy, lastValidPages, meta, pageSelection, setPageSelection, state],
  );

  const reorderPages = useCallback(
    (fromPage: number, toPage: number) => {
      if (busy || state === 'success' || !meta || meta.encryptionStatus === 'encrypted') return;
      if (fromPage === toPage) return;
      const current = resolveThumbnailSelection(pageSelection, meta.pageCount, lastValidPages);
      const from = current.indexOf(fromPage);
      const to = current.indexOf(toPage);
      if (from < 0 || to < 0) return;
      const next = moveItemToIndex(current, from, to);
      setPageSelection(formatPagesForRangeInput(next));
    },
    [busy, lastValidPages, meta, pageSelection, setPageSelection, state],
  );

  const changeDestination = useCallback(async () => {
    if (busy || !meta) return;
    const dialog = await window.cmFlow.savePdfDialog(destinationPath || undefined);
    if (dialog.canceled || !dialog.filePath) return;
    setDestinationPath(dialog.filePath);
    setDestinationCustomized(true);
    if (state === 'destination_error' || state === 'success') {
      setState('ready');
      setStatusMessageKey('pdfSplitMerge.status.ready');
      setOutputPath(null);
    }
  }, [busy, destinationPath, meta, state]);

  const extract = useCallback(async () => {
    if (!extractEnabled || !meta || operationLock.current) return;
    operationLock.current = true;
    setState('processing');
    setStatusMessageKey(null);
    setOutputPath(null);
    try {
      const result = await window.cmFlow.extractPdfPages({
        sourcePath: meta.filePath,
        destinationPath,
        pageSelection,
      });
      const mapped = mapExtractResult(result);
      setState(mapped.state);
      setStatusMessageKey(mapped.messageKey);
      setStatusFileName(mapped.fileName ?? null);
      if (result.status === 'extracted') {
        setOutputPath(result.destinationPath);
      }
    } catch {
      setState('failed');
      setStatusMessageKey('pdfSplitMerge.error.unexpected');
    } finally {
      operationLock.current = false;
    }
  }, [destinationPath, extractEnabled, meta, pageSelection]);

  const openOutputFolder = useCallback(async () => {
    const target = outputPath ?? destinationPath;
    if (!target) return;
    const result = await window.cmFlow.openFolder(target);
    if (!result.ok) {
      setStatusMessageKey('pdfSplitMerge.error.openFolderFailed');
    }
  }, [destinationPath, outputPath]);

  return {
    state,
    meta,
    destinationPath,
    pageSelection,
    rangeValid,
    statusMessageKey,
    statusFileName,
    outputPath,
    busy,
    extractEnabled,
    selectionEnabled,
    previewToken,
    selectedPages,
    setPageSelection,
    togglePage,
    reorderPages,
    selectViaDialog,
    acceptDroppedFiles,
    changeDestination,
    extract,
    openOutputFolder,
    reset,
  };
}
