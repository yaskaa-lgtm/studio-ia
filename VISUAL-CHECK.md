# VISUAL-CHECK — KIWIBYTE Studio (studio-ia)

Méthode : `npm run check:visual` (`scripts/shoot.mjs`) lance `vite preview` sur `dist/`, pilote le Chrome headless de HyperFrames (chrome-headless-shell 152, rendu WebGL logiciel SwiftShader), fait défiler la page et capture **15 positions** par taille d'écran ; chaque série a été assemblée en planche (`scripts/sheet.sh`) et **regardée** (vision), puis zoomée sur les zones à risque. Le script mesure aussi le débordement horizontal, les textes coupés (scrollWidth > clientWidth), les éléments hors écran, les images sans alt et la console. Serveur et Chrome sont arrêtés à la fin de chaque exécution.

Captures (dans `_work/shots/`, non versionnées) : `<variante>-<taille>-<position>.png`
Positions : 01-top, 02-hero-mid, 03-hero-end, 04-who, 05-who-list, 06-method-a, 07-method-c, 08-reel, 09-phones, 10-pricing, 11-plans, 12-sim, 13-faq, 14-final, 15-end.

| Variante | Tailles | Captures regardées | Détecteur auto | Console |
|---|---|---|---|---|
| motion (animations + WebGL) | 390x844, 768x1024, 1440x900, 1920x1080 | 4 × 15 = 60 | 0 problème | 0 erreur |
| reduced (prefers-reduced-motion) | 390x844, 1440x900 | 2 × 15 = 30 | 0 problème | 0 erreur |
| nowebgl (getContext WebGL → null) | 1440x900 | 15 | 0 problème | 0 erreur (après correction n°9) |
| pages légales | 390x844 | 2 | — | 0 erreur |
| focus clavier | 1440x900 | 1 (`focus-1440.png`) | contour visible | — |
| image Open Graph | 1200x630 | 3 itérations | — | — |

Mesures (headless, local, indicatives) : DOMContentLoaded 130–320 ms ; ~340 Ko transférés au premier chargement desktop (HTML + CSS + JS d'animation + police + affiches ; Three.js 133 Ko gzip chargé ensuite au repos du navigateur, vidéo atlas 75 Ko) ; `dist/` total 1,7 Mo. FPS mesuré pendant un défilement forcé : 60 sur 390x844, 35–60 en 768, 25–38 en 1440/1920 **en rendu WebGL logiciel** (pas de GPU en headless) — à confirmer sur une vraie machine, où le GPU fait ce travail.

## Corrections faites après lecture des captures

1. **Héros desktop, titre** : le titre passait sous l'anneau 3D et « 20 à 40 s, » se cassait mal. → largeur du bloc texte limitée à 54vw, taille `min(6vw, 10.4vh, 7.25rem)` pour tenir aussi en 1440x900, « 20 à 40 s, » en `nowrap`.
2. **Héros desktop, anneau 3D trop gros/centré** : chevauchait le titre. → caméra reculée, anneau décalé à droite (`x = min(vw·0.265, 2.7)`), barre de timecode déplacée sous l'anneau, colonne de droite.
3. **Héros desktop, frise 0–3 s / 3–30 s / 30–40 s** : trois colonnes serrées et illisibles sous le titre. → liste verticale compacte dans la colonne de droite.
4. **Ponctuation française** : « vidéo ? » pouvait laisser « ? » seul en début de ligne (le découpage en mots cassait sur les espaces insécables). → espaces fines insécables injectées au build avant `? ! ;`, insécables avant `: »`, découpage limité aux espaces ordinaires ; trait d'union insécable dans « Racontez‑la ».
5. **Surlignage vert** : en pseudo-élément absolu, il débordait quand le texte passait sur deux lignes (« ni le temps ni l'équipe »). → surlignage en `background` + `box-decoration-break: clone` (suit chaque ligne, animé par variable CSS).
6. **Pour qui, desktop** : 3 colonnes (numéro / nom / cas) écrasaient les citations. → 2 colonnes, cas sous le nom.
7. **Tablette 768** : l'anneau utilisait la composition « desktop » (décalé à droite et coupé) car l'aspect du canvas était > 1,15. → composition large seulement si fenêtre ≥ 900 px ; en mobile/tablette anneau centré, rapproché (plus de vide au-dessus), hauteur de scène 54svh.
8. **Tablette 768, formules** : trois cartes très hautes empilées. → cartes en 2 colonnes internes (prix à gauche, liste + bouton à droite) entre 640 et 999 px.
9. **Sans WebGL** : Three.js écrivait « Error creating WebGL context » dans la console. → détection préalable d'un contexte WebGL (puis libération) avant de charger le module 3D ; l'image de repli (3 affiches inclinées) reste affichée, console propre.
10. **En-tête translucide** : le texte du héros (« Voir les tarifs ») transparaissait sous l'en-tête en défilement. → fond d'en-tête opaque (papier ou nuit selon la section).
11. **Exemples desktop** : les téléphones décalés verticalement étaient étirés à des hauteurs différentes (flex `stretch`). → `align-items: flex-start`, cinq écrans 9:16 identiques.
12. **Mode réduit** : un timecode « 00:00 / 00:40 » figé n'avait pas de sens sans défilement animé. → remplacé par le titre statique « Anatomie d'une pub de 40 s », barre et consigne masquées.
13. **Bouton néon mobile** : libellé serré à 390 px. → taille et approche réduites sous 520 px.
14. **Lisibilité des étapes inactives** du héros : opacité relevée de 0,38 à 0,55.
15. **Image Open Graph** : 1re version en graisse 100 (police variable lue par défaut), 2e avec interlignage géant ; → instances statiques Montserrat 800/500 et une ligne par `drawtext`, surlignage recalé sous « 20 à 40 s ».

## Contrôles d'accessibilité vérifiés

- `lang="fr"`, lien d'évitement « Aller au contenu », ordre de tabulation logique (sortie réelle : « Aller au contenu » → « KIWIBYTE Studio » → « Méthode » → « Exemples »), contour de focus rose encre 3 px visible (vert sur fonds sombres).
- Contrastes (WCAG, calculés) : encre/papier 15,3:1 ; gris chaud/papier 7,8:1 ; vert encre/papier 6,5:1 ; rose encre/papier 5,3:1 ; gris nuit/nuit 9,6:1 ; bouton néon 7,1:1. Le rose clair #F472B6 n'est jamais utilisé en texte sur fond clair.
- Vidéos muettes, `playsinline`, lecture seulement quand visibles, bouton « Mettre les vidéos en pause » ; en mode réduit elles ne démarrent pas (bouton « Lire les vidéos »). Images décoratives en `alt=""`, vidéos avec `aria-label`, anneau 3D et curseur personnalisés en `aria-hidden`.
- Cibles tactiles ≥ 44 px (boutons, liens du pied de page, puces du simulateur, questions de la FAQ en `<details>` natifs).
- `prefers-reduced-motion` : pas de Lenis, pas d'épinglage, pas de WebGL, pas de grain animé ni de curseur ; tout le contenu est visible sans JavaScript d'animation (captures « reduced » vérifiées).

## Reste à vérifier sur appareil réel (non testable ici)

- Fluidité réelle à 60 fps avec GPU (desktop, iPhone, Android milieu de gamme).
- Comportement Safari iOS (lecture auto des vidéos muettes, `svh`).
- Ouverture du `mailto:` pré-rempli dans le client mail par défaut.
