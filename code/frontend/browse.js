const API_URL = "/api";
const token = localStorage.getItem("token") || null;

const userStatus = document.getElementById("userStatus");
const btnLogout = document.getElementById("btnLogout");

// User status
if (token) {
  userStatus.textContent = "Logged in";
} else {
  userStatus.textContent = "Guest";
}

// Logout
btnLogout?.addEventListener("click", () => {
  localStorage.removeItem("token");
  location.href = "index.html";
});

// Fetch and render movies
async function fetchMovies() {
  try {
    const res = await fetch(`${API_URL}/movies`);
    const movies = await res.json();
    renderMovies(movies);
  } catch (err) {
    console.error("Error loading movies", err);
  }
}

// Render all movies in one horizontal row
function renderMovies(movies) {
  const track = document.getElementById("all-movies");
  track.innerHTML = "";

  movies.forEach(movie => {
    const posterUrl = movie.posterUrl || `https://via.placeholder.com/200x300/333/fff?text=${encodeURIComponent(movie.title)}`;
    const card = document.createElement("div");
    card.className = "horizontal-movie-card";
    card.innerHTML = `
      <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300/333/fff?text=${encodeURIComponent(movie.title)}'">
      <div class="card-overlay">
        <div class="card-title">${movie.title}</div>
        <div class="card-meta">${movie.genre || "Unknown"} • ${movie.year || ""}</div>
        <div class="card-actions">
          <button class="action-btn"><i class="fas fa-play"></i> Play</button>
          <button class="action-btn primary" onclick="addToWatchlist('${movie._id}', '${movie.title}')">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    `;
    track.appendChild(card);
  });

  updateArrowVisibility(track.closest(".movie-row"));
}

// Scroll movies horizontally
window.scrollMovies = function(button, direction) {
  const movieTrack = button.parentNode.querySelector(".movie-track");
  const cardWidth = 210;
  const visibleCards = Math.floor(movieTrack.clientWidth / cardWidth);
  const scrollDistance = cardWidth * visibleCards;

  if (direction === "next") {
    movieTrack.scrollBy({ left: scrollDistance, behavior: "smooth" });
  } else {
    movieTrack.scrollBy({ left: -scrollDistance, behavior: "smooth" });
  }

  setTimeout(() => {
    updateArrowVisibility(button.parentNode.parentNode);
  }, 300);
};

// Update arrow visibility
function updateArrowVisibility(rowElement) {
  const movieTrack = rowElement.querySelector(".movie-track");
  const prevArrow = rowElement.querySelector(".nav-arrow.prev");
  const nextArrow = rowElement.querySelector(".nav-arrow.next");

  const isAtStart = movieTrack.scrollLeft <= 0;
  const isAtEnd = movieTrack.scrollLeft >= movieTrack.scrollWidth - movieTrack.clientWidth - 5;

  prevArrow.style.opacity = isAtStart ? "0.3" : "1";
  nextArrow.style.opacity = isAtEnd ? "0.3" : "1";
  prevArrow.disabled = isAtStart;
  nextArrow.disabled = isAtEnd;
}

// Add to watchlist
window.addToWatchlist = async function(movieId, movieTitle) {
  if (!token) {
    alert("Please log in to add movies to your list");
    location.href = "login.html";
    return;
  }
  try {
    const res = await fetch(`${API_URL}/watchlist/${movieId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert(`"${movieTitle}" added to your list!`);
    } else {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to add movie");
    }
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    alert("Failed to add to watchlist");
  }
};

// Init
document.addEventListener("DOMContentLoaded", fetchMovies);

// Add this to your existing browse.js
window.addToWatchlist = async function(movieId, movieTitle) {
  if (!token) {
    alert("Please log in to add movies to your list");
    location.href = "login.html";
    return;
  }
  
  try {
    console.log("Adding movie:", movieId); // Debug log
    
    const res = await fetch(`${API_URL}/watchlist/${movieId}`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Response status:", res.status); // Debug log
    
    if (res.ok) {
      const data = await res.json();
      console.log("Success:", data); // Debug log
      alert(`"${movieTitle}" added to your list!`);
    } else {
      const errorData = await res.json();
      console.error("Error response:", errorData); // Debug log
      throw new Error(errorData.message || "Failed to add movie");
    }
  } catch (error) {
    console.error("Full error:", error); // Debug log
    alert("Failed to add to watchlist: " + error.message);
  }
};