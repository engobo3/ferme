# FarmTrust — Redesign Kinshasa & Cotonou

*Juillet 2026 — refonte des trois applications pour la gestion de fermes **et** de chantiers dans les deux marchés de lancement.*

## Contexte

FarmTrust est une plateforme de confiance pour la diaspora : des investisseurs à l'étranger financent des fermes (volaille, porcs) et des chantiers de construction au pays ; des opérateurs locaux exécutent des tâches vérifiées par photo/GPS ; des fournisseurs agréés encaissent des bons d'achat restreints. Les deux marchés de lancement :

| | Kinshasa (RD Congo) | Cotonou (Bénin) |
|---|---|---|
| Devise | CDF (franc congolais) | XOF (franc CFA) |
| Indicatif | +243 | +229 |
| Mobile money | M-Pesa, Airtel Money, Orange Money | MTN MoMo, Moov Money |
| Langue de travail | français | français |

## Principes de conception (les « best practices » appliquées)

1. **Français d'abord.** Le français est la langue de travail des deux villes. Les surfaces opérateur (mobile) et fournisseur sont 100 % françaises ; l'espace investisseur est français par défaut avec bascule FR/EN pour la diaspora anglophone. Catalogue partagé : `libs/shared-ui/src/i18n/strings.ts`.
2. **Deux devises, jamais mélangées.** Tout affichage monétaire passe par `formatMoney` / `formatMoneyCompact` (`libs/core-logic/src/region.ts`). CDF et XOF sont zéro-décimale à l'usage ; aucune conversion FX implicite.
3. **Hors-ligne d'abord.** Réseau intermittent assumé : file d'attente locale des preuves (MediaQueueService + NetInfo), bandeau hors-ligne avec compteur d'envois en attente sur l'accueil mobile. Persistance Firestore web : voir feuille de route.
4. **Lisible en plein soleil, utilisable d'une main.** Jetons de design (`libs/shared-ui/src/theme/tokens.ts`) : contraste AA sur toutes les paires texte/surface, corps de texte ≥ 16, cibles tactiles ≥ 48 dp, thème clair à fort contraste sur mobile.
5. **Deux verticales, un seul système.** Ferme = vert (`#2E7D32`), chantier = ambre (`#B45309`). Statuts de tâches unifiés (mêmes couleurs/libellés partout via `getTaskStatusDisplay`).
6. **Poids réseau minimal.** Pas de police téléchargée (pile système), pas de dépendance Google Fonts au build, bundles statiques.
7. **La confiance par la vérification, pas par la promesse.** Inchangé et renforcé : machine à états stricte des tâches, géofencing (ray-casting + zone tampon), chaîne de traçabilité des matériaux, référentiel de prix anti-fraude (seuil ±30 %), écritures financières réservées au backend.

## Ce qui a changé

### Fondation partagée (nouveau)
- `libs/core-logic/src/region.ts` — régions Kinshasa/Cotonou (devise, locale `fr-CD`/`fr-BJ`, indicatif, fuseau, opérateurs mobile money avec correspondants PawaPay), `formatMoney`, `formatMoneyCompact`, `isPlausibleMsisdn`. Champs optionnels `region` sur `User` et `Farm`.
- `libs/shared-ui/src/theme/tokens.ts` — palette, couleurs sémantiques, couleurs de statut, espacement, rayons, échelle typographique, `MIN_TOUCH_TARGET`.
- `libs/shared-ui/src/i18n/` — catalogue FR (canonique) + EN, `t()`, `I18nProvider`/`useI18n`. `getTaskStatusDisplay` consomme désormais jetons + catalogue.

### `apps/manager-mobile` (ouvriers / chefs de chantier)
- UI 100 % française, couleurs des écrans issues des jetons, backdoor de debug supprimée, `verifiedBy` réel (plus de « Michel » codé en dur).
- Onglets : **Accueil** (tableau de bord tâches avec bandeau hors-ligne + retards), **Chantier** (matériaux), **Outils** (hub : mesurer le terrain, scanner les cultures, témoin vidéo, demander un bon d'achat) — l'onglet démo Expo a été supprimé, ainsi que ~10 composants boilerplate.
- Deux modules orphelins enfin branchés : **pointage géofencé** (sur le détail de tâche quand un périmètre existe, écrit dans `clock_ins`) et **demande de bon d'achat** (route `request-funds`, devise selon la région — plus de XOF codé en dur).
- Corrigé au passage : 5 bugs `snap.exists` (RNFirebase v23 — la branche « introuvable » ne s'exécutait jamais) et un abonnement Firestore qui ignorait le rôle chargé tardivement.

### `apps/investor-web` (diaspora)
- Français par défaut (`lang="fr"`), bascule FR/EN dans la barre supérieure, catalogue applicatif `src/lib/i18n.ts` (~110 clés).
- Jetons mappés dans Tailwind v4 (`@theme` dans `globals.css`) ; accents indigo → vert marque, verticale chantier en ambre ; police système (dépendance Google Fonts supprimée → build hors-ligne reproductible).
- Tout l'argent via `formatMoney`/`formatMoneyCompact` ; le widget financier groupe les paiements **par devise** (CDF et XOF côte à côte, sans conversion).
- Sous-arbre construction : accents normalisés, montants CDF formatés (reste français-seul, assumé).

### `apps/supplier-web` (fournisseurs)
- Sélecteur de marché **Kinshasa / Cotonou** (persisté en localStorage) : pilote la devise des soumissions de prix, l'indicatif téléphonique et la validation MSISDN.
- **Recherche + encaissement de bons enfin fonctionnels** : lecture Firestore du bon, badge de statut, solde restant, encaissement partiel via la fonction `validateVoucher`, erreurs en français.
- Jetons dans Tailwind (`@theme`), accent principal vert marque. `vite-env.d.ts` ajouté (6 erreurs de types préexistantes corrigées).

### Sécurité
- `firestore.rules` : nouvelles règles pour `voucher_requests` (création par l'opérateur, statut initial forcé, décision réservée admin/funder) et `clock_ins` (création par l'intéressé uniquement, immuable ensuite).

## Feuille de route (non couvert par cette refonte)

1. **Backend prix multi-devises** — `submit-price`/`approve-price` ignorent encore la devise envoyée ; les référentiels doivent être clés par région+devise. *(tâche déjà fléchée)*
2. **PawaPay réel** — `functions/src/utils/pawapay.ts` est mocké ; les correspondants par marché sont prêts dans `region.ts`.
3. **Auth téléphone réelle** — l'OTP fournisseur est une maquette ; Firebase Phone Auth + indicatifs régionaux.
4. **Persistance Firestore web** (`persistentLocalCache`) pour l'espace investisseur en connexion instable.
5. **Nettoyage** — supprimer les anciens dossiers `mobile/` et `web/` à la racine (cf. `MONOREPO_README.md`).
6. **Données réelles** — Watchtower et une partie des tableaux construction investisseur tournent encore sur des données fictives.
7. **Langues locales** — le lingala (Kinshasa) et le fon (Cotonou) en pistes audio pour les écrans opérateur, plutôt qu'en traductions écrites.
