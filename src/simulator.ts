import { CONFIG, mailto, DEFAULT_BRIEF } from './config.ts';

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export interface Quote {
  plan: string;
  detail: string;
  total: number;
  perVideo: number;
}

/** Cheapest combination of the published launch prices for n videos (one-off or per month). */
export function quote(n: number, monthly: boolean): Quote {
  const { essai, lancement, mensuel } = CONFIG.offers;
  const x = CONFIG.extraVideo;
  const s = (k: number) => (k > 1 ? 's' : '');
  const options: Quote[] = [];
  if (n <= 2) options.push({ plan: essai.name, detail: `${n} × ${essai.name}`, total: n * essai.price, perVideo: 0 });
  if (n >= 3) {
    const extra = n - lancement.videos;
    options.push({
      plan: lancement.name,
      detail: extra > 0 ? `Pack 3 vidéos + ${extra} vidéo${s(extra)} supp.` : 'Pack 3 vidéos',
      total: lancement.price + extra * x,
      perVideo: 0,
    });
  }
  if (monthly && n >= 4) {
    const extra = n - mensuel.videos;
    options.push({
      plan: mensuel.name,
      detail: extra > 0 ? `4 vidéos + ${extra} vidéo${s(extra)} supp.` : '4 vidéos par mois',
      total: mensuel.price + extra * x,
      perVideo: 0,
    });
  }
  // cheapest wins; on a tie the later (larger) formula wins
  const best = options.reduce((a, b) => (b.total <= a.total ? b : a));
  best.perVideo = Math.round(best.total / n);
  return best;
}

export function initSimulator() {
  const range = document.querySelector<HTMLInputElement>('#sim-n');
  if (!range) return;
  const out = document.querySelector<HTMLOutputElement>('#sim-n-out')!;
  const radios = document.querySelectorAll<HTMLInputElement>('input[name="freq"]');
  const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;
  const plan = $('.js-sim-plan');
  const detail = $('.js-sim-detail');
  const unit = $('.js-sim-unit');
  const total = $('.js-sim-total');
  const period = $('.js-sim-period');
  const cta = document.querySelector<HTMLAnchorElement>('.js-sim-cta')!;

  const update = () => {
    const n = Number(range.value);
    const monthly = document.querySelector<HTMLInputElement>('input[name="freq"]:checked')?.value === 'monthly';
    const q = quote(n, monthly);
    out.value = String(n);
    range.setAttribute('aria-valuetext', `${n} vidéo${n > 1 ? 's' : ''}`);
    plan.textContent = q.plan;
    detail.textContent = q.detail;
    unit.textContent = eur(q.perVideo);
    total.textContent = eur(q.total);
    period.textContent = monthly ? 'par mois, sans engagement' : 'paiement unique';
    const label = `${n} vidéo${n > 1 ? 's' : ''}${monthly ? ' par mois' : ''}`;
    cta.href = mailto(
      `Demande de devis — ${q.plan}, ${label}`,
      `Estimation vue sur le site : ${q.plan} (${q.detail}), ${eur(q.total)}${monthly ? ' par mois' : ''}.\n\n${DEFAULT_BRIEF}`,
    );
  };
  range.addEventListener('input', update);
  radios.forEach((r) => r.addEventListener('change', update));
  update();
}
