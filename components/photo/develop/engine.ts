// ─── GPU develop engine ──────────────────────────────────────────────────────
// A small raw-style image pipeline in a single WebGL2 fragment shader. Exposure
// and white balance run in linear light (as a raw converter does), tone and
// colour adjustments in display space, then vignette and grain on top.

import { HIST_BINS, type PhotoHistogram } from "@/app/photography/data";

export interface DevelopParams {
  exposure: number; // stops, -2..2
  contrast: number; // -1..1
  highlights: number; // -1..1
  shadows: number; // -1..1
  temperature: number; // -1 (cool) .. 1 (warm)
  tint: number; // -1 (green) .. 1 (magenta)
  vibrance: number; // -1..1
  saturation: number; // -1..1
  fade: number; // 0..1, lifts the black point
  vignette: number; // 0..1
  grain: number; // 0..1
}

export const NEUTRAL: DevelopParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  fade: 0,
  vignette: 0,
  grain: 0,
};

const UNIFORMS = Object.keys(NEUTRAL) as (keyof DevelopParams)[];

const VERT = `#version 300 es
in vec2 p;
out vec2 uv;
void main() {
  uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D img;
uniform vec2 res;
uniform float split;
uniform float ${UNIFORMS.join(", ")};

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toDisplay(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

void main() {
  vec3 src = texture(img, uv).rgb;
  // Left of the split line shows the untouched original
  if (uv.x < split) { outColor = vec4(src, 1.0); return; }

  // Linear light: exposure is a pure multiply, white balance scales channels
  vec3 c = toLinear(src) * exp2(exposure);
  c *= vec3(1.0 + 0.22 * temperature, 1.0 - 0.12 * tint, 1.0 - 0.22 * temperature);
  c = toDisplay(c);

  // Tone: masked lifts for shadows and highlights, then contrast about mid-grey
  float l = dot(c, LUMA);
  c += shadows * 0.28 * (1.0 - smoothstep(0.0, 0.55, l));
  c += highlights * 0.28 * smoothstep(0.45, 1.0, l);
  c = (c - 0.5) * (1.0 + contrast) + 0.5;
  c = c * (1.0 - 0.14 * fade) + 0.14 * fade;

  // Colour: vibrance boosts muted colours more than already-saturated ones
  l = dot(c, LUMA);
  float chroma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  float satAmount = 1.0 + saturation + vibrance * (1.0 - clamp(chroma * 1.5, 0.0, 1.0));
  c = mix(vec3(l), c, satAmount);

  // Optics and film: aspect-correct vignette, midtone-weighted grain
  vec2 d = (uv - 0.5) * vec2(res.x / res.y, 1.0);
  c *= 1.0 - vignette * 0.85 * smoothstep(0.25, 0.95, length(d) * 1.25);
  float n = hash(uv * res) - 0.5;
  c += n * grain * 0.2 * (1.0 - abs(dot(c, LUMA) - 0.5) * 1.4);

  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed to compile");
  }
  return shader;
}

const HIST_W = 160;

export class DevelopEngine {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private fbo: WebGLFramebuffer;
  private fboTex: WebGLTexture;
  private fboSize = { w: HIST_W, h: HIST_W };
  private pixels = new Uint8Array(HIST_W * HIST_W * 4);
  ready = false;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: false, antialias: false });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Link failed");
    this.program = program;
    gl.useProgram(program);

    // One quad covering the viewport
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const p = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

    for (const name of [...UNIFORMS, "img", "res", "split"]) this.loc[name] = gl.getUniformLocation(program, name);

    this.texture = gl.createTexture()!;
    // Small offscreen target the histogram is read back from
    this.fboTex = gl.createTexture()!;
    this.fbo = gl.createFramebuffer()!;
  }

  setImage(image: HTMLImageElement) {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const h = Math.max(1, Math.round(HIST_W * (image.naturalHeight / image.naturalWidth)));
    this.fboSize = { w: HIST_W, h };
    this.pixels = new Uint8Array(HIST_W * h * 4);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, HIST_W, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ready = true;
  }

  private draw(params: DevelopParams, split: number, w: number, h: number) {
    const { gl } = this;
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.loc.img, 0);
    gl.uniform2f(this.loc.res, w, h);
    gl.uniform1f(this.loc.split, split);
    for (const k of UNIFORMS) gl.uniform1f(this.loc[k], params[k]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Draw to the visible canvas. `split` is 0..1 of width, or -1 for no split. */
  render(params: DevelopParams, split: number) {
    if (!this.ready) return;
    const c = this.gl.canvas as HTMLCanvasElement;
    this.draw(params, split, c.width, c.height);
  }

  /** Render the edit at thumbnail size and bin its pixels, in the same format as the build-time data. */
  histogram(params: DevelopParams): PhotoHistogram | null {
    if (!this.ready) return null;
    const { gl } = this;
    const { w, h } = this.fboSize;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.draw({ ...params, grain: 0 }, -1, w, h);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const bins = {
      r: new Array(HIST_BINS).fill(0),
      g: new Array(HIST_BINS).fill(0),
      b: new Array(HIST_BINS).fill(0),
      l: new Array(HIST_BINS).fill(0),
    };
    const toBin = (v: number) => Math.min(HIST_BINS - 1, Math.floor((v / 256) * HIST_BINS));
    const px = this.pixels;
    for (let i = 0; i < px.length; i += 4) {
      bins.r[toBin(px[i])]++;
      bins.g[toBin(px[i + 1])]++;
      bins.b[toBin(px[i + 2])]++;
      bins.l[toBin(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2])]++;
    }
    const norm = (arr: number[]) => {
      const peak = Math.max(...arr.map(Math.sqrt)) || 1;
      return arr.map((v) => Math.round((Math.sqrt(v) / peak) * 100));
    };
    return { r: norm(bins.r), g: norm(bins.g), b: norm(bins.b), l: norm(bins.l) };
  }

  dispose() {
    const { gl } = this;
    gl.deleteTexture(this.texture);
    gl.deleteTexture(this.fboTex);
    gl.deleteFramebuffer(this.fbo);
    gl.deleteProgram(this.program);
  }
}
