"use client";

import { useEffect, useRef } from "react";
import styles from "./home.module.css";

/*!
 * Canvas Ribbons, adapted from Boris Šehovac (c) 2026, MIT.
 * https://codepen.io/bsehovac/pen/LQVzxJ
 * License: /brand/canvas-ribbons/LICENSE.txt
 * Retains the original sine-driven Bezier curves and line-history geometry.
 */
type Angles = [number, number, number, number];
type Wave = { angles: Angles; speeds: Angles; lines: Angles[]; color: string };
const TRAIL_LENGTH = 120;
const FRAME_INTERVAL = 1000 / 30;

function advance(wave: Wave) {
  const a = wave.angles;
  const s = wave.speeds;
  wave.lines.push([
    Math.sin(a[0] += s[0]), Math.sin(a[1] += s[1]),
    Math.sin(a[2] += s[2]), Math.sin(a[3] += s[3]),
  ]);
  if (wave.lines.length > TRAIL_LENGTH) wave.lines.shift();
}

export function HomeRibbons() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    // The CSS field remains visible when Canvas/ResizeObserver is unavailable.
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tokens = getComputedStyle(canvas);
    const colors = ["--color-primary-400", "--color-primary-500", "--color-brand-muted"]
      .map((name) => tokens.getPropertyValue(name).trim() || "#868D98");
    const randomAngle = () => Math.random() * Math.PI * 2;
    const randomSpeed = () => (0.004 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1);
    const waves: Wave[] = colors.map((color) => ({
      color,
      angles: [randomAngle(), randomAngle(), randomAngle(), randomAngle()],
      speeds: [randomSpeed(), randomSpeed(), randomSpeed(), randomSpeed()],
      lines: [],
    }));
    waves.forEach((wave) => { for (let i = 0; i < TRAIL_LENGTH; i++) advance(wave); });

    const render = (update = false) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const radius = Math.hypot(canvas.width, canvas.height) / 2;
      const third = radius / 3;
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      const rotation = Math.PI / 4;
      ctx.globalAlpha = 0.1;
      for (const wave of waves) {
        if (update) advance(wave);
        ctx.strokeStyle = wave.color;
        for (const a of wave.lines) {
          ctx.beginPath();
          ctx.moveTo(x - radius * Math.cos(a[0] * 0.5 + rotation), y - radius * Math.sin(a[0] * 0.5 + rotation));
          ctx.bezierCurveTo(
            x - third * Math.cos(a[1]), y - third * Math.sin(a[1]),
            x + third * Math.cos(a[2]), y + third * Math.sin(a[2]),
            x + radius * Math.cos(a[3] * 0.5 + rotation), y + radius * Math.sin(a[3] * 0.5 + rotation),
          );
          ctx.stroke();
        }
      }
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(box.width * scale));
      canvas.height = Math.max(1, Math.round(box.height * scale));
      ctx.lineWidth = scale;
      render();
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | undefined;
    let previous = 0;
    let onScreen = true;
    const tick = (time: number) => {
      if (time - previous >= FRAME_INTERVAL) {
        render(true);
        previous = time - (time - previous) % FRAME_INTERVAL;
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      const active = !motion.matches && !document.hidden && onScreen;
      canvas.dataset.motion = motion.matches ? "static" : active ? "animated" : "paused";
      if (active) {
        previous = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const observer = new ResizeObserver(resize);
    const intersection = typeof IntersectionObserver !== "undefined"
      // Edge-adjacent rectangles can still be "intersecting" with zero visible area.
      ? new IntersectionObserver(([entry]) => { onScreen = (entry?.intersectionRatio ?? 0) > 0.001; sync(); }, { threshold: 0.001 })
      : undefined;
    resize();
    observer.observe(canvas);
    intersection?.observe(canvas);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect();
      intersection?.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return <canvas ref={ref} className={styles.ribbons} data-ribbons aria-hidden="true" />;
}
