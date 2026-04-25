'use client';

import { useEffect, useRef, useState } from 'react';

type CursorState = {
  visible: boolean;
  interactive: boolean;
  pressed: boolean;
  label: string;
};

export function PremiumCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const [state, setState] = useState<CursorState>({
    visible: false,
    interactive: false,
    pressed: false,
    label: '',
  });

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!media.matches || reduced.matches) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    document.body.classList.add('has-premium-cursor');

    const tick = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.18;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.18;

      root.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0)`;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const syncTargetState = (element: HTMLElement | null) => {
      const labeled = element?.closest<HTMLElement>('[data-cursor-label]');
      const interactive = Boolean(
        element?.closest('a, button, [role="button"], [data-cursor-variant], input[type="button"], input[type="submit"]')
      );

      setState((prev) => {
        const nextLabel = labeled?.dataset.cursorLabel ?? '';

        if (prev.interactive === interactive && prev.label === nextLabel) {
          return prev;
        }

        return {
          ...prev,
          interactive,
          label: nextLabel,
        };
      });
    };

    const handleMove = (event: MouseEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };

      if (!rafRef.current) {
        currentRef.current = { x: event.clientX, y: event.clientY };
        root.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        rafRef.current = window.requestAnimationFrame(tick);
      }

      syncTargetState(event.target instanceof HTMLElement ? event.target : null);

      setState((prev) => (prev.visible ? prev : { ...prev, visible: true }));
    };

    const handleWindowOut = (event: MouseEvent) => {
      if (event.relatedTarget !== null) {
        return;
      }

      setState((prev) => ({ ...prev, visible: false, pressed: false, interactive: false, label: '' }));
    };

    const handleDown = () => {
      setState((prev) => ({ ...prev, pressed: true }));
    };

    const handleUp = () => {
      setState((prev) => ({ ...prev, pressed: false }));
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mouseout', handleWindowOut);

    return () => {
      document.body.classList.remove('has-premium-cursor');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mouseout', handleWindowOut);

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={[
        'site-cursor',
        state.visible ? 'is-visible' : '',
        state.interactive ? 'is-interactive' : '',
        state.pressed ? 'is-pressed' : '',
        state.label ? 'has-label' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <span className="site-cursor__ring" />
      <span className="site-cursor__dot" />
      <span className="site-cursor__spark" />
      {state.label ? <span className="site-cursor__label">{state.label}</span> : null}
    </div>
  );
}
