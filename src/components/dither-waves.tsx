'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import {
  createShaderCanvas,
  glslBayer,
  glslNoise,
  prefersReducedMotion,
  readTokenColor,
  watchTheme,
} from '@/lib/shader-canvas';

const PIXEL = 3; // CSS px per dither dot

const fragment = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uMaskX;   // 1 = fade in toward the right (desktop), 0 = toward the bottom (mobile)
uniform vec3 uBg;
uniform vec3 uC1;
uniform vec3 uC2;
${glslBayer}
${glslNoise}
void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;                       // 0–1, y up
  vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y) * 2.4;
  float t = uTime;

  // Domain-warped bands: slow sine waves bent by fractal noise.
  float warp = fbm(vec3(p * 0.7, t * 0.05));
  float wave = sin(p.y * 3.2 + p.x * 0.9 + warp * 5.5 - t * 0.35);
  float bands = smoothstep(0.1, 1.0, wave);
  float grain = fbm(vec3(p * 1.8 + warp, t * 0.08));
  float v = bands * 0.6 + grain * 0.4 - 0.28;

  // Strongest where the orb lives; a faint wash everywhere else.
  float toward = mix(1.0 - smoothstep(0.0, 0.7, uv.y), smoothstep(0.3, 0.9, uv.x), uMaskX);
  v *= mix(0.3, 0.85, toward);

  // Three tones, ordered-dithered.
  float level = floor(clamp(v, 0.0, 1.0) * 2.0 + bayer8(frag));
  vec3 color = level < 0.5 ? uBg : (level < 1.5 ? uC1 : uC2);
  gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Animated noise-wave field, Bayer-dithered into three theme colors. Fills its
 * positioned parent; decorative only. Pauses offscreen and holds still for
 * reduced-motion users.
 */
export function DitherWaves({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sc = createShaderCanvas(canvas, fragment);
    if (!sc) return;

    const still = prefersReducedMotion();
    const desktop = window.matchMedia('(min-width: 1024px)');
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const applyColors = () => {
      sc.set('uBg', readTokenColor('bg1'));
      sc.set('uC1', readTokenColor('separator1'));
      sc.set('uC2', readTokenColor('separatorAccent'));
    };

    const render = (time: number) => {
      sc.resize(PIXEL);
      sc.set('uMaskX', desktop.matches ? 1 : 0);
      sc.set('uTime', still ? 12 : (time - start) / 1000);
      sc.draw();
    };

    const loop = (time: number) => {
      render(time);
      raf = visible && !still ? requestAnimationFrame(loop) : 0;
    };

    const kick = () => {
      if (still) render(performance.now());
      else if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    applyColors();
    kick();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => still && render(performance.now()));
    ro.observe(canvas);

    const unwatch = watchTheme(() => {
      applyColors();
      if (still) render(performance.now());
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      unwatch();
      sc.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none block size-full [image-rendering:pixelated]', className)}
    />
  );
}
