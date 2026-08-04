import { useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/utils';

type PdfDropZoneProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  onSelectClick: () => void;
};

export function PdfDropZone({ disabled, onFiles, onSelectClick }: PdfDropZoneProps) {
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
      aria-label={t('passwordRemover.dropzone.title')}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors',
        active && !disabled && 'border-primary bg-primary/5',
        disabled && 'opacity-60',
      )}
    >
      <p className="text-base font-medium">
        {active && !disabled ? t('passwordRemover.dropzone.active') : t('passwordRemover.dropzone.title')}
      </p>
      <p className="max-w-md text-sm text-muted-foreground">{t('passwordRemover.dropzone.hint')}</p>
      <Button type="button" onClick={onSelectClick} disabled={disabled}>
        {t('passwordRemover.selectPdf')}
      </Button>
    </div>
  );
}
