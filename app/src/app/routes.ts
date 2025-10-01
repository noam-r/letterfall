export const APP_VIEW = {
  Start: 'start',
  Playing: 'playing',
  Settings: 'settings',
  Help: 'help',
  About: 'about',
} as const;

export type AppView = (typeof APP_VIEW)[keyof typeof APP_VIEW];

export type AppViewState = {
  view: AppView;
};

export const defaultViewState: AppViewState = {
  view: APP_VIEW.Start,
};
