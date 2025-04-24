/**
 * CustomXShop Profile Navigation Handler
 * 
 * This script handles the visibility of profile/login links based on authentication status
 * and ensures direct navigation to the profile page.
 */

(function() {
  // Run when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Ensure profile elements are properly shown based on auth state
    updateProfileVisibility();
  });
  
  /**
   * Ensure profile elements are shown/hidden based on auth state
   * This provides an extra layer of visibility control beyond auth.js
   */
  function updateProfileVisibility() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    
    // Get elements
    const loginLi = document.getElementById('login-li');
    const profileLi = document.getElementById('profile-li');
    
    if (!loginLi || !profileLi) {
      // Elements not found on this page
      return;
    }
    
    // Update visibility based on login state
    if (isLoggedIn) {
      loginLi.style.display = 'none';
      profileLi.style.display = 'block';
      console.log('Profile navigation: User is logged in, showing profile button');
      
      // Ensure the profile link is correctly set
      const profileLink = profileLi.querySelector('a');
      if (profileLink) {
        profileLink.href = "Profile.html";
      }
    } else {
      loginLi.style.display = 'block';
      profileLi.style.display = 'none';
      console.log('Profile navigation: User is not logged in, hiding profile button');
    }
  }
})(); 