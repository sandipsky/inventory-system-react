import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { DrawerRef } from './drawer-ref';
import './drawer-container.css';

type DrawerState = 'enter' | 'leave';

export interface DrawerContainerProps {
  drawerRef: DrawerRef;
  children?: ReactNode;
}

/**
 * Host component rendered into `<body>` (via `createPortal`) by
 * `LUIDrawerProvider`. Owns the backdrop, the edge-anchored panel, the
 * position-driven slide animations, and renders the supplied content.
 */
export function DrawerContainer({ drawerRef, children }: DrawerContainerProps) {
  const [state, setState] = useState<DrawerState>('enter');
  const config = drawerRef.config;

  useEffect(() => {
    // Let the container drive the leave animation when close() is called.
    drawerRef._setStartClose(() => setState('leave'));
  }, [drawerRef]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !drawerRef.config.disableClose) {
        drawerRef.close();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [drawerRef]);

  const onBackdropClick = () => {
    if (!drawerRef.config.disableClose) {
      drawerRef.close();
    }
  };

  const position = config.position ?? 'right';
  const isHorizontal = position === 'left' || position === 'right';
  const extra = config.panelClass
    ? Array.isArray(config.panelClass)
      ? config.panelClass
      : [config.panelClass]
    : [];
  const panelClasses = [
    'drawer-panel',
    `drawer-panel--${position}`,
    `drawer-anim--${state}`,
    ...extra,
  ].join(' ');

  return (
    <div
      className={state === 'leave' ? 'drawer-overlay drawer-overlay--leaving' : 'drawer-overlay'}
      style={{ '--drawer-duration': `${config.animationDuration ?? 280}ms` } as CSSProperties}
    >
      {config.backdrop !== false && <div className="drawer-backdrop" onClick={onBackdropClick} />}

      <div
        className={panelClasses}
        style={{
          width: isHorizontal ? config.size : undefined,
          height: !isHorizontal ? config.size : undefined,
        }}
        role="dialog"
        aria-modal="true"
        onAnimationEnd={(event) => {
          // Only react to the panel's own animation, and only on the way out.
          if (event.target === event.currentTarget && state === 'leave') {
            drawerRef._finishClose();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
