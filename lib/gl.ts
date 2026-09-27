// ─── WebGL helpers ──────────────────────────────────────────────────────────
// Shared by the two shaders that draw glass: DotField (the paper, the frost
// under cards and the cursor swell) and LiquidBud (a bubble budding off a
// card). Both draw the same glass edge, so it's written once, here.

/** Vertex shader for a single triangle that covers the viewport. */
export const FULLSCREEN_VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

/**
 * Compiles and links a program over FULLSCREEN_VERT, makes it current and
 * binds the covering triangle to its `a` attribute. Returns null if the shader
 * doesn't build, so the caller can fall back to whatever the DOM already shows.
 */
export function fullscreenProgram(gl: WebGLRenderingContext, frag: string): WebGLProgram | null {
  const prog = gl.createProgram();
  if (!prog) return null;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, FULLSCREEN_VERT],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    gl.attachShader(prog, shader);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    // a broken shader would otherwise just skip the effect silently
    if (process.env.NODE_ENV !== "production") console.error("shader:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return prog;
}

/** Uniform locations by name, looked up once. */
export function uniforms<K extends string>(gl: WebGLRenderingContext, prog: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<K, WebGLUniformLocation | null>;
}

/** Normalised rgb for a uniform3f, from 0-255 channels. */
export const rgb = (c: readonly number[]) => [c[0] / 255, c[1] / 255, c[2] / 255] as const;

/**
 * GLSL shared by both shaders: signed distances, the frosted dots under glass,
 * and the glass edge (--edge-lip and --edge-film in app/globals.css).
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

// Frosted dots: the paper's grid (page-anchored: page is the page position of
// the canvas' top-left), each dot spread soft and wide.
float frostDots(vec2 p, vec2 page, float gap, float dotR) {
  vec2 w = p + page;
  vec2 c = (floor(w / gap) + 0.5) * gap - page;
  float d = length(p - c);
  float R = dotR + 2.6;
  return smoothstep(R, 0.0, d) * 0.6;
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
