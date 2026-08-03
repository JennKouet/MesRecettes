# Mes Recettes

Carnet de recettes et planificateur de menus hebdomadaires.

- **Recettes** : lisibles par tout le monde, y compris sans compte. Seul l'auteur peut modifier ou supprimer les siennes.
- **Menus** : strictement privés. Chaque utilisateur ne voit et ne modifie que les siens.
- **Connexion** : email + mot de passe, ou compte Google.

Depuis la page menu, un créneau se remplit de trois façons sans quitter la page : choisir une recette existante, **créer à la volée** une recette qui n'existe pas encore (le titre suffit), ou noter un **repas libre** (« restes », « restaurant ») qui ne crée aucune fiche.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Base de données | PostgreSQL 17 — Docker en local, [Neon](https://neon.tech) en production |
| ORM | Prisma 7 avec le driver adapter `@prisma/adapter-pg` |
| Authentification | Auth.js v5 (`next-auth@5` beta) |
| Styles | Tailwind CSS 4 (configuration en CSS, pas de `tailwind.config.ts`) |
| Formulaires | react-hook-form + zod |
| Gestionnaire de paquets | Yarn 4 (Corepack) |

## Démarrer en local

Prérequis : **Node ≥ 20.9**, **Docker**, **Corepack** (fourni avec Node).

```bash
corepack enable
yarn install

cp .env.example .env
yarn dlx auth secret          # génère AUTH_SECRET dans .env

yarn db:up                    # Postgres 17 dans Docker (port 5433)
yarn prisma migrate dev       # applique les migrations
yarn db:seed                  # 16 catégories + 3 recettes de démonstration

yarn dev                      # http://localhost:3000
```

Compte de démonstration créé par le seed : `demo@mesrecettes.local` / `demo-motdepasse-2026`.

## Scripts

| Commande | Effet |
|---|---|
| `yarn dev` | serveur de développement |
| `yarn build` / `yarn start` | build et exécution en production |
| `yarn lint` | ESLint (`next lint` n'existe plus depuis Next 16) |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn db:up` / `yarn db:down` | démarre / arrête Postgres |
| `yarn db:reset` | **supprime le volume** et repart d'une base vide |
| `yarn db:migrate` | crée et applique une migration |
| `yarn db:seed` | rejoue le seed (idempotent) |
| `yarn db:studio` | Prisma Studio |

Interface web d'inspection de la base, optionnelle :
`docker compose --profile tools up -d` → <http://localhost:8080>

## Connexion Google

À configurer une fois sur [console.cloud.google.com](https://console.cloud.google.com) :

1. Nouveau projet → **APIs & Services → OAuth consent screen** : type *External*, nom de l'application, email de support, scopes `email` `profile` `openid`.
   Tant que l'application est en *Testing*, ajoutez votre propre compte Google dans **Test users**, sinon la connexion renvoie `access_denied`.
2. **Credentials → Create credentials → OAuth client ID → Web application** :
   - *Authorized JavaScript origins* : `http://localhost:3000`
   - *Authorized redirect URIs* (exact, sans slash final) : `http://localhost:3000/api/auth/callback/google`
3. Reportez le client ID et le secret dans `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

En production, ajoutez les mêmes entrées avec l'URL du déploiement.

## Déploiement (Vercel + Neon)

1. Créez une base sur Neon. Deux URLs sont nécessaires :
   - `DATABASE_URL` → l'hôte **poolé** (`...-pooler...`), utilisé par l'application.
   - `DIRECT_URL` → l'hôte **direct**, utilisé par le CLI Prisma. Une migration lancée sur l'hôte poolé échoue sur des advisory locks.
2. Appliquez les migrations depuis un shell local (plutôt que dans la commande de build : une migration qui échoue en plein build laisse l'application à moitié déployée) :
   ```bash
   DIRECT_URL="<url-directe-neon>" yarn prisma migrate deploy
   ```
3. Variables d'environnement Vercel : `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

Le script `postinstall` lance `prisma generate` — il est indispensable : le client est généré dans `src/generated/` qui est gitignoré.

> Le plan gratuit de Neon met la base en veille après ~5 minutes d'inactivité. Le premier appel qui la réveille prend environ une demi-seconde. Ce n'est pas un bug.

## Organisation du code

```
prisma/            schéma, migrations, seed
prisma.config.ts   configuration du CLI Prisma (Prisma 7)
src/
  proxy.ts         redirections de confort (ex-middleware.ts, renommé en Next 16)
  auth.ts          configuration complète Auth.js (adapter, Credentials, Google)
  auth.config.ts   sous-ensemble léger, importé par proxy.ts
  schemas/         schémas zod PARTAGÉS entre les formulaires et les Server Actions
  lib/             db, session, erreurs, dates, formatage
  server/
    queries/       lectures
    actions/       mutations (Server Actions)
  app/             routes et composants
```

## Notes d'implémentation

**Les Server Actions sont des endpoints publics.** Next.js attribue à chacune un identifiant stable ; n'importe qui peut l'appeler avec un corps forgé, sans ouvrir l'interface. Deux conséquences appliquées partout dans `src/server/actions/` :

- La validation react-hook-form est purement ergonomique — elle tourne dans le navigateur de l'utilisateur. Le serveur revalide systématiquement avec le **même** schéma zod (`src/schemas/`).
- La propriété d'une donnée s'exprime **dans le `WHERE` SQL** (`updateMany` / `deleteMany` avec `authorId`), jamais dans un `if` préalable. C'est atomique, et on ne peut pas oublier d'exploiter le résultat du contrôle.

**Les menus sont inaccessibles entre utilisateurs par construction.** Le client envoie une coordonnée — semaine, jour, créneau — jamais un `menuId`. Le serveur résout le menu par `(ownerId, weekStart)`, l'`ownerId` venant de la session. Si un `menuId` apparaît un jour dans `src/schemas/menu.ts`, c'est une faille.

**`Menu.weekStart` est un `DATE` Postgres**, toujours normalisé au lundi à minuit UTC (`src/lib/week.ts`). Sans ça, un utilisateur dans un fuseau très à l'est verrait son lundi enregistré comme le dimanche précédent.

**`Recipe.isComplete` pilote la visibilité publique.** Une recette créée à la volée depuis le menu n'a ni ingrédient ni étape : elle reste visible de son seul auteur jusqu'à ce qu'il la complète. Le drapeau est *dérivé* (au moins un ingrédient ET une étape) mais *stocké*, pour rester filtrable et indexable sans jointure ; il ne peut pas dériver puisque toutes les écritures passent par `createRecipe` / `updateRecipe` / `quickCreateRecipe`, qui le recalculent. Le formulaire complet exigeant les deux, **enregistrer via le formulaire revient à publier**. Le filtrage est concentré dans `src/server/queries/recipes.ts` : le paramètre `viewerId` vient toujours de la session, jamais de la requête HTTP, et l'omettre donne la vue strictement publique — le défaut sûr.

**Attention aux `loading.tsx` au-dessus d'une route dynamique.** Un `loading.tsx` crée une frontière Suspense : la réponse part en streaming avec un statut 200, et `notFound()` ne peut plus le corriger en 404. C'est pourquoi le squelette de la liste vit dans le groupe `src/app/recettes/(liste)/` — qui n'apparaît pas dans l'URL — plutôt que directement sous `recettes/`, où il couvrirait aussi `[slug]`.

**Les sessions sont des JWT, pas des lignes en base.** Auth.js impose cette stratégie dès qu'un provider `Credentials` est présent. Les utilisateurs et les comptes Google restent persistés en Postgres via le `PrismaAdapter` ; la seule contrepartie est qu'une session ne peut pas être révoquée instantanément côté serveur (elle expire au bout de 30 jours).

**`src/proxy.ts` ne fait que des redirections de confort.** Il doit se trouver dans `src/` — Next ne le détecte pas à la racine quand le projet utilise un dossier `src`. Ce n'est pas une barrière de sécurité : chaque Server Action revérifie la session.
