// Enhanced Netflix-style browse functionality
const API_URL = "/api";
const token = localStorage.getItem("token") || null;

// DOM elements
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const movieGrid = document.getElementById("movie-grid");
const userStatus = document.getElementById("userStatus");
const btnLogout = document.getElementById("btnLogout");
const btnSearch = document.getElementById("btnSearch");
const loading = document.getElementById("loading");

// Header scroll effect
window.addEventListener('scroll', () => {
  const header = document.querySelector('.netflix-header');
  if (window.scrollY > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Search functionality
const searchIcon = document.querySelector('.search-icon');
const searchInputField = document.querySelector('.search-input');

if (searchIcon && searchInputField) {
  searchIcon.addEventListener('click', () => {
    searchInputField.classList.toggle('active');
    if (searchInputField.classList.contains('active')) {
      searchInputField.focus();
    }
  });

  // Hide search when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchInputField.classList.remove('active');
    }
  });
}

// User status display
if (token) {
  userStatus.textContent = "Logged in";
} else {
  userStatus.textContent = "Guest";
}

// Logout functionality
btnLogout?.addEventListener("click", () => {
  localStorage.removeItem("token");
  showNotification("Logged out successfully");
  setTimeout(() => {
    location.href = "index.html";
  }, 1000);
});

// Show loading spinner
function showLoading() {
  if (loading) loading.style.display = 'block';
}

// Hide loading spinner
function hideLoading() {
  if (loading) loading.style.display = 'none';
}

// Show notification
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Fetch genres and populate dropdown
async function loadGenres() {
  try {
    showLoading();
    const res = await fetch(`${API_URL}/movies`);
    if (!res.ok) throw new Error('Failed to fetch movies');
    
    const list = await res.json();
    const genres = Array.from(new Set(list.map(m => m.genre).filter(Boolean)));
    
    // Clear existing options except "All Genres"
    genreSelect.innerHTML = '<option value="">All Genres</option>';
    
    genres.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreSelect.appendChild(opt);
    });
    
    hideLoading();
  } catch (error) {
    console.error('Error loading genres:', error);
    showNotification('Failed to load genres', 'error');
    hideLoading();
  }
}

// Fetch movies with search and filter
async function loadMovies(query = "", genre = "") {
  try {
    showLoading();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (genre) params.set("genre", genre);
    
    const url = `${API_URL}/movies?${params.toString()}`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('Failed to fetch movies');
    
    const movies = await res.json();
    renderMovies(movies);
    hideLoading();
  } catch (error) {
    console.error('Error loading movies:', error);
    showNotification('Failed to load movies', 'error');
    hideLoading();
  }
}

// Render movies in Netflix-style grid
function renderMovies(movies) {
  if (!movieGrid) return;
  
  movieGrid.innerHTML = "";
  
  if (!movies.length) {
    movieGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
        <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h3>No movies found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>
    `;
    return;
  }
  
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";
    
    const posterUrl = movie.posterUrl || `https://via.placeholder.com/300x450/333/fff?text=${encodeURIComponent(movie.title)}`;
    const year = movie.year ? ` • ${movie.year}` : '';
    const rating = movie.rating ? ` • ★${movie.rating}` : '';
    
    card.innerHTML = `
      <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450/333/fff?text=${encodeURIComponent(movie.title)}'">
      <div class="meta">
        <h3>${movie.title}</h3>
        <p>${movie.genre || 'Unknown Genre'}${year}${rating}</p>
        ${movie.description ? `<p style="font-size: 0.8rem; margin-bottom: 1rem;">${movie.description.substring(0, 100)}${movie.description.length > 100 ? '...' : ''}</p>` : ''}
        <button class="btn-add" data-id="${movie._id}" data-title="${movie.title}">
          <i class="fas fa-plus"></i> Add to My List
        </button>
      </div>
    `;
    
    movieGrid.appendChild(card);
  });
  
  // Add event listeners to "Add to My List" buttons
  movieGrid.querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      
      if (!token) {
        showNotification("Please log in to add movies to your list", "error");
        setTimeout(() => {
          location.href = "login.html";
        }, 2000);
        return;
      }
      
      const movieId = btn.dataset.id;
      const movieTitle = btn.dataset.title;
      
      try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        btn.disabled = true;
        
        const res = await fetch(`${API_URL}/watchlist/${movieId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          btn.innerHTML = '<i class="fas fa-check"></i> Added!';
          btn.style.background = '#4CAF50';
          showNotification(`"${movieTitle}" added to your list!`);
          
          // Reset button after 2 seconds
          setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-plus"></i> Add to My List';
            btn.style.background = '#e50914';
            btn.disabled = false;
          }, 2000);
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to add movie');
        }
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        showNotification(error.message || 'Failed to add to watchlist', 'error');
        btn.innerHTML = '<i class="fas fa-plus"></i> Add to My List';
        btn.disabled = false;
      }
    });
  });
}

// Search event listeners
if (btnSearch) {
  btnSearch.addEventListener("click", (e) => {
    e.preventDefault();
    const query = searchInput?.value || searchInputField?.value || '';
    const genre = genreSelect?.value || '';
    loadMovies(query, genre);
  });
}

// Enter key search
[searchInput, searchInputField].forEach(input => {
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = input.value || '';
        const genre = genreSelect?.value || '';
        loadMovies(query, genre);
      }
    });
  }
});

// Genre filter change
if (genreSelect) {
  genreSelect.addEventListener("change", () => {
    const query = searchInput?.value || searchInputField?.value || '';
    const genre = genreSelect.value;
    loadMovies(query, genre);
  });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadGenres();
  loadMovies();
});