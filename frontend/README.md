# ArchiFlow Frontend

Interface React de l'application ArchiFlow, une plateforme de gestion documentaire avec authentification JWT, roles utilisateurs, depot de fichiers, archivage, categories, versions de documents et tableau de bord.

## Fonctionnement General

ArchiFlow fonctionne avec deux parties :

- un frontend React/Vite, qui affiche l'interface utilisateur
- un backend Django REST, qui gere l'authentification, les utilisateurs, les documents, les categories, les invitations et les fichiers

Le frontend communique avec le backend via `VITE_API_URL`.

Exemple :

```env
VITE_API_URL=https://client-a.example.com/api
```

Les fichiers uploades sont servis par le backend depuis `MEDIA_ROOT`. Le frontend reconstruit les liens media avec la meme base que l'API, en retirant le suffixe `/api`.

## Isolation Des Applications

Le projet est concu en mode **une application = un frontend + un backend + une base de donnees**.

L'isolation se fait au niveau du deploiement :

- chaque application a sa propre base PostgreSQL
- chaque application a son propre dossier de medias
- chaque application a son propre fichier `.env` backend
- chaque application a son propre fichier `.env` frontend
- chaque application pointe vers sa propre API avec `VITE_API_URL`

Donc les utilisateurs d'une application n'auront pas acces aux donnees d'une autre application **si chaque application utilise une base de donnees differente et un dossier media different**.

Exemple d'isolation correcte :

```text
Application Client A
  Frontend: https://client-a.example.com
  Backend:  https://api-client-a.example.com
  DB_NAME:  archiflow_client_a
  MEDIA_ROOT: /var/lib/archiflow/client-a/media

Application Client B
  Frontend: https://client-b.example.com
  Backend:  https://api-client-b.example.com
  DB_NAME:  archiflow_client_b
  MEDIA_ROOT: /var/lib/archiflow/client-b/media
```

Dans ce schema, un utilisateur cree dans `archiflow_client_a` n'existe pas dans `archiflow_client_b`. Les documents, categories, invitations et journaux d'activite restent aussi dans leur base respective.

Important : ne jamais faire pointer deux applications vers le meme `DB_NAME` ou le meme `MEDIA_ROOT`, sinon elles partageront les donnees.

## Stack

- React 19
- Vite
- React Router
- Zustand
- Axios
- react-i18next
- Recharts
- Tailwind CSS
- React Icons

## Prerequis

- Node.js et npm installes
- Backend Django lancer et accessible
- Base PostgreSQL creee pour l'application
- Migrations backend appliquees
- Fichier `.env` backend configure
- Fichier `.env` frontend configure

## Configuration Frontend

Creer un fichier `.env` dans `frontend/`.

Exemple :

```env
VITE_APP_NAME=ArchiFlow Client A
VITE_APP_TAGLINE=Gestion documentaire
VITE_APP_LOGO=CA
VITE_PRIMARY=#0f766e
VITE_ACCENT=#1e293b
VITE_FOOTER=ArchiFlow Client A - Acces reserve
VITE_LANG=fr
VITE_API_URL=https://api-client-a.example.com/api
```

Un template est disponible ici :

```text
frontend/src/.env.client-example
```

Variables importantes :

- `VITE_APP_NAME` : nom visible de l'application
- `VITE_APP_TAGLINE` : slogan ou sous-titre
- `VITE_APP_LOGO` : initiales ou libelle court affiche dans l'interface
- `VITE_PRIMARY` : couleur principale
- `VITE_ACCENT` : couleur secondaire
- `VITE_FOOTER` : texte du pied de page
- `VITE_LANG` : langue par defaut, par exemple `fr` ou `en`
- `VITE_API_URL` : URL publique de l'API backend de cette application

## Configuration Backend

Creer un fichier `.env` dans `backend/`.

Exemple pour le client A :

```env
SECRET_KEY=change-me-client-a
DEBUG=False
ALLOWED_HOSTS=api-client-a.example.com
CORS_ALLOWED_ORIGINS=https://client-a.example.com

DB_NAME=archiflow_client_a
DB_USER=archiflow_client_a
DB_PASSWORD=change-me
DB_HOST=localhost
DB_PORT=5432

MEDIA_ROOT=/var/lib/archiflow/client-a/media

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DEFAULT_FROM_EMAIL=noreply@client-a.example.com
FRONTEND_URL=https://client-a.example.com
```

Un template est disponible ici :

```text
backend/.env.example
```

Variables importantes :

- `SECRET_KEY` : cle secrete Django, unique par application
- `DEBUG` : doit etre `False` en production
- `ALLOWED_HOSTS` : domaine(s) du backend
- `CORS_ALLOWED_ORIGINS` : domaine(s) autorises pour le frontend
- `DB_NAME` : base PostgreSQL dediee a l'application
- `DB_USER` / `DB_PASSWORD` : identifiants PostgreSQL de cette application
- `MEDIA_ROOT` : dossier dedie aux fichiers uploades de cette application
- `FRONTEND_URL` : URL du frontend, utilisée dans les liens d'invitation
- `DEFAULT_FROM_EMAIL` : adresse d'envoi des emails

## Installation Locale

Installer les dependances frontend :

```bash
cd frontend
npm install
```

Lancer le frontend en developpement :

```bash
npm run dev
```

Le backend doit etre lance separement, generalement sur `http://localhost:8000`.

En local, le frontend peut utiliser :

```env
VITE_API_URL=http://localhost:8000/api
```

## Deploiement D'Une Nouvelle Application

Pour creer une nouvelle application/client :

1. Creer une base PostgreSQL dediee, par exemple `archiflow_client_a`.
2. Creer un utilisateur PostgreSQL dedie pour cette base.
3. Creer un dossier media dedie, par exemple `/var/lib/archiflow/client-a/media`.
4. Copier `backend/.env.example` vers `backend/.env` sur le serveur de cette application.
5. Remplir `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `MEDIA_ROOT`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` et `FRONTEND_URL`.
6. Appliquer les migrations backend.
7. Creer le premier utilisateur admin.
8. Copier `frontend/src/.env.client-example` vers `frontend/.env`.
9. Remplir `VITE_APP_NAME`, les couleurs, la langue et `VITE_API_URL`.
10. Construire le frontend avec `npm run build`.
11. Servir le dossier `frontend/dist` avec Nginx, Apache ou un hebergeur statique.
12. Servir le backend Django avec un serveur WSGI/ASGI, par exemple Gunicorn/Uvicorn derriere Nginx.

## Scripts Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Routes Principales

- `/login` : connexion
- `/dashboard` : tableau de bord, reserve aux admins et editeurs
- `/archives` : archives accessibles aux utilisateurs connectes
- `/archives/:id` : detail d'un document
- `/upload` : depot de documents, reserve aux admins et editeurs
- `/categories` : gestion des categories, reservee aux admins
- `/users` : gestion des utilisateurs, reservee aux admins
- `/profile` : profil utilisateur
- `/set-password/:token` : creation de compte invité
- `/unauthorized` : acces refuse

## Fonctionnalites

- Connexion JWT par email et mot de passe
- Navigation protegee selon les roles `admin`, `editeur` et `lecteur`
- Tableau de bord avec statistiques et graphiques
- Liste des archives avec recherche, filtres et pagination
- Depot de documents PDF, Word, Excel et CSV
- Gestion des categories
- Gestion des utilisateurs et invitations
- Creation de compte via lien d'invitation
- Profil utilisateur et changement de mot de passe
- Interface bilingue francais/anglais via `react-i18next`

## Internationalisation

Les traductions sont dans :

- `src/locales/fr.json`
- `src/locales/en.json`

L'initialisation est dans `src/i18n.js`. La langue par defaut vient de `VITE_LANG` ou retombe sur `fr`.

Pour ajouter un texte :

1. Ajouter la clé dans `fr.json`.
2. Ajouter la meme clé dans `en.json`.
3. Utiliser `const { t } = useTranslation();` dans le composant.
4. Afficher le texte avec `t("section.key")`.

## Checklist Avant Production

Avant de deployer, verifier :

- `DEBUG=False` cote backend
- `SECRET_KEY` unique, longue et non committee
- `ALLOWED_HOSTS` limite aux domaines backend reels
- `CORS_ALLOWED_ORIGINS` limite aux domaines frontend reels
- `DB_NAME` different pour chaque application/client
- `MEDIA_ROOT` different pour chaque application/client
- `FRONTEND_URL` correct pour les liens d'invitation
- `VITE_API_URL` pointe vers l'API de la bonne application
- les migrations backend sont appliquees
- un compte admin existe pour l'application
- les fichiers `.env` ne sont pas committes
- les dossiers `media/`, `venv/`, `__pycache__/` et `node_modules/` ne sont pas committes
- les medias sont servis par le serveur web en production, pas par Django directement
- une sauvegarde automatique de la base et du dossier media est configuree

## Structure Utile

```text
src/
  api/          Appels HTTP Axios
  components/   Layout, routes privees, pagination, toasts
  config/       Theme et configuration application/client
  locales/      Traductions fr/en
  pages/        Pages applicatives
  store/        Stores Zustand
```
