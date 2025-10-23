// Enhanced Netflix-style horizontal browse functionality
const API_URL = "/api";
const token = localStorage.getItem("token") || null;
const currentProfileId = localStorage.getItem("currentProfileId") || null;
const currentProfileName = localStorage.getItem("currentProfileName") || "User";

// DOM elements
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const movieRowsContainer = document.getElementById("movie-rows-container");
const userStatus = document.getElementById("userStatus");
const btnLogout = document.getElementById("btnLogout");
const btnSearch = document.getElementById("btnSearch");
const loading = document.getElementById("loading");

// Check if user has selected a profile
console.log("Current Profile ID:", currentProfileId);
console.log("Token exists:", !!token);
if (!currentProfileId) {
  console.log("No profile selected, redirecting to profiles page");
  window.location.href = "profiles.html";
}

// Global data
let allMovies = [];
let moviesByGenre = {};

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

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchInputField.classList.remove('active');
    }
  });
}

// User status display
if (token) {
  userStatus.textContent = currentProfileName;
} else {
  userStatus.textContent = "Guest";
}

// Logout functionality
btnLogout?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentProfileId");
  localStorage.removeItem("currentProfileName");
  showNotification("Logged out successfully");
  setTimeout(() => {
    location.href = "index.html";
  }, 1000);
});

// Show/Hide loading
function showLoading() {
  if (loading) loading.style.display = 'block';
}

function hideLoading() {
  if (loading) loading.style.display = 'none';
}

// Show notification with better error handling
function showNotification(message, type = 'success') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());

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
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 4000);
}

// Fetch movies and organize by genre
async function loadMovies() {
  try {
    showLoading();
    console.log("Loading movies...");
    
    const res = await fetch(`${API_URL}/movies`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch movies: ${res.status} ${res.statusText}`);
    }
    
    allMovies = await res.json();
    console.log("Movies loaded:", allMovies.length);
    
    if (allMovies.length === 0) {
      showNotification("No movies found in database", "error");
      return;
    }
    
    organizeMoviesByGenre();
    populateGenreFilter();
    renderMovieRows();
    hideLoading();
  } catch (error) {
    console.error('Error loading movies:', error);
    showNotification(`Failed to load movies: ${error.message}`, 'error');
    hideLoading();
  }
}

// Organize movies by genre (handle both array and string genres)
function organizeMoviesByGenre() {
  moviesByGenre = {};
  
  allMovies.forEach(movie => {
    let genres = [];
    
    // Handle both array and string genres from your Movie model
    if (Array.isArray(movie.genre)) {
      genres = movie.genre.filter(Boolean);
    } else if (movie.genre) {
      genres = [movie.genre];
    }
    
    if (genres.length === 0) {
      genres = ['Other'];
    }
    
    genres.forEach(genre => {
      if (!moviesByGenre[genre]) {
        moviesByGenre[genre] = [];
      }
      moviesByGenre[genre].push(movie);
    });
  });
  
  console.log("Movies organized by genre:", Object.keys(moviesByGenre));
}

// Populate genre filter
function populateGenreFilter() {
  genreSelect.innerHTML = '<option value="">All Genres</option>';
  
  Object.keys(moviesByGenre).sort().forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    genreSelect.appendChild(option);
  });
}

// Render movie rows
function renderMovieRows(searchQuery = '', selectedGenre = '') {
  if (!movieRowsContainer) return;
  
  movieRowsContainer.innerHTML = '';
  
  let filteredGenres = selectedGenre ? [selectedGenre] : Object.keys(moviesByGenre).sort();
  
  if (searchQuery) {
    // If search query, show all matching movies in one row
    const searchResults = allMovies.filter(movie =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.description && movie.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(movie.genre) ? movie.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) : 
       movie.genre && movie.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (searchResults.length > 0) {
      createMovieRow('Search Results', searchResults);
    } else {
      movieRowsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #999;">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No results found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      `;
    }
    return;
  }
  
  // Render rows by genre
  filteredGenres.forEach(genre => {
    if (moviesByGenre[genre] && moviesByGenre[genre].length > 0) {
      createMovieRow(genre, moviesByGenre[genre]);
    }
  });
  
  if (filteredGenres.length === 0 || !filteredGenres.some(genre => moviesByGenre[genre]?.length > 0)) {
    movieRowsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #999;">
        <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h3>No movies found</h3>
        <p>Try selecting a different genre</p>
      </div>
    `;
  }
  
  // Add scroll listeners after rows are created
  setTimeout(addScrollListeners, 100);
}

// Create a movie row
function createMovieRow(title, movies) {
  const rowDiv = document.createElement('div');
  rowDiv.className = 'movie-row';
  
  rowDiv.innerHTML = `
    <div class="row-header">
      <h2 class="row-title">${title}</h2>
      <div class="row-controls">
        <span class="scroll-indicator">${movies.length} titles</span>
      </div>
    </div>
    <div class="movie-slider">
      <button class="nav-arrow prev" onclick="scrollMovies(this, 'prev')">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="movie-track">
        ${movies.map(movie => createMovieCard(movie)).join('')}
      </div>
      <button class="nav-arrow next" onclick="scrollMovies(this, 'next')">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
  
  movieRowsContainer.appendChild(rowDiv);
  
  // Update arrow visibility
  setTimeout(() => updateArrowVisibility(rowDiv), 100);
}

// Create individual movie card
function createMovieCard(movie) {
  const posterUrl = movie.posterUrl || `https://via.placeholder.com/200x300/333/fff?text=${encodeURIComponent(movie.title)}`;
  
  // Handle genre display (array or string)
  let genreDisplay = 'Unknown';
  if (Array.isArray(movie.genre)) {
    genreDisplay = movie.genre.join(', ');
  } else if (movie.genre) {
    genreDisplay = movie.genre;
  }
  
  const year = movie.year ? ` • ${movie.year}` : '';
  
  return `
    <div class="horizontal-movie-card">
      <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300/333/fff?text=${encodeURIComponent(movie.title)}'">
      <div class="card-overlay">
        <div class="card-title">${movie.title}</div>
        <div class="card-meta">${genreDisplay}${year}</div>
        <div class="card-actions">
          <button class="action-btn">
            <i class="fas fa-play"></i> Play
          </button>
          <button class="action-btn primary" onclick="addToWatchlist('${movie._id}', '${movie.title.replace(/'/g, "\\'")}')">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Scroll movies horizontally
window.scrollMovies = function(button, direction) {
  const movieTrack = button.parentNode.querySelector('.movie-track');
  const cardWidth = 210; // 200px card + 10px gap
  const visibleCards = Math.floor(movieTrack.clientWidth / cardWidth);
  const scrollDistance = cardWidth * visibleCards;
  
  if (direction === 'next') {
    movieTrack.scrollBy({ left: scrollDistance, behavior: 'smooth' });
  } else {
    movieTrack.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
  }
  
  // Update arrow visibility after scroll
  setTimeout(() => {
    updateArrowVisibility(button.parentNode.parentNode);
  }, 300);
};

// Update arrow visibility based on scroll position
function updateArrowVisibility(rowElement) {
  const movieTrack = rowElement.querySelector('.movie-track');
  const prevArrow = rowElement.querySelector('.nav-arrow.prev');
  const nextArrow = rowElement.querySelector('.nav-arrow.next');
  
  if (!movieTrack || !prevArrow || !nextArrow) return;
  
  const isAtStart = movieTrack.scrollLeft <= 0;
  const isAtEnd = movieTrack.scrollLeft >= movieTrack.scrollWidth - movieTrack.clientWidth - 5;
  
  prevArrow.style.opacity = isAtStart ? '0.3' : '1';
  nextArrow.style.opacity = isAtEnd ? '0.3' : '1';
  prevArrow.disabled = isAtStart;
  nextArrow.disabled = isAtEnd;
}

// Add scroll listeners to update arrows
function addScrollListeners() {
  document.querySelectorAll('.movie-track').forEach(track => {
    track.addEventListener('scroll', () => {
      const rowElement = track.closest('.movie-row');
      updateArrowVisibility(rowElement);
    });
  });
}

// Add to watchlist function with detailed error handling
window.addToWatchlist = async function(movieId, movieTitle) {
  console.log("Adding to watchlist:", movieId, movieTitle);
  
  if (!token) {
    showNotification("Please log in to add movies to your list", "error");
    setTimeout(() => {
      location.href = "login.html";
    }, 2000);
    return;
  }
  
  if (!currentProfileId) {
    showNotification("Please select a profile first", "error");
    setTimeout(() => {
      location.href = "profiles.html";
    }, 2000);
    return;
  }
  
  if (!movieId) {
    showNotification("Invalid movie ID", "error");
    return;
  }

  const button = document.querySelector(`button[onclick="addToWatchlist('${movieId}', '${movieTitle.replace(/'/g, "\\'")}')"]`);
  const originalText = button ? button.innerHTML : '';
  
  try {
    // Show loading state
    if (button) {
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      button.disabled = true;
    }

    console.log("Making POST request to:", `${API_URL}/profiles/${currentProfileId}/watchlist/${movieId}`);
    
    const res = await fetch(`${API_URL}/profiles/${currentProfileId}/watchlist/${movieId}`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Response status:", res.status);
    
    const responseText = await res.text();
    console.log("Response text:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response was:", responseText);
      throw new Error("Server returned invalid JSON response");
    }
    
    if (res.ok) {
      showNotification(`"${movieTitle}" added to ${currentProfileName}'s list!`);
      
      // Show success state briefly
      if (button) {
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.background = '#4CAF50';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = '#e50914';
          button.disabled = false;
        }, 2000);
      }
    } else {
      console.error("Server error response:", data);
      throw new Error(data.message || `Server error: ${res.status}`);
    }
  } catch (error) {
    console.error('Full error adding to watchlist:', error);
    
    let errorMessage = "Failed to add to watchlist";
    if (error.message.includes("JSON")) {
      errorMessage = "Server error - please check server logs";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification(errorMessage, 'error');
    
    // Reset button
    if (button) {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }
};

// Search functionality
if (btnSearch) {
  btnSearch.addEventListener("click", (e) => {
    e.preventDefault();
    const query = searchInput?.value || '';
    const genre = genreSelect?.value || '';
    renderMovieRows(query, genre);
  });
}

// Enter key search
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchInput.value || '';
      const genre = genreSelect?.value || '';
      renderMovieRows(query, genre);
    }
  });
}

// Genre filter change
if (genreSelect) {
  genreSelect.addEventListener("change", () => {
    const query = searchInput?.value || '';
    const genre = genreSelect.value;
    renderMovieRows(query, genre);
  });
}

// Add CSS animations and styles
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
  
  .notification {
    font-family: 'Netflix Sans', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
`;
document.head.appendChild(style);

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  console.log("Page loaded, initializing...");
  console.log("Token exists:", !!token);
  loadMovies();
});