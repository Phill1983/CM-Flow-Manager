export type LocaleCode = 'pl' | 'uk' | 'en';

export const SUPPORTED_LOCALES: readonly LocaleCode[] = ['pl', 'uk', 'en'] as const;

export const DEFAULT_LOCALE: LocaleCode = 'pl';

export type MessageKey =
  | 'app.name'
  | 'nav.dashboard'
  | 'nav.pdfTools'
  | 'nav.passwordRemover'
  | 'nav.activity'
  | 'nav.settings'
  | 'nav.about'
  | 'dashboard.title'
  | 'dashboard.lead'
  | 'dashboard.privacy'
  | 'dashboard.quickActions'
  | 'dashboard.recentActivity'
  | 'dashboard.recentEmpty'
  | 'dashboard.localStatus'
  | 'dashboard.localStatusValue'
  | 'dashboard.openPasswordRemover'
  | 'passwordRemover.title'
  | 'passwordRemover.lead'
  | 'passwordRemover.privacy'
  | 'passwordRemover.engineUnavailable'
  | 'activity.title'
  | 'activity.empty'
  | 'settings.title'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.themeLight'
  | 'settings.themeDark'
  | 'settings.themeSystem'
  | 'about.title'
  | 'about.version'
  | 'about.localOnly'
  | 'common.comingLater';

export type MessageCatalog = Record<MessageKey, string>;
