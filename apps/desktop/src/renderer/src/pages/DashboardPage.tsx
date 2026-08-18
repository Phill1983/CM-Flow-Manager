import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  PDF_PASSWORD_REMOVER_ROUTE,
  getPdfPasswordRemoverModuleInfo,
} from '@cm-flow-manager/pdf-password-remover';
import { PDF_SPLIT_MERGE_ROUTE } from '@cm-flow-manager/pdf-split-merge';
import { useI18n } from '@/i18n/useI18n';
import { DashboardHero } from '@/components/cm/DashboardHero';
import {
  DashboardPanel,
  EmptyState,
  SectionHeader,
  StatCell,
  StatusBadge,
  ToolCard,
} from '@/components/cm/primitives';
import {
  IconChart,
  IconClock,
  IconPdf,
  IconPin,
  IconScales,
  IconWarning,
} from '@/components/cm/icons';
import modulePasswordUrl from '@/assets/cm-ui/modules/pdf-password-remover.png';
import moduleSplitUrl from '@/assets/cm-ui/modules/pdf-split-merge.png';
import moduleRepairUrl from '@/assets/cm-ui/modules/repair-intelligence.png';
import moduleCompareUrl from '@/assets/cm-ui/modules/comparisons.png';
import pdfBadgeUrl from '@/assets/cm-ui/icons/filetypes/pdf.png';

export function DashboardPage() {
  const { t } = useI18n();
  const [engineReady, setEngineReady] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string>('…');
  const [stamp, setStamp] = useState('');

  useEffect(() => {
    let cancelled = false;
    void window.cmFlow.getVersion().then((v) => {
      if (!cancelled) setVersion(v.version);
    });
    if (!cancelled) setEngineReady(getPdfPasswordRemoverModuleInfo().engineAvailable);
    const tick = () => {
      const now = new Date();
      setStamp(
        `${now.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section className="flex min-h-full flex-col" aria-labelledby="dashboard-title">
      <div className="flex flex-1 flex-col gap-5 px-6 pb-4 pt-4">
        <div id="dashboard-title" className="sr-only">
          {t('dashboard.title')}
        </div>

        <DashboardHero
          eyebrow={t('dashboard.welcomeEyebrow')}
          title={t('dashboard.welcomeTitle')}
          lead={t('dashboard.welcomeLead')}
          imageAlt={t('dashboard.heroAlt')}
        />

        <section className="space-y-3.5">
          <SectionHeader>{t('dashboard.quickAccess')}</SectionHeader>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ToolCard
              href={PDF_PASSWORD_REMOVER_ROUTE}
              title={t('dashboard.qa.passwordTitle')}
              description={t('dashboard.qa.passwordDesc')}
              actionLabel={t('dashboard.openArrow')}
              graphicSrc={modulePasswordUrl}
              graphicAlt={t('dashboard.qa.passwordTitle')}
            />
            <ToolCard
              href={PDF_SPLIT_MERGE_ROUTE}
              title={t('dashboard.qa.splitTitle')}
              description={t('dashboard.qa.splitDesc')}
              actionLabel={t('dashboard.openArrow')}
              graphicSrc={moduleSplitUrl}
              graphicAlt={t('dashboard.qa.splitTitle')}
            />
            <ToolCard
              disabled
              title={t('dashboard.qa.repairTitle')}
              description={t('dashboard.qa.repairDesc')}
              actionLabel={t('common.comingSoon')}
              graphicSrc={moduleRepairUrl}
              graphicAlt={t('dashboard.qa.repairTitle')}
            />
            <ToolCard
              disabled
              title={t('dashboard.qa.compareTitle')}
              description={t('dashboard.qa.compareDesc')}
              actionLabel={t('common.comingSoon')}
              graphicSrc={moduleCompareUrl}
              graphicAlt={t('dashboard.qa.compareTitle')}
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <DashboardPanel
            title={t('dashboard.recentFiles')}
            action={
              <Link to="/activity" className="text-[length:var(--cm-text-body)] font-semibold text-cm-blue hover:underline">
                {t('dashboard.viewAll')}
              </Link>
            }
          >
            <EmptyState
              icon={<img src={pdfBadgeUrl} alt="" width={36} height={36} className="size-9 object-contain opacity-80" />}
              title={t('dashboard.recentFilesEmpty')}
              description={t('dashboard.recentEmptyHint')}
            />
          </DashboardPanel>

          <DashboardPanel
            title={t('dashboard.stats')}
            action={
              <span className="text-[length:var(--cm-text-body)] font-semibold text-cm-blue/55" title={t('common.comingLater')}>
                {t('dashboard.details')}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <StatCell icon={<IconPdf className="size-5" />} value="0" label={t('dashboard.stats.processed')} />
              <StatCell icon={<IconScales className="size-5" />} value="0" label={t('dashboard.stats.comparisons')} />
              <StatCell icon={<IconWarning className="size-5" />} value="0" label={t('dashboard.stats.flagged')} />
              <StatCell icon={<IconChart className="size-5" />} value="0" label={t('dashboard.stats.reports')} />
            </div>
          </DashboardPanel>
        </section>
      </div>

      <footer className="sticky bottom-0 mt-auto grid shrink-0 grid-cols-1 gap-3 border-t border-border bg-white px-6 py-2.5 text-[length:var(--cm-text-small)] text-cm-navy md:grid-cols-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-cm-light-gray text-cm-blue">
            <IconPin className="size-3.5" />
          </span>
          <span>{t('dashboard.status.address')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-center">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-cm-light-gray text-cm-blue">
            <IconPdf className="size-3.5" />
          </span>
          <span>
            {t('dashboard.localStatus')}:{' '}
            {engineReady === null ? (
              <StatusBadge tone="muted">…</StatusBadge>
            ) : engineReady ? (
              <StatusBadge tone="success">{t('dashboard.status.ready')}</StatusBadge>
            ) : (
              <StatusBadge tone="warning">{t('dashboard.status.engineOffline')}</StatusBadge>
            )}
          </span>
          <span className="text-muted-foreground">
            · {t('about.version')} {version}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground md:justify-end">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-cm-light-gray text-cm-blue">
            <IconClock className="size-3.5" />
          </span>
          {stamp}
        </div>
      </footer>
    </section>
  );
}
