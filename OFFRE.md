# OFFRE — KIWIBYTE Studio

Document interne (non publié sur le site). Proposition de Tony, à valider par Captox.

## Positionnement

**Quoi** : des pubs vidéo verticales de 20 à 40 secondes (Reels, TikTok, YouTube Shorts, publicités Meta), produites avec l'I.A. : script, voix de synthèse française, animations graphiques, sous-titres, musique sous licence commerciale. Livrées en quelques jours, avec une révision.

**Pour qui** : petites structures francophones sans équipe vidéo — commerces locaux, e-commerçants (Shopify, WooCommerce, Etsy), coachs et indépendants, restaurants.

**Pourquoi nous** (honnête) : le pipeline existe déjà et tourne pour la chaîne KIWIBYTE (script → voix → rendu HyperFrames → sous-titres) ; un indépendant peut donc livrer vite et à petit prix. Modèle inspiré de Knowlify (YC Summer 2025), en version locale, personnelle et abordable.

**Ce qu'on ne promet pas** : des ventes, des vues, un « retour sur investissement ». On promet un livrable, un délai et une révision.

**Ce qu'on ne fait pas** : tournage, acteurs, faux témoignages, deepfakes de personnes réelles, gestion des campagnes publicitaires.

## Prix (tarifs de lancement, modifiables dans `src/config.ts`)

| Formule | Contenu | Prix | Par vidéo |
|---|---|---|---|
| Essai | 1 vidéo 20–40 s, 1 révision, 5 jours ouvrés | 149 € | 149 € |
| Lancement | 3 vidéos, 3 accroches, 1 déclinaison 1:1 ou 16:9, 1 révision par vidéo, 7 jours ouvrés | 390 € | 130 € |
| Mensuel | 4 vidéos/mois, sujets + calendrier proposés, sans engagement | 490 €/mois | 122,50 € |

Options : vidéo supplémentaire 120 €, révision supplémentaire 30 €. Acompte 50 % à la validation du script.

**Cohérence** (repère, pas une garantie) : pour un débutant, une vidéo demande environ 2 à 3 h une fois le pipeline rodé (brief 15 min, script 30–45 min, production 1 h, révision 30 min). 130 € la vidéo ≈ 45–65 € de l'heure avant charges ; en micro-entreprise (prestation de services BNC/BIC), retirer environ 21 à 25 % de cotisations selon le statut — à vérifier sur urssaf.fr. Le prix est volontairement bas pour obtenir les premiers clients et des exemples à montrer ; le remonter après 5 à 10 clients.

**Coûts directs à surveiller** : voix de synthèse (vérifier que la licence de l'outil autorise l'usage commercial), musique (bibliothèque avec licence commerciale), éventuelles images sous licence (devisées à part).

## Avant le premier client (check-list)

1. Statut : micro-entreprise déclarée (gratuit sur formalites.entreprises.gouv.fr) → SIRET à mettre dans les mentions légales.
2. Adresse e-mail pro → `src/config.ts` (`email`), puis `npm run build`.
3. Compléter `mentions-legales.html` et `confidentialite.html` (tous les « [à compléter] »).
4. Préparer **2 à 3 vraies démos** pour des commerces fictifs clairement présentés comme démos (« exemple réalisé pour une boulangerie fictive »), ou mieux : 1 à 3 vidéos offertes à de vrais commerçants en échange de l'autorisation de les montrer. Ne jamais présenter une démo comme un client.
5. Modèle de devis + conditions générales de vente (droits cédés, révision, délai, acompte).

## Plan de prospection — 7 jours (France)

Règles : messages personnalisés et peu nombreux (10 à 20 par jour), jamais d'envoi en masse, pas de liste achetée. En B2B, la prospection par e-mail est permise si le message concerne l'activité professionnelle du destinataire et propose de se désinscrire (règles CNIL) ; une seule relance, puis on arrête. Sur Instagram/LinkedIn : un message, une relance maximum.

| Jour | Cible | Action |
|---|---|---|
| J1 | — | Préparer : 1 démo « restaurant » et 1 démo « boutique » (fictives, annoncées comme telles), liste de 40 commerces locaux (Google Maps : restaurants, boulangeries, fleuristes, salons, boutiques) avec un compte Instagram actif mais sans vidéo récente. |
| J2 | Restaurants et commerces de bouche de ta ville | 15 messages Instagram personnalisés (voir modèle A). Passer en personne dans 3 à 5 commerces aux heures creuses avec la démo sur le téléphone. |
| J3 | E-commerçants (boutiques Shopify/Etsy francophones, 1 à 10 personnes) | 15 e-mails courts à l'adresse de contact publique de la boutique (modèle B), avec une idée d'accroche précise pour un de leurs produits. |
| J4 | Coachs, formateurs, thérapeutes, consultants | 15 messages LinkedIn (modèle C). Publier une démo sur ton propre compte LinkedIn/Instagram avec le « avant / après » d'un script. |
| J5 | Relances | Une relance polie aux personnes qui n'ont pas répondu à J2 (modèle D). Répondre à tous les messages reçus. |
| J6 | Réseau local | Message aux associations de commerçants / office de commerce / CCI locale : proposer une courte démonstration gratuite (15 min) aux adhérents. Poster dans 1 ou 2 groupes Facebook locaux d'entrepreneurs **si le règlement du groupe l'autorise**. |
| J7 | Bilan | Compter réponses, appels, devis. Ajuster le message qui marche le moins. Préparer la semaine 2 (nouvelle liste de 40). |

Objectif réaliste de la semaine : quelques conversations et 1 ou 2 devis. Pas d'objectif de chiffre d'affaires annoncé.

### Modèles de messages (à personnaliser à chaque fois)

**A — Commerce local (Instagram)**
> Bonjour, je suis [prénom], je fais des petites vidéos verticales de 30 secondes pour les commerces de [ville]. J'ai vu votre [plat / produit précis] sur votre page : je verrais bien une vidéo « [idée d'accroche précise] ». Je peux vous envoyer un script gratuit pour voir si ça vous parle ? Aucun engagement.

**B — E-commerçant (e-mail)**
> Objet : une idée de pub de 30 s pour [nom du produit]
> Bonjour [prénom], je produis des pubs vidéo verticales avec l'I.A. (script, voix de synthèse déclarée, animation). Pour [produit], je testerais trois accroches : [1], [2], [3]. Si vous voulez, je vous envoie le script de la première, gratuitement. Sinon, pas de souci : dites-le-moi et je ne vous relancerai pas.
> [prénom] — [lien du site]

**C — Coach / indépendant (LinkedIn)**
> Bonjour [prénom], vous expliquez très bien [sujet] dans vos posts. Je fais des vidéos de 40 secondes qui expliquent une méthode en schéma animé, sans que vous ayez à vous filmer. Ça vous intéresse que je vous propose un script sur [sujet précis] ?

**D — Relance unique**
> Bonjour, je me permets une seule relance au sujet de la vidéo pour [produit/commerce]. Si ce n'est pas le moment, aucun problème, je ne vous écrirai plus.

## Indicateurs à suivre (tableur simple)

Messages envoyés, réponses, scripts gratuits envoyés, devis, devis signés, temps passé par vidéo. Pas de publication de ces chiffres sur le site tant qu'ils ne sont pas réels et vérifiables.
