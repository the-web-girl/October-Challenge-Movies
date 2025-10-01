-- ===============================================
-- BASE DE DONNÉES - CATALOGUE FILMS D'HORREUR
-- MySQL / MariaDB (Compatible IONOS)
-- ===============================================

-- Création de la base (si nécessaire)
-- CREATE DATABASE IF NOT EXISTS horror_films_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE horror_films_db;

-- ===============================================
-- SUPPRESSION DES TABLES EXISTANTES (OPTIONNEL)
-- ===============================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_films;
DROP TABLE IF EXISTS saga_films;
DROP TABLE IF EXISTS film_genre;
DROP TABLE IF EXISTS films;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS sagas;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ===============================================
-- TABLE: films
-- ===============================================
CREATE TABLE films (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tmdb_id VARCHAR(32) NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NULL,
    year SMALLINT NULL,
    release_date DATE NULL,
    synopsis TEXT NULL,
    poster_url VARCHAR(512) NULL,
    country VARCHAR(64) NULL,
    runtime SMALLINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_year (year),
    INDEX idx_release_date (release_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLE: genres
-- ===============================================
CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLE: film_genre (relation many-to-many)
-- ===============================================
CREATE TABLE film_genre (
    film_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (film_id, genre_id),
    FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLE: sagas
-- ===============================================
CREATE TABLE sagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLE: saga_films (relation many-to-many avec ordre)
-- ===============================================
CREATE TABLE saga_films (
    saga_id INT NOT NULL,
    film_id INT NOT NULL,
    saga_order INT NULL,
    PRIMARY KEY (saga_id, film_id),
    FOREIGN KEY (saga_id) REFERENCES sagas(id) ON DELETE CASCADE,
    FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE,
    INDEX idx_saga_order (saga_id, saga_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLE: users
-- ===============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLE: user_films (statut "vu" par utilisateur)
-- ===============================================
CREATE TABLE user_films (
    user_id INT NOT NULL,
    film_id INT NOT NULL,
    seen TINYINT(1) DEFAULT 0,
    seen_at DATETIME NULL,
    PRIMARY KEY (user_id, film_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE,
    INDEX idx_seen (seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- INSERTION DES DONNÉES INITIALES
-- ===============================================

-- Utilisateur par défaut (user_id = 1)
INSERT INTO users (id, username, password_hash, email) 
VALUES (1, 'admin', '$2y$10$abcdefghijklmnopqrstuv', 'admin@example.com');

-- Genres
INSERT INTO genres (name) VALUES 
    ('slasher'),
    ('surnaturel'),
    ('zombies'),
    ('psychologique'),
    ('gore'),
    ('creature'),
    ('found-footage');

-- Sagas
INSERT INTO sagas (name) VALUES 
    ('Scream'),
    ('Saw'),
    ('The Conjuring Universe'),
    ('Alien'),
    ('Halloween'),
    ('Friday the 13th'),
    ('A Nightmare on Elm Street'),
    ('Paranormal Activity'),
    ('The Ring'),
    ('Insidious');

-- ===============================================
-- FILMS D'HORREUR (1995-2025) - EXEMPLES
-- ===============================================

-- SLASHERS
INSERT INTO films (title, year, release_date) VALUES 
    ('Scream', 1996, '1996-12-20'),
    ('Scream 2', 1997, '1997-12-12'),
    ('Souviens-toi... l''été dernier', 1997, '1997-10-17'),
    ('Urban Legend', 1998, '1998-09-25'),
    ('Scream 3', 2000, '2000-02-04'),
    ('Scream 4', 2011, '2011-04-15'),
    ('Scream 5', 2022, '2022-01-14'),
    ('Scream 6', 2023, '2023-03-10');

-- Liaison films -> genre slasher
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'slasher' 
AND f.title IN ('Scream', 'Scream 2', 'Scream 3', 'Scream 4', 'Scream 5', 'Scream 6', 
                'Souviens-toi... l''été dernier', 'Urban Legend');

-- Liaison saga Scream
INSERT INTO saga_films (saga_id, film_id, saga_order)
SELECT s.id, f.id, 
    CASE f.title
        WHEN 'Scream' THEN 1
        WHEN 'Scream 2' THEN 2
        WHEN 'Scream 3' THEN 3
        WHEN 'Scream 4' THEN 4
        WHEN 'Scream 5' THEN 5
        WHEN 'Scream 6' THEN 6
    END
FROM films f, sagas s
WHERE s.name = 'Scream' 
AND f.title LIKE 'Scream%';

-- SURNATUREL / POSSESSION
INSERT INTO films (title, year, release_date) VALUES 
    ('Ringu', 1998, '1998-01-31'),
    ('The Sixth Sense', 1999, '1999-08-06'),
    ('The Others', 2001, '2001-08-02'),
    ('The Ring', 2002, '2002-10-18'),
    ('The Conjuring', 2013, '2013-07-19'),
    ('Insidious', 2011, '2011-04-01'),
    ('Insidious: Chapter 2', 2013, '2013-09-13'),
    ('The Conjuring 2', 2016, '2016-06-10');

-- Liaison genre surnaturel
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'surnaturel' 
AND f.title IN ('Ringu', 'The Sixth Sense', 'The Others', 'The Ring', 
                'The Conjuring', 'Insidious', 'Insidious: Chapter 2', 'The Conjuring 2');

-- Liaison saga Insidious
INSERT INTO saga_films (saga_id, film_id, saga_order)
SELECT s.id, f.id,
    CASE 
        WHEN f.title = 'Insidious' THEN 1
        WHEN f.title = 'Insidious: Chapter 2' THEN 2
    END
FROM films f, sagas s
WHERE s.name = 'Insidious' 
AND f.title LIKE 'Insidious%';

-- Liaison saga The Conjuring Universe
INSERT INTO saga_films (saga_id, film_id, saga_order)
SELECT s.id, f.id,
    CASE 
        WHEN f.title = 'The Conjuring' THEN 1
        WHEN f.title = 'The Conjuring 2' THEN 2
    END
FROM films f, sagas s
WHERE s.name = 'The Conjuring Universe' 
AND f.title LIKE 'The Conjuring%';

-- ZOMBIES
INSERT INTO films (title, year, release_date) VALUES 
    ('28 Days Later', 2002, '2002-11-01'),
    ('Shaun of the Dead', 2004, '2004-09-24'),
    ('Dawn of the Dead', 2004, '2004-03-19'),
    ('World War Z', 2013, '2013-06-21'),
    ('Train to Busan', 2016, '2016-07-20');

-- Liaison genre zombies
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'zombies' 
AND f.title IN ('28 Days Later', 'Shaun of the Dead', 'Dawn of the Dead', 
                'World War Z', 'Train to Busan');

-- HORREUR PSYCHOLOGIQUE
INSERT INTO films (title, year, release_date) VALUES 
    ('The Blair Witch Project', 1999, '1999-07-14'),
    ('American Psycho', 2000, '2000-04-14'),
    ('The Machinist', 2004, '2004-10-22'),
    ('Hereditary', 2018, '2018-06-08'),
    ('Midsommar', 2019, '2019-07-03');

-- Liaison genre psychologique
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'psychologique' 
AND f.title IN ('The Blair Witch Project', 'American Psycho', 'The Machinist', 
                'Hereditary', 'Midsommar');

-- GORE
INSERT INTO films (title, year, release_date) VALUES 
    ('Saw', 2004, '2004-10-29'),
    ('Hostel', 2005, '2005-01-06'),
    ('Saw II', 2005, '2005-10-28'),
    ('Saw III', 2006, '2006-10-27'),
    ('Terrifier', 2016, '2016-10-15'),
    ('Terrifier 2', 2022, '2022-10-06');

-- Liaison genre gore
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'gore' 
AND f.title IN ('Saw', 'Hostel', 'Saw II', 'Saw III', 'Terrifier', 'Terrifier 2');

-- Liaison saga Saw
INSERT INTO saga_films (saga_id, film_id, saga_order)
SELECT s.id, f.id,
    CASE 
        WHEN f.title = 'Saw' THEN 1
        WHEN f.title = 'Saw II' THEN 2
        WHEN f.title = 'Saw III' THEN 3
    END
FROM films f, sagas s
WHERE s.name = 'Saw' 
AND f.title LIKE 'Saw%';

-- CRÉATURES
INSERT INTO films (title, year, release_date) VALUES 
    ('Alien: Resurrection', 1997, '1997-11-26'),
    ('The Descent', 2005, '2005-07-08'),
    ('Cloverfield', 2008, '2008-01-18'),
    ('A Quiet Place', 2018, '2018-04-06'),
    ('A Quiet Place Part II', 2021, '2021-05-28');

-- Liaison genre creature
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'creature' 
AND f.title IN ('Alien: Resurrection', 'The Descent', 'Cloverfield', 
                'A Quiet Place', 'A Quiet Place Part II');

-- FOUND FOOTAGE
INSERT INTO films (title, year, release_date) VALUES 
    ('Paranormal Activity', 2007, '2007-09-14'),
    ('REC', 2007, '2007-11-23'),
    ('Paranormal Activity 2', 2010, '2010-10-22'),
    ('V/H/S', 2012, '2012-10-05');

-- Liaison genre found-footage
INSERT INTO film_genre (film_id, genre_id)
SELECT f.id, g.id FROM films f, genres g 
WHERE g.name = 'found-footage' 
AND f.title IN ('Paranormal Activity', 'REC', 'Paranormal Activity 2', 'V/H/S');

-- Liaison saga Paranormal Activity
INSERT INTO saga_films (saga_id, film_id, saga_order)
SELECT s.id, f.id,
    CASE 
        WHEN f.title = 'Paranormal Activity' THEN 1
        WHEN f.title = 'Paranormal Activity 2' THEN 2
    END
FROM films f, sagas s
WHERE s.name = 'Paranormal Activity' 
AND f.title LIKE 'Paranormal Activity%';

-- Initialiser tous les films comme "non vus" pour l'utilisateur par défaut
INSERT INTO user_films (user_id, film_id, seen)
SELECT 1, id, 0 FROM films;

-- ===============================================
-- FIN DU SCRIPT
-- ===============================================