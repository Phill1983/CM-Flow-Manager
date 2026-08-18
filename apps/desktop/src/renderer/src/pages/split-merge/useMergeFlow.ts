import { useCallback, useRef, useState } from 'react';
import {
  acceptMergePdfDrop,
  canChangeSelection,
  canMerge,
  isBusyState,
  isSameFilePath,
  mapMergePrepareFailure,
  mapMergeResult,
  moveItem,
  moveItemToIndex,
  type MergeFileMeta,
  type SplitMergeUiState,
} from '@cm-flow-manager/pdf-split-merge';
import type { MessageKey } from '@/i18n/types';

export type MergeListItem = MergeFileMeta & { previewToken: string | null };

export type MergeFlow = {
  state: SplitMergeUiState;
  files: MergeListItem[];
  destinationPath: string;
  statusMessageKey: MessageKey | null;
  statusFileName: string | null;
  outputPath: string | null;
  busy: boolean;
  mergeEnabled: boolean;
  selectionEnabled: boolean;
  selectViaDialog: () => Promise<void>;
  acceptDroppedFiles: (files: File[]) => Promise<void>;
  removeFile: (filePath: string) => void;
  moveFile: (index: number, direction: -1 | 1) => void;
  reorderFiles: (fromPath: string, toPath: string) => void;
  changeDestination: () => Promise<void>;
  merge: () => Promise<void>;
  openOutputFolder: () => Promise<void>;
  reset: () => void;
};

export function useMergeFlow(): MergeFlow {
  const [state, setState] = useState<SplitMergeUiState>('idle');
  const [files, setFiles] = useState<MergeListItem[]>([]);
  const [destinationPath, setDestinationPath] = useState('');
  const [destinationCustomized, setDestinationCustomized] = useState(false);
  const [statusMessageKey, setStatusMessageKey] = useState<MessageKey | null>(null);
  const [statusFileName, setStatusFileName] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const operationLock = useRef(false);

  const busy = isBusyState(state);
  const mergeEnabled = canMerge(state, files.length, destinationPath);
  const selectionEnabled = canChangeSelection(state);

  const revokeTokens = useCallback(async (tokens: Array<string | null | undefined>) => {
    await Promise.all(
      tokens
        .filter((token): token is string => typeof token === 'string' && token.length > 0)
        .map((token) => window.cmFlow.revokePdfPreview(token)),
    );
  }, []);

  const reset = useCallback(() => {
    if (operationLock.current) return;
    void revokeTokens(files.map((file) => file.previewToken));
    setState('idle');
    setFiles([]);
    setDestinationPath('');
    setDestinationCustomized(false);
    setStatusMessageKey(null);
    setStatusFileName(null);
    setOutputPath(null);
  }, [files, revokeTokens]);

  const addPaths = useCallback(
    async (filePaths: string[]) => {
      setState('inspecting');
      setStatusMessageKey('pdfSplitMerge.status.inspecting');
      setOutputPath(null);
      let next = [...files];
      let duplicate = false;
      for (const filePath of filePaths) {
        if (next.some((file) => isSameFilePath(file.filePath, filePath))) {
          duplicate = true;
          continue;
        }
        const prepared = await window.cmFlow.prepareMergeFile(filePath);
        if (!prepared.ok) {
          const mapped = mapMergePrepareFailure(prepared.code, prepared.fileName);
          setFiles(next);
          setState(mapped.state);
          setStatusMessageKey(mapped.messageKey);
          setStatusFileName(mapped.fileName ?? null);
          return;
        }
        next = [
          ...next,
          {
            filePath: prepared.filePath,
            fileName: prepared.fileName,
            fileSizeBytes: prepared.fileSizeBytes,
            sourceDirectory: prepared.sourceDirectory,
            pageCount: prepared.pageCount ?? 0,
            previewToken: null,
          },
        ];
        const preview = await window.cmFlow.grantPdfPreview(prepared.filePath);
        const last = next[next.length - 1];
        if (preview.ok && last) {
          last.previewToken = preview.token;
        }
        if (!destinationCustomized && !destinationPath) {
          setDestinationPath(prepared.suggestedDestinationPath);
        }
      }
      setFiles(next);
      if (next.length === 0) {
        setState('failed');
        setStatusMessageKey(duplicate ? 'pdfSplitMerge.error.duplicateFile' : 'pdfSplitMerge.error.notEnoughFiles');
        return;
      }
      setState('ready');
      if (duplicate) {
        setStatusMessageKey('pdfSplitMerge.error.duplicateFile');
        return;
      }
      setStatusMessageKey(next.length < 2 ? 'pdfSplitMerge.error.notEnoughFiles' : 'pdfSplitMerge.status.ready');
    },
    [destinationCustomized, destinationPath, files],
  );

  const selectViaDialog = useCallback(async () => {
    if (!selectionEnabled || operationLock.current) return;
    operationLock.current = true;
    setState('selecting');
    try {
      const dialog = await window.cmFlow.openPdfsDialog();
      if (dialog.canceled || !dialog.filePaths || dialog.filePaths.length === 0) {
        setState(files.length > 0 ? 'ready' : 'cancelled');
        setStatusMessageKey(files.length > 0 ? 'pdfSplitMerge.status.ready' : null);
        return;
      }
      await addPaths(dialog.filePaths);
    } catch {
      setState('failed');
      setStatusMessageKey('pdfSplitMerge.error.unexpected');
    } finally {
      operationLock.current = false;
    }
  }, [addPaths, files.length, selectionEnabled]);

  const acceptDroppedFiles = useCallback(
    async (dropped: File[]) => {
      if (!selectionEnabled || operationLock.current) return;
      const acceptance = acceptMergePdfDrop(dropped);
      if (!acceptance.accepted) {
        setState('failed');
        setStatusMessageKey('pdfSplitMerge.error.unsupportedFile');
        return;
      }
      operationLock.current = true;
      try {
        const paths = dropped
          .map((file) => window.cmFlow.getPathForFile(file))
          .filter((filePath): filePath is string => Boolean(filePath));
        if (paths.length === 0) {
          setState('failed');
          setStatusMessageKey('pdfSplitMerge.error.sourceUnavailable');
          return;
        }
        await addPaths(paths);
      } catch {
        setState('failed');
        setStatusMessageKey('pdfSplitMerge.error.unexpected');
      } finally {
        operationLock.current = false;
      }
    },
    [addPaths, selectionEnabled],
  );

  const removeFile = useCallback((filePath: string) => {
    setFiles((current) => {
      const removed = current.find((file) => isSameFilePath(file.filePath, filePath));
      if (removed?.previewToken) {
        void window.cmFlow.revokePdfPreview(removed.previewToken);
      }
      const next = current.filter((file) => !isSameFilePath(file.filePath, filePath));
      if (next.length === 0) {
        setState('idle');
        setStatusMessageKey(null);
        if (!destinationCustomized) setDestinationPath('');
      } else {
        setState('ready');
        setStatusMessageKey(next.length < 2 ? 'pdfSplitMerge.error.notEnoughFiles' : 'pdfSplitMerge.status.ready');
      }
      return next;
    });
  }, [destinationCustomized]);

  const moveFile = useCallback((index: number, direction: -1 | 1) => {
    setFiles((current) => moveItem(current, index, direction));
  }, []);

  const reorderFiles = useCallback((fromPath: string, toPath: string) => {
    setFiles((current) => {
      const from = current.findIndex((file) => isSameFilePath(file.filePath, fromPath));
      const to = current.findIndex((file) => isSameFilePath(file.filePath, toPath));
      if (from < 0 || to < 0 || from === to) return current;
      return moveItemToIndex(current, from, to);
    });
  }, []);

  const changeDestination = useCallback(async () => {
    if (busy) return;
    const dialog = await window.cmFlow.savePdfDialog(destinationPath || undefined);
    if (dialog.canceled || !dialog.filePath) return;
    setDestinationPath(dialog.filePath);
    setDestinationCustomized(true);
    if (state === 'destination_error' || state === 'success') {
      setState('ready');
      setStatusMessageKey('pdfSplitMerge.status.ready');
      setOutputPath(null);
    }
  }, [busy, destinationPath, state]);

  const merge = useCallback(async () => {
    if (!mergeEnabled || operationLock.current) return;
    operationLock.current = true;
    setState('processing');
    setStatusMessageKey(null);
    setOutputPath(null);
    try {
      const result = await window.cmFlow.mergePdfs({
        sourcePaths: files.map((file) => file.filePath),
        destinationPath,
      });
      const mapped = mapMergeResult(result);
      setState(mapped.state);
      setStatusMessageKey(mapped.messageKey);
      setStatusFileName(mapped.fileName ?? null);
      if (result.status === 'merged') {
        setOutputPath(result.destinationPath);
      }
    } catch {
      setState('failed');
      setStatusMessageKey('pdfSplitMerge.error.unexpected');
    } finally {
      operationLock.current = false;
    }
  }, [destinationPath, files, mergeEnabled]);

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
    files,
    destinationPath,
    statusMessageKey,
    statusFileName,
    outputPath,
    busy,
    mergeEnabled,
    selectionEnabled,
    selectViaDialog,
    acceptDroppedFiles,
    removeFile,
    moveFile,
    reorderFiles,
    changeDestination,
    merge,
    openOutputFolder,
    reset,
  };
}
