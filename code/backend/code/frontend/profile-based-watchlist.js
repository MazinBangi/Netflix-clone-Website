// Profile-based Watchlist functionality
const API_URL = "/api";
const token = localStorage.getItem("token") || null;
const currentProfileId = localStorage.getItem("currentProfileId") || null;
const currentProfileName = localStorage.getItem("currentProfileName") || "User";

// DOM elements
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const watchlistGrid = document.getElementById("watchlist-grid");
const userStatus = document.getElementById("userStatus");
const btnLogout = document.getElementById("btnLogout");
const btnSearch = document.getElementById("btnSearch");
const btnClearAll = document.getElementById("btnClearAll");
const loading = document.getElementById("loading");
const totalItems = document.getElementById("totalItems");
const totalGenres = document.getElementById("totalGenres");

// Check if user has selected a profile
if (!currentProfileId) {
  window.location.href = "profiles.html";
}

// Global watchlist data
let watchlistData = [];

// Header scroll effect
window.addEventListener("scroll", () => {
  const header = document.querySelector(".netflix-header");
  if (window.scrollY > 100) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Search functionality
const searchIcon = document.querySelector(".search-icon");
const searchInputField = document.querySelector(".search-input");

if (searchIcon && searchInputField) {
  searchIcon.addEventListener("click", () => {
    searchInputField.classList.toggle("active");
    if (searchInputField.classList.contains("active")) {
      searchInputField.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      searchInputField.classList.remove("active");
    }
  });
}

// Check authentication
if (!token) {
  showNotification("Please log in to view your watchlist", "error");
  setTimeout(() => {
    location.href = "login.html";
  }, 2000);
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
  if (loading) loading.style.display = "block";
}

function hideLoading() {
  if (loading) loading.style.display = "none";
}

// Show notification
function showNotification(message, type = "success") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#4CAF50" : "#f44336"};
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 3000);
}

// Update stats
function updateStats(movies) {
  if (totalItems) totalItems.textContent = movies.length;

  if (totalGenres) {
    const allGenres = new Set();
    movies.forEach((movie) => {
      if (Array.isArray(movie.genre)) {
        movie.genre.forEach((g) => allGenres.add(g));
      } else if (movie.genre) {
        allGenres.add(movie.genre);
      }
    });
    totalGenres.textContent = allGenres.size;
  }
}

// Populate genre filter
function populateGenreFilter(movies) {
  const allGenres = new Set();
  movies.forEach((movie) => {
    if (Array.isArray(movie.genre)) {
      movie.genre.forEach((g) => allGenres.add(g));
    } else if (movie.genre) {
      allGenres.add(movie.genre);
    }
  });

  genreSelect.innerHTML = '<option value="">All Genres</option>';

  Array.from(allGenres)
    .sort()
    .forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreSelect.appendChild(option);
    });
}

// Fetch watchlist from profile
async function loadWatchlist(query = "", genre = "") {
  if (!token || !currentProfileId) {
    showNotification("Please log in and select a profile", "error");
    return;
  }

  try {
    showLoading();

    console.log("Loading watchlist for profile:", currentProfileId);

    const res = await fetch(
      `${API_URL}/profiles/${currentProfileId}/watchlist`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        showNotification("Session expired. Please log in again.", "error");
        localStorage.removeItem("token");
        localStorage.removeItem("currentProfileId");
        localStorage.removeItem("currentProfileName");
        setTimeout(() => (location.href = "login.html"), 2000);
        return;
      }
      throw new Error("Failed to fetch watchlist");
    }

    const data = await res.json();
    console.log("Watchlist data:", data);

    watchlistData = data.movies || [];

    // Filter the data client-side
    let filteredMovies = watchlistData;

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filteredMovies = filteredMovies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm) ||
          (Array.isArray(movie.genre)
            ? movie.genre.some((g) => g.toLowerCase().includes(searchTerm))
            : movie.genre && movie.genre.toLowerCase().includes(searchTerm)) ||
          (movie.description &&
            movie.description.toLowerCase().includes(searchTerm))
      );
    }

    if (genre) {
      filteredMovies = filteredMovies.filter((movie) => {
        if (Array.isArray(movie.genre)) {
          return movie.genre.includes(genre);
        }
        return movie.genre === genre;
      });
    }

    populateGenreFilter(watchlistData);
    updateStats(watchlistData);
    renderWatchlist(filteredMovies);
    hideLoading();
  } catch (error) {
    console.error("Error loading watchlist:", error);
    showNotification("Failed to load watchlist", "error");
    hideLoading();
  }
}

// Render watchlist
function renderWatchlist(movies) {
  if (!watchlistGrid) return;

  watchlistGrid.innerHTML = "";

  if (!movies.length) {
    watchlistGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
        <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h3>${currentProfileName}'s list is empty</h3>
        <p>Start adding movies from the browse page!</p>
        <a href="browse.html" class="browse-link" style="
          display: inline-block;
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #e50914;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        ">Browse Movies</a>
      </div>
    `;
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const posterUrl =
      movie.posterUrl ||
      `https://via.placeholder.com/300x450/333/fff?text=${encodeURIComponent(
        movie.title
      )}`;

    // Handle genre display (array or string)
    let genreDisplay = "Unknown Genre";
    if (Array.isArray(movie.genre)) {
      genreDisplay = movie.genre.join(", ");
    } else if (movie.genre) {
      genreDisplay = movie.genre;
    }

    const year = movie.year ? ` • ${movie.year}` : "";

    card.innerHTML = `
      <img src="${posterUrl}" alt="${
      movie.title
    }" onerror="this.src='https://via.placeholder.com/300x450/333/fff?text=${encodeURIComponent(
      movie.title
    )}'">
      <div class="meta">
        <h3>${movie.title}</h3>
        <p>${genreDisplay}${year}</p>
        ${
          movie.description
            ? `<p style="font-size: 0.8rem; margin-bottom: 1rem;">${movie.description.substring(
                0,
                100
              )}${movie.description.length > 100 ? "..." : ""}</p>`
            : ""
        }
        <div class="card-actions">
          <button class="btn-play">
            <i class="fas fa-play"></i> Play
          </button>
          <button class="btn-remove" data-id="${movie._id}" data-title="${
      movie.title
    }">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `;

    watchlistGrid.appendChild(card);
  });

  // Add event listeners to remove buttons
  watchlistGrid.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const movieId = btn.dataset.id;
      const movieTitle = btn.dataset.title;

      if (
        !confirm(`Remove "${movieTitle}" from ${currentProfileName}'s list?`)
      ) {
        return;
      }

      try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        const res = await fetch(
          `${API_URL}/profiles/${currentProfileId}/watchlist/${movieId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          showNotification(
            `"${movieTitle}" removed from ${currentProfileName}'s list!`
          );
          const query = searchInput?.value || "";
          const genre = genreSelect?.value || "";
          loadWatchlist(query, genre);
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to remove movie");
        }
      } catch (error) {
        console.error("Error removing from watchlist:", error);
        showNotification(
          error.message || "Failed to remove from watchlist",
          "error"
        );
        btn.innerHTML = '<i class="fas fa-trash"></i> Remove';
        btn.disabled = false;
      }
    });
  });
}

// Clear all watchlist items
btnClearAll?.addEventListener("click", async () => {
  if (!watchlistData.length) {
    showNotification("Your list is already empty", "error");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to clear ${currentProfileName}'s entire watchlist? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    btnClearAll.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Clearing...';
    btnClearAll.disabled = true;

    const res = await fetch(
      `${API_URL}/profiles/${currentProfileId}/watchlist/clear`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) {
      showNotification(
        `${currentProfileName}'s watchlist cleared successfully!`
      );
      loadWatchlist();
    } else {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to clear watchlist");
    }
  } catch (error) {
    console.error("Error clearing watchlist:", error);
    showNotification(error.message || "Failed to clear watchlist", "error");
  } finally {
    btnClearAll.innerHTML = '<i class="fas fa-trash"></i> Clear All';
    btnClearAll.disabled = false;
  }
});

// Search event listeners
if (btnSearch) {
  btnSearch.addEventListener("click", (e) => {
    e.preventDefault();
    const query = searchInput?.value || "";
    const genre = genreSelect?.value || "";
    loadWatchlist(query, genre);
  });
}

// Enter key search
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchInput.value || "";
      const genre = genreSelect?.value || "";
      loadWatchlist(query, genre);
    }
  });
}

// Genre filter change
if (genreSelect) {
  genreSelect.addEventListener("change", () => {
    const query = searchInput?.value || "";
    const genre = genreSelect.value;
    loadWatchlist(query, genre);
  });
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .btn-play, .btn-remove {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-play {
    background: white;
    color: black;
  }
  
  .btn-play:hover {
    background: rgba(255, 255, 255, 0.8);
  }
  
  .btn-remove {
    background: #e50914;
    color: white;
  }
  
  .btn-remove:hover {
    background: #b8070f;
  }
`;
document.head.appendChild(style);

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Watchlist page loaded for profile:", currentProfileName);
  loadWatchlist();
});
