import React, { useCallback, useEffect, useRef } from 'react';
import { MediaItem } from '../../types.js';
import { CarouselEngine } from './carouselEngine.js';
import { DRAG_SENSITIVITY, MOUSE_SENSITIVITY, WHEEL_SENSITIVITY } from './carouselConfig.js';
import { CurveDef, getCardVisual, getCurveForWidth, wrappedDelta } from '../../lib/curvedPath.js';
import { FloatingMovieCard } from './FloatingMovieCard.js';

interface FloatingMovieCarouselProps {
  items: MediaItem[];
  activeIndex: number;
  reducedMotion: boolean;
  onActiveChange: (index: number) => void;
  onSelect: (item: MediaItem) => void;
  engineRef?: React.MutableRefObject<CarouselEngine | null>;
}

export const FloatingMovieCarousel: React.FC<FloatingMovieCarouselProps> = ({
  items,
  activeIndex,
  reducedMotion,
  onActiveChange,
  onSelect,
  engineRef,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const engine = useRef<CarouselEngine | null>(null);
  const curveRef = useRef<CurveDef>(getCurveForWidth(1200));
  const hovering = useRef(false);
  const pointerId = useRef<number | null>(null);
  const lastX = useRef(0);
  const dragDistance = useRef(0);
  const raf = useRef(0);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  const n = items.length;

  useEffect(() => {
    const handle = (index: number) => onActiveRef.current(index);
    if (!engine.current) {
      engine.current = new CarouselEngine(n, handle, 0);
    } else {
      engine.current.setCount(n);
      engine.current.onActiveChange = handle;
    }
    engine.current.setReducedMotion(reducedMotion);
    if (engineRef) engineRef.current = engine.current;
  }, [n, reducedMotion, engineRef]);

  const applyFrame = useCallback((now: number) => {
    const eng = engine.current;
    const root = rootRef.current;
    if (!eng || !root) return;
    eng.step(now);

    const width = root.clientWidth;
    const height = root.clientHeight;
    curveRef.current = getCurveForWidth(width);
    const curve = curveRef.current;
    const count = eng.n;

    for (let i = 0; i < count; i++) {
      const node = cardRefs.current[i];
      if (!node) continue;
      const delta = wrappedDelta(i, eng.progress, count);
      const visual = getCardVisual(delta, curve);
      const floatY = reducedMotion ? 0 : Math.sin(now / 900 + i * 1.17) * 4.5;
      const floatR = reducedMotion ? 0 : Math.sin(now / 1400 + i * 0.8) * 1.2;
      const x = visual.x * width - 46;
      const y = visual.y * height - 69 + floatY;

      node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${visual.rotate + floatR}deg) scale(${visual.scale})`;
      node.style.opacity = String(visual.opacity);
      node.style.zIndex = String(visual.zIndex);
      node.style.filter = visual.visible
        ? `blur(${visual.blur}px) brightness(${visual.brightness})`
        : 'none';
      node.style.pointerEvents = visual.visible ? 'auto' : 'none';
      node.style.boxShadow = visual.isFeatured
        ? '0 0 0 1px rgba(53,194,200,0.45), 0 0 28px rgba(25,167,199,0.28), 0 18px 40px rgba(0,0,0,0.5)'
        : '0 10px 24px rgba(0,0,0,0.4)';
      node.setAttribute('aria-current', visual.isFeatured ? 'true' : 'false');
    }
  }, [reducedMotion]);

  useEffect(() => {
    let running = true;
    const loop = (now: number) => {
      if (!running) return;
      applyFrame(now);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf.current);
    };
  }, [applyFrame, items.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheel = (e: WheelEvent) => {
      const eng = engine.current;
      if (!eng) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 1) return;
      e.preventDefault();
      eng.pause();
      eng.nudge(delta * WHEEL_SENSITIVITY);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, []);

  const pauseAuto = () => {
    hovering.current = true;
    engine.current?.pause();
  };

  const resumeAuto = () => {
    hovering.current = false;
    if (!engine.current?.dragging) engine.current?.resume();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const eng = engine.current;
    if (!eng) return;

    if (pointerId.current === e.pointerId) {
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      dragDistance.current += Math.abs(dx);
      if (dragDistance.current > 6) eng.dragging = true;
      if (eng.dragging) {
        eng.nudge(-dx * DRAG_SENSITIVITY);
        return;
      }
    }

    if (hovering.current && e.pointerType === 'mouse' && !reducedMotion && !eng.dragging) {
      eng.nudge(e.movementX * MOUSE_SENSITIVITY);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const eng = engine.current;
    if (!eng) return;
    eng.pause();
    pointerId.current = e.pointerId;
    lastX.current = e.clientX;
    dragDistance.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const eng = engine.current;
    if (!eng) return;
    eng.dragging = false;
    pointerId.current = null;
    if (!hovering.current) eng.resume();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const eng = engine.current;
    if (!eng) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      eng.goBy(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      eng.goBy(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[eng.wrapIndex(eng.progress)];
      if (item) onSelect(item);
    }
  };

  if (n === 0) return null;

  return (
    <div
      ref={rootRef}
      role="listbox"
      aria-label="Dòng phim trôi theo hải lưu"
      aria-activedescendant={items[activeIndex]?.id}
      tabIndex={0}
      onPointerEnter={pauseAuto}
      onPointerLeave={() => {
        if (engine.current) engine.current.dragging = false;
        pointerId.current = null;
        resumeAuto();
      }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="relative h-[240px] sm:h-[280px] lg:h-[340px] w-full select-none touch-pan-y outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/40 rounded-md"
    >
      {items.map((item, i) => (
        <FloatingMovieCard
          key={item.id}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          item={item}
          onActivate={() => engine.current?.goTo(i)}
          onOpen={() => {
            if (dragDistance.current > 10) return;
            engine.current?.goTo(i);
            onSelect(item);
          }}
        />
      ))}

      <div className="pointer-events-none absolute bottom-1 right-2 hidden sm:flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
        <span className="inline-block h-4 w-4 rounded-full border border-white/25" />
        Di chuyển chuột để khám phá
      </div>
    </div>
  );
};
