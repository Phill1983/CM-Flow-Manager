import heroBannerUrl from '@/assets/cm-ui/hero/hero-banner.jpg';

export function DashboardHero(props: {
  eyebrow: string;
  title: string;
  lead: string;
  imageAlt: string;
}) {
  return (
    <div className="relative isolate min-h-[13.75rem] overflow-hidden rounded-[0.75rem] shadow-[0_12px_32px_rgba(11,31,74,0.2)] lg:min-h-[14.5rem]">
      <img
        src={heroBannerUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden="true"
      />
      <header className="relative z-10 flex h-full min-h-[13.75rem] max-w-[34rem] flex-col justify-center gap-2 px-8 py-6 lg:min-h-[14.5rem] lg:px-10">
        <p className="text-[length:var(--cm-text-body)] text-white/75">{props.eyebrow}</p>
        <h1 className="text-[length:var(--cm-text-h1)] font-bold leading-[1.12] tracking-tight text-white">
          {props.title}
        </h1>
        <p className="max-w-md text-[length:var(--cm-text-body)] leading-relaxed text-white/85">{props.lead}</p>
      </header>
      <span className="sr-only">{props.imageAlt}</span>
    </div>
  );
}
