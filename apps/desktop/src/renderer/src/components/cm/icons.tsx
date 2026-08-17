import type { ReactNode, SVGProps } from 'react';
import { cn } from '@/lib/utils';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function IconBase({ className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconPdf(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M14 3v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconWrench(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L4 17v3h3l5.1-5.1a4 4 0 0 0 5.6-5.6l-2.2 2.2-2.8-2.8 2-2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconScales(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18M5 7h14M7 7l-3 8h6L7 7Zm10 0-3 8h6l-3-8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconChart(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19V5M4 19h16M8 17V11M12 17V8M16 17v-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconUpdates(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 4v6h6M20 20v-6h-6M20 9A8 8 0 0 0 6.5 6.5L4 10M4 15a8 8 0 0 0 13.5 2.5L20 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconAbout(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 10v5M12 7.5h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3Z" stroke="currentColor" strokeWidth="1.55" />
    </IconBase>
  );
}

export function IconUser(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 19.5c1.8-3.2 4.2-4.5 7-4.5s5.2 1.3 7 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconLock(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

export function IconSplit(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 4h5l3 3v13H8V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 4v3h3M4 14h4M16 14h4M6 12v4M18 12v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconPin(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.75" />
    </IconBase>
  );
}

export function IconClock(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 9v4M12 17h.01M10.3 4.9 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </IconBase>
  );
}

export type ModuleIconKind = 'password' | 'split' | 'repair' | 'compare';

/** Larger CM-blue circular module icons with selective yellow accents (REFERENCE A + B). */
export function ModuleIcon({ kind, className }: { kind: ModuleIconKind; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-16 items-center justify-center rounded-full bg-cm-blue text-white shadow-[0_8px_18px_rgba(20,58,123,0.28)] ring-4 ring-[#143a7b]/12',
        className,
      )}
      aria-hidden="true"
    >
      {kind === 'password' ? (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
          <rect x="10.2" y="14" width="3.6" height="3.2" rx="0.6" fill="var(--cm-yellow)" />
        </svg>
      ) : null}
      {kind === 'split' ? (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h5l3 3v13H7V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 4v3h3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 13.5h4M16.5 13.5h4" stroke="var(--cm-yellow)" strokeWidth="2" strokeLinecap="round" />
          <path d="M5.5 11.5v4M18.5 11.5v4" stroke="var(--cm-yellow)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : null}
      {kind === 'repair' ? (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M4 17.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6 17.5 8 12h8l2 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M14.8 6.2a3.4 3.4 0 0 0-4.8 4.8L7 14l2 2 3-3a3.4 3.4 0 0 0 4.8-4.8Z" stroke="var(--cm-yellow)" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ) : null}
      {kind === 'compare' ? (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v18" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 7h14" stroke="var(--cm-yellow)" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 7 4 15h6L7 7Zm10 0-3 8h6l-3-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}
