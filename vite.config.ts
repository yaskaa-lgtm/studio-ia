import { defineConfig, type Plugin } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONFIG, mailto, DEFAULT_BRIEF } from './src/config.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const o = CONFIG.offers;
const perVideo = (price: number, n: number) => Math.round(price / n);
const expires = new Date(Date.now() + 330 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${CONFIG.brand} — vidéos publicitaires verticales`,
  serviceType: 'Production de vidéos publicitaires courtes',
  description:
    'Pubs vidéo verticales de 20 à 40 secondes produites avec l’I.A. (script, voix de synthèse, animations, sous-titres) pour PME et petites marques francophones.',
  areaServed: { '@type': 'Country', name: 'France' },
  availableLanguage: 'fr',
  url: CONFIG.siteUrl,
  provider: { '@type': 'Organization', name: CONFIG.brand, url: CONFIG.siteUrl },
  offers: Object.values(o).map((x) => ({
    '@type': 'Offer',
    name: x.name,
    price: String(x.price),
    priceCurrency: 'EUR',
    description: `${x.videos} vidéo${x.videos > 1 ? 's' : ''}${x.monthly ? ' par mois' : ''}`,
  })),
};

// Raw (already safe) replacements first, then escaped text replacements.
const raw: Record<string, string> = {
  JSONLD: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
};
const text: Record<string, string> = {
  EMAIL: CONFIG.email,
  SITE_URL: CONFIG.siteUrl,
  REPO_URL: CONFIG.repoUrl,
  MAILTO_DEVIS: mailto('Demande de devis — vidéo courte', DEFAULT_BRIEF),
  MAILTO_ESSAI: mailto(`Formule ${o.essai.name} — 1 vidéo`, DEFAULT_BRIEF),
  MAILTO_LANCEMENT: mailto(`Formule ${o.lancement.name} — 3 vidéos`, DEFAULT_BRIEF),
  MAILTO_MENSUEL: mailto(`Formule ${o.mensuel.name} — 4 vidéos par mois`, DEFAULT_BRIEF),
  MAILTO_CONTACT: mailto(`Contact — ${CONFIG.brand}`, 'Bonjour,\n\n'),
  PRICE_ESSAI: String(o.essai.price),
  PRICE_LANCEMENT: String(o.lancement.price),
  PRICE_MENSUEL: String(o.mensuel.price),
  PER_VIDEO_LANCEMENT: String(perVideo(o.lancement.price, o.lancement.videos)),
  PER_VIDEO_MENSUEL: String(perVideo(o.mensuel.price, o.mensuel.videos)),
  EXTRA_VIDEO: String(CONFIG.extraVideo),
  EXTRA_REVISION: String(CONFIG.extraRevision),
  VAT_NOTE: CONFIG.vatNote,
  BRAND: CONFIG.brand,
  YEAR: String(new Date().getFullYear()),
  EXPIRES: expires,
};

function fill(src: string, escapeText: boolean): string {
  let out = src.replace(/\{\{(\w+)\}\}/g, (m, k: string) => {
    if (k in raw) return raw[k];
    if (k in text) return escapeText ? esc(text[k]) : text[k];
    throw new Error(`Unknown placeholder ${m}`);
  });
  return out;
}

/** French typography in text nodes only: no line break before ? ! ; : » or after «. */
function frenchSpacing(html: string): string {
  return html.replace(/>([^<]+)</g, (_m, t: string) =>
    '>' +
    t
      .replace(/ ([?!;])/g, '\u202F$1')
      .replace(/ ([:»])/g, '\u00A0$1')
      .replace(/« /g, '«\u00A0') +
    '<',
  );
}

/** Injects src/config.ts values into HTML at build time and into the static text files after the build. */
function studioConfig(): Plugin {
  let outDir = 'dist';
  return {
    name: 'studio-config',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    transformIndexHtml: { order: 'pre', handler: (html) => frenchSpacing(fill(html, true)) },
    closeBundle() {
      for (const f of ['robots.txt', 'sitemap.xml', '.well-known/security.txt']) {
        const p = resolve(outDir, f);
        if (existsSync(p)) writeFileSync(p, fill(readFileSync(p, 'utf8'), false));
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [studioConfig()],
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        mentions: resolve(import.meta.dirname, 'mentions-legales.html'),
        confidentialite: resolve(import.meta.dirname, 'confidentialite.html'),
      },
    },
  },
  preview: { host: '127.0.0.1' },
});
