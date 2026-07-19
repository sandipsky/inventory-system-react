import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './notification.css';

export type NotificationType = 'success' | 'warn' | 'error' | 'info';

export type NotificationPosition =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight';

/** Options accepted by `show()` and the type shortcuts. */
export interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  message?: string;
  /** Auto-dismiss delay in ms. `0` keeps it open until dismissed manually. */
  duration?: number;
  position?: NotificationPosition;
  /** Pause the dismiss timer (and progress bar) while hovered. */
  pauseOnHover?: boolean;
  /** Render the shrinking progress bar that tracks the dismiss timer. */
  showProgress?: boolean;
  /** Render the × close button. */
  showClose?: boolean;
  /** Render the leading type icon. */
  withIcon?: boolean;
}

export const NOTIFICATION_DEFAULTS: Required<Omit<NotificationOptions, 'title' | 'message'>> = {
  type: 'info',
  duration: 4000,
  position: 'topRight',
  pauseOnHover: true,
  showProgress: true,
  showClose: true,
  withIcon: true,
};

/** Handle to a shown notification, returned by `show()`. */
export interface NotificationRef {
  readonly id: number;
  /** Begin dismissing this notification (plays the leave animation). */
  dismiss(): void;
}

/** Internal record for one live notification, held by the provider. */
interface NotificationItem extends Required<Omit<NotificationOptions, 'title' | 'message'>> {
  id: number;
  title?: string;
  message?: string;
  /** Drives the leave animation; set true to dismiss. */
  leaving: boolean;
}

export interface LUINotificationProps {
  type?: NotificationType;
  title?: string;
  message?: string;
  position?: NotificationPosition;
  duration?: number;
  pauseOnHover?: boolean;
  showProgress?: boolean;
  showClose?: boolean;
  withIcon?: boolean;
  /** When true, the card plays its leave animation and then calls `onClosed`. */
  leaving?: boolean;
  /** Requests dismissal (close clicked or timer elapsed) — the container drives the leave. */
  onRequestDismiss?: () => void;
  /** Fired once the leave animation has finished and the card can be removed. */
  onClosed?: () => void;
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'success':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
          <path
            d="M6 10.5 9 13.5 14.5 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'error':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'warn':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
          <path d="M10 5.5v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
          <path d="M10 9.5v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="10" cy="6" r="1" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * A single notification card (toast). Presentational: it renders the type icon,
 * title/message, optional close button and progress bar, and runs its own
 * dismiss timer off the progress animation (so "pause on hover" and the visible
 * bar share one clock). The owning provider adds/removes it.
 */
export function LUINotification({
  type = 'info',
  title,
  message,
  position = 'topRight',
  duration = 4000,
  pauseOnHover = true,
  showProgress = true,
  showClose = true,
  withIcon = true,
  leaving = false,
  onRequestDismiss,
  onClosed,
}: LUINotificationProps) {
  const classes = [
    'l-notification',
    `l-notification--${type}`,
    `l-notification--${position}`,
    pauseOnHover ? 'pause' : '',
    leaving ? 'is-leaving' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      role="alert"
      onAnimationEnd={(event) => {
        /* Only the host's own leave animation should finalize removal. */
        if (event.target === event.currentTarget && leaving) {
          onClosed?.();
        }
      }}
    >
      {withIcon && (
        <span className="l-notification__icon" aria-hidden="true">
          <NotificationIcon type={type} />
        </span>
      )}

      <div className="l-notification__body">
        {title && <p className="l-notification__title">{title}</p>}
        {message && <p className="l-notification__message">{message}</p>}
      </div>

      {showClose && (
        <button
          type="button"
          className="l-notification__close"
          aria-label="Dismiss"
          onClick={() => onRequestDismiss?.()}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5 5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {duration > 0 && (
        <div className={showProgress ? 'l-notification__progress' : 'l-notification__progress is-hidden'}>
          <span
            className="l-notification__progress-bar"
            style={{ animationDuration: `${duration}ms` }}
            onAnimationEnd={(event) => {
              event.stopPropagation();
              onRequestDismiss?.();
            }}
          ></span>
        </div>
      )}
    </div>
  );
}

const POSITIONS: NotificationPosition[] = [
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight',
];

/**
 * Imperative toast/notification API returned by {@link useLUINotification}.
 *
 * ```ts
 * const notify = useLUINotification();
 * notify.success('Saved', 'Your changes are live.');
 * notify.show({ type: 'error', title: 'Failed', position: 'bottomRight' });
 * ```
 */
export interface LUINotificationApi {
  show(options: NotificationOptions): NotificationRef;
  success(title: string, message?: string, options?: NotificationOptions): NotificationRef;
  error(title: string, message?: string, options?: NotificationOptions): NotificationRef;
  warn(title: string, message?: string, options?: NotificationOptions): NotificationRef;
  info(title: string, message?: string, options?: NotificationOptions): NotificationRef;
  /** Dismiss every open notification. */
  clear(): void;
}

const NotificationContext = createContext<LUINotificationApi | null>(null);

/** Imperative toast/notification hook — requires a mounted {@link LUINotificationProvider}. */
export function useLUINotification(): LUINotificationApi {
  const api = useContext(NotificationContext);
  if (!api) {
    throw new Error('useLUINotification() must be used within an <LUINotificationProvider>.');
  }
  return api;
}

/**
 * Holds the live notification list and renders it into `document.body` via a
 * portal, laid out into six fixed position regions. Mount once near the app
 * root; open toasts from anywhere with {@link useLUINotification}.
 */
export function LUINotificationProvider({ children }: { children?: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const nextIdRef = useRef(0);

  /** Start the leave animation for a notification. */
  const dismiss = (id: number): void => {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, leaving: true } : n)));
  };

  /** Remove a notification once its leave animation has finished. */
  const remove = (id: number): void => {
    setItems((current) => current.filter((n) => n.id !== id));
  };

  const show = (options: NotificationOptions): NotificationRef => {
    const id = nextIdRef.current++;
    const item: NotificationItem = { ...NOTIFICATION_DEFAULTS, ...options, id, leaving: false };
    setItems((current) => [...current, item]);
    return { id, dismiss: () => dismiss(id) };
  };

  const showTyped = (
    type: NotificationType,
    title: string,
    message?: string,
    options?: NotificationOptions,
  ): NotificationRef => show({ ...options, type, title, message });

  const api: LUINotificationApi = {
    show,
    success: (title, message, options) => showTyped('success', title, message, options),
    error: (title, message, options) => showTyped('error', title, message, options),
    warn: (title, message, options) => showTyped('warn', title, message, options),
    info: (title, message, options) => showTyped('info', title, message, options),
    clear: () => setItems((current) => current.map((n) => ({ ...n, leaving: true }))),
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      {createPortal(
        <>
          {POSITIONS.map((pos) => {
            const group = items.filter((n) => n.position === pos);
            if (group.length === 0) return null;
            return (
              <div key={pos} className={`notif-region notif-region--${pos}`}>
                {group.map((n) => (
                  <LUINotification
                    key={n.id}
                    type={n.type}
                    title={n.title}
                    message={n.message}
                    position={n.position}
                    duration={n.duration}
                    pauseOnHover={n.pauseOnHover}
                    showProgress={n.showProgress}
                    showClose={n.showClose}
                    withIcon={n.withIcon}
                    leaving={n.leaving}
                    onRequestDismiss={() => dismiss(n.id)}
                    onClosed={() => remove(n.id)}
                  />
                ))}
              </div>
            );
          })}
        </>,
        document.body,
      )}
    </NotificationContext.Provider>
  );
}
