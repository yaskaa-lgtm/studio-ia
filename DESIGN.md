---
version: alpha
name: KIWIBYTE Studio — Papier & Pellicule
description: Landing page de conversion d'un petit studio de pubs vidéo verticales produites avec l'I.A. Papier chaud, encre presque noire, salles de projection sombres en contrepoint, un seul accent fort par écran.
colors:
  primary: "#15151A"
  paper: "#F1EBDF"
  paper-deep: "#E6DECF"
  line: "#CFC5B3"
  muted: "#4A4740"
  green-ink: "#065F46"
  pink-ink: "#B8195F"
  marker: "#34D399"
  rec: "#F472B6"
  night: "#0F1115"
  night-text: "#F5F5F4"
  night-muted: "#B9B9B4"
  card-green: "#16211D"
  card-pink: "#261522"
typography:
  display:
    fontFamily: Montserrat
    fontSize: 7.5rem
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  h2:
    fontFamily: Montserrat
    fontSize: 4.5rem
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  h3:
    fontFamily: Montserrat
    fontSize: 1.75rem
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: Montserrat
    fontSize: 1.0625rem
    fontWeight: 450
    lineHeight: 1.6
  label:
    fontFamily: Montserrat
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.16em
  timecode:
    fontFamily: Montserrat
    fontSize: 0.875rem
    fontWeight: 700
    fontFeature: "\"tnum\" 1"
rounded:
  sm: 6px
  md: 14px
  phone: 28px
spacing:
  xs: 8px
  sm: 16px
  md: 32px
  lg: 64px
  xl: 128px
  gutter: 24px
  margin: 5vw
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: 18px 26px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.green-ink}"
    textColor: "{colors.paper}"
  button-neon:
    backgroundColor: "{colors.rec}"
    textColor: "{colors.night}"
    rounded: "{rounded.sm}"
    padding: 22px 32px
  marker-highlight:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.primary}"
  body-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
  rail-line:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.primary}"
  divider:
    backgroundColor: "{colors.line}"
    textColor: "{colors.primary}"
  accent-green:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green-ink}"
  accent-pink:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.pink-ink}"
  night-section:
    backgroundColor: "{colors.night}"
    textColor: "{colors.night-text}"
  night-caption:
    backgroundColor: "{colors.night}"
    textColor: "{colors.night-muted}"
  card-night-green:
    backgroundColor: "{colors.card-green}"
    textColor: "{colors.night-text}"
  card-night-pink:
    backgroundColor: "{colors.card-pink}"
    textColor: "{colors.night-text}"
---

## Overview

Surface : **Decide** (landing page de conversion). Une idée par section, une seule action principale (écrire un e-mail de demande de devis).

Métaphore : l'atelier de montage. Le site se lit comme une petite pub verticale qu'on fait défiler : le défilement fait avancer un **timecode** (00:00 → 00:40) pendant que le ruban 3D des images défile ; la méthode est une **piste de montage** avec tête de lecture ; les tarifs se terminent par un **ticket de devis**. Le papier chaud est l'atelier, les sections sombres sont la salle de projection.

Différence volontaire avec le portfolio KIWIBYTE (tout sombre) : ici la base est claire et chaude, le noir arrive par blocs francs, comme des coupes au montage.

## Colors

- **Encre (#15151A)** : tout le texte principal, boutons primaires.
- **Papier (#F1EBDF)** : fond par défaut. **Papier foncé (#E6DECF)** pour les rails et zones secondaires, **Trait (#CFC5B3)** pour les filets.
- **Gris chaud (#4A4740)** : texte courant secondaire (contraste > 8:1 sur papier).
- **Vert encre (#065F46)** et **rose encre (#B8195F)** : seuls verts/roses autorisés pour du TEXTE sur fond clair.
- **Vert marqueur (#34D399)** : surlignage derrière l'encre, tête de lecture, jamais en texte sur papier.
- **Rose REC (#F472B6)** : uniquement sur fond nuit (bouton néon final, point d'enregistrement).
- **Nuit (#0F1115)**, texte #F5F5F4, cartes #16211D / #261522 : sections « projection » et CTA final.
- Néon (lueur) autorisé sur **deux éléments seulement** : le bouton final rose et l'indicateur « lecture » vert des exemples.

## Typography

Une seule famille auto-hébergée : Montserrat variable (sous-ensemble latin, WOFF2, 100–900).
Titres 800, interlignage serré (0,92), approche négative. Texte courant 450 à 1,6. Étiquettes en capitales 700 espacées 0,16em. Chiffres tabulaires pour timecodes et prix. Pas d'emoji, pas d'icônes décoratives : la hiérarchie vient de l'échelle et de la graisse.

## Layout

Grille 12 colonnes (4 sur mobile), marges latérales `clamp(20px, 5vw, 96px)`, gouttière 24px. Compositions asymétriques : titre calé à gauche sur 5 colonnes, contenu sur 7 ; jamais de pile centrée sauf le CTA final. Rythme vertical par paliers de 64/128px.

## Elevation & Depth

Pas d'ombres portées ni de flou de verre. La profondeur vient de la 3D du héros (ruban de vignettes 9:16 courbé), des coupes papier/nuit et d'un grain photographique fixe très léger (opacité ≤ 0,08).

## Shapes

Rayons 6px (boutons), 14px (cartes, ticket), 28px (téléphones). Filets de 1px. Le ticket de devis a un bord dentelé (masque CSS) et des pointillés.

## Components

- `button-primary` : encre sur papier, étiquette en capitales ; survol → vert encre.
- `button-neon` : unique, section finale, rose REC + lueur.
- `marker-highlight` : barre verte derrière 1 à 3 mots par section, qui se « trace » au défilement.
- Piste de montage : 4 blocs proportionnels, tête de lecture verte, étape active en encre pleine.
- Téléphones d'exemples : boucles muettes réelles, légende honnête dessous.
- Formules : 3 colonnes à structure identique, la formule du milieu en bloc nuit ; tampon « Tarifs de lancement » en rose encre.

Mouvement : GSAP + ScrollTrigger + Lenis. Révélations par masque de ligne (0,9s, `expo.out`), scrub sur héros (timecode, ruban), méthode (tête de lecture) et ouverture de la salle de projection (clip-path). `prefers-reduced-motion` : pas de Lenis, pas d'épinglage, pas de WebGL, vidéos en pause avec bouton lecture ; tout le contenu reste visible.

## Do's and Don'ts

- Faire : de vrais extraits de nos vidéos, des délais « indicatifs », des prix exacts, la mention voix de synthèse.
- Faire : un seul appel à l'action principal, répété (en-tête, tarifs, final).
- Ne pas faire : dégradés violet/bleu, glassmorphism, grilles de cartes identiques à icônes, Inter, emojis.
- Ne pas faire : faux logos clients, faux témoignages, faux chiffres (« +300 % de ventes »), compteurs décoratifs.
- Ne pas faire : mots creux (« révolutionnaire », « boostez »), tutoiement, promesse de résultats.
- Ne pas faire : script/style inline, CDN, police distante (CSP stricte).
