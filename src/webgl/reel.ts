import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Group,
  VideoTexture,
  TextureLoader,
  LinearFilter,
  Texture,
  Vector3,
} from 'three';

/**
 * Hero "reel": a ring of 9:16 frames bent on a cylinder, all sampling ONE atlas
 * video (5 real clips side by side). Scroll rotates the ring, scroll velocity adds
 * a slight RGB split. Shaders are plain strings compiled by WebGL (no eval).
 */

const VERT = /* glsl */ `
uniform float uSlot;
uniform float uOffset;
uniform float uLen;
uniform float uRadius;
uniform float uTime;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  float c = mod(uSlot + uOffset + uLen * 0.5, uLen) - uLen * 0.5;
  float s = p.x + c;
  float a = s / uRadius;
  vec3 q = vec3(sin(a) * uRadius, p.y, cos(a) * uRadius);
  q.y += sin(s * 1.7 + uTime * 0.6) * 0.03;
  vDepth = q.z - uRadius;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform float uTile;
uniform float uTiles;
uniform float uVel;
uniform float uTime;
uniform float uRadius;
uniform vec3 uBack;
uniform vec2 uSize;
varying vec2 vUv;
varying float vDepth;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 tex(vec2 uv) {
  float lo = uTile / uTiles + 0.002;
  float hi = (uTile + 1.0) / uTiles - 0.002;
  uv.x = clamp((uTile + uv.x) / uTiles, lo, hi);
  return texture2D(uTex, uv).rgb;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float d = sdRound(p, uSize * 0.5, 0.05);
  if (d > 0.0) discard;
  vec3 col;
  if (gl_FrontFacing) {
    float sh = clamp(uVel, -1.0, 1.0) * 0.018;
    col = vec3(tex(vUv + vec2(sh, 0.0)).r, tex(vUv).g, tex(vUv - vec2(sh, 0.0)).b);
  } else {
    col = uBack;
  }
  float ring = smoothstep(-0.012, -0.004, d);
  col = mix(col, vec3(0.06, 0.07, 0.08), ring);
  float depthF = smoothstep(-2.0 * uRadius, 0.0, vDepth);
  col *= mix(0.42, 1.0, depthF);
  float n = fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 91.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface Reel {
  setProgress(p: number): void;
  setVelocity(v: number): void;
  destroy(): void;
}

export function createReel(
  canvas: HTMLCanvasElement,
  opts: { video: string; poster: string; tiles: number; animate: boolean },
): Reel | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  const group = new Group();
  scene.add(group);

  const COUNT = 10;
  const H = 1;
  const W = (H * 9) / 16;
  const GAP = 0.11;
  const LEN = COUNT * (W + GAP);
  const RADIUS = LEN / (Math.PI * 2);
  const geo = new PlaneGeometry(W, H, 40, 6);

  // Poster texture first, swapped for the video texture once it plays.
  const posterTex = new TextureLoader().load(opts.poster, () => render());
  posterTex.minFilter = LinearFilter;
  posterTex.generateMipmaps = false;
  let current: Texture = posterTex;

  const shared = {
    uTex: { value: current },
    uOffset: { value: 0 },
    uLen: { value: LEN },
    uRadius: { value: RADIUS },
    uTime: { value: 0 },
    uVel: { value: 0 },
    uTiles: { value: opts.tiles },
    uSize: { value: [W, H] },
  };
  const backs = [
    [0.086, 0.129, 0.114],
    [0.149, 0.082, 0.133],
  ];
  const mats: ShaderMaterial[] = [];
  for (let i = 0; i < COUNT; i++) {
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: 2, // DoubleSide
      uniforms: {
        ...shared,
        uSlot: { value: i * (W + GAP) },
        uTile: { value: i % opts.tiles },
        uBack: { value: new Vector3(...backs[i % 2]) },
      },
    });
    mats.push(mat);
    group.add(new Mesh(geo, mat));
  }

  // Video (muted, inline, looped). Loaded only when WebGL works.
  let video: HTMLVideoElement | null = null;
  if (opts.animate) {
    video = document.createElement('video');
    video.src = opts.video;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.addEventListener(
      'playing',
      () => {
        const vt = new VideoTexture(video!);
        vt.minFilter = LinearFilter;
        vt.generateMipmaps = false;
        current = vt;
        for (const m of mats) m.uniforms.uTex.value = vt;
      },
      { once: true },
    );
  }

  let progress = 0;
  let vel = 0;
  let velTarget = 0;
  let idle = 0;
  let pointerX = 0;
  let pointerY = 0;
  let px = 0;
  let py = 0;
  let wide = true;

  function layout() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = window.innerWidth >= 900 && camera.aspect > 1.15;
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    const p = progress;
    shared.uOffset.value = -(p * LEN * 0.8 + idle);
    shared.uVel.value = vel;
    // composition: ring on the right on wide screens, centred on narrow ones
    const dist = wide ? 5.1 - p * 0.45 : 3.25 - p * 0.3;
    const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
    const vw = vh * camera.aspect;
    const x = wide ? Math.min(vw * 0.265, 2.7) : 0;
    group.position.set(x, wide ? 0.2 : 0.0, 0);
    group.rotation.set(0.3 - p * 0.16 + py * 0.05, px * 0.12, -0.12 + p * 0.14);
    camera.position.set(0, 0, dist + RADIUS);
    camera.lookAt(x * 0.15, 0, 0);
    renderer.render(scene, camera);
  }

  let raf = 0;
  let running = false;
  let last = performance.now();
  function tick(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    shared.uTime.value += dt;
    idle += dt * 0.05;
    vel += (velTarget - vel) * 0.08;
    velTarget *= 0.9;
    px += (pointerX - px) * 0.05;
    py += (pointerY - py) * 0.05;
    if (current instanceof VideoTexture) current.needsUpdate = true;
    render();
    raf = requestAnimationFrame(tick);
  }
  function start() {
    if (running || !opts.animate) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
    video?.play().catch(() => {});
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    video?.pause();
  }

  const onPointer = (e: PointerEvent) => {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = e.clientY / window.innerHeight - 0.5;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  const io = new IntersectionObserver(
    ([e]) => (e.isIntersecting && !document.hidden ? start() : stop()),
    { threshold: 0 },
  );
  io.observe(canvas);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    document.documentElement.classList.remove('has-webgl');
  });

  layout();
  canvas.classList.add('is-ready');

  return {
    setProgress(p: number) {
      progress = p;
      if (!running) render();
    },
    setVelocity(v: number) {
      velTarget = Math.max(-1, Math.min(1, v / 40));
    },
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mats.forEach((m) => m.dispose());
      current.dispose();
      renderer.dispose();
    },
  };
}
