import { useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/utils';

type PdfDropZoneProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  onSelectClick: () => void;
  titleKey?: MessageKey;
  hintKey?: MessageKey;
  activeKey?: MessageKey;
  selectKey?: MessageKey;
};

export function PdfDropZone({
  disabled,
  onFiles,
  onSelectClick,
  titleKey = 'passwordRemover.dropzone.title',
  hintKey = 'passwordRemover.dropzone.hint',
  activeKey = 'passwordRemover.dropzone.active',
  selectKey = 'passwordRemover.selectPdf',
}: PdfDropZoneProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    onFiles(files);
  }

  return (
    <div
      role="region"
      aria-label={t(titleKey)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center transition-colors',
        active && !disabled && 'border-cm-blue bg-accent',
        disabled && 'opacity-60',
      )}
    >
      <p className="text-base font-medium">{active && !disabled ? t(activeKey) : t(titleKey)}</p>
      <p className="max-w-md text-sm text-muted-foreground">{t(hintKey)}</p>
      <Button type="button" onClick={onSelectClick} disabled={disabled}>
        {t(selectKey)}
      </Button>
    </div>
  );
}
