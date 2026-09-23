import { AUTO_PLAY_INTERVAL_MS } from './carouselConfig.js';

export const AUTO_PLAY_INTERVAL = AUTO_PLAY_INTERVAL_MS;

export class CarouselEngine {
  progress = 0;
  target = 0;
  n = 1;
  paused = false;
  dragging = false;
  reducedMotion = false;
  lastTime = 0;
  lastActive = 0;
  onActiveChange: (index: number) => void;

  constructor(n: number, onActiveChange: (index: number) => void, initialIndex = 0) {
    this.n = Math.max(1, n);
    this.onActiveChange = onActiveChange;
    this.progress = initialIndex;
    this.target = initialIndex;
    this.lastActive = this.wrapIndex(initialIndex);
  }

  wrapIndex(value: number): number {
    const n = this.n;
    return ((Math.round(value) % n) + n) % n;
  }

  setCount(n: number) {
    this.n = Math.max(1, n);
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    if (value) {
      this.progress = this.wrapIndex(this.progress);
      this.target = this.progress;
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  nudge(deltaCards: number) {
    this.target += deltaCards;
  }

  goBy(steps: number) {
    this.target += steps;
    if (this.reducedMotion) {
      this.progress = this.wrapIndex(this.progress + steps);
      this.target = this.progress;
      this.emitActive();
    }
  }

  goTo(index: number) {
    const current = this.wrapIndex(this.progress);
    const dest = ((index % this.n) + this.n) % this.n;
    let delta = dest - current;
    if (delta > this.n / 2) delta -= this.n;
    if (delta < -this.n / 2) delta += this.n;
    this.target = this.progress + delta;
    if (this.reducedMotion) {
      this.progress = dest;
      this.target = dest;
      this.emitActive();
    }
  }

  private emitActive() {
    const active = this.wrapIndex(this.progress);
    if (active !== this.lastActive) {
      this.lastActive = active;
      this.onActiveChange(active);
    }
  }

  private wrapProgress() {
    if (this.n <= 0) return;
    if (this.progress > this.n * 8 || this.target > this.n * 8) {
      this.progress -= this.n * 4;
      this.target -= this.n * 4;
    } else if (this.progress < -this.n * 4 || this.target < -this.n * 4) {
      this.progress += this.n * 4;
      this.target += this.n * 4;
    }
  }

  step(now: number) {
    if (!this.lastTime) this.lastTime = now;
    const dt = Math.min(48, now - this.lastTime);
    this.lastTime = now;

    if (!this.paused && !this.dragging && !this.reducedMotion) {
      this.target += dt / AUTO_PLAY_INTERVAL_MS;
    }

    const k = this.dragging ? 0.18 : this.reducedMotion ? 1 : 0.075;
    this.progress += (this.target - this.progress) * (1 - Math.pow(1 - k, dt / 16.67));
    this.wrapProgress();
    this.emitActive();
  }
}
