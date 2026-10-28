'use client';

import { useEffect, useRef, useState } from 'react';

import { onAgentAttention } from '@/lib/agent-attention';
import { cn } from '@/lib/cn';
import {
  createShaderCanvas,
  glslBayer,
  glslNoise,
  prefersReducedMotion,
  readTokenColor,
  type RGB,
  watchTheme,
} from '@/lib/shader-canvas';

const PIXEL = 3; // CSS px per dither dot

const fragment = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLevel;   // voice loudness, 0–1
uniform vec2 uLight;    // cursor direction from the orb, roughly -1–1, y up
uniform vec3 uP0;
uniform vec3 uP1;
uniform vec3 uP2;
uniform vec3 uP3;
uniform vec3 uHalo;
${glslBayer}
${glslNoise}
void main() {
  vec2 frag = gl_FragCoord.xy;
  float b = bayer8(frag);
  float t = uTime;
  vec2 p = (frag - 0.5 * uRes) / (0.5 * min(uRes.x, uRes.y));
  p -= uLight * 0.035;  // lean a little toward the cursor

  // Silhouette: breathes slowly, swells and ripples with the voice.
  float ang = atan(p.y, p.x);
  float ripple = noise(vec3(cos(ang) * 1.6, sin(ang) * 1.6, t * 0.7)) - 0.5;
  float r = 0.66 + uLevel * 0.07 + 0.012 * sin(t * 1.3) + ripple * (0.025 + 0.11 * uLevel);
  float d = length(p);

  if (d > r) {
    // Dithered halo that brightens when it speaks.
    float glow = exp(-(d - r) * 7.0) * (0.22 + 0.6 * uLevel) * (1.0 - smoothstep(0.85, 0.99, d));
    gl_FragColor = glow > b ? vec4(uHalo, 1.0) : vec4(0.0);
    return;
  }

  // Sphere normal, then bend it with a flowing noise field on the surface.
  vec2 q = p / r;
  vec3 n = normalize(vec3(q, sqrt(max(0.0, 1.0 - dot(q, q)))));
  vec3 fp = n * 2.0 + vec3(0.0, t * 0.22, t * 0.12);
  float h = fbm(fp + fbm(fp * 1.3 - t * 0.1) * 1.4);
  vec3 bend = vec3(fbm(fp + 3.1), fbm(fp + 7.7), fbm(fp + 1.3)) - 0.5;
  vec3 m = normalize(n + bend * (0.35 + uLevel * 1.3));

  // Light comes from wherever the cursor is.
  vec3 L = normalize(vec3(uLight, 0.75));
  float diffuse = max(dot(m, L), 0.0);
  float spec = pow(max(dot(reflect(-L, m), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
  float rim = pow(1.0 - n.z, 3.0);
  float contours = smoothstep(0.35, 0.95, 0.5 + 0.5 * sin(h * 16.0 - t * 1.8));

  float shade = 0.06 + diffuse * 0.8 + spec * 0.7
    + rim * (0.12 + 0.35 * uLevel)
    + contours * (0.14 + 0.22 * uLevel) * (0.3 + 0.7 * diffuse);

  // Four-tone pumpkin ramp, ordered-dithered.
  float level = clamp(floor(clamp(shade, 0.0, 1.0) * 3.0 + b), 0.0, 3.0);
  vec3 color = level < 0.5 ? uP0 : (level < 1.5 ? uP1 : (level < 2.5 ? uP2 : uP3));
  gl_FragColor = vec4(color, 1.0);
}
`;

type Status = 'speaking' | 'listening';

/**
 * Stand-in for a live audio level. Alternates spoken phrases (syllable-rate pulses
 * with jitter) and pauses, with a fast attack and slow release like a VU meter.
 * Swap for an AnalyserNode RMS reading when there's real audio.
 */
function createFakeVoice() {
  let speaking = false;
  let phaseEnds = 0;
  let rate = 4.5;
  let phase = 0;
  let level = 0;

  let heardAt = -Infinity;
  let heard = 0;

  const voice = (now: number, dt: number) => {
    // While the user is typing, the agent stops talking and "hears" each keystroke.
    heard *= Math.exp(-dt * 5);
    if (now - heardAt < 1.4) {
      const k = 1 - Math.exp(-dt * (heard > level ? 30 : 8));
      level += (heard - level) * k;
      phaseEnds = now + 0.6;
      speaking = false;
      return { level, speaking };
    }
    if (now > phaseEnds) {
      speaking = !speaking;
      phaseEnds = now + (speaking ? 1.8 + Math.random() * 2.6 : 0.8 + Math.random() * 1.4);
      rate = 3.6 + Math.random() * 2.2;
    }
    phase += dt * rate * Math.PI;
    const target = speaking
      ? Math.pow(Math.abs(Math.sin(phase)), 1.6) * (0.5 + 0.5 * Math.random())
      : 0;
    const k = 1 - Math.exp(-dt * (target > level ? 28 : 7));
    level += (target - level) * k;
    return { level, speaking };
  };

  voice.hear = (now: number) => {
    heardAt = now;
    heard = Math.min(1, heard + 0.45);
  };

  return voice;
}

const BARS = [0.55, 0.85, 1, 0.75, 0.5];

/**
 * The Séance agent: a dithered orb whose surface flows on its own, swells with a
 * (simulated) voice, and is lit from the direction of the cursor. Decorative —
 * the caption carries the state for assistive tech.
 */
export function VoiceOrb({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<HTMLSpanElement>(null);
  const [status, setStatus] = useState<Status>('listening');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sc = createShaderCanvas(canvas, fragment);
    if (!sc) {
      setFailed(true);
      return;
    }

    const still = prefersReducedMotion();
    const voice = createFakeVoice();
    const light = { x: -0.4, y: 0.5 }; // eased
    const aim = { x: -0.4, y: 0.5 }; // where the cursor is
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let shown: Status = 'listening';

    const applyColors = () => {
      const p: RGB[] = [
        readTokenColor('pumpkin-900'),
        readTokenColor('pumpkin-700'),
        readTokenColor('pumpkin-500'),
        readTokenColor('pumpkin-200'),
      ];
      p.forEach((c, i) => sc.set(`uP${i}`, c));
      sc.set('uHalo', readTokenColor('bgAccent2'));
    };

    const render = (time: number, level: number) => {
      sc.resize(PIXEL);
      sc.set('uTime', time);
      sc.set('uLevel', level);
      sc.set('uLight', [light.x, light.y]);
      sc.draw();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { level, speaking } = voice(now / 1000, dt);
      const ease = 1 - Math.exp(-dt * 6);
      light.x += (aim.x - light.x) * ease;
      light.y += (aim.y - light.y) * ease;
      render(now / 1000, level);

      if (barsRef.current) {
        [...barsRef.current.children].forEach((bar, i) => {
          const s = 0.15 + level * BARS[i] * 0.85;
          (bar as HTMLElement).style.transform = `scaleY(${s.toFixed(3)})`;
        });
      }
      const next: Status = speaking ? 'speaking' : 'listening';
      if (next !== shown) {
        shown = next;
        setStatus(next);
      }
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    // Light comes from wherever attention is: the cursor, or the caret while typing.
    const aimAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const reach = Math.max(rect.width, 320);
      const dx = (clientX - (rect.left + rect.width / 2)) / reach;
      const dy = (clientY - (rect.top + rect.height / 2)) / reach;
      // Soft-clamp so far-away cursors still read as a direction, not an extreme.
      aim.x = Math.tanh(dx * 1.6) * 1.3;
      aim.y = -Math.tanh(dy * 1.6) * 1.3;
      if (still) {
        light.x = aim.x;
        light.y = aim.y;
        render(4, 0.2);
      }
    };

    const onPointer = (event: PointerEvent) => aimAt(event.clientX, event.clientY);
    const stopListening = onAgentAttention(({ x, y, pulse }) => {
      aimAt(x, y);
      if (pulse) voice.hear(performance.now() / 1000);
    });

    applyColors();
    if (still) render(4, 0.2);
    else raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !still && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => still && render(4, 0.2));
    ro.observe(canvas);

    window.addEventListener('pointermove', onPointer, { passive: true });
    const unwatch = watchTheme(() => {
      applyColors();
      if (still) render(4, 0.2);
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      unwatch();
      window.removeEventListener('pointermove', onPointer);
      stopListening();
      sc.dispose();
    };
  }, []);

  return (
    <figure className={cn('flex flex-col items-center gap-5', className)}>
      <div className="relative aspect-square w-full max-w-[22rem]">
        <canvas
          ref={canvasRef}
          aria-hidden
          className="block size-full [image-rendering:pixelated]"
        />
        {failed && (
          <div
            aria-hidden
            className="absolute inset-[17%] rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--dk-color-pumpkin-200),var(--dk-color-pumpkin-500)_45%,var(--dk-color-pumpkin-900))]"
          />
        )}
      </div>

      <figcaption className="flex items-center gap-3 font-mono text-xs text-fg3 uppercase">
        <span ref={barsRef} aria-hidden className="flex h-3 items-center gap-[2px]">
          {BARS.map((_, i) => (
            <span
              key={i}
              className="h-full w-[3px] origin-center bg-fgAccent1"
              style={{ transform: 'scaleY(0.15)' }}
            />
          ))}
        </span>
        <span>
          Séance agent · <span className="text-fg1">{status}</span>
        </span>
      </figcaption>
    </figure>
  );
}
