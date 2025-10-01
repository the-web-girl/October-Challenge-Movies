/**
 * CATALOGUE FILMS D'HORREUR
 * Frontend JavaScript - Communication avec API PHP
 */

// === CONFIGURATION ===
const API_BASE_URL = './api.php';
const TMDB_SEARCH_ENDPOINT = `${API_BASE_URL}?action=tmdb_search`;

// === VARIABLES GLOBALES ===
let allFilms = [];
let allSagas = [];
let currentFilters = {
    search: '',
    genre: '',
    saga: '',
    seen: ''
};

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎃 Application Films d\'Horreur initialisée');
    
    setupEventListeners();
    loadFilms();
});

// === ÉCOUTEURS D'ÉVÉNEMENTS ===
function setupEventListeners() {
    // Recherche
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchInput.addEventListener('input', debounce(() => {
        currentFilters.search = searchInput.value.trim();
        filterAndDisplayFilms();
    }, 300));
    
    searchBtn.addEventListener('click', () => {
        currentFilters.search = searchInput.value.trim();
        filterAndDisplayFilms();
    });

    // Filtres
    document.getElementById('genreFilter').addEventListener('change', (e) => {
        currentFilters.genre = e.target.value;
        filterAndDisplayFilms();
    });

    document.getElementById('sagaFilter').addEventListener('change', (e) => {
        currentFilters.saga = e.target.value;
        filterAndDisplayFilms();
    });

    document.getElementById('seenFilter').addEventListener('change', (e) => {
        currentFilters.seen = e.target.value;
        filterAndDisplayFilms();
    });

    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Modal d'ajout
    const addFilmBtn = document.getElementById('addFilmBtn');
    const modal = document.getElementById('addFilmModal');
    const closeModal = document.querySelector('.close');
    const cancelAdd = document.getElementById('cancelAdd');
    
    addFilmBtn.addEventListener('click', () => modal.classList.add('show'));
    closeModal.addEventListener('click', () => modal.classList.remove('show'));
    cancelAdd.addEventListener('click', () => modal.classList.remove('show'));
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    // Recherche TMDb
    const tmdbSearch = document.getElementById('tmdbSearch');
    tmdbSearch.addEventListener('input', debounce(() => {
        const query = tmdbSearch.value.trim();
        if (query.length >= 3) {
            searchTMDb(query);
        } else {
            document.getElementById('tmdbResults').classList.remove('show');
        }
    }, 500));

    // Formulaire d'ajout
    document.getElementById('addFilmForm').addEventListener('submit', handleAddFilm);
}

// === CHARGEMENT DES DONNÉES ===
async function loadFilms() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}?action=get_films`);
        const data = await response.json();
        
        if (data.success) {
            allFilms = data.films || [];
            allSagas = extractSagas(allFilms);
            populateSagaFilter();
            filterAndDisplayFilms();
            showToast('Films chargés avec succès', 'success');
        } else {
            throw new Error(data.message || 'Erreur de chargement');
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        showToast('Erreur de chargement des films', 'error');
        document.getElementById('filmsList').innerHTML = 
            '<p style="text-align:center;color:var(--color-danger);">Impossible de charger les films. Vérifiez la connexion à la base de données.</p>';
    } finally {
        showLoading(false);
    }
}

// === FILTRAGE ET AFFICHAGE ===
function filterAndDisplayFilms() {
    let filtered = [...allFilms];

    // Filtre de recherche
    if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filtered = filtered.filter(film => 
            film.title.toLowerCase().includes(search) ||
            (film.saga && film.saga.toLowerCase().includes(search)) ||
            film.genre.toLowerCase().includes(search)
        );
    }

    // Filtre par genre
    if (currentFilters.genre) {
        filtered = filtered.filter(film => film.genre === currentFilters.genre);
    }

    // Filtre par saga
    if (currentFilters.saga) {
        filtered = filtered.filter(film => film.saga === currentFilters.saga);
    }

    // Filtre par statut vu
    if (currentFilters.seen === 'seen') {
        filtered = filtered.filter(film => film.seen === 1);
    } else if (currentFilters.seen === 'unseen') {
        filtered = filtered.filter(film => film.seen === 0);
    }

    displayFilms(filtered);
}

function displayFilms(films) {
    const container = document.getElementById('filmsList');
    
    if (films.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--color-text-dim);padding:3rem;">Aucun film trouvé.</p>';
        return;
    }

    // Grouper par genre
    const byGenre = groupByGenre(films);
    
    let html = '';
    
    // Ordre d'affichage des genres
    const genreOrder = ['slasher', 'surnaturel', 'zombies', 'psychologique', 'gore', 'creature', 'found-footage'];
    const genreIcons = {
        'slasher': '🔪',
        'surnaturel': '👻',
        'zombies': '🧟',
        'psychologique': '🧠',
        'gore': '🩸',
        'creature': '🦇',
        'found-footage': '📹'
    };
    const genreNames = {
        'slasher': 'Slashers',
        'surnaturel': 'Surnaturel / Possession',
        'zombies': 'Zombies',
        'psychologique': 'Horreur Psychologique',
        'gore': 'Gore',
        'creature': 'Créatures',
        'found-footage': 'Found Footage'
    };

    genreOrder.forEach(genreKey => {
        if (!byGenre[genreKey] || byGenre[genreKey].length === 0) return;

        const icon = genreIcons[genreKey] || '🎬';
        const name = genreNames[genreKey] || genreKey;
        
        html += `
            <div class="genre-section">
                <h2 class="genre-title">${icon} ${name}</h2>
                ${renderGenreFilms(byGenre[genreKey])}
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Attacher les écouteurs d'événements
    attachFilmEventListeners();
}

function renderGenreFilms(films) {
    // Grouper par saga
    const bySaga = {};
    const standalone = [];

    films.forEach(film => {
        if (film.saga) {
            if (!bySaga[film.saga]) bySaga[film.saga] = [];
            bySaga[film.saga].push(film);
        } else {
            standalone.push(film);
        }
    });

    let html = '';

    // Afficher les sagas
    Object.keys(bySaga).sort().forEach(sagaName => {
        const sagaFilms = bySaga[sagaName].sort((a, b) => {
            // Tri par saga_order puis par release_date
            if (a.saga_order && b.saga_order) {
                return a.saga_order - b.saga_order;
            }
            if (a.saga_order) return -1;
            if (b.saga_order) return 1;
            return new Date(a.release_date) - new Date(b.release_date);
        });

        html += `
            <div class="saga-group">
                <h3 class="saga-title">📽️ ${escapeHtml(sagaName)}</h3>
                <div class="films-list">
                    ${sagaFilms.map(renderFilmItem).join('')}
                </div>
            </div>
        `;
    });

    // Afficher les films standalone triés par date
    if (standalone.length > 0) {
        standalone.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        html += `
            <div class="films-list">
                ${standalone.map(renderFilmItem).join('')}
            </div>
        `;
    }

    return html;
}

function renderFilmItem(film) {
    const seenClass = film.seen ? 'seen' : '';
    const checked = film.seen ? 'checked' : '';
    
    return `
        <div class="film-item ${seenClass}" data-film-id="${film.id}">
            <input 
                type="checkbox" 
                class="film-checkbox" 
                data-film-id="${film.id}"
                ${checked}
            >
            <div class="film-info">
                <span class="film-title">${escapeHtml(film.title)}</span>
                <span class="film-year">(${film.year || 'N/A'})</span>
            </div>
            <div class="film-actions">
                <button class="btn-delete" data-film-id="${film.id}">🗑️</button>
            </div>
        </div>
    `;
}

// === ACTIONS SUR LES FILMS ===
function attachFilmEventListeners() {
    // Checkboxes "vu"
    document.querySelectorAll('.film-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const filmId = e.target.dataset.filmId;
            const seen = e.target.checked ? 1 : 0;
            await toggleSeen(filmId, seen);
        });
    });

    // Boutons de suppression
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const filmId = e.target.dataset.filmId;
            if (confirm('Voulez-vous vraiment supprimer ce film ?')) {
                await deleteFilm(filmId);
            }
        });
    });
}

async function toggleSeen(filmId, seen) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle_seen',
                film_id: filmId,
                seen: seen
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour localement
            const film = allFilms.find(f => f.id == filmId);
            if (film) film.seen = seen;
            
            // Mettre à jour l'affichage
            const filmItem = document.querySelector(`.film-item[data-film-id="${filmId}"]`);
            if (filmItem) {
                filmItem.classList.toggle('seen', seen === 1);
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur toggle seen:', error);
        showToast('Erreur de mise à jour', 'error');
    }
}

async function deleteFilm(filmId) {
    try {
        const response = await fetch(`${API_BASE_URL}?action=delete_film&id=${filmId}`, {
            method: 'GET'
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Film supprimé avec succès', 'success');
            await loadFilms();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur suppression:', error);
        showToast('Erreur de suppression', 'error');
    }
}

// === RECHERCHE TMDB ===
async function searchTMDb(query) {
    try {
        const response = await fetch(`${TMDB_SEARCH_ENDPOINT}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.results) {
            displayTMDbResults(data.results);
        }
    } catch (error) {
        console.error('Erreur recherche TMDb:', error);
    }
}

function displayTMDbResults(results) {
    const container = document.getElementById('tmdbResults');
    
    if (results.length === 0) {
        container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--color-text-dim);">Aucun résultat</div>';
        container.classList.add('show');
        return;
    }

    container.innerHTML = results.map(film => `
        <div class="tmdb-result-item" data-tmdb-id="${film.id}" data-title="${escapeHtml(film.title)}" data-year="${film.year}" data-date="${film.release_date}">
            <div class="tmdb-result-title">${escapeHtml(film.title)}</div>
            <div class="tmdb-result-year">${film.year || 'N/A'}</div>
        </div>
    `).join('');

    container.classList.add('show');

    // Attacher les événements de sélection
    container.querySelectorAll('.tmdb-result-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('filmTitle').value = item.dataset.title;
            document.getElementById('filmYear').value = item.dataset.year;
            document.getElementById('filmReleaseDate').value = item.dataset.date;
            document.getElementById('filmTmdbId').value = item.dataset.tmdbId;
            container.classList.remove('show');
            document.getElementById('tmdbSearch').value = '';
        });
    });
}

// === AJOUT DE FILM ===
async function handleAddFilm(e) {
    e.preventDefault();

    const filmData = {
        action: 'add_film',
        tmdb_id: document.getElementById('filmTmdbId').value,
        title: document.getElementById('filmTitle').value,
        year: document.getElementById('filmYear').value,
        genre: document.getElementById('filmGenre').value,
        saga: document.getElementById('filmSaga').value,
        saga_order: document.getElementById('filmSagaOrder').value,
        release_date: document.getElementById('filmReleaseDate').value
    };

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filmData)
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Film ajouté avec succès', 'success');
            document.getElementById('addFilmModal').classList.remove('show');
            document.getElementById('addFilmForm').reset();
            await loadFilms();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur ajout film:', error);
        showToast('Erreur d\'ajout du film', 'error');
    }
}

// === UTILITAIRES ===
function groupByGenre(films) {
    return films.reduce((acc, film) => {
        if (!acc[film.genre]) acc[film.genre] = [];
        acc[film.genre].push(film);
        return acc;
    }, {});
}

function extractSagas(films) {
    const sagas = new Set();
    films.forEach(film => {
        if (film.saga) sagas.add(film.saga);
    });
    return Array.from(sagas).sort();
}

function populateSagaFilter() {
    const select = document.getElementById('sagaFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Toutes</option>';
    allSagas.forEach(saga => {
        const option = document.createElement('option');
        option.value = saga;
        option.textContent = saga;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

function resetFilters() {
    currentFilters = { search: '', genre: '', saga: '', seen: '' };
    document.getElementById('searchInput').value = '';
    document.getElementById('genreFilter').value = '';
    document.getElementById('sagaFilter').value = '';
    document.getElementById('seenFilter').value = '';
    filterAndDisplayFilms();
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

console.log('🎃 Script chargé avec succès');
