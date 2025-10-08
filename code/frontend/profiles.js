// frontend/profiles.js (robust)
const API_ORIGIN = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'http://localhost:5000';
const API_URL = `${API_ORIGIN}/api`;
const token = localStorage.getItem("token") || null;

const profilesGrid = document.getElementById("profiles-grid");
const loading = document.getElementById("loading");

// Safety checks
console.log('profiles.js loaded. token present?', !!token, 'API_URL:', API_URL, 'profilesGrid found?', !!profilesGrid);

if (!token) {
  console.log('No token -> redirect to login');
  window.location.href = "login.html";
}

// show/hide
function showLoading() { if (loading) loading.style.display = 'block'; if (profilesGrid) profilesGrid.style.display = 'none'; }
function hideLoading() { if (loading) loading.style.display = 'none'; if (profilesGrid) profilesGrid.style.display = 'grid'; }

async function loadProfiles() {
  if (!profilesGrid) {
    console.error('profilesGrid element not found. Make sure your profiles.html contains <div id="profiles-grid"></div>');
    return;
  }

  try {
    showLoading();
    console.log('Fetching profiles from', `${API_URL}/profiles`);
    const res = await fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('fetch status', res.status);

    const text = await res.text();
    // Try parsing JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response:', text);
      data = null;
    }
    console.log('raw response parsed:', data);

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Unauthorized - clearing token and redirecting to login');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
      }
      throw new Error(data?.message || `Status ${res.status}`);
    }

    // Support both: array OR {profiles: [...], count, maxProfiles}
    let profilesArray = [];
    if (Array.isArray(data)) {
      profilesArray = data;
    } else if (data && Array.isArray(data.profiles)) {
      profilesArray = data.profiles;
    } else {
      profilesArray = [];
    }

    console.log('profilesArray length', profilesArray.length);
    renderProfiles(profilesArray, profilesArray.length, 5);
    hideLoading();

  } catch (err) {
    console.error('Error loadProfiles:', err);
    hideLoading();
    profilesGrid.innerHTML = `<div style="grid-column:1/-1;color:#999;text-align:center;padding:1rem;">Error loading profiles. Check console/network.</div>`;
  }
}

function renderProfiles(profiles, count, maxProfiles) {
  profilesGrid.innerHTML = '';

  if (profiles.length === 0) {
    // Empty state → show only Add Profile card
    const addCard = createAddProfileCard();
    profilesGrid.appendChild(addCard);

    profilesGrid.insertAdjacentHTML(
      'afterend',
      `<p style="color:#808080; text-align:center; margin-top:1.5rem;">
        No profiles yet. Create your first profile to continue.
      </p>`
    );
    return;
  }

  // Render existing profiles
  profiles.forEach(profile => {
    const profileCard = createProfileCard(profile);
    profilesGrid.appendChild(profileCard);
  });

  // Add "Add Profile" card if under limit
  if (count < maxProfiles) {
    const addCard = createAddProfileCard();
    profilesGrid.appendChild(addCard);
  }
}

function createProfileCard(profile) {
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.onclick = () => selectProfile(profile._id, profile.name);

  card.innerHTML = `
    <div class="profile-avatar">
      <span style="font-size:2.5rem">${profile.avatar || "🙂"}</span>
    </div>
    <div class="profile-name">${profile.name}</div>
  `;

  return card;
}

function createAddProfileCard() {
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.onclick = () => showAddProfilePrompt();

  card.innerHTML = `
    <div class="profile-avatar add-profile">
      <i class="fas fa-plus"></i>
    </div>
    <div class="profile-name">Add Profile</div>
  `;
  return card;
}

// SELECT PROFILE FUNCTION - THIS WAS MISSING!
function selectProfile(profileId, profileName) {
  console.log("Selected profile:", profileId, profileName);
  
  // Store current profile in localStorage
  localStorage.setItem("currentProfileId", profileId);
  localStorage.setItem("currentProfileName", profileName);
  
  // Redirect to browse page
  window.location.href = "browse.html";
}

// Add profile prompt & create
function showAddProfilePrompt() {
  const name = prompt('Profile name (max 20 chars):');
  if (!name) return;
  if (name.length > 20) { alert('Max 20 chars'); return; }
  const avatars = ['🎬','🎭','🎨','🎮','🎵','🏆','⚽','🎲','🎸'];
  const avatar = avatars[Math.floor(Math.random()*avatars.length)];
  createProfile(name.trim(), avatar);
}

async function createProfile(name, avatar) {
  try {
    showLoading();
    const res = await fetch(`${API_URL}/profiles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar })
    });
    const json = await res.json();
    console.log('create profile response', res.status, json);
    if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
    await loadProfiles();
    alert(`Profile "${name}" created`);
  } catch (err) {
    console.error('createProfile error', err);
    alert(err.message || 'Create profile failed');
    hideLoading();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Profiles page init');
  loadProfiles();
});