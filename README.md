# KIWIBYTE Studio — landing page

Site vitrine statique de l'offre « vidéos publicitaires verticales de 20 à 40 s produites avec l'I.A. ».
Vite 8 + TypeScript + Three.js (anneau 3D de vignettes vidéo, shader GLSL maison) + GSAP/ScrollTrigger + Lenis.
Aucun backend, aucun CDN, aucune police ni script tiers, aucun cookie, aucune collecte.

- `index.html` — landing (héros 3D scrubbé, pour qui, méthode en 4 étapes épinglée, exemples, formules + simulateur, FAQ, appel final)
- `mentions-legales.html`, `confidentialite.html` — squelettes à compléter (`[à compléter]`)
- `src/config.ts` — **le seul fichier à modifier** : e-mail, URL du site, URL du dépôt, prix, mention TVA
- `DESIGN.md` — système visuel (palette, typo, grille, mouvement, interdits) ; `OFFRE.md` — positionnement, prix, prospection 7 jours

## Commandes

```bash
npm ci                 # dépendances épinglées (package-lock.json)
npm run dev            # développement (http://localhost:5173)
npm run build          # tsc + build statique dans dist/ (base './', sans source maps)
npm run preview        # sert dist/ sur http://127.0.0.1:4173 (Ctrl+C pour arrêter)
npm test               # tests du simulateur de prix (node:test)
npm run check:csp      # prouve 0 violation CSP + blocage d'un script/style inline injecté
npm run check:visual   # captures 390/768/1440/1920 dans _work/shots (+ --variant=reduced|nowebgl)
```

Les deux scripts de contrôle démarrent et arrêtent eux-mêmes `vite preview` (ports 4790/4791) et le Chrome headless de HyperFrames (`~/.cache/hyperframes/chrome/chrome-headless-shell`, ou variable `HEADLESS_CHROME_DIR`).

Régénérer les médias (uniquement si les vidéos sources changent ; nécessite ffmpeg + Python avec `fonttools brotli`) :

```bash
uv venv .venv && uv pip install --python .venv/Scripts/python.exe fonttools brotli
export KIWI_ASSETS=<dossier des assets de marque>   # contient fonts/Montserrat.ttf et le logo kiwi
export KIWI_SHORTS=<dossier des shorts rendus>      # contient <slug>/short.mp4
.venv/Scripts/python.exe scripts/make_fonts.py   # Montserrat variable -> WOFF2 latin (33 Ko)
.venv/Scripts/python.exe scripts/make_media.py   # 5 boucles muettes 360x640 + atlas 3D + emblème
.venv/Scripts/python.exe scripts/make_og.py      # public/og.jpg 1200x630
```

## Remplacer les placeholders avant publication

1. `src/config.ts` :
   - `email` → votre adresse professionnelle (remplace `contact@exemple.fr` partout : boutons, pages légales, simulateur) ;
   - `siteUrl` → URL finale avec `/` final, ex. `https://<compte>.github.io/studio-ia/` (canonical, Open Graph, sitemap, robots, security.txt, JSON-LD) ;
   - `repoUrl` → URL du dépôt public (contact de `/.well-known/security.txt`) ;
   - `vatNote` → par ex. « TVA non applicable, art. 293 B du CGI » en franchise ;
   - prix (`offers`, `extraVideo`, `extraRevision`) si besoin. Les textes de la carte « Mensuel/Essai… » qui citent un délai sont dans `index.html`.
2. `mentions-legales.html` et `confidentialite.html` : remplir tous les `[à compléter]` (nom/raison sociale, SIRET, adresse, directeur de publication, durées de conservation, outils utilisés).
3. `npm run build`, puis vérifier : `grep -r "exemple.fr\|votre-compte\|à compléter" dist` ne doit plus rien renvoyer.
4. `security.txt` contient une date `Expires` calculée au build (+330 jours) : refaire un build au moins une fois par an.

## Déploiement GitHub Pages (fait par Tony, rien n'est poussé ici)

Option A — dossier `dist/` publié par GitHub Actions (recommandé) : dans le dépôt, *Settings → Pages → Source : GitHub Actions*, puis un workflow qui lance `npm ci && npm run build` et publie `dist/` avec `actions/upload-pages-artifact` + `actions/deploy-pages`.

Option B — branche `gh-pages` : `npm run build`, puis publier le contenu de `dist/` à la racine d'une branche `gh-pages` (Settings → Pages → Deploy from a branch).

`dist/.nojekyll` est fourni (sinon GitHub ignore le dossier `.well-known`). Les chemins sont relatifs (`base: './'`), le site fonctionne donc dans un sous-dossier `https://<compte>.github.io/<depot>/`. GitHub Pages ne permet pas d'en-têtes HTTP personnalisés : la CSP est posée par balise `<meta http-equiv>` sur chaque page (les directives `frame-ancestors` et `report-uri` ne sont pas utilisables en meta).

## Contenu et honnêteté

- Les extraits vidéo sont tirés de vidéos réelles de la chaîne KIWIBYTE et présentés comme tels (« ce ne sont pas des travaux clients »).
- Aucun témoignage, logo client, note ou chiffre de résultat. Le JSON-LD `Service` ne contient ni `aggregateRating` ni `review`.
- Voix de synthèse et usage de l'I.A. indiqués dans la FAQ, le pied de page et les mentions légales.
