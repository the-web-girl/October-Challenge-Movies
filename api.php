<?php
/**
 * API BACKEND PHP - CATALOGUE FILMS D'HORREUR
 * Gestion des films avec MySQL via PDO
 */

// === CONFIGURATION ===
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// === PARAMÈTRES DE CONNEXION BASE DE DONNÉES ===
define('DB_HOST', 'icivotre.hosting-data.io');
define('DB_NAME', 'votre nom de base de donnée');
define('DB_USER', 'Votre ID user');
define('DB_PASS', 'Votre mot de passe de BD');
define('DB_CHARSET', 'utf8mb4');

// === CLÉ API TMDB ===
define('TMDB_API_KEY', 'Votre clé API pour movie db');
define('TMDB_BASE_URL', 'https://api.themoviedb.org/3');

// === CONNEXION À LA BASE DE DONNÉES ===
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            sendError('Erreur de connexion à la base de données: ' . $e->getMessage(), 500);
        }
    }
    
    return $pdo;
}

// === ROUTEUR PRINCIPAL ===
// CORRECTION: Vérifier l'action dans GET, POST ou dans le corps JSON
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if (empty($action)) {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $jsonData = json_decode($rawInput, true);
        $action = $jsonData['action'] ?? '';
    }
}

switch ($action) {
    case 'get_films':
        getFilms();
        break;
    
    case 'add_film':
        addFilm();
        break;
    
    case 'toggle_seen':
        toggleSeen();
        break;
    
    case 'delete_film':
        deleteFilm();
        break;
    
    case 'tmdb_search':
        searchTMDb();
        break;
    
    default:
        sendError('Action non reconnue: ' . $action, 400);
}

// === RÉCUPÉRATION DES FILMS ===
function getFilms() {
    $pdo = getDB();
    
    try {
        $sql = "
            SELECT 
                f.id,
                f.tmdb_id,
                f.title,
                f.year,
                f.release_date,
                g.name as genre,
                s.name as saga,
                sf.saga_order,
                uf.seen,
                uf.seen_at
            FROM films f
            LEFT JOIN film_genre fg ON f.id = fg.film_id
            LEFT JOIN genres g ON fg.genre_id = g.id
            LEFT JOIN saga_films sf ON f.id = sf.film_id
            LEFT JOIN sagas s ON sf.saga_id = s.id
            LEFT JOIN user_films uf ON f.id = uf.film_id AND uf.user_id = 1
            ORDER BY g.name, s.name, sf.saga_order, f.release_date
        ";
        
        $stmt = $pdo->query($sql);
        $films = $stmt->fetchAll();
        
        // Transformation des données
        $filmsFormatted = array_map(function($film) {
            return [
                'id' => (int)$film['id'],
                'tmdb_id' => $film['tmdb_id'],
                'title' => $film['title'],
                'year' => $film['year'],
                'release_date' => $film['release_date'],
                'genre' => $film['genre'],
                'saga' => $film['saga'],
                'saga_order' => $film['saga_order'] ? (int)$film['saga_order'] : null,
                'seen' => (int)($film['seen'] ?? 0),
                'seen_at' => $film['seen_at']
            ];
        }, $films);
        
        sendSuccess(['films' => $filmsFormatted]);
        
    } catch (PDOException $e) {
        sendError('Erreur de récupération des films: ' . $e->getMessage(), 500);
    }
}

// === AJOUT D'UN FILM ===
function addFilm() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validation et nettoyage des données
    $tmdb_id = isset($data['tmdb_id']) ? trim($data['tmdb_id']) : null;
    $title = trim($data['title'] ?? '');
    $year = isset($data['year']) ? trim($data['year']) : null;
    $release_date = isset($data['release_date']) ? trim($data['release_date']) : null;
    $genre = trim($data['genre'] ?? '');
    $saga = trim($data['saga'] ?? '');
    $saga_order = isset($data['saga_order']) ? (int)$data['saga_order'] : null;
    
    if (empty($title) || empty($genre)) {
        sendError('Titre et genre obligatoires', 400);
    }
    
    $pdo = getDB();
    
    try {
        $pdo->beginTransaction();
        
        // 1. Insérer le film
        $sql = "INSERT INTO films (tmdb_id, title, year, release_date) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tmdb_id, $title, $year, $release_date]);
        $film_id = $pdo->lastInsertId();
        
        // 2. Associer au genre
        $genre_id = getOrCreateGenre($pdo, $genre);
        $sql = "INSERT INTO film_genre (film_id, genre_id) VALUES (?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$film_id, $genre_id]);
        
        // 3. Associer à la saga si fournie
        if (!empty($saga)) {
            $saga_id = getOrCreateSaga($pdo, $saga);
            
            // Si saga_order non fourni, calculer automatiquement
            if (empty($saga_order)) {
                $saga_order = getNextSagaOrder($pdo, $saga_id);
            }
            
            $sql = "INSERT INTO saga_films (saga_id, film_id, saga_order) VALUES (?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$saga_id, $film_id, $saga_order]);
        }
        
        // 4. Initialiser le statut "vu" pour l'utilisateur par défaut
        $sql = "INSERT INTO user_films (user_id, film_id, seen) VALUES (1, ?, 0)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$film_id]);
        
        $pdo->commit();
        
        sendSuccess(['film_id' => $film_id, 'message' => 'Film ajouté avec succès']);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendError('Erreur d\'ajout du film: ' . $e->getMessage(), 500);
    }
}

// === TOGGLE "VU" ===
function toggleSeen() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $film_id = (int)($data['film_id'] ?? 0);
    $seen = (int)($data['seen'] ?? 0);
    $user_id = 1; // Utilisateur par défaut
    
    if ($film_id <= 0) {
        sendError('ID film invalide', 400);
    }
    
    $pdo = getDB();
    
    try {
        $seen_at = $seen ? date('Y-m-d H:i:s') : null;
        
        $sql = "
            INSERT INTO user_films (user_id, film_id, seen, seen_at)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE seen = ?, seen_at = ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $film_id, $seen, $seen_at, $seen, $seen_at]);
        
        sendSuccess(['message' => 'Statut mis à jour']);
        
    } catch (PDOException $e) {
        sendError('Erreur de mise à jour: ' . $e->getMessage(), 500);
    }
}

// === SUPPRESSION D'UN FILM ===
function deleteFilm() {
    $film_id = (int)($_GET['id'] ?? 0);
    
    if ($film_id <= 0) {
        sendError('ID film invalide', 400);
    }
    
    $pdo = getDB();
    
    try {
        $sql = "DELETE FROM films WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$film_id]);
        
        sendSuccess(['message' => 'Film supprimé']);
        
    } catch (PDOException $e) {
        sendError('Erreur de suppression: ' . $e->getMessage(), 500);
    }
}

// === RECHERCHE TMDB ===
function searchTMDb() {
    $query = $_GET['query'] ?? '';
    
    if (empty($query)) {
        sendError('Query vide', 400);
    }
    
    $url = TMDB_BASE_URL . '/search/movie?api_key=' . TMDB_API_KEY . '&query=' . urlencode($query) . '&language=fr-FR';
    
    $response = @file_get_contents($url);
    
    if ($response === false) {
        sendError('Erreur de connexion à TMDb', 500);
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['results'])) {
        $results = array_map(function($item) {
            return [
                'id' => $item['id'],
                'title' => $item['title'],
                'year' => isset($item['release_date']) ? substr($item['release_date'], 0, 4) : null,
                'release_date' => $item['release_date'] ?? null
            ];
        }, array_slice($data['results'], 0, 10));
        
        sendSuccess(['results' => $results]);
    } else {
        sendError('Aucun résultat trouvé', 404);
    }
}

// === FONCTIONS UTILITAIRES ===
function getOrCreateGenre($pdo, $genre_name) {
    $sql = "SELECT id FROM genres WHERE name = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$genre_name]);
    $result = $stmt->fetch();
    
    if ($result) {
        return $result['id'];
    }
    
    $sql = "INSERT INTO genres (name) VALUES (?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$genre_name]);
    return $pdo->lastInsertId();
}

function getOrCreateSaga($pdo, $saga_name) {
    $sql = "SELECT id FROM sagas WHERE name = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$saga_name]);
    $result = $stmt->fetch();
    
    if ($result) {
        return $result['id'];
    }
    
    $sql = "INSERT INTO sagas (name) VALUES (?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$saga_name]);
    return $pdo->lastInsertId();
}

function getNextSagaOrder($pdo, $saga_id) {
    $sql = "SELECT MAX(saga_order) as max_order FROM saga_films WHERE saga_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$saga_id]);
    $result = $stmt->fetch();
    
    return ($result['max_order'] ?? 0) + 1;
}

function sendSuccess($data = []) {
    echo json_encode(['success' => true] + $data);
    exit();
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}
