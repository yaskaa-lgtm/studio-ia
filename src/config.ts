/**
 * KIWIBYTE Studio — the ONLY file to edit before going live.
 *
 * Every value here is injected at build time into the HTML pages, the JSON-LD,
 * sitemap.xml, robots.txt and .well-known/security.txt (see vite.config.ts),
 * and read at runtime by the price simulator. Rebuild after editing: npm run build
 */
export const CONFIG = {
  brand: 'KIWIBYTE Studio',

  /** Public contact address used by every "Demander un devis" button (mailto:). PLACEHOLDER. */
  email: 'contact@exemple.fr',

  /** Final public URL of the site, with trailing slash (GitHub Pages project site). PLACEHOLDER. */
  siteUrl: 'https://yaskaa-lgtm.github.io/studio-ia/',

  /** Public repository URL — used as the contact in /.well-known/security.txt. PLACEHOLDER. */
  repoUrl: 'https://github.com/yaskaa-lgtm/studio-ia',

  /** Shown under the prices. Micro-entreprise en franchise : « TVA non applicable, art. 293 B du CGI ». */
  vatNote: 'Prix nets en euros. TVA : [à compléter selon votre statut, ex. « TVA non applicable, art. 293 B du CGI »].',

  /** Launch prices (EUR). Indicative, editable. */
  offers: {
    essai: { name: 'Essai', videos: 1, price: 149, monthly: false, delay: '5 jours ouvrés' },
    lancement: { name: 'Lancement', videos: 3, price: 390, monthly: false, delay: '7 jours ouvrés' },
    mensuel: { name: 'Mensuel', videos: 4, price: 490, monthly: true, delay: 'au fil du mois' },
  },
  /** Price of one extra video added to a pack or a month. */
  extraVideo: 120,
  /** Price of one extra revision round. */
  extraRevision: 30,
} as const;

export type OfferKey = keyof typeof CONFIG.offers;

/** Build a mailto: link with a pre-filled subject and body (no data leaves the browser until the user sends it). */
export function mailto(subject: string, body: string): string {
  return `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const DEFAULT_BRIEF = [
  'Bonjour,',
  '',
  'Je souhaite une ou plusieurs vidéos verticales courtes.',
  '',
  '- Activité / marque :',
  '- Ce que la vidéo doit présenter :',
  '- Public visé :',
  '- Où elle sera publiée (Instagram, TikTok, YouTube Shorts, publicité…) :',
  '- Nombre de vidéos souhaité :',
  '- Date idéale de livraison :',
  '',
  'Merci,',
].join('\n');
