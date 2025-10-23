// Login/Register functionality for Netflix Clone
const API_URL = "/api";

// DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const feedback = document.getElementById("feedback");

// Show feedback message
function showFeedback(message, isError = false) {
  if (feedback) {
    feedback.textContent = message;
    feedback.style.color = isError ? "#e50914" : "#46d369";
    feedback.style.display = "block";
  }
}

// Clear feedback
function clearFeedback() {
  if (feedback) {
    feedback.textContent = "";
    feedback.style.display = "none";
  }
}

// Show loading state
function setLoadingState(button, isLoading = true) {
  if (isLoading) {
    button.disabled = true;
    button.style.opacity = "0.6";
    button.style.cursor = "not-allowed";
  } else {
    button.disabled = false;
    button.style.opacity = "1";
    button.style.cursor = "pointer";
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate form inputs
function validateInputs() {
  const email = emailInput?.value?.trim();
  const password = passwordInput?.value?.trim();
  
  if (!email || !password) {
    showFeedback("Please fill in all fields", true);
    return false;
  }
  
  if (!isValidEmail(email)) {
    showFeedback("Please enter a valid email address", true);
    return false;
  }
  
  if (password.length < 6) {
    showFeedback("Password must be at least 6 characters long", true);
    return false;
  }
  
  return true;
}

// Register user
async function registerUser() {
  if (!validateInputs()) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  try {
    setLoadingState(btnRegister, true);
    clearFeedback();
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showFeedback("Registration successful! You can now log in.");
      // Clear the form
      emailInput.value = "";
      passwordInput.value = "";
    } else {
      showFeedback(data.message || "Registration failed", true);
    }
  } catch (error) {
    console.error("Registration error:", error);
    showFeedback("Network error. Please try again.", true);
  } finally {
    setLoadingState(btnRegister, false);
  }
}

// Login user
async function loginUser() {
  if (!validateInputs()) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  try {
    setLoadingState(btnLogin, true);
    clearFeedback();
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store the token
      localStorage.setItem("token", data.token);
      
      // Clear any existing profile selection
      localStorage.removeItem("currentProfileId");
      localStorage.removeItem("currentProfileName");
      
      showFeedback("Login successful! Redirecting...");
      
      // Redirect to profiles page after login
      setTimeout(() => {
        window.location.href = "profiles.html";
      }, 1500);
    } else {
      showFeedback(data.message || "Login failed", true);
    }
  } catch (error) {
    console.error("Login error:", error);
    showFeedback("Network error. Please try again.", true);
  } finally {
    setLoadingState(btnLogin, false);
  }
}

// Event listeners
if (btnRegister) {
  btnRegister.addEventListener("click", registerUser);
}

if (btnLogin) {
  btnLogin.addEventListener("click", loginUser);
}

// Enter key submission
[emailInput, passwordInput].forEach(input => {
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loginUser(); // Default to login on Enter
      }
    });
  }
});

// Clear feedback when user starts typing
[emailInput, passwordInput].forEach(input => {
  if (input) {
    input.addEventListener("input", clearFeedback);
  }
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem("token");
  if (token) {
    // User is already logged in, redirect to profiles page
    window.location.href = "profiles.html";
  }
});
