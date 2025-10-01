# 🎃 Catalogue Films d'Horreur - Guide d'Installation IONOS

## 📋 Description

Application web de gestion de films d'horreur avec :
- Classement par sous-genre (Slasher, Surnaturel, Zombies, etc.)
- Regroupement par sagas triées chronologiquement
- Recherche et filtres avancés
- Ajout de films via API TMDb
- Gestion du statut "vu"

---

## 🛠️ Stack Technique

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Backend** : PHP 8.x avec PDO
- **Base de données** : MySQL / MariaDB
- **API externe** : TMDb (The Movie Database)
- **Hébergement** : IONOS (ou tout hébergeur compatible PHP/MySQL)

---

## 📦 Structure des Fichiers

```
horror-films/
├── index.html          # Page principale
├── style.css           # Styles CSS
├── script.js           # Logique frontend JavaScript
├── api.php             # API backend PHP
├── db.sql              # Schéma de base de données + données initiales
└── README.md           # Ce fichier
```

---

## 🚀 Installation sur IONOS

### Étape 1 : Créer la Base de Données

1. **Connectez-vous à votre espace IONOS**
2. Allez dans **"Bases de données MySQL"**
3. Créez une nouvelle base de données :
   - **Nom** : `horror_films_db` (ou autre nom de votre choix)
   - Notez le **nom d'utilisateur**, **mot de passe** et **serveur** (généralement `localhost`)

4. **Importer le schéma** :
   - Dans phpMyAdmin (accessible via IONOS)
   - Sélectionnez votre base de données
   - Cliquez sur l'onglet **"Importer"**
   - Choisissez le fichier `db.sql`
   - Cliquez sur **"Exécuter"**

### Étape 2 : Configurer l'API PHP

1. **Ouvrez le fichier `api.php`**
2. **Modifiez les paramètres de connexion** (lignes 19-22) :

```php
define('DB_HOST', 'localhost');              // Serveur (généralement 'localhost')
define('DB_NAME', 'horror_films_db');        // Nom de votre base
define('DB_USER', 'votre_utilisateur_mysql'); // Utilisateur MySQL
define('DB_PASS', 'votre_mot_de_passe');     // Mot de passe MySQL
```

3. **Configurer la clé API TMDb** :
   - Créez un compte gratuit sur [TMDb](https://www.themoviedb.org/)
   - Allez dans **Paramètres → API** et générez une clé API
   - Remplacez ligne 27 :

```php
define('TMDB_API_KEY', 'votre_cle_tmdb_ici');
```

### Étape 3 : Téléverser les Fichiers

1. **Via FTP** (recommandé) :
   - Utilisez FileZilla ou le gestionnaire de fichiers IONOS
   - Connectez-vous à votre espace FTP
   - Téléversez tous les fichiers dans un dossier (ex: `/horror-films/`)

2. **Via le Gestionnaire de Fichiers IONOS** :
   - Téléversez les fichiers via l'interface web

### Étape 4 : Tester l'Application

1. Ouvrez votre navigateur
2. Accédez à : `https://votre-domaine.com/horror-films/`
3. Vous devriez voir la liste des films avec les exemples pré-chargés

---

## 🔑 Obtenir une Clé API TMDb (GRATUIT)

1. Créez un compte sur [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Allez dans **Paramètres → API**
3. Demandez une clé API (usage non-commercial)
4. Acceptez les conditions d'utilisation
5. Copiez votre clé API dans `api.php`

**Important** : L'API TMDb est gratuite pour usage personnel, mais nécessite une attribution (déjà incluse dans le footer).

---

## ⚙️ Configuration Avancée

### Modifier les Sous-Genres

Éditez les fichiers suivants :

**1. `index.html`** (lignes 30-38 et 82-90) :
```html
<option value="nouveau-genre">Nouveau Genre</option>
```

**2. `style.css`** : Ajoutez des icônes personnalisées si souhaité

**3. `script.js`** (lignes 205-217) : Ajoutez dans les dictionnaires `genreIcons` et `genreNames`

### Ajouter un Utilisateur Admin

Par défaut, l'utilisateur `admin` (ID: 1) est créé. Pour ajouter d'autres utilisateurs :

```sql
INSERT INTO users (username, password_hash, email) 
VALUES ('nouveau_user', '$2y$10$hash_bcrypt_ici', 'email@example.com');
```

**Générer un hash bcrypt en PHP** :
```php
echo password_hash('mon_mot_de_passe', PASSWORD_DEFAULT);
```

---

## 🐛 Dépannage

### Erreur "Impossible de charger les films"

**Causes possibles** :
1. **Mauvais identifiants de base de données** dans `api.php`
2. **Base de données non importée** ou table manquante
3. **Droits d'accès PHP** : vérifiez que `api.php` a les permissions d'exécution

**Solution** :
- Vérifiez les logs d'erreur PHP (accessible via IONOS)
- Testez la connexion en accédant directement à `api.php?action=get_films`

### Les Films ne s'Affichent pas

1. Ouvrez la **Console JavaScript** (F12 dans le navigateur)
2. Vérifiez les erreurs réseau
3. Assurez-vous que `script.js` et `style.css` sont bien chargés

### L'Ajout de Films via TMDb ne Fonctionne pas

1. Vérifiez que votre **clé API TMDb** est valide
2. Testez directement l'endpoint : `api.php?action=tmdb_search&query=scream`
3. Vérifiez que `allow_url_fopen` est activé sur votre serveur (généralement oui sur IONOS)

---

## 📊 Base de Données : Tables Principales

| Table | Description |
|-------|-------------|
| `films` | Tous les films avec métadonnées |
| `genres` | Liste des sous-genres |
| `sagas` | Liste des sagas/franchises |
| `film_genre` | Association films ↔ genres |
| `saga_films` | Association films ↔ sagas avec ordre |
| `users` | Comptes utilisateurs |
| `user_films` | Statut "vu" par utilisateur |

---

## 🔒 Sécurité

✅ **Bonnes pratiques implémentées** :
- Requêtes préparées PDO (protection SQL injection)
- Échappement HTML côté frontend
- Validation des données côté serveur
- Clés API stockées côté serveur uniquement

⚠️ **Recommandations supplémentaires** :
- Activez HTTPS (Let's Encrypt gratuit sur IONOS)
- Limitez l'accès à `api.php` si nécessaire (`.htaccess`)
- Implémentez un système d'authentification complet pour plusieurs utilisateurs

---

## 📝 Licence et Attribution

- **Code** : Libre d'utilisation pour usage personnel
- **API TMDb** : Attribution obligatoire (déjà incluse dans le footer)
- **Données** : Respectez les conditions d'utilisation de TMDb

---

## 🆘 Support

Pour toute question :
1. Consultez la [documentation IONOS](https://www.ionos.com/help/)
2. Vérifiez la [FAQ TMDb](https://www.themoviedb.org/talk)
3. Ouvrez la console développeur (F12) pour déboguer JavaScript

---

## 🎉 Bon Catalogage de Films ! 🎃
