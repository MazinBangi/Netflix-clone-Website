// Manage Profiles Page
const API_URL = "/api";
const token = localStorage.getItem("token") || null;

const manageGrid = document.getElementById("manage-grid");
const loading = document.getElementById("loading");

// Available avatars
const AVATARS = [
  "🎬",
  "🎭",
  "🎪",
  "🎨",
  "🎮",
  "🎯",
  "🎲",
  "🎸",
  "🎺",
  "🎻",
  "🎼",
  "🎤",
  "🎧",
  "🎹",
  "🎵",
  "🎶",
  "🏆",
  "⚽",
  "🏀",
  "🎾",
  "🎳",
  "🎰",
  "🎱",
  "🎣",
  "🌟",
  "⭐",
  "🔥",
  "💎",
  "🎓",
  "🚀",
];

let profiles = [];

// Check authentication
if (!token) {
  window.location.href = "login.html";
}

// Show/Hide loading
function showLoading() {
  if (loading) loading.style.display = "block";
  if (manageGrid) manageGrid.style.display = "none";
}

function hideLoading() {
  if (loading) loading.style.display = "none";
  if (manageGrid) manageGrid.style.display = "grid";
}

// Load profiles
async function loadProfiles() {
  try {
    showLoading();

    const res = await fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
      }
      throw new Error("Failed to fetch profiles");
    }

    const data = await res.json();
    console.log("Profiles loaded:", data);

    profiles = data.profiles;
    renderProfiles(profiles);
    hideLoading();
  } catch (error) {
    console.error("Error loading profiles:", error);
    hideLoading();
    manageGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #999;">
        <p>Error loading profiles. Please try again.</p>
        <button onclick="loadProfiles()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e50914; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  }
}

// Render profiles for management
function renderProfiles(profiles) {
  manageGrid.innerHTML = "";

  profiles.forEach((profile) => {
    const profileCard = createManageProfileCard(profile);
    manageGrid.appendChild(profileCard);
  });
}

// Create manage profile card
function createManageProfileCard(profile) {
  const card = document.createElement("div");
  card.className = "manage-profile-card";
  card.dataset.profileId = profile._id;

  card.innerHTML = `
    <div class="manage-avatar" onclick="changeAvatar('${profile._id}', '${profile.avatar}')">
      ${profile.avatar}
      <div class="edit-overlay">
        <i class="fas fa-pencil-alt edit-icon"></i>
      </div>
    </div>
    <input 
      type="text" 
      class="profile-name-input" 
      value="${profile.name}" 
      maxlength="20"
      onchange="updateProfileName('${profile._id}', this.value)"
    />
    <div class="profile-actions">
      <button class="action-icon-btn" onclick="saveProfile('${profile._id}')" title="Save">
        <i class="fas fa-check"></i>
      </button>
      <button class="action-icon-btn delete" onclick="deleteProfile('${profile._id}', '${profile.name}')" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  return card;
}

// Change avatar
window.changeAvatar = function (profileId, currentAvatar) {
  // Create avatar selector
  const avatarSelector = document.createElement("div");
  avatarSelector.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #333;
    padding: 2rem;
    border-radius: 8px;
    z-index: 9999;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  `;

  avatarSelector.innerHTML = `
    <h3 style="color: #fff; margin-bottom: 1rem; text-align: center;">Choose Avatar</h3>
    <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 1rem;">
      ${AVATARS.map(
        (avatar) => `
        <div 
          style="font-size: 3rem; text-align: center; cursor: pointer; padding: 0.5rem; border: 2px solid ${
            avatar === currentAvatar ? "#fff" : "transparent"
          }; border-radius: 4px; transition: all 0.2s;"
          onmouseover="this.style.transform='scale(1.2)'"
          onmouseout="this.style.transform='scale(1)'"
          onclick="selectAvatar('${profileId}', '${avatar}')"
        >
          ${avatar}
        </div>
      `
      ).join("")}
    </div>
    <button 
      onclick="this.parentElement.remove(); document.getElementById('overlay').remove();"
      style="width: 100%; padding: 0.75rem; background: #e50914; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;"
    >
      Cancel
    </button>
  `;

  // Add overlay
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9998;
  `;
  overlay.onclick = () => {
    avatarSelector.remove();
    overlay.remove();
  };

  document.body.appendChild(overlay);
  document.body.appendChild(avatarSelector);
};

// Select avatar
window.selectAvatar = async function (profileId, avatar) {
  try {
    const res = await fetch(`${API_URL}/profiles/${profileId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ avatar }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update avatar");
    }

    // Update UI
    const card = document.querySelector(`[data-profile-id="${profileId}"]`);
    if (card) {
      const avatarDiv = card.querySelector(".manage-avatar");
      avatarDiv.innerHTML = `
        ${avatar}
        <div class="edit-overlay">
          <i class="fas fa-pencil-alt edit-icon"></i>
        </div>
      `;
      avatarDiv.onclick = () => changeAvatar(profileId, avatar);
    }

    // Close selector
    document.querySelector("#overlay")?.remove();
    document.querySelector('div[style*="z-index: 9999"]')?.remove();
  } catch (error) {
    console.error("Error updating avatar:", error);
    alert(error.message || "Failed to update avatar");
  }
};

// Update profile name (triggered on input change)
window.updateProfileName = function (profileId, name) {
  // Just store the name change, actual save happens on button click
  console.log("Name changed for", profileId, "to", name);
};

// Save profile
window.saveProfile = async function (profileId) {
  try {
    const card = document.querySelector(`[data-profile-id="${profileId}"]`);
    const nameInput = card.querySelector(".profile-name-input");
    const name = nameInput.value.trim();

    if (!name) {
      alert("Profile name cannot be empty");
      return;
    }

    if (name.length > 20) {
      alert("Profile name must be 20 characters or less");
      return;
    }

    const res = await fetch(`${API_URL}/profiles/${profileId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update profile");
    }

    const data = await res.json();
    console.log("Profile updated:", data);

    // Show success feedback
    const saveBtn = card.querySelector(".action-icon-btn");
    const originalIcon = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
    saveBtn.style.color = "#4CAF50";
    saveBtn.style.borderColor = "#4CAF50";

    setTimeout(() => {
      saveBtn.innerHTML = originalIcon;
      saveBtn.style.color = "";
      saveBtn.style.borderColor = "";
    }, 2000);
  } catch (error) {
    console.error("Error saving profile:", error);
    alert(error.message || "Failed to save profile");
  }
};

// Delete profile
window.deleteProfile = async function (profileId, profileName) {
  if (profiles.length <= 1) {
    alert("You must have at least one profile");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/profiles/${profileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to delete profile");
    }

    console.log("Profile deleted:", profileId);

    // Remove from UI
    const card = document.querySelector(`[data-profile-id="${profileId}"]`);
    if (card) {
      card.style.animation = "fadeOut 0.3s ease";
      setTimeout(() => {
        card.remove();
      }, 300);
    }

    // Reload profiles
    setTimeout(() => {
      loadProfiles();
    }, 500);
  } catch (error) {
    console.error("Error deleting profile:", error);
    alert(error.message || "Failed to delete profile");
  }
};

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.8); }
  }
  
  .manage-profile-card {
    animation: fadeIn 0.5s ease;
  }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Manage profiles page loaded");
  loadProfiles();
});
