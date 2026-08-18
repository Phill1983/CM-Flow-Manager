import { getPdfSplitMergeModuleInfo } from '@cm-flow-manager/pdf-split-merge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import { MergePanel } from './split-merge/MergePanel';
import { SplitPanel } from './split-merge/SplitPanel';

type Mode = 'split' | 'merge';

export function SplitMergePage() {
  const { t } = useI18n();
  const info = getPdfSplitMergeModuleInfo();
  const [mode, setMode] = useState<Mode>('split');

  return (
    <section className="mx-auto flex w-full max-w-none flex-col gap-4 p-5 pb-8" aria-labelledby="split-merge-title">
      <header className="space-y-1.5">
        <p className="text-[length:var(--cm-text-small)] font-medium uppercase tracking-[0.12em] text-cm-blue">
          {t('nav.pdfTools')}
        </p>
        <h1 id="split-merge-title" className="text-cm-navy">
          {t('pdfSplitMerge.title')}
        </h1>
        <p className="max-w-2xl text-[length:var(--cm-text-body)] text-muted-foreground">{t('pdfSplitMerge.lead')}</p>
      </header>
      <p className="rounded-md border border-border bg-card px-3 py-2.5 text-[length:var(--cm-text-small)] text-muted-foreground">
        {t('pdfSplitMerge.privacy')}
      </p>
      <div role="tablist" aria-label={t('pdfSplitMerge.title')} className="flex flex-wrap gap-2">
        <Button
          type="button"
          role="tab"
          aria-selected={mode === 'split'}
          variant={mode === 'split' ? 'default' : 'outline'}
          onClick={() => setMode('split')}
        >
          {t('pdfSplitMerge.tabSplit')}
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === 'merge'}
          variant={mode === 'merge' ? 'default' : 'outline'}
          onClick={() => setMode('merge')}
        >
          {t('pdfSplitMerge.tabMerge')}
        </Button>
      </div>
      {mode === 'split' ? <SplitPanel /> : <MergePanel />}
      <p className="text-[length:var(--cm-text-small)] text-muted-foreground">
        module: {info.id} · engineAvailable: {String(info.engineAvailable)}
      </p>
    </section>
  );
}
