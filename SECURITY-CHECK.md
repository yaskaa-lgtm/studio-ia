# SECURITY-CHECK — KIWIBYTE Studio (studio-ia)

Contrôles exécutés le 23/10/2026 sur le build `dist/` (Vite 8.3.5). Sorties réelles copiées ci-dessous. À refaire par Tony avant déploiement : `npm ci && npm run build && npm audit && npm run check:csp`.

## 1. Site 100 % statique, aucune collecte

- Pas de backend, pas de `fetch`/XHR vers un tiers, pas de formulaire (`<form>` absent), pas de cookie, pas de `localStorage`, pas d'analytics.
- Les boutons de contact sont des liens `mailto:` vers le placeholder `contact@exemple.fr` (défini dans `src/config.ts`) : rien ne part sans action de l'utilisateur dans sa messagerie.
- Le simulateur (`src/simulator.ts`) calcule dans le navigateur à partir des prix de `config.ts` ; aucune valeur n'est envoyée ni stockée.

## 2. Dépendances épinglées + audit

`package.json` : versions exactes (sans `^`/`~`), `package-lock.json` versionné.

```
dependencies:    gsap 3.15.0, lenis 1.3.27, three 0.186.1
devDependencies: @types/node 26.6.5, @types/three 0.186.0, typescript 7.0.2, vite 8.3.5

$ npm audit
found 0 vulnerabilities
```

Tout est embarqué dans le build (aucun CDN). Police Montserrat auto-hébergée (`dist/assets/montserrat-latin-var-*.woff2`, licence OFL copiée dans `src/assets/fonts/OFL-Montserrat.txt`).

## 3. Content-Security-Policy stricte (balise meta, sur les 3 pages)

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self';
connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none';
frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'
```

- Ni `'unsafe-inline'` ni `'unsafe-eval'` : `grep -c "unsafe-" dist/*.html` → 0 partout.
- Aucun `<script>` inline exécutable, aucun `<style>`, aucun attribut `style="…"` dans le HTML : comptes = 0 / 0 / 0 sur les 3 pages. Seul bloc inline : `<script type="application/ld+json">` (bloc de données non exécuté, non soumis à `script-src`, 0 violation mesurée).
- Aucun `eval(`, `new Function(` dans les bundles : `grep` → aucun résultat. Shaders GLSL = chaînes de caractères dans `src/webgl/reel.ts`, compilées par WebGL (pas d'eval JS).
- Animations : GSAP écrit via l'API CSSOM (`element.style.x = …`), autorisée par la CSP (seuls les attributs `style` inline du HTML et les `<style>` sont bloqués).
- `<meta name="referrer" content="no-referrer">` sur les 3 pages.

Test réel (`npm run check:csp` : Chrome headless + `vite preview`, écoute de `securitypolicyviolation`, puis injection volontaire d'un script inline et d'un attribut style) :

```
index.html            violationsDuringLoad: []  inlineScriptRan: false  inlineStyleApplied: false  violations (sonde): ["script-src-elem inline", "style-src-attr inline"]
mentions-legales.html violationsDuringLoad: []  inlineScriptRan: false  inlineStyleApplied: false  violations (sonde): ["script-src-elem inline", "style-src-attr inline"]
confidentialite.html  violationsDuringLoad: []  inlineScriptRan: false  inlineStyleApplied: false  violations (sonde): ["script-src-elem inline", "style-src-attr inline"]
```

→ 0 violation pendant le chargement normal, et la CSP bloque bien ce qu'elle doit bloquer. Les captures (`npm run check:visual`) ont aussi relevé la console : **0 erreur, 0 avertissement** sur 390x844, 768x1024, 1440x900, 1920x1080, en mode réduit et sans WebGL (le repli sans WebGL détecte l'absence de contexte avant de charger Three.js, donc aucune erreur console).

Limite connue : GitHub Pages n'autorise pas d'en-têtes HTTP personnalisés ; `frame-ancestors` (anti-clickjacking) ne peut pas être posé en meta. Risque faible pour un site sans action sensible.

## 4. Aucun secret, chemin local, pseudo système ni e-mail perso

```
$ grep -rnaiE "capto|[CD]:[/\\](Users|Dev|YouTube)|api[_-]?key|secret|passw|bearer|ghp_…|sk-…|AKIA…|discord.com/api/webhooks|@gmail|@outlook|@hotmail|@yahoo" dist src public scripts tests *.html *.ts
0

$ grep -rhoaE "<adresses e-mail>" dist | sort | uniq -c
     16 contact@exemple.fr        ← placeholder uniquement
```

- Les scripts de génération ne contiennent plus de chemin local : dossiers sources passés par variables d'environnement (`KIWI_ASSETS`, `KIWI_SHORTS`, `HEADLESS_CHROME_DIR`, défaut = `~/.cache/…` via `os.homedir()`).
- Métadonnées des médias supprimées (`-map_metadata -1`) : seuls restent les tags techniques du conteneur MP4 (`major_brand`, `encoder=Lavf…`). Aucun titre, auteur ni chemin.
- `.gitignore` : `node_modules/`, `dist/`, `.venv/`, `_work/` (captures, profils Chrome), `.env*`.
- Origines présentes dans les bundles JS : `http://www.w3.org` (namespaces SVG/XML), `https://gsap.com`, `https://jcgt.org`, `https://github.com` (commentaires/licences des bibliothèques) et le placeholder `https://votre-compte.github.io` — chaînes inertes, aucune requête (et `connect-src 'self'` les bloquerait).

## 5. Liens externes

Les 3 seuls liens externes (pages légales : GitHub Pages, déclaration de confidentialité GitHub, CNIL) ont `target="_blank" rel="noopener noreferrer"`. Aucun autre lien sortant.

## 6. Pas de source maps publiées

```
build.sourcemap: false
$ find dist -name '*.map' | wc -l          → 0
$ grep -rl sourceMappingURL dist | wc -l   → 0
```

## 7. security.txt, robots, sitemap

- `dist/.well-known/security.txt` : `Contact:` = `<repoUrl>/security/advisories/new` et `<repoUrl>/issues` (pas d'e-mail), `Expires:` calculé au build (+330 jours), `Canonical`, `Preferred-Languages: fr, en`.
- `dist/.nojekyll` présent (sinon GitHub Pages ignore `.well-known`).
- `robots.txt`, `sitemap.xml` (page d'accueil seulement ; pages légales en `noindex, follow`).
- JSON-LD `Service` + 3 `Offer` (prix réels des formules) ; **aucun** `aggregateRating`, `review` ni avis.

## 8. Tests fonctionnels

```
$ npm test
✔ one-off quotes use the cheapest published combination
✔ monthly picks Mensuel from 4 videos
✔ per-video price is total / n rounded
ℹ pass 3 / fail 0
```

## À faire avant mise en ligne (non bloquant pour la sécurité)

- Remplacer les placeholders dans `src/config.ts` (e-mail, `siteUrl`, `repoUrl`, `vatNote`), rebuild, puis `grep -r "exemple.fr\|votre-compte\|à compléter" dist` → doit être vide.
- Compléter les `[à compléter]` des pages légales.
