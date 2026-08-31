# ArchiFlow Backend

Le backend ArchiFlow est une API REST Django dédiée à la gestion documentaire multi-utilisateurs, avec authentification JWT, rôles utilisateurs, invitations, uploads de fichiers et journalisation des actions.

## État actuel du projet

Le backend est fonctionnel comme MVP de gestion documentaire. Il couvre les mécanismes essentiels suivants :

- Authentification JWT avec Django REST Framework et `rest_framework_simplejwt`
- Utilisateur personnalisé sous `users.User`
- Rôles : `admin`, `editeur`, `lecteur`
- Invitations par email avec token UUID et expiration
- Gestion des documents et catégories
- Versions de document avec historique
- Journal d’activité (`ActivityLog`)
- Uploads de fichiers via `FileField`
- Permissions basées sur le rôle
- Contrôle fin d’accès par document via `DocumentAccess` (`can_view`, `can_edit`, `can_download`)
- Filtrage des documents autorisés selon l’utilisateur et son niveau d’accès

Le backend est désormais bien plus proche d’un niveau de production fonctionnel pour le besoin métier principal : un document peut désormais être restreint à certains utilisateurs sans se limiter au seul rôle global.

## Stack technique

- Python 3.12 (ou version compatible)
- Django 6.x
- Django REST Framework
- PostgreSQL
- python-decouple
- django-cors-headers
- djangorestframework-simplejwt

## Structure du backend

```text
backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── documents/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── users/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── backends.py
│   └── migrations/
├── media/
├── .env.example
├── manage.py
├── README.md
└── venv/
```

## Fonctionnalités déjà implémentées

### 1. Authentification et utilisateurs

- Login JWT via `/api/auth/token/`
- Refresh JWT via `/api/auth/refresh/`
- Profil courant via `/api/users/me/`
- Changement de mot de passe
- Création de compte via invitation
- Vérification de validité d’un token d’invitation

### 2. Gestion documentaire

- Création de documents
- Catégories
- Tags
- Versions du même document
- Version courante
- Historique et activité

### 3. Sécurité de base

- `IsAdminOnly` pour les opérations sensibles
- `IsAdminOrEditeur` pour les uploads
- JWT obligatoire pour la plupart des endpoints

## Points forts du backend

- Code relativement propre et bien segmenté par app
- Modèle de document cohérent avec versions
- Journal d’activité utile pour l’audit
- Gestion des rôles simple et exploitable
- Intégration front/back claire

## Points à améliorer avant production

### 1. Restriction d’accès par document (important)

Le besoin que vous avez mentionné est absolument pertinent : un administrateur doit pouvoir limiter l’accès à certains documents.

Actuellement, le système n’a pas de notion d’autorisation fine par document. Tous les documents sont globalement visibles selon le rôle, mais pas selon un droit d’accès explicite.

Il faut ajouter un mécanisme de type :

```python
class DocumentPermission(models.Model):
    document = models.ForeignKey("documents.Document", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    group = models.ForeignKey("auth.Group", null=True, blank=True, on_delete=models.CASCADE)
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_download = models.BooleanField(default=False)
    granted_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="granted_permissions", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

Puis dans les vues de lecture :

- filtrer les documents selon permissions
- bloquer la consultation d’un document non autorisé
- autoriser l’admin à gérer les droits depuis l’interface

La meilleure approche est :

- rôle = règle globale
- permission document = règle fine

Le document est accessible si l’utilisateur est :

- admin, ou
- auteur du document, ou
- bénéficiaire explicite d’une permission

### 2. Validation de fichiers

L’upload de documents doit vérifier :

- taille max autorisée
- types MIME acceptés ou extension
- scan antivirus en production pour fichiers sensibles
- stockage externe (S3/MinIO) pour croissance

### 3. Sécurité JWT

À renforcer :

- rotation de refresh token
- blacklist/denylist si nécessaire
- expiration courte du token d’accès
- HTTPS forcé
- cookies sécurisés si nécessaire

### 4. Contrôle des erreurs et réponses API

- standardiser toutes les erreurs au format cohérent
- ajouter `throttling` sur login/invitation
- éviter de renvoyer des détails internes en production

### 5. Tests

Le backend doit avoir au minimum :

- tests sur authentification
- tests sur invitation / création de compte
- tests sur upload/document versions
- tests sur permissions
- tests d’accès et autorisations

### 6. CI/CD

- lint (ruff / black / flake8)
- tests automatisés sur chaque PR
- sécurité (bandit, pip-audit)
- build & migration checks

## Endpoints clés

### Auth

- `POST /api/auth/token/`
- `POST /api/auth/refresh/`

### Utilisateurs

- `GET /api/users/`
- `POST /api/users/`
- `GET /api/users/me/`
- `POST /api/users/change-password/`
- `POST /api/users/invite/`
- `POST /api/users/set-password/`
- `GET /api/users/validate-token/<uuid>/`
- `GET /api/users/invitations/`

### Documents

- `GET /api/documents/`
- `POST /api/documents/`
- `GET /api/documents/<id>/`
- `PUT /api/documents/<id>/`
- `DELETE /api/documents/<id>/`
- `POST /api/documents/<id>/versions/`
- `POST /api/documents/<id>/versions/<version_id>/restore/`
- `GET /api/documents/activity/`
- `GET /api/documents/categories/`

## Variables d’environnement

Voir `backend/.env.example`.

Exemple minimal :

```env
SECRET_KEY=change-me
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DB_NAME=archiflow
DB_USER=archiflow
DB_PASSWORD=change-me
DB_HOST=localhost
DB_PORT=5432
MEDIA_ROOT=/var/lib/archiflow/media
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@archiflow.local
FRONTEND_URL=http://localhost:5173
```

## Démarrage local

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux / macOS
# source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Si `requirements.txt` n’existe pas encore, il faut le créer avec les dépendances du projet, puis l’ajouter au dépôt.

## Docker : oui ou non ?

Docker n’est pas obligatoire pour démarrer ce projet.

Il est utile si vous voulez :

- environnement stable pour tous les développeurs
- lancer PostgreSQL et backend facilement
- standardiser les environnements de test/staging
- simplifier les déploiements reproductibles

Mais pour un petit ou moyen projet, la solution la plus simple reste souvent :

- PostgreSQL sur un serveur (ou conteneur)
- Django avec Gunicorn/Uvicorn
- Nginx comme reverse proxy
- stockage local ou S3 pour les fichiers

Conclusion :

- Docker = recommandé pour le développement et le partage des environnements
- Docker n’est pas un prérequis absolu pour le projet
- il devient presque indispensable si vous avez plusieurs environnements ou plusieurs déployeurs

## Recommandation de production

Avant la mise en production, je recommande au minimum :

1. ajouter le modèle `DocumentPermission`
2. sécuriser les uploads
3. ajouter les tests API
4. ajouter un vrai backend email
5. créer un `requirements.txt`
6. configurer HTTPS et headers de sécurité
7. mettre en place logs + monitoring
8. préparer un fichier Dockerfile et un `docker-compose.yml` pour dev/staging

## Conclusion

Le backend ArchiFlow a une base solide pour un MVP document management : JWT, rôles, catégories, versions et responsabilité d’audit. Il est bien orienté pour un besoin interne ou SaaS léger.

Ce qu’il manque surtout pour être prêt pour la production, c’est la granularité de sécurité sur les documents, la validation file upload, la couverture de tests et un vrai plan d’hébergement/monitoring.
