import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeader({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3.5 flex items-center justify-between gap-3', className)}>
      <h2 className="text-[length:var(--cm-text-h2)] font-semibold tracking-tight text-cm-navy">{children}</h2>
      {action}
    </div>
  );
}

export function DashboardPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-h-[12.5rem] flex-col rounded-[0.75rem] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(11,31,74,0.05)]',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[length:var(--cm-text-h3)] font-semibold text-cm-navy">{title}</h3>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-md bg-cm-light-gray/60 px-4 py-6 text-center',
        className,
      )}
    >
      {icon ? <div className="text-cm-blue/80">{icon}</div> : null}
      <p className="text-[length:var(--cm-text-body)] font-medium text-cm-navy">{title}</p>
      {description ? (
        <p className="max-w-sm text-[length:var(--cm-text-small)] text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function StatCell({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md px-1 py-2">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-cm-blue/10 text-cm-blue">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[1.65rem] font-bold leading-none tracking-tight text-cm-navy">{value}</p>
        <p className="mt-1.5 text-[length:var(--cm-text-small)] leading-snug text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function ToolCard(props: {
  title: string;
  description: string;
  graphicSrc: string;
  graphicAlt: string;
  actionLabel: string;
  href?: string;
  disabled?: boolean;
}) {
  const body = (
    <>
      <div className="flex flex-1 flex-col items-center px-1 pt-1 text-center">
        <img
          src={props.graphicSrc}
          alt=""
          width={120}
          height={120}
          className="size-[7rem] object-contain"
          aria-hidden="true"
        />
        <span className="sr-only">{props.graphicAlt}</span>
        <h3 className="mt-3.5 text-[length:var(--cm-text-h3)] font-semibold text-cm-navy">{props.title}</h3>
        <p className="mt-2 max-w-[15.5rem] flex-1 text-[length:var(--cm-text-small)] leading-relaxed text-muted-foreground">
          {props.description}
        </p>
      </div>
      <div className="mt-4 border-t border-border pt-3.5 text-center">
        <span
          className={cn(
            'text-[length:var(--cm-text-body)] font-semibold',
            props.disabled ? 'text-muted-foreground' : 'text-cm-blue',
          )}
        >
          {props.actionLabel}
        </span>
      </div>
    </>
  );

  const className = cn(
    'flex min-h-[16.25rem] flex-col rounded-[0.75rem] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(11,31,74,0.06)]',
    !props.disabled && 'hover:shadow-[0_8px_24px_rgba(11,31,74,0.1)]',
  );

  if (props.disabled || !props.href) {
    return (
      <div className={className} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link to={props.href} className={cn(className, 'transition-shadow')}>
      {body}
    </Link>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: 'success' | 'info' | 'warning' | 'muted';
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[length:var(--cm-text-small)] font-semibold',
        tone === 'success' && 'bg-success/15 text-success',
        tone === 'info' && 'bg-info/10 text-info',
        tone === 'warning' && 'bg-warning/15 text-warning',
        tone === 'muted' && 'bg-muted text-muted-foreground',
      )}
    >
      {tone === 'success' ? <span className="size-1.5 rounded-full bg-success" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
