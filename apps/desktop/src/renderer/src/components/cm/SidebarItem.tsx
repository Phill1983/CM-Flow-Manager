import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SidebarItem(props: {
  to?: string;
  end?: boolean;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  if (props.disabled || !props.to) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-3 text-[0.92rem] text-white/55"
        title={props.title}
      >
        <span className="inline-flex w-5 justify-center opacity-80">{props.icon}</span>
        <span className="truncate">{props.label}</span>
      </span>
    );
  }

  return (
    <NavLink
      to={props.to}
      end={props.end}
      title={props.title}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-md px-3 py-3 text-[0.92rem] transition-colors',
          'text-white/88 hover:bg-white/[0.09] hover:text-white',
          isActive &&
            'bg-[#1a4a96] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-r-sm before:bg-cm-yellow before:content-[""]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('inline-flex w-5 justify-center', isActive ? 'text-white' : 'text-white/90')}>
            {props.icon}
          </span>
          <span className="truncate">{props.label}</span>
        </>
      )}
    </NavLink>
  );
}
