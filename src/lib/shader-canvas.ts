/**
 * Tiny WebGL helper for full-screen fragment shaders, plus the GLSL chunks the
 * DeadKit dithered effects share. No dependencies.
 *
 * Effects render at a low resolution (one canvas pixel = `pixelSize` CSS pixels)
 * and are scaled up with `image-rendering: pixelated`, so every dither dot lands on
 * the same chunky grid as the pumpkin mark — and it's cheap to run.
 */

export type RGB = [number, number, number];

export type ShaderCanvas = {
  gl: WebGLRenderingContext;
  /** Set a uniform by name. Numbers → float, 2/3-length arrays → vec2/vec3. */
  set: (name: string, value: number | readonly number[]) => void;
  /** Match the canvas backing size to its CSS size. Returns true if it changed. */
  resize: (pixelSize: number) => boolean;
  draw: () => void;
  dispose: () => void;
};

const vertexSource = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export function createShaderCanvas(
  canvas: HTMLCanvasElement,
  fragmentSource: string,
): ShaderCanvas | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // One oversized triangle covers the whole viewport.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const locations = new Map<string, WebGLUniformLocation | null>();
  const location = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name)!;
  };

  const set: ShaderCanvas['set'] = (name, value) => {
    const loc = location(name);
    if (!loc) return;
    if (typeof value === 'number') gl.uniform1f(loc, value);
    else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else gl.uniform3f(loc, value[0], value[1], value[2]);
  };

  return {
    gl,
    set,
    resize(pixelSize) {
      const w = Math.max(1, Math.round(canvas.clientWidth / pixelSize));
      const h = Math.max(1, Math.round(canvas.clientHeight / pixelSize));
      if (canvas.width === w && canvas.height === h) return false;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      set('uRes', [w, h]);
      return true;
    },
    draw() {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

/** Read a `--dk-color-*` token from the current theme as 0–1 RGB. */
export function readTokenColor(token: string, from: Element = document.documentElement): RGB {
  const raw = getComputedStyle(from).getPropertyValue(`--dk-color-${token}`).trim();
  const hex = raw.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Call `onChange` whenever the DeadKit theme attribute flips. Returns a cleanup. */
export function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-dk-theme'],
    subtree: false,
  });
  return () => observer.disconnect();
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* GLSL chunks ------------------------------------------------------------------------------ */

/** Ordered (Bayer) dithering threshold, 0–1, for an integer pixel coordinate. */
export const glslBayer = `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`;

/** 3D value noise and 4-octave fractal noise. */
export const glslNoise = `
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.02 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}
`;
