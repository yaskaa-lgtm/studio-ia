import './styles/main.css';
import { initSimulator } from './simulator';
import { splitWords } from './split';
import type { Reel } from './webgl/reel';

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const BASE = import.meta.env.BASE_URL;

initSimulator();
initHeader();
initVideos();

if (!reduced) {
  root.classList.add('js-motion');
  void initMotion();
  if (finePointer) initCursor();
}

/* ---------------- header: solid on scroll, dark over night sections ---------------- */
function initHeader() {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;
  const nights = Array.from(document.querySelectorAll<HTMLElement>('.reel__frame, .final, .site-footer'));
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 24);
    const probe = header.offsetHeight / 2;
    const night = nights.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    header.classList.toggle('is-night', night);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* ---------------- example loops: play only when visible, with a pause control ---------------- */
function initVideos() {
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('.phone video'));
  const toggle = document.querySelector<HTMLButtonElement>('.reel__toggle');
  if (!videos.length) return;
  let paused = reduced; // reduced motion: nothing plays until asked
  const visible = new Set<HTMLVideoElement>();
  const sync = () => {
    for (const v of videos) {
      if (!paused && visible.has(v)) v.play().catch(() => {});
      else v.pause();
    }
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Lire les vidéos' : 'Mettre les vidéos en pause';
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) visible.add(v);
        else visible.delete(v);
      }
      sync();
    },
    { rootMargin: '120px 0px', threshold: 0.25 },
  );
  videos.forEach((v) => io.observe(v));
  toggle?.addEventListener('click', () => {
    paused = !paused;
    sync();
  });
  sync();
}

/* ---------------- custom cursor (fine pointers only, decorative) ---------------- */
function initCursor() {
  const el = document.querySelector<HTMLElement>('.cursor');
  const label = el?.querySelector<HTMLElement>('.cursor__label');
  if (!el || !label) return;
  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
      el.classList.add('is-on');
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  const loop = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('a, button, summary, label, input, .phone__screen');
    el.classList.toggle('is-big', !!t);
    label.textContent = t ? (t.dataset.cursor ?? (t.classList.contains('phone__screen') ? 'Boucle' : '')) : '';
  });
}

/* ---------------- scroll choreography (GSAP + ScrollTrigger + Lenis) ---------------- */
async function initMotion() {
  const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('lenis'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 }, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // --- word reveals
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const words = splitWords(el);
    const inHero = !!el.closest('.hero');
    gsap.from(words, {
      yPercent: 115,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.04,
      delay: inHero ? 0.15 : 0,
      scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 86%', once: true },
    });
  });
  document.querySelectorAll<HTMLElement>('.marker').forEach((m) => {
    const inHero = !!m.closest('.hero');
    gsap.fromTo(
      m,
      { '--mark': 0 },
      {
        '--mark': 1,
        duration: 0.9,
        ease: 'power3.inOut',
        delay: inHero ? 0.75 : 0.35,
        scrollTrigger: inHero ? undefined : { trigger: m, start: 'top 82%', once: true },
      },
    );
  });
  gsap.from('.hero .label, .hero .lede, .hero__cta, .scrub', {
    y: 24,
    opacity: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.08,
    delay: 0.45,
  });
  document.querySelectorAll<HTMLElement>('[data-reveal], .plan, .sim, .faq details, .final__text, .final .btn, .final__mail').forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // --- hero: timecode + beats + WebGL ring
  const now = document.querySelector<HTMLElement>('.scrub__now');
  const fill = document.querySelector<HTMLElement>('.scrub__fill');
  const beats = Array.from(document.querySelectorAll<HTMLElement>('.scrub__beats li'));
  let reel: Reel | null = null;
  const setHero = (p: number) => {
    const t = Math.round(p * 40);
    if (now) now.textContent = `00:${String(t).padStart(2, '0')}`;
    if (fill) fill.style.transform = `scaleX(${Math.max(0.02, p)})`;
    const active = t < 3 ? 0 : t < 30 ? 1 : 2;
    beats.forEach((b, i) => b.classList.toggle('is-on', i === active));
    reel?.setProgress(p);
  };

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: '+=140%',
      pin: '.hero__pin',
      scrub: true,
      onUpdate: (s) => {
        setHero(s.progress);
        reel?.setVelocity(lenis.velocity);
      },
    });

    // method: pinned "monitor" + playhead on the editing track
    const clips = Array.from(document.querySelectorAll<HTMLElement>('.clip'));
    const steps = Array.from(document.querySelectorAll<HTMLElement>('.step'));
    const head = document.querySelector<HTMLElement>('.track__head');
    const weights = [1, 1.4, 2.2, 1.2];
    const sum = weights.reduce((a, b) => a + b, 0);
    const bounds = weights.reduce<number[]>((acc, w) => [...acc, acc[acc.length - 1] + w / sum], [0]);
    ScrollTrigger.create({
      trigger: '.method',
      start: 'top top',
      end: '+=220%',
      pin: '.method__pin',
      scrub: true,
      onUpdate: (s) => {
        const p = s.progress;
        if (head) head.style.left = `${p * 100}%`;
        let idx = bounds.findIndex((b, i) => i < 4 && p >= b && p < bounds[i + 1]);
        if (idx < 0) idx = 3;
        steps.forEach((el, i) => el.classList.toggle('is-on', i === idx));
        clips.forEach((el, i) => {
          el.classList.toggle('is-on', i === idx);
          el.classList.toggle('is-done', i < idx);
        });
      },
    });

    // phones drift at different speeds
    gsap.utils.toArray<HTMLElement>('.phone').forEach((ph, i) => {
      gsap.fromTo(
        ph,
        { y: 60 + (i % 2) * 50 },
        { y: -40 - (i % 3) * 30, ease: 'none', scrollTrigger: { trigger: '.phones', start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    });
  });
  mm.add('(max-width: 899px)', () => {
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom 30%',
      scrub: true,
      onUpdate: (s) => {
        setHero(s.progress);
        reel?.setVelocity(lenis.velocity);
      },
    });
  });

  // projection room opens (clip-path wipe)
  gsap.fromTo(
    '.reel__frame',
    { clipPath: 'inset(7% 4% 0% 4% round 32px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: '.reel', start: 'top bottom', end: 'top 20%', scrub: true },
    },
  );
  gsap.fromTo(
    '.final__emblem',
    { rotate: -90, scale: 0.6 },
    { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'center center', scrub: true } },
  );

  // --- WebGL ring, loaded after first paint
  const canvas = document.querySelector<HTMLCanvasElement>('.hero__canvas');
  const webglOk = (() => {
    try {
      const c = document.createElement('canvas');
      const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return !!gl;
    } catch {
      return false;
    }
  })();
  if (canvas && webglOk) {
    const start = async () => {
      const { createReel } = await import('./webgl/reel');
      reel = createReel(canvas, {
        video: `${BASE}media/atlas.mp4`,
        poster: `${BASE}media/atlas.webp`,
        tiles: 5,
        animate: true,
      });
      if (reel) {
        root.classList.add('has-webgl');
        ScrollTrigger.refresh();
      }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(() => void start(), { timeout: 800 });
    else setTimeout(() => void start(), 200);
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
