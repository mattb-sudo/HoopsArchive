# NBA Card Tracker

Application web personnelle de suivi d'une collection de cartes de basket-ball.
Un compte = une collection : classeurs par set, focus joueur / équipe, session
d'ajout rapide, statistiques, photos personnelles des cartes.

> Ce README concerne **uniquement** ce sous-projet (`nba-card-tracker-web/`).
> Le README situé au niveau du dossier parent décrit l'ancien prototype
> statique, qui n'est plus utilisé.

## Sommaire

1. [Ce que fait l'application](#1-ce-que-fait-lapplication)
2. [Pile technique](#2-pile-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Créer le projet Supabase](#4-créer-le-projet-supabase)
5. [Lancer l'application en local](#5-lancer-lapplication-en-local)
6. [Publier le code sur GitHub](#6-publier-le-code-sur-github)
7. [Déployer sur Vercel](#7-déployer-sur-vercel)
8. [Notes de conception](#8-notes-de-conception)

---

## 1. Ce que fait l'application

| Écran | Chemin | Contenu |
| --- | --- | --- |
| Accueil | `/accueil` | Compteur global possédées/total + %, sets en cours, dernières cartes ajoutées en éventail, une « carte du jour » par focus actif, compteur de doublons, accès rapides |
| Bibliothèque de sets | `/sets` | Liste des sets du plus récent au plus ancien, jaquette générée, progression |
| Classeur | `/classeur/[setId]` | Grille de cartes par sous-ensemble (base → highlights → all-star → inserts → autographes), case à cocher directe, filtres (sous-ensemble, rookies, statut, recherche locale), tri numéro / joueur / équipe |
| Focus | `/focus/[id]` | Les cartes d'un joueur ou d'une équipe, tous sets confondus, avec sa propre progression |
| Fiche carte | `/carte/[setId]/[cardCode]` | Grand visuel, possession, quantité, numéro de maillot et variante éditables, note, photo personnelle, carte précédente / suivante |
| Recherche | `/recherche` | Recherche globale (joueur, équipe, numéro, nom de set) + filtres |
| Ajouter | `/ajouter` | Session d'ajout : autocomplétion → quantité → ajout immédiat, liste de la session avec annulation ligne par ligne |
| Statistiques | `/stats` | Courbe d'évolution, répartition par équipe et par type de carte, doublons, progression par focus |
| Profil | `/profil` | Avatar, pseudonyme, date d'inscription, statistiques, gestion des focus, préférences (vue par défaut, thème clair/sombre), déconnexion |
| Connexion | `/login` | Connexion et création de compte par email + mot de passe |

**Aucune image de carte n'est récupérée sur un site tiers.** Les visuels sont
générés localement en CSS aux couleurs officielles de la franchise
(`lib/teamColors.ts`, `components/CardVisual.tsx`). Seule exception : les photos
que vous prenez vous-même, stockées dans un bucket Supabase privé.

## 2. Pile technique

- **Next.js 14** (App Router, Server Components, Server Actions) + **TypeScript** strict
- **Tailwind CSS** (mode sombre par classe sur `<html>`)
- **Supabase** : Postgres + Auth (email/mot de passe) + Storage, via `@supabase/ssr`
- Aucune librairie de graphiques : les visualisations sont du SVG écrit à la main
- Hébergement visé : **Vercel** (plan gratuit suffisant)

Prérequis local : **Node.js 18.17 ou plus récent** (`node --version`).

## 3. Structure du projet

```
nba-card-tracker-web/
├── app/                        # routes (App Router)
│   ├── layout.tsx              # coquille + navigation + thème
│   ├── login/                  # connexion / inscription
│   ├── auth/callback/          # retour des liens envoyés par email
│   ├── accueil/ sets/ classeur/[setId]/ focus/[id]/
│   ├── carte/[setId]/[cardId]/ recherche/ ajouter/ stats/ profil/
├── components/                 # composants d'interface réutilisables
├── lib/
│   ├── types.ts                # contrat de données, aligné sur le SQL
│   ├── supabase/               # clients serveur / navigateur / middleware
│   ├── db.ts                   # toutes les lectures
│   ├── actions.ts              # toutes les écritures (Server Actions)
│   ├── cards.ts focus.ts rng.ts teamColors.ts avatars.ts
├── data/2025-26-topps-nba-hoops.json   # checklist source (725 entrées)
├── scripts/generate-seed.mjs   # régénère 0002_seed.sql depuis le JSON
├── supabase/migrations/
│   ├── 0001_init.sql           # tables, index, triggers, RLS, bucket Storage
│   └── 0002_seed.sql           # données de référence (généré, ne pas éditer)
└── middleware.ts               # rafraîchit la session, protège les routes
```

## 4. Créer le projet Supabase

### 4.1 Créer le projet

1. Aller sur <https://supabase.com> et se connecter (compte gratuit possible avec GitHub).
2. **New project**.
   - *Name* : `nba-card-tracker`
   - *Database Password* : générer un mot de passe et **le conserver** (il n'est
     pas nécessaire à l'application, mais il est nécessaire pour l'accès direct
     à la base).
   - *Region* : `West EU (Ireland)` ou `Central EU (Frankfurt)`.
3. Attendre 1 à 2 minutes la fin de la création.

### 4.2 Exécuter les deux migrations

**Option A — via l'interface (recommandée, aucun outil à installer)**

1. Dans le projet Supabase : menu de gauche → **SQL Editor** → **New query**.
2. Ouvrir `supabase/migrations/0001_init.sql`, copier **tout** le contenu, le
   coller dans l'éditeur, puis **Run**. Résultat attendu : `Success. No rows returned`.
3. Nouvelle requête (**New query**), même opération avec
   `supabase/migrations/0002_seed.sql` (1 463 lignes, le copier-coller intégral
   fonctionne), puis **Run**.
4. Vérification : **Table Editor** → la table `cards` contient **675** lignes et
   `card_players` **725** lignes.

Les deux scripts sont **idempotents** : les relancer ne casse rien.

**Option B — via la CLI Supabase**

```bash
npm install -g supabase                 # ou : brew install supabase/tap/supabase
cd nba-card-tracker-web
supabase login
supabase link --project-ref <REF_DU_PROJET>   # visible dans l'URL du dashboard
supabase db push
```

### 4.3 Le bucket de photos `card-photos`

`0001_init.sql` **crée déjà** le bucket privé `card-photos` (limite 10 Mo,
images uniquement) et les quatre règles d'accès qui isolent chaque utilisateur
dans son propre dossier `<user_id>/<set_id>/<card_code>`. Il n'y a normalement
**rien à faire**.

Vérification : **Storage** → un bucket `card-photos` marqué *Private* doit
apparaître.

⚠️ *Cas d'échec possible* : sur certains projets, l'éditeur SQL n'a pas le droit
de créer des règles sur `storage.objects` et la section 6 du script renvoie une
erreur du type `must be owner of table objects`. Dans ce cas :

1. **Storage** → **New bucket** → nom `card-photos`, **Public : désactivé**,
   *File size limit* `10 MB`.
2. Onglet **Policies** du bucket → **New policy** → *For full customization*, et
   créer quatre règles (SELECT, INSERT, UPDATE, DELETE) pour le rôle
   `authenticated` avec l'expression :
   `bucket_id = 'card-photos' and (storage.foldername(name))[1] = auth.uid()::text`

Sans ce bucket, toute l'application fonctionne : seul l'ajout d'une photo
personnelle échoue.

### 4.4 Réglages d'authentification

Menu **Authentication** → **Providers** → **Email** :

- **Email** doit être activé (c'est le cas par défaut).
- **Confirm email** : si vous le **désactivez**, la création de compte connecte
  immédiatement ; si vous le laissez activé, il faut cliquer sur le lien reçu
  par email avant de pouvoir se connecter. Les deux cas sont gérés.

Menu **Authentication** → **URL Configuration** (nécessaire seulement si
*Confirm email* est activé) :

- *Site URL* : `http://localhost:3000` en local, puis l'URL Vercel en production.
- *Redirect URLs* : ajouter `http://localhost:3000/auth/callback` et
  `https://<votre-projet>.vercel.app/auth/callback`.

### 4.5 Récupérer les deux clés

Menu **Project Settings** → **API** :

| Champ Supabase | Variable d'environnement |
| --- | --- |
| *Project URL* | `NEXT_PUBLIC_SUPABASE_URL` |
| *Project API keys* → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

🚫 **Ne jamais utiliser la clé `service_role`** : elle contourne toutes les
règles de sécurité. Elle n'a sa place ni dans `.env.local`, ni sur Vercel, ni
dans Git.

## 5. Lancer l'application en local

```bash
cd nba-card-tracker-web
cp .env.local.example .env.local     # puis remplacer les deux valeurs (§ 4.5)
npm install
npm run dev
```

Ouvrir <http://localhost:3000> → redirection vers `/login` → **Créer un
compte** → l'application s'ouvre sur `/accueil`.

Si `.env.local` est absent ou incomplet, l'application démarre quand même et
affiche un écran expliquant quelles variables manquent (aucun plantage).

Autres commandes :

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement (rechargement à chaud) |
| `npm run build` | Build de production (fonctionne sans Supabase configuré) |
| `npm start` | Sert le build de production |
| `npm run typecheck` | Vérification TypeScript, sans rien émettre |
| `npm run lint` | ESLint (`next lint`) |
| `npm run seed:generate` | Régénère `supabase/migrations/0002_seed.sql` depuis `data/*.json` |

## 6. Publier le code sur GitHub

Le dépôt Git existe déjà dans `nba-card-tracker-web/` et contient
l'historique des commits. Il reste à créer le dépôt distant sous le compte
**`mattb-sudo`** et à pousser.

### Option A — en une commande avec GitHub CLI

Prérequis : `gh` installé (`brew install gh`) et connecté (`gh auth login`,
choisir *GitHub.com* → *HTTPS* → *Login with a web browser*).

```bash
cd nba-card-tracker-web
gh repo create mattb-sudo/nba-card-tracker --private --source=. --remote=origin --push
```

### Option B — manuellement

1. Sur <https://github.com/new>, connecté en tant que `mattb-sudo` :
   - *Repository name* : `nba-card-tracker`
   - *Private*
   - **Ne rien cocher** (pas de README, pas de `.gitignore`, pas de licence)
   - **Create repository**
2. Puis :

```bash
cd nba-card-tracker-web
git remote add origin https://github.com/mattb-sudo/nba-card-tracker.git
git branch -M main
git push -u origin main
```

GitHub demandera un identifiant : le mot de passe du compte ne fonctionne pas,
il faut un **Personal Access Token** (Settings → Developer settings → Personal
access tokens → *Tokens (classic)* → *Generate new token* → cocher `repo`) à
coller à la place du mot de passe.

`.env.local` est ignoré par Git (`.gitignore`) : les clés ne partent jamais sur
GitHub.

## 7. Déployer sur Vercel

1. <https://vercel.com> → **Continue with GitHub** (compte `mattb-sudo`).
2. **Add New…** → **Project** → dans la liste, choisir `nba-card-tracker` →
   **Import**. Si le dépôt n'apparaît pas : *Adjust GitHub App Permissions* →
   autoriser Vercel sur ce dépôt.
3. Réglages du projet :
   - *Framework Preset* : **Next.js** (détecté automatiquement).
   - *Root Directory* : laisser vide **si** le dépôt GitHub a été créé depuis
     `nba-card-tracker-web/` (cas des commandes ci-dessus). Si vous avez poussé
     le dossier parent, indiquer `nba-card-tracker-web`.
   - *Build Command* / *Output Directory* / *Install Command* : ne rien changer.
4. **Environment Variables** — ajouter les deux variables **avant** de déployer :

   | Name | Value | Environments |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* Supabase | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` `public` | Production, Preview, Development |

5. **Deploy**, puis attendre ~2 minutes.
6. Retourner dans Supabase → **Authentication** → **URL Configuration** et
   ajouter l'URL Vercel (*Site URL*) ainsi que
   `https://<votre-projet>.vercel.app/auth/callback` (*Redirect URLs*).

Si les variables sont ajoutées **après** un déploiement, il faut relancer un
déploiement : onglet **Deployments** → dernier déploiement → *⋯* →
**Redeploy**.

## 8. Notes de conception

- **`card_players`** : certaines cartes autographes signées à plusieurs
  (`HRD` Rookie Duals, `HRT` Rookie Triples, `RVD` Rookie/Veteran Duos) portent
  **un seul numéro pour 2 ou 3 joueurs**. La clé primaire de `cards` étant
  `(set_id, card_code)`, ces associations vivent dans la table
  `card_players` ; les focus interrogent cette table pour retrouver une carte
  même quand le joueur suivi n'est pas le premier signataire.
- **`variant` et `jersey_number`** sont stockés dans `user_card_state`, pas dans
  `cards` : les tables de référence sont en lecture seule pour les utilisateurs
  (RLS). L'affichage privilégie la valeur saisie, puis celle de la checklist.
  Aucun numéro de maillot n'est jamais pré-rempli ou inventé.
- **Sécurité** : chaque table utilisateur (`user_card_state`, `focuses`,
  `profiles`) est protégée par des règles RLS `user_id = auth.uid()`. Les photos
  sont dans un bucket privé, servies via des URL signées valables une heure.
- **Carte du jour** : tirage déterministe (`lib/rng.ts`) à partir de la date du
  jour et de l'identifiant du focus. Rien n'est stocké, et la sélection change
  à minuit.
- **Robustesse du build** : aucun client Supabase n'est créé à l'import d'un
  module. Toutes les pages vérifient `isSupabaseConfigured()` et sont marquées
  `dynamic = "force-dynamic"`, si bien que `npm run build` réussit sans base de
  données.
