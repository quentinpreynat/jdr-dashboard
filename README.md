# L'Anneau Unique - Outil MJ (Jalon 1)

Carnet MJ local-first pour **L'Anneau Unique / The One Ring**, conçu pour une personne non-développeuse.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Persistance locale via `localStorage` avec une petite abstraction de stockage

## Installation

1. Installer Node.js 18+ (Node 20 LTS recommandé).
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Démarrer le serveur de dev :
   ```bash
   npm run dev
   ```
4. Ouvrir l'URL affichée par Vite (souvent `http://localhost:5173`).

## Deploiement GitHub Pages

Le deploiement est automatise via GitHub Actions sur chaque push sur `main`.

1. Verifier que le repo est publie en Pages (Settings -> Pages -> Source = GitHub Actions).
2. Le workflow construit `dist/` et deploie automatiquement.
3. L'URL finale est `https://<user>.github.io/<repo>/`.

### Configuration du `base` Vite (nom du repo)

Le `base` est deduit de la variable d'environnement `GITHUB_REPO` dans `vite.config.ts`.

- En CI, le workflow fournit automatiquement `GITHUB_REPO: ${{ github.event.repository.name }}`.
- En local, si vous voulez tester un build avec le meme chemin que GitHub Pages :
  ```bash
  $env:GITHUB_REPO="nom-du-repo"
  npm run build
  ```

Si vous preferez un `base` fixe, modifiez la variable `repoName` dans `vite.config.ts`.

## Installation sur iPad (PWA)

1. Ouvrir l'application dans Safari.
2. Bouton Partager (carré avec flèche vers le haut).
3. Choisir **Ajouter à l'écran d'accueil**.
4. Lancer l'app depuis l'icône : elle s'ouvre en plein écran.

## Routing (HashRouter)

Le routing utilise `HashRouter` pour eviter les erreurs 404 au rafraichissement sur GitHub Pages.

- Les URLs ressemblent a `https://<user>.github.io/<repo>/#/sessions`.

## Hors ligne

- Après une première visite en ligne, l'app peut s'ouvrir hors connexion.
- Les données restent stockées localement dans le navigateur.
- Limitations : la première ouverture nécessite une connexion pour mettre en cache les fichiers. Seul le shell de l'app est garanti hors ligne.

## Fonctionnalités Jalon 1

- Shell d'app avec navigation
- Tableau de bord de campagne
  - édition du titre, résumé, tonalité
  - chronologie dérivée des sessions (tri par ordre, déplacement haut/bas)
- Sessions
  - liste des sessions avec création/suppression et `updatedAt`
  - détail de session avec titre/objectif/notes
  - CRUD des scènes (`title`, `text`, `order`) avec déplacement haut/bas
  - lien PNJ aux scènes via cases à cocher
- PNJ
  - liste des PNJ avec création/suppression
  - détail PNJ avec `name`, `role`, `locationText`, `description`, `notes`
  - liste des apparitions (session + scène) en lecture seule
- Bouton de réinitialisation dans l'en-tête et dans Paramètres
- Indicateur d'auto-sauvegarde dans l'en-tête

## Stockage des données

- Les données sont stockées dans le `localStorage` du navigateur avec la clé :
  - `tor-gm-v1-data`
- Le code de stockage est isolé dans :
  - `src/lib/storage.ts`
- L'application utilise une interface `DataStore` simple afin de pouvoir remplacer la persistance plus tard (par exemple avec IndexedDB) sans réécrire les écrans.

## Modèle de données

Défini dans `src/models.ts` :

- `Campaign { id, title, summary, tone, timelineItems: { id, text, order }[], createdAt, updatedAt }`
- `Session { id, title, objective, notes, scenes: { id, title, text, order, linkedNpcIds: string[] }[], inTimeline: boolean, timelineOrder: number, createdAt, updatedAt }`
- `Npc { id, name, role, locationText, description, notes, attitude: "friendly" | "neutral" | "wary" | "hostile", createdAt, updatedAt }`

## Réinitialiser les données de démo

Utiliser **Réinitialiser les données de démo** dans l'en-tête (ou dans Paramètres) pour effacer les changements locaux et restaurer le contenu de démo.

## Sauvegarde (export / import)

- **Exporter les données** : télécharge un fichier JSON de sauvegarde.
- **Importer une sauvegarde** : sélectionne un fichier JSON et remplace les données actuelles.
