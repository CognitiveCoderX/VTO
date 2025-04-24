/**
 * CustomXShop Authentication Module
 * Provides consistent authentication handling across all pages
 */

(function() {
  // Check authentication and update UI when the DOM content is loaded
  document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Profile dropdown is being removed - direct navigation to Profile.html is now implemented
  });
  
  // Dropdown functionality removed in favor of direct navigation

  /**
   * Check user authentication status and update UI accordingly
   */
  function checkAuthStatus() {
    try {
      // Safely get token and DOM elements
      const token = localStorage.getItem('token') || '';
      const loginLi = document.getElementById('login-li');
      const profileLi = document.getElementById('profile-li');
      
      // Early check for empty token
      if (!token) {
        // No token, show login button and hide profile
        if (loginLi) loginLi.style.display = 'block';
        if (profileLi) profileLi.style.display = 'none';
        
        // If we're on the Profile.html page and not authenticated, redirect to login
        if (window.location.pathname.includes('/HTML/Profile.html')) {
          console.warn('Authentication required: Redirecting to login page');
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/HTML/index.html';
        }
        
        return; // Exit early
      }
      
      // We have a token, show profile link and hide login button
      if (loginLi) loginLi.style.display = 'none';
      if (profileLi) {
        profileLi.style.display = 'block';
        
        // Ensure profile link points directly to Profile.html
        const profileLink = profileLi.querySelector('a');
        if (profileLink) {
          profileLink.href = '/HTML/Profile.html';
        }
      }
      
      // Get username with multiple fallback methods
      let username = 'User'; // Default fallback
      
      // TOP PRIORITY: Check for enhanced user data first (most reliable source)
      try {
        const enhancedUserStr = localStorage.getItem('enhanced_user_data');
        if (enhancedUserStr) {
          const enhancedUser = JSON.parse(enhancedUserStr);
          if (enhancedUser && enhancedUser.username) {
            username = enhancedUser.username;
            console.log('Using enhanced user data for username:', username);
          }
        }
      } catch (enhancedUserError) {
        console.warn('Enhanced user data parsing failed:', enhancedUserError);
      }
      
      // If enhanced data not found, try other methods
      if (username === 'User') {
        // Try to get user from localStorage
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && (user.username || user.name || user.email)) {
              username = user.username || user.name || user.email;
              // If username is same as email, try to extract username part
              if (username.includes('@') && username === user.email) {
                username = formatUsernameFromEmail(username);
              }
              
              // If username is "mockuser", try to use something better
              if (username === 'mockuser' && user.email) {
                username = formatUsernameFromEmail(user.email);
              }
            }
          }
        } catch (userError) {
          console.warn('User data parsing failed:', userError);
        }
        
        // If we still don't have a good username, try token
        if (username === 'User' || username === 'mockuser') {
          // Handle token parsing
          if (token.includes('.') && token.split('.').length === 3) {
            try {
              const parts = token.split('.');
              if (parts[1]) {
                // Safe decode JWT payload (second part)
                const payload = parseJwtPayload(parts[1]);
                if (payload) {
                  username = payload.username || payload.name || payload.email || payload.sub || 'User';
                  // If username is same as email, try to extract username part
                  if (username.includes('@') && username === payload.email) {
                    username = formatUsernameFromEmail(username);
                  }
                  
                  // If username is still "mockuser", try to use email
                  if (username === 'mockuser' && payload.email) {
                    username = formatUsernameFromEmail(payload.email);
                  }
                }
              }
            } catch (jwtError) {
              console.warn('JWT parsing failed:', jwtError);
            }
          }
        }
      }
      
      // Update username in profile element if it exists
      const profileUsername = document.querySelector('.profile-btn .username-text');
      if (profileUsername) {
        profileUsername.textContent = username;
      }

      // Debug output to help identify token issues
      console.log('Authentication successful with username:', username);
    } catch (globalError) {
      // Catch-all for any unexpected errors
      console.error('Authentication error:', globalError);
      
      // Remove potentially invalid token
      if (localStorage.getItem('token')) {
        console.warn('Removing invalid token due to parsing error');
        localStorage.removeItem('token');
      }
    }
  }

  /**
   * Format a user-friendly username from an email address
   */
  function formatUsernameFromEmail(email) {
    if (!email || !email.includes('@')) return email;
    
    const namePart = email.split('@')[0];
    
    // Format username to be more user-friendly
    // Capitalize first letter, replace dots and underscores with spaces
    let formattedName = namePart
      .replace(/[._]/g, ' ')  // Replace dots and underscores with spaces
      .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
      
    return formattedName;
  }

  /**
   * Safely parses the JWT payload section
   * @param {string} token - The JWT token
   * @returns {object|null} The parsed payload, or null if parsing failed
   */
  function parseJwtPayload(token) {
    try {
      if (!token) {
        console.warn('parseJwtPayload: No token provided');
        return null;
      }
      
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('parseJwtPayload: Invalid token format - expected 3 parts');
        return null;
      }
      
      // Get the payload (middle part)
      const base64Url = parts[1];
      if (!base64Url) {
        console.warn('parseJwtPayload: Empty payload section');
        return null;
      }
      
      try {
        // Use safer base64 decoding to avoid URI errors
        const payload = JSON.parse(safeBase64Decode(base64Url));
        return payload;
      } catch (innerError) {
        console.error('parseJwtPayload: Failed to parse payload JSON', innerError);
        // Return empty object as fallback instead of null
        return {};
      }
    } catch (error) {
      console.error('parseJwtPayload: Unexpected error parsing token', error);
      return null;
    }
  }

  /**
   * Safely decodes a base64 string without using atob/btoa
   * @param {string} base64Url - The base64 URL encoded string
   * @returns {string} The decoded string
   */
  function safeBase64Decode(base64Url) {
    try {
      // Replace non-base64 URL chars and add padding if needed
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      
      // Decode using the safer approach instead of atob + decodeURIComponent
      // This avoids URI malformed errors with invalid UTF-8 sequences
      const rawString = atob(paddedBase64);
      
      // Convert to byte array to handle UTF-8 properly
      const outputArray = new Uint8Array(rawString.length);
      for (let i = 0; i < rawString.length; ++i) {
        outputArray[i] = rawString.charCodeAt(i);
      }
      
      // Convert byte array to string using TextDecoder (handles UTF-8 correctly)
      let decoder;
      try {
        decoder = new TextDecoder('utf-8');
        return decoder.decode(outputArray);
      } catch (decoderError) {
        // Fallback for older browsers without TextDecoder
        let result = '';
        const utf8decoder = (byte) => {
          return String.fromCharCode(byte);
        };
        outputArray.forEach(byte => {
          result += utf8decoder(byte);
        });
        return result;
      }
    } catch (error) {
      console.error('safeBase64Decode: Error decoding base64', error);
      return '{}'; // Return empty JSON object string as fallback
    }
  }
  
  /**
   * Creates a mock JWT payload for development or fallback purposes
   * @returns {Object} A mock payload
   */
  function createMockPayload() {
    console.warn('Using mock JWT payload as fallback');
    return { 
      sub: 'mock-user-id', 
      email: 'user@example.com',
      username: 'mockuser',
      exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
    };
  }

  /**
   * Handles user login process
   * @param {Object} userData - User data to save
   * @param {string} token - Authentication token
   */
  function handleLogin(userData, token) {
    // Save authentication data
    if (token) {
      localStorage.setItem('token', token);
    }
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }

    // Check for redirect URL or default to home
    const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/HTML/index.html';
    localStorage.removeItem('redirectAfterLogin'); // Clear after use
    
    // Prevent unnecessary redirects if already on the intended page
    const currentPath = window.location.pathname;
    if (redirectUrl.endsWith('index.html') && currentPath.endsWith('index.html')) {
      // Already on index page, just refresh the UI
      checkAuthStatus();
    } else {
      // Redirect to the intended page
      console.log('Login successful, redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
    }
  }

  /**
   * Handles user logout process
   */
  function handleLogout() {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('enhanced_user_data');  // Also clear enhanced user data
    
    console.log('Logout successful, redirecting to login page');
    
    // If on the Profile page, need to redirect away
    if (window.location.pathname.includes('/HTML/Profile.html')) {
      window.location.href = '/HTML/index.html';  // Use index.html as the login page
    } else {
      // Otherwise just refresh UI without redirect
      checkAuthStatus();
      // Reload the page to ensure all auth-dependent content is reset
      window.location.reload();
    }
  }

  /**
   * Set authentication token
   * @param {string} token - The authentication token
   */
  function setAuthToken(token) {
    localStorage.setItem('token', token);
    checkAuthStatus();
  }

  /**
   * Check if user is authenticated 
   * This function is specifically designed for protected pages like profile
   * @returns {boolean} - True if authenticated, false otherwise
   */
  window.checkAuthentication = function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('Authentication required: Redirecting to login page');
      
      // Store the current URL to redirect back after login
      const currentPage = window.location.pathname;
      if (currentPage.includes('/HTML/Profile.html')) {
        localStorage.setItem('redirectAfterLogin', currentPage);
      }
      
      // Redirect to login page
      window.location.href = '/HTML/index.html';
      return false;
    }
    
    return true;
  }

  /**
   * Get the authentication token from localStorage
   * @returns {string} - The authentication token or empty string if not found
   */
  function getAuthToken() {
    return localStorage.getItem('token') || '';
  }

  // Export functions for global access
  window.CustomXAuth = {
    checkAuthStatus: checkAuthStatus,
    handleLogin: handleLogin,
    handleLogout: handleLogout,
    setAuthToken: setAuthToken,
    checkAuthentication: window.checkAuthentication,
    parseJwtPayload: parseJwtPayload,
    safeBase64Decode: safeBase64Decode,
    getAuthToken: getAuthToken
  };
})(); 