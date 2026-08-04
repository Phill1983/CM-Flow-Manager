import { useCallback, useRef, useState } from 'react';
import {
  acceptSinglePdfDrop,
  canChangeSelection,
  canUnlock,
  isBusyState,
  mapPrepareFailure,
  mapUnlockResult,
  passwordRequiredFor,
  shouldClearPasswordAfterOutcome,
  type PasswordRemoverErrorMessageKey,
  type PasswordRemoverUiState,
  type SelectedPdfMeta,
} from '@cm-flow-manager/pdf-password-remover';
import type { MessageKey } from '@/i18n/types';

export type PasswordRemoverFlow = {
  state: PasswordRemoverUiState;
  meta: SelectedPdfMeta | null;
  destinationPath: string;
  password: string;
  showPassword: boolean;
  statusMessageKey: MessageKey | null;
  outputPath: string | null;
  busy: boolean;
  passwordRequired: boolean;
  unlockEnabled: boolean;
  selectionEnabled: boolean;
  setPassword: (value: string) => void;
  toggleShowPassword: () => void;
  selectViaDialog: () => Promise<void>;
  acceptDroppedFiles: (files: File[]) => Promise<void>;
  changeDestination: () => Promise<void>;
  unlock: () => Promise<void>;
  openOutputFolder: () => Promise<void>;
  reset: () => void;
};

function clearPasswordState(
  setPassword: (value: string) => void,
  setShowPassword: (value: boolean) => void,
): void {
  setPassword('');
  setShowPassword(false);
}

export function usePasswordRemoverFlow(): PasswordRemoverFlow {
  const [state, setState] = useState<PasswordRemoverUiState>('idle');
  const [meta, setMeta] = useState<SelectedPdfMeta | null>(null);
  const [destinationPath, setDestinationPath] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessageKey, setStatusMessageKey] = useState<MessageKey | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const operationLock = useRef(false);

  const busy = isBusyState(state);
  const passwordRequired = passwordRequiredFor(meta);
  const unlockEnabled = canUnlock(state, passwordRequired, password) && Boolean(destinationPath);
  const selectionEnabled = canChangeSelection(state);

  const reset = useCallback(() => {
    if (operationLock.current) return;
    setState('idle');
    setMeta(null);
    setDestinationPath('');
    clearPasswordState(setPassword, setShowPassword);
    setStatusMessageKey(null);
    setOutputPath(null);
  }, []);

  const applyPrepareFailure = useCallback((code: Parameters<typeof mapPrepareFailure>[0]) => {
    const mapped = mapPrepareFailure(code);
    setState(mapped.state);
    setStatusMessageKey(mapped.messageKey);
    setMeta(null);
    setDestinationPath('');
    clearPasswordState(setPassword, setShowPassword);
    setOutputPath(null);
  }, []);

  const loadSourcePath = useCallback(
    async (filePath: string) => {
      setState('inspecting');
      setStatusMessageKey('passwordRemover.status.inspecting');
      setOutputPath(null);
      clearPasswordState(setPassword, setShowPassword);

      try {
        let prepared = null as Awaited<ReturnType<typeof window.cmFlow.preparePdfSource>> | null;

        if (typeof window.cmFlow.preparePdfSource === 'function') {
          try {
            prepared = await window.cmFlow.preparePdfSource(filePath);
          } catch (error) {
            console.error('[password-remover] preparePdfSource IPC failed, falling back to inspect', error);
          }
        }

        if (prepared && !prepared.ok) {
          applyPrepareFailure(prepared.code);
          return;
        }

        if (prepared?.ok) {
          setMeta({
            filePath: prepared.filePath,
            fileName: prepared.fileName,
            fileSizeBytes: prepared.fileSizeBytes,
            sourceDirectory: prepared.sourceDirectory,
            encryptionStatus: prepared.encryptionStatus,
            pageCount: prepared.pageCount,
          });
          setDestinationPath(prepared.suggestedDestinationPath);
          setState('ready');
          setStatusMessageKey('passwordRemover.status.ready');
          return;
        }

        // Fallback: Phase 2 inspect + local suggested name (collision resolved on unlock/Save As).
        const inspection = await window.cmFlow.inspectPdf(filePath);
        if (inspection.status === 'invalid') {
          applyPrepareFailure('invalid_pdf');
          return;
        }
        if (inspection.status === 'unavailable') {
          applyPrepareFailure('unavailable');
          return;
        }

        const normalized = filePath.replace(/\\/g, '/');
        const segments = normalized.split('/');
        const fileName = segments[segments.length - 1] || filePath;
        const sourceDirectory = filePath.slice(0, Math.max(0, filePath.length - fileName.length - 1));
        const suggestedDestinationPath = filePath.replace(/\.pdf$/i, '_unlocked.pdf');

        setMeta({
          filePath,
          fileName,
          fileSizeBytes: 0,
          sourceDirectory,
          encryptionStatus: inspection.status,
          pageCount: inspection.pageCount,
        });
        setDestinationPath(suggestedDestinationPath);
        setState('ready');
        setStatusMessageKey('passwordRemover.status.ready');
      } catch (error) {
        console.error('[password-remover] loadSourcePath failed', error);
        setState('failed');
        setStatusMessageKey('passwordRemover.error.unexpected');
        setMeta(null);
        setDestinationPath('');
        clearPasswordState(setPassword, setShowPassword);
      }
    },
    [applyPrepareFailure],
  );

  const selectViaDialog = useCallback(async () => {
    if (!selectionEnabled || operationLock.current) return;
    if (!window.cmFlow?.openPdfDialog || !window.cmFlow?.preparePdfSource) {
      setState('failed');
      setStatusMessageKey('passwordRemover.error.engineUnavailable');
      console.error('[password-remover] cmFlow bridge missing openPdfDialog/preparePdfSource');
      return;
    }
    operationLock.current = true;
    setState('selecting');
    try {
      const dialog = await window.cmFlow.openPdfDialog();
      if (dialog.canceled || !dialog.filePath) {
        setState(meta ? 'ready' : 'cancelled');
        setStatusMessageKey(meta ? 'passwordRemover.status.ready' : null);
        return;
      }
      await loadSourcePath(dialog.filePath);
    } catch (error) {
      console.error('[password-remover] selectViaDialog failed', error);
      setState('failed');
      setStatusMessageKey('passwordRemover.error.unexpected');
    } finally {
      operationLock.current = false;
    }
  }, [loadSourcePath, meta, selectionEnabled]);

  const acceptDroppedFiles = useCallback(
    async (files: File[]) => {
      if (!selectionEnabled || operationLock.current) return;

      const acceptance = acceptSinglePdfDrop(files);
      if (!acceptance.accepted) {
        const key: PasswordRemoverErrorMessageKey =
          acceptance.reason === 'multiple_files'
            ? 'passwordRemover.error.multipleFiles'
            : 'passwordRemover.error.unsupportedFile';
        setState('failed');
        setStatusMessageKey(key);
        return;
      }

      const file = files[0];
      if (!file) {
        setState('failed');
        setStatusMessageKey('passwordRemover.error.unsupportedFile');
        return;
      }

      operationLock.current = true;
      setState('inspecting');
      try {
        const filePath = window.cmFlow.getPathForFile(file);
        if (!filePath) {
          setState('failed');
          setStatusMessageKey('passwordRemover.error.sourceUnavailable');
          return;
        }
        await loadSourcePath(filePath);
      } catch {
        setState('failed');
        setStatusMessageKey('passwordRemover.error.unexpected');
      } finally {
        operationLock.current = false;
      }
    },
    [loadSourcePath, selectionEnabled],
  );

  const changeDestination = useCallback(async () => {
    if (busy || !meta) return;
    const dialog = await window.cmFlow.savePdfDialog(destinationPath || undefined);
    if (dialog.canceled || !dialog.filePath) {
      return;
    }
    setDestinationPath(dialog.filePath);
    if (state === 'destination_error' || state === 'success') {
      setState('ready');
      setStatusMessageKey('passwordRemover.status.ready');
      setOutputPath(null);
    }
  }, [busy, destinationPath, meta, state]);

  const unlock = useCallback(async () => {
    if (!unlockEnabled || !meta || operationLock.current) return;
    operationLock.current = true;
    setState('unlocking');
    setStatusMessageKey(null);
    setOutputPath(null);

    try {
      const result = await window.cmFlow.unlockPdf({
        sourcePath: meta.filePath,
        destinationPath,
        password: passwordRequired ? password : '',
      });
      const mapped = mapUnlockResult(result);
      setState(mapped.state);
      setStatusMessageKey(mapped.messageKey);

      if (result.status === 'unlocked') {
        setOutputPath(result.destinationPath);
      }
      if (shouldClearPasswordAfterOutcome(mapped.state)) {
        clearPasswordState(setPassword, setShowPassword);
      }
    } catch {
      setState('failed');
      setStatusMessageKey('passwordRemover.error.unexpected');
      clearPasswordState(setPassword, setShowPassword);
    } finally {
      operationLock.current = false;
    }
  }, [destinationPath, meta, password, passwordRequired, unlockEnabled]);

  const openOutputFolder = useCallback(async () => {
    const target = outputPath ?? destinationPath;
    if (!target) return;
    const result = await window.cmFlow.openFolder(target);
    if (!result.ok) {
      setStatusMessageKey('passwordRemover.error.openFolderFailed');
    }
  }, [destinationPath, outputPath]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((value) => !value);
  }, []);

  return {
    state,
    meta,
    destinationPath,
    password,
    showPassword,
    statusMessageKey,
    outputPath,
    busy,
    passwordRequired,
    unlockEnabled,
    selectionEnabled,
    setPassword,
    toggleShowPassword,
    selectViaDialog,
    acceptDroppedFiles,
    changeDestination,
    unlock,
    openOutputFolder,
    reset,
  };
}
