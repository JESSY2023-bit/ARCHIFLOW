# ArchiFlow Frontend

Le frontend ArchiFlow est l’interface web React/Vite de la solution de gestion documentaire. Il permet à un administrateur, un éditeur ou un lecteur d’accéder à la plateforme selon leur rôle, de consulter les documents, d’importer des fichiers et gérer les utilisateurs.

## État actuel du projet

Le frontend contient déjà une grande partie des fonctionnalités de base d’une application documentaire :

- login et authentification JWT
- tableau de bord
- galerie / archives de documents
- upload de document
- gestion des utilisateurs
- invitations d’utilisateurs
- gestion des catégories
- profil utilisateur
- page d’accès refusé
- page d’initialisation de compte à partir d’un token d’invitation
- i18n FR/EN
- gestion des permissions documentaires par utilisateur depuis la fiche document

Le projet est bien avancé en terme de structure et de flux utilisateur, et le besoin critique d’accès restreint par document a désormais été intégré côté interface et API. Il reste cependant plusieurs points de production à corriger pour un usage réel en entreprise.

## Stack technique

- React 19
- Vite
- React Router
- Zustand
- Axios
- React Icons
- Tailwind CSS
- Recharts
- i18next

## Structure du frontend

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── config/
│   ├── locales/
│   ├── pages/
│   ├── store/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── i18n.js
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
├── README.md
└── dist/
```

## Fonctionnalités déjà disponibles

### 1. Authentification

- login par email/mot de passe
- stockage des tokens côté client
- protection des routes par rôle
- déconnexion

### 2. Gestion documentaire

- liste des documents
- recherche par document / mots clés
- filtres par catégorie, auteur, type de fichier
- historique de versions
- détail de document
- restauration de version

### 3. Gestion utilisateur

- ajout d’utilisateur
- invitation par email
- modification du rôle et du statut
- suppression d’utilisateur
- profil utilisateur

### 4. Interface fonctionnelle

- sidebar / layout applicatif
- toast de feedback utilisateur
- tableaux, cartes, stats
- route privée selon rôle

## Points à améliorer avant production

### 1. Restriction d’accès par document (priorité majeur)

C’est la fonction que vous voulez et elle est très importante.

Aujourd’hui, le backend traite surtout les rôles globaux :

- admin
- éditeur
- lecteur

Mais cela ne suffit pas pour les cas métier réels, par exemple :

- un document ne doit être visible que par certains collaborateurs
- un admin veut autoriser un service à voir seulement certains dossiers
- un document confidentiel ne doit pas être listé pour tout le monde

Le bon modèle est de rajouter :

- une permission par document
- une permission par utilisateur ou groupe
- des droits de lecture / écriture / téléchargement

Exemple conceptuel :

```text
DocumentAccessRule
- document_id
- user_id OR group_id
- can_view: bool
- can_edit: bool
- can_download: bool
- granted_by
- created_at
```

Ensuite, dans le front et l’API :

- filtrer les documents affichés par permissions
- masquer les documents non autorisés
- afficher les informations “accès restreint”
- ajouter un bouton “Gestion des accès” côté admin

### 2. Supprimer les restes de template Vite par défaut

Le fichier `src/App.jsx` est encore la base par défaut de Vite. Cela est un mauvais signal pour une application de production. Il faut remplacer tout ce code de starter par l’application réelle, ou l’enlever complètement s’il n’est plus utilisé.

### 3. Contrôler proprement les fichiers uploadés

- taille maximum
- extensions autorisées
- validation MIME
- prévisualisation
- sécurité des liens de téléchargement
- scanner des fichiers sensibles si nécessaire

### 4. Créer une gestion d’erreurs plus propre

- erreurs réseau plus explicites
- messages de refus d’accès différents selon le cas
- rechargement intelligent sur token expiré
- gestion des erreurs API globale

### 5. Améliorer le design et la UX

- états vides plus propres
- chargement skeleton
- confirmation d’actions critiques
- filtres avancés
- tri plus clair
- meilleure gestion de pagination

### 6. Ajouter de la sécurité front

- session/token expiré => redirection propre
- bloque automatique des routes non autorisées
- éviter les fuites d’URL et de données sensibles dans le navigateur

## Routes principales

- `/login`
- `/dashboard`
- `/archives`
- `/archives/:id`
- `/upload`
- `/users`
- `/categories`
- `/profile`
- `/set-password/:token`
- `/unauthorized`

## Variables d’environnement

Créez un fichier `.env` dans `frontend/` :

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=ArchiFlow
VITE_APP_TAGLINE=Gestion documentaire
VITE_APP_LOGO=AF
VITE_PRIMARY=#0f766e
VITE_ACCENT=#1e293b
VITE_LANG=fr
VITE_FOOTER=ArchiFlow - Accès réservé
```

## Démarrage local

```bash
cd frontend
npm install
npm run dev
```

Le backend doit être lancé séparément sur `http://localhost:8000`.

## Build de production

```bash
cd frontend
npm run build
```

Le dossier `dist/` est prêt à être servi par Nginx, un hébergeur statique ou un CDN.

## Docker : oui ou non ?

Docker n’est pas obligatoire pour ce frontend.

C’est utile si vous voulez :

- un environnement identique pour tout le monde
- lancer le front plus facilement en dev/test
- préparer des environnements reproductibles

Mais pour un front React statique, le plus simple est souvent :

- build du frontend
- servir le `dist` via Nginx
- backend séparé sur un autre service

Donc :

- Docker = bien pour la cohérence de l’environnement
- Docker = pas obligatoire pour un petit projet bien structuré
- il devient très utile quand vous voulez standardiser staging / production / CI

## Recommandations de production

Avant mise en production, je recommande au minimum :

1. ajouter la gestion d’accès par document
2. retirer les fichiers de template Vite non utilisés
3. sécuriser les uploads et les téléchargements
4. tests UI et API
5. vérifier les permissions route / page / données
6. configurer un build CI
7. préparer un déploiement statique + API distante
8. configurer un reverse proxy Nginx ou un objet de stockage pour les assets

## Conclusion

Le frontend comprend déjà les briques de base d’une application de gestion documentaire fonctionnelle : login, rôle, archives, upload, invitations et profil. C’est un bon MVP.

La prochaine étape logique avant production est d’ajouter le contrôle d’accès granulaire au document et de nettoyer les restes de génération de template. À partir de là, le produit sera nettement plus sérieux et beaucoup mieux préparé pour un environnement réel.


Ammélioration : 
recherche avancée combinée : nom, auteur, type, catégorie, tags et période ;
aperçu PDF/images directement dans l’application ;
téléchargement avec journal d’activité ;
corbeille avec restauration ;
historique complet des versions ;
partage sécurisé par lien temporaire ;
permissions par dossier et par document ;
notifications et alertes ;
export Excel/CSV des archives ;
recherche plein texte dans les documents ;
détection de doublons ;
OCR pour documents scannés ;
validation électronique et workflow d’approbation ;
tableau de bord avec statistiques par période ;
sauvegarde automatique et politique d’archivage ;
traçabilité complète conforme aux exigences d’audit.



Point critique avant la production :
Le fichier backend/.env contient encore :
DEBUG=True
une clé secrète de développement ;
un mot de passe PostgreSQL réel.
Les vulnérabilités axios, react-router, form-data et follow-redirects doivent être corrigées.
Les téléchargements ne sont pas enregistrés dans l’activité récente.
Il n’existe pas encore de tests frontend/backend.
Le bundle frontend devrait être découpé par chargement dynamique.
Il manque une vraie configuration de déploiement : HTTPS, Nginx, Gunicorn, sauvegardes, supervision et restauration.
Les fichiers uploadés nécessitent une protection renforcée : limites serveur, antivirus, contrôle MIME et stockage sécurisé.
Il faudrait ajouter une journalisation complète : connexion, téléchargement, consultation, export, suppression et modification.