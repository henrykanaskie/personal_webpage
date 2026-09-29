// ─── WebGL helpers ──────────────────────────────────────────────────────────
// Shared by the two shaders that draw glass: DotField (the paper, the frost
// under cards and the cursor swell) and LiquidBud (a bubble budding off a
// card). Both draw the same glass edge, so it's written once, here.

/** Vertex shader for a single triangle that covers the viewport. */
export const FULLSCREEN_VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

/**
 * Compiles and links a program over FULLSCREEN_VERT without waiting on the
 * driver: with KHR_parallel_shader_compile the compile runs in the
 * background, and the returned poll says "pending" until it's done (a big
 * shader compiled synchronously froze the page on load, notably where WebGL
 * is translated for Metal). Without the extension, or with `parallel` off,
 * the first poll waits for it. Once done, the poll returns the program, made
 * current with the covering triangle bound to its `a` attribute, or null if
 * it didn't build, so the caller can fall back to what the DOM already shows.
 */
export function compileFullscreen(gl: WebGLRenderingContext, frag: string, parallel = true): () => WebGLProgram | null | "pending" {
  const prog = gl.createProgram();
  if (!prog) return () => null;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, FULLSCREEN_VERT],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return () => null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    gl.attachShader(prog, shader);
  }
  gl.linkProgram(prog);
  const par = parallel ? (gl.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null) : null;
  let done: WebGLProgram | null | undefined;
  return () => {
    if (done !== undefined) return done;
    if (par && !gl.getProgramParameter(prog, par.COMPLETION_STATUS_KHR)) return "pending";
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      // a broken shader would otherwise just skip the effect silently
      if (process.env.NODE_ENV !== "production") console.error("shader:", gl.getProgramInfoLog(prog));
      return (done = null);
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return (done = prog);
  };
}

/** Uniform locations by name, looked up once. */
export function uniforms<K extends string>(gl: WebGLRenderingContext, prog: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<K, WebGLUniformLocation | null>;
}

/** Normalised rgb for a uniform3f, from 0-255 channels. */
export const rgb = (c: readonly number[]) => [c[0] / 255, c[1] / 255, c[2] / 255] as const;

/**
 * GLSL shared by both shaders: signed distances, the glass itself, and the
 * glass edge (--edge-lip and --edge-film in app/globals.css).
 */
export const GLSL_GLASS = `
float sdBox(vec2 p, vec2 c, vec2 hs, float r) {
  vec2 q = abs(p - c) - hs + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// The glass: one material for every glass surface the shaders draw: a card
// (DotField, under the card's DOM fill), a card's swell toward the cursor,
// and a bubble budding out of its card (LiquidBud). It is the settled
// bubble's glass, modelled on what the browser does to it (.glass-bubble and
// useGlassLens in lib/liquid.tsx):
//   - what's behind (the dots and the line drawings) is blurred as by
//     blur(1.6px): the dots analytically (a small disk convolved with a
//     Gaussian of sigma 1.6: peak r^2 / 2 sigma^2), the drawings from their mipmaps
//   - the lens: flat in the middle, a 22px bevel at the rim with a circular
//     profile, sampling inward up to ~19px (lensMap at strength 38), each
//     colour bent a little more than the last (1, 1.07, 1.14) for dispersion
//   - saturate(1.25) and the brightness lift (--bubble-lift)
//   - the rim's inner light (the inset glow in --bubble-edge), glassGlow
// Needs uGap, uDotR, uDotA, uBg, uDot and uDark declared above it. off is
// the page position of the canvas' top-left, so the dots land on the page grid.
float glassDot(vec2 p, vec2 off) {
  vec2 c = (floor((p + off) / uGap) + 0.5) * uGap - off;
  vec2 q = p - c;
  const float S2 = 5.12; // 2 sigma^2, sigma 1.6
  return min(1.0, uDotR * uDotR / S2) * exp(-dot(q, q) / S2);
}
// The line drawings on the paper (lib/drawings), premultiplied, blurred by
// the glass's 1.6px. Each shader defines it: DotField paints the drawings;
// LiquidBud has none.
vec4 drawings(vec2 p, float blur);
// d: signed distance to the glass outline (negative inside); n: outward normal.
// The page as the glass sees it: the dots blurred (analytically), the
// drawings over them blurred by the same 1.6px, all bent through the lens.
// Each colour of the dots is bent a little more than the last (dispersion);
// the drawings are read once, at the middle colour's offset. This function
// is pasted whole into every place that calls it, and so is everything it
// calls: reading the drawings per colour put three more copies of the
// drawings' texture reads into the shader for each call, and the GPU has to
// build all of it before the first frame (seconds, on a cold load).
// This is the frost alone; glassTone adds the saturation and the lift.
vec3 glassFrost(vec2 p, vec2 off, float d, vec2 n) {
  float u = 1.0 - clamp(-d / 22.0, 0.0, 1.0);
  float tilt = 1.0 - sqrt(max(0.0, 1.0 - u * u));
  vec2 v = -n * tilt * 18.9; // zero across the flat middle
  vec3 dots = vec3(glassDot(p + v, off), glassDot(p + v * 1.07, off), glassDot(p + v * 1.14, off));
  vec3 col = mix(uBg, uDot, dots * uDotA);
  vec4 dr = drawings(p + v * 1.07, 1.6);
  return col * (1.0 - dr.a) + dr.rgb;
}
// saturate(1.25) brightness(lift), exactly as the CSS filters do them (the
// same luminance weights, clamped after each step), so the browser's glass
// (.glass-back) over the frost and this are the same arithmetic
vec3 glassTone(vec3 col) {
  float l = dot(col, vec3(0.213, 0.715, 0.072));
  vec3 s = clamp(mix(vec3(l), col, 1.25), 0.0, 1.0);
  return min(s * mix(1.02, 1.12, uDark), vec3(1.0));
}
vec3 glassSurface(vec2 p, vec2 off, float d, vec2 n) {
  return glassTone(glassFrost(p, off, d, n));
}
// how much white the rim's inner light adds, d inside the outline
float glassGlow(float d) {
  float x = max(-d, 0.0);
  return mix(0.42 * exp(-x / 12.0), 0.11 * exp(-x / 14.0), uDark);
}

// The thin film just inside the edge, by the direction the edge faces (n):
// pink on the left, cyan on the right, violet on top, gold below.
vec3 edgeFilm(vec2 n) {
  float wl = max(-n.x, 0.0), wr = max(n.x, 0.0), wt = max(-n.y, 0.0), wb = max(n.y, 0.0);
  return (vec3(1.0, 0.59, 0.8) * wl + vec3(0.47, 0.8, 1.0) * wr + vec3(0.73, 0.63, 1.0) * wt + vec3(1.0, 0.86, 0.55) * wb) / (wl + wr + wt + wb + 1e-3);
}

// The white hairline lip: brighter on top, a little on the bottom; fainter on the dark sheet.
float edgeLip(vec2 n, float dark) {
  return mix(0.45 + 0.47 * max(-n.y, 0.0) + 0.22 * max(n.y, 0.0), 0.09 + 0.19 * max(-n.y, 0.0), dark);
}

// How strongly the film band shows.
float edgeFilmA(float dark) { return mix(0.3, 0.27, dark); }
`;
