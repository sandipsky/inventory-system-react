import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DrawerContainer } from './drawer-container';
import { DrawerRef } from './drawer-ref';
import { DRAWER_DEFAULTS, type DrawerConfig } from './drawer.config';

/**
 * Drawer content — plain JSX, or a render function that receives the
 * `DrawerRef` so the content can close its own drawer (and read
 * `ref.config.data`).
 */
export type DrawerContent<R = unknown> = ReactNode | ((ref: DrawerRef<R>) => ReactNode);

/** Imperative drawer API returned by `useLUIDrawer()`. */
export interface LUIDrawerApi {
  /**
   * Open an edge-anchored drawer with the given content; returns a
   * `DrawerRef` handle (close / afterClosed).
   */
  open<R = unknown, D = unknown>(content: DrawerContent<R>, config?: DrawerConfig<D>): DrawerRef<R>;

  /** Close every open drawer. */
  closeAll(): void;
}

interface OpenDrawer {
  key: number;
  content: DrawerContent;
  drawerRef: DrawerRef;
}

const DrawerContext = createContext<LUIDrawerApi | null>(null);

let _uid = 0;

/**
 * React counterpart of the Angular `DrawerService` — opens edge-anchored
 * drawers (left / right / bottom).
 *
 * Mirrors `LUIModalProvider`: mount once near the app root and call
 * `useLUIDrawer()` anywhere below it. Containers render into `document.body`
 * via `createPortal` and play pure-CSS slide animations chosen by
 * `config.position`; body scroll is locked while any drawer is open.
 */
export function LUIDrawerProvider({ children }: { children?: ReactNode }) {
  const [drawers, setDrawers] = useState<OpenDrawer[]>([]);
  const live = useRef<OpenDrawer[]>([]);

  function open<R = unknown, D = unknown>(
    content: DrawerContent<R>,
    config: DrawerConfig<D> = {},
  ): DrawerRef<R> {
    const merged: DrawerConfig<D> = { ...DRAWER_DEFAULTS, ...config };
    const drawerRef = new DrawerRef<R>(merged);
    const item: OpenDrawer = { key: _uid++, content: content as DrawerContent, drawerRef: drawerRef as unknown as DrawerRef };

    live.current = [...live.current, item];
    setDrawers(live.current);

    void drawerRef.afterClosed().then(() => {
      live.current = live.current.filter((d) => d !== item);
      setDrawers(live.current);
    });

    return drawerRef;
  }

  function closeAll(): void {
    [...live.current].forEach((d) => d.drawerRef.close());
  }

  const api: LUIDrawerApi = { open, closeAll };

  const anyOpen = drawers.length > 0;
  useEffect(() => {
    if (!anyOpen) {
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyOpen]);

  return (
    <DrawerContext.Provider value={api}>
      {children}
      {drawers.map((d) =>
        createPortal(
          <DrawerContainer drawerRef={d.drawerRef}>
            {typeof d.content === 'function' ? d.content(d.drawerRef) : d.content}
          </DrawerContainer>,
          document.body,
          `lui-drawer-${d.key}`,
        ),
      )}
    </DrawerContext.Provider>
  );
}

/** Access the imperative drawer API. Must be used below `LUIDrawerProvider`. */
export function useLUIDrawer(): LUIDrawerApi {
  const api = useContext(DrawerContext);
  if (!api) {
    throw new Error('useLUIDrawer() must be used within an <LUIDrawerProvider>.');
  }
  return api;
}
