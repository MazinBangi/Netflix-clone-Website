// FAQ Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in - if so, redirect to browse
  const token = localStorage.getItem("token");
  if (token) {
    window.location.href = "browse.html";
    return; // Exit early to prevent other code from running
  }

  const faqButtons = document.querySelectorAll('.FAQ__title');
  
  faqButtons.forEach(button => {
    button.addEventListener('click', function() {
      const faqContent = this.nextElementSibling;
      const icon = this.querySelector('i');
      
      // Close all other FAQ items
      faqButtons.forEach(otherButton => {
        if (otherButton !== this) {
          const otherContent = otherButton.nextElementSibling;
          const otherIcon = otherButton.querySelector('i');
          otherContent.style.maxHeight = '0';
          otherIcon.classList.remove('fa-times');
          otherIcon.classList.add('fa-plus');
        }
      });
      
      // Toggle current FAQ item
      if (faqContent.style.maxHeight === '0px' || !faqContent.style.maxHeight) {
        faqContent.style.maxHeight = faqContent.scrollHeight + 'px';
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-times');
      } else {
        faqContent.style.maxHeight = '0';
        icon.classList.remove('fa-times');
        icon.classList.add('fa-plus');
      }
    });
  });

  // Handle "Get Started" buttons
  const getStartedButtons = document.querySelectorAll('.primary__button');
  const emailInputs = document.querySelectorAll('.email__input');
  
  getStartedButtons.forEach((button, index) => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const email = emailInputs[index].value.trim();
      
      if (!email) {
        alert('Please enter your email address');
        return;
      }
      
      if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Store email in localStorage and redirect to login
      localStorage.setItem('signupEmail', email);
      window.location.href = 'login.html';
    });
  });

  // Handle Sign In button
  const signInButton = document.querySelector('.signin__button');
  if (signInButton) {
    signInButton.addEventListener('click', function() {
      window.location.href = 'login.html';
    });
  }

  // Email validation function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Floating label animation for email inputs
  emailInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentNode.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      if (!this.value.trim()) {
        this.parentNode.classList.remove('focused');
      }
    });
    
    input.addEventListener('input', function() {
      if (this.value.trim()) {
        this.parentNode.classList.add('has-content');
      } else {
        this.parentNode.classList.remove('has-content');
      }
    });
  });
});