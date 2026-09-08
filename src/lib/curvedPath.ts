export interface Vec2 {
  x: number;
  y: number;
}

export interface CurveDef {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
}

/** Rising underwater current — lower-left to upper-right. */
export const DESKTOP_CURVE: CurveDef = {
  p0: { x: 0.02, y: 0.90 },
  p1: { x: 0.22, y: 0.98 },
  p2: { x: 0.48, y: 0.42 },
  p3: { x: 0.96, y: 0.08 },
};

/** Flatter arc for tablets. */
export const TABLET_CURVE: CurveDef = {
  p0: { x: 0.02, y: 0.78 },
  p1: { x: 0.28, y: 0.92 },
  p2: { x: 0.58, y: 0.48 },
  p3: { x: 0.98, y: 0.22 },
};

/** Compact horizontal current for mobile. */
export const MOBILE_CURVE: CurveDef = {
  p0: { x: 0.00, y: 0.62 },
  p1: { x: 0.30, y: 0.82 },
  p2: { x: 0.62, y: 0.38 },
  p3: { x: 1.00, y: 0.48 },
};

export const FEATURED_T = 0.48;
export const CARD_SPACING = 0.125;
export const VISIBLE_HALF_SPAN = 3.2;

export function cubicBezier2D(t: number, curve: CurveDef): Vec2 {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * curve.p0.x + 3 * uu * t * curve.p1.x + 3 * u * tt * curve.p2.x + ttt * curve.p3.x,
    y: uuu * curve.p0.y + 3 * uu * t * curve.p1.y + 3 * u * tt * curve.p2.y + ttt * curve.p3.y,
  };
}

export function getCurveForWidth(width: number): CurveDef {
  if (width < 640) return MOBILE_CURVE;
  if (width < 1024) return TABLET_CURVE;
  return DESKTOP_CURVE;
}

/** Shortest wrapped delta from progress to index, in card units. */
export function wrappedDelta(index: number, progress: number, n: number): number {
  if (n <= 0) return 0;
  let d = index - progress;
  d -= n * Math.round(d / n);
  return d;
}

export interface CardVisual {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotate: number;
  zIndex: number;
  blur: number;
  brightness: number;
  isFeatured: boolean;
  visible: boolean;
}

export function getCardVisual(delta: number, curve: CurveDef): CardVisual {
  const t = FEATURED_T - delta * CARD_SPACING;
  const outOfPath = t < 0.02 || t > 0.98 || Math.abs(delta) > VISIBLE_HALF_SPAN;
  const pos = cubicBezier2D(Math.min(1, Math.max(0, t)), curve);

  const dist = Math.min(Math.abs(delta), VISIBLE_HALF_SPAN);
  const proximity = 1 - dist / VISIBLE_HALF_SPAN;
  const ease = proximity * proximity * (3 - 2 * proximity);
  const featured = Math.abs(delta) < 0.42;

  let opacity = 0.22 + ease * 0.78;
  if (t < 0.08) opacity *= t / 0.08;
  if (t > 0.92) opacity *= (1 - t) / 0.08;
  if (outOfPath) opacity = 0;

  return {
    x: pos.x,
    y: pos.y,
    scale: 0.52 + ease * 0.62,
    opacity,
    rotate: delta * -7.5,
    zIndex: Math.round(10 + ease * 90),
    blur: (1 - ease) * 5.5,
    brightness: 0.55 + ease * 0.5,
    isFeatured: featured,
    visible: !outOfPath && opacity > 0.04,
  };
}
