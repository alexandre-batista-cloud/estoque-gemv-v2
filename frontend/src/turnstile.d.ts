interface TurnstileRenderParams {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  action?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, params: TurnstileRenderParams) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export {};
