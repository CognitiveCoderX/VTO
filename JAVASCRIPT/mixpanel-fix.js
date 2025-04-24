/**
 * Mixpanel CORS Fix
 * 
 * This script fixes CORS issues with Mixpanel by intercepting XMLHttpRequest
 * calls to Mixpanel's API and ensuring they don't include credentials.
 * 
 * Error being fixed:
 * "Access to XMLHttpRequest at 'https://api-js.mixpanel.com/engage/' from origin 'http://localhost:3000' 
 * has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response 
 * must not be the wildcard '*' when the request's credentials mode is 'include'."
 */

(function() {
  // Store the original XMLHttpRequest open method
  const originalOpen = XMLHttpRequest.prototype.open;
  
  // Override the open method to intercept Mixpanel API calls
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // Call the original method first
    originalOpen.apply(this, arguments);
    
    // Check if this is a Mixpanel API call
    if (url && typeof url === 'string' && 
        (url.includes('api-js.mixpanel.com') || url.includes('mixpanel.com'))) {
      // Set withCredentials to false for Mixpanel requests to avoid CORS issues
      this.withCredentials = false;
      
      // Log for debugging purposes
      console.debug('Mixpanel CORS fix applied to:', url);
    }
  };
  
  // Also patch fetch requests if they're being used
  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function(resource, options) {
      // If this is a Mixpanel API call
      if (resource && typeof resource === 'string' && 
          (resource.includes('api-js.mixpanel.com') || resource.includes('mixpanel.com'))) {
        // Create new options with credentials set to 'omit'
        options = options || {};
        options.credentials = 'omit';
        
        // Log for debugging purposes
        console.debug('Mixpanel CORS fix applied to fetch:', resource);
      }
      return originalFetch.call(this, resource, options);
    };
  }
  
  console.log('Mixpanel CORS fix applied to both XMLHttpRequest and fetch');
})();