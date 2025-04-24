// Profile state to store user data
const profileState = {
  profile: null,
  orders: [],
  designs: [],
  paymentMethods: [],
  addresses: [],
  activities: []
};

/**
 * Initialize all profile page components and functionality
 */
async function initProfilePage() {
  console.log('Initializing profile page');
  
  // Check if user is authenticated
  const isAuthenticated = CustomXAuth.checkAuthentication();
  if (!isAuthenticated) {
    console.warn('User is not authenticated, redirecting to login');
    window.location.href = '/HTML/index.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }
  
  // Show loading indicator
  showLoadingState();
  
  // Get development mode setting from localStorage or URL parameter
  const isDevelopment = localStorage.getItem('isDevelopmentMode') === 'true' || 
                       new URLSearchParams(window.location.search).get('dev') === 'true';
  
  // Check if we specifically want to use real data even in development
  const forceRealData = localStorage.getItem('useRealData') === 'true';
  
  // Only use mock data if in development mode AND not forcing real data
  if (isDevelopment && !forceRealData) {
    console.log('Running in development mode, loading mock data');
    // Load mock data and update UI
    const mockData = loadMockData();
    Object.assign(profileState, mockData);
    updateProfileUI(profileState.profile);
    hideLoadingState();
    return;
  }
  
  // Fetch profile data from server
  fetchProfileData()
    .then(data => {
      console.log('Profile data fetched successfully:', data);
      // Update properties instead of reassigning the object
      if (data) {
        Object.assign(profileState, data);
      }
      
      // Update the UI with fetched profile data
      updateProfileUI(profileState.profile);
      
      // Cache profile data in localStorage
      try {
        localStorage.setItem('profileData', JSON.stringify(profileState));
        localStorage.setItem('profileDataTimestamp', Date.now());
      } catch (error) {
        console.warn('Could not cache profile data in localStorage:', error);
      }
    })
    .catch(error => {
      console.error('Error fetching profile data:', error);
      
      // Try to load cached data from localStorage if available
      const cachedData = localStorage.getItem('profileData');
      const cachedTimestamp = localStorage.getItem('profileDataTimestamp');
      
      if (cachedData && cachedTimestamp) {
        const cacheAge = Date.now() - parseInt(cachedTimestamp);
        const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxCacheAge) {
          console.log('Using cached profile data');
          const parsedData = JSON.parse(cachedData);
          Object.assign(profileState, parsedData);
          updateProfileUI(profileState.profile);
          showNotification('warning', 'Using cached profile data. Some information may be outdated.');
        } else {
          // Cache is too old, show error and load mock data
          console.log('Cached data is too old, loading mock data instead');
          const mockData = createDefaultProfile();
          Object.assign(profileState, mockData);
          updateProfileUI(profileState.profile);
          showNotification('error', 'Could not connect to server. Using sample data instead.');
        }
      } else {
        // No cached data, load mock data
        console.log('No cached data found, loading mock data instead');
        const mockData = createDefaultProfile();
        Object.assign(profileState, mockData);
        updateProfileUI(profileState.profile);
        showNotification('error', 'Could not connect to server. Using sample data instead.');
      }
    })
    .finally(() => {
      // Hide loading indicator
      hideLoadingState();
      
      // Initialize event listeners for the profile page
      initProfileEventListeners();
    });
}

/**
 * Initialize event listeners for profile page
 */
function initProfileEventListeners() {
  console.log('Initializing profile page event listeners');
  
  // Initialize navigation and form handling
  initNavigation();
  initForms();
  initActionButtons();
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      CustomXAuth.handleLogout();
    });
  }
  
  // Refresh dashboard button
  const refreshDashboardBtn = document.getElementById('refresh-dashboard');
  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener('click', async () => {
      showLoadingState();
      try {
        const data = await fetchProfileData();
        updateProfileUI(data);
        showSuccessMessage('Profile data refreshed successfully');
      } catch (error) {
        showErrorMessage('Failed to refresh profile data');
      } finally {
        hideLoadingState();
      }
    });
  }
}

/**
 * Show a notification message to the user
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {string} message - Message to display
 */
function showNotification(type, message) {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    console.error('Notification container not found');
    return;
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  notification.innerHTML = `
    <div class="notification-icon"></div>
    <div class="notification-message">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  
  notificationContainer.appendChild(notification);
  
  // Add event listener to close button
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * Show loading state
 */
function showLoadingState() {
  // Show skeletons, hide content
  document.querySelectorAll('.skeleton').forEach(skeleton => {
    skeleton.classList.remove('hidden');
  });
  
  // Hide actual content elements
  document.querySelectorAll('#profile-username, #profile-email, #profile-avatar, #profile-stats').forEach(element => {
    if (element) element.classList.add('hidden');
  });
  
  // Hide any error or empty states
  document.querySelectorAll('.empty-state').forEach(element => {
    element.classList.add('hidden');
  });
  
  console.log('Loading state activated: showing skeletons');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
  // Hide skeleton elements
  document.querySelectorAll('.skeleton').forEach(skeleton => {
    skeleton.classList.add('hidden');
  });
  
  console.log('Loading state deactivated: hiding skeletons');
}

/**
 * Get decoded token information
 * @returns {Object} User information from the token
 */
function getTokenInfo() {
  try {
    const token = localStorage.getItem('token');
    if (!token || !token.includes('.')) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = CustomXAuth.parseJwtPayload(parts[1]);
    return payload;
  } catch (error) {
    console.warn('Failed to decode token:', error);
    return null;
  }
}

/**
 * Fetch profile data from API or use mock data
 * @returns {Promise<Object>} Promise resolving to profile data
 */
async function fetchProfileData() {
  console.log('Fetching profile data...');
  
  // Set a development flag for easier debugging
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
  
  // Check if we specifically want to use real data even in development
  const forceRealData = localStorage.getItem('useRealData') === 'true';
  if (forceRealData) {
    console.log('Force using real data even in development mode');
  }
  
  // Get auth token and extract user ID
  const token = localStorage.getItem('token'); // Changed from 'authToken' to 'token'
  
  // Initialize variables for tracking API errors
  let shouldUseMockData = false;
  let apiErrorCount = 0;
  let userId = null;
  
  // Safe extraction of user ID from token
  try {
    if (!token) {
      console.warn('No auth token found, using mock data');
      shouldUseMockData = true;
    } else {
      // Use CustomXAuth if available, otherwise use local function
      const payload = window.CustomXAuth && typeof window.CustomXAuth.parseJwtPayload === 'function' 
        ? window.CustomXAuth.parseJwtPayload(token) 
        : parseJwtPayload(token);
      
      if (!payload) {
        console.warn('Failed to parse JWT payload, using mock data');
        shouldUseMockData = true;
      } else {
        userId = payload.sub || payload.userId || null;
        if (!userId) {
          console.warn('No user ID found in token, using mock data');
          shouldUseMockData = true;
        } else {
          console.log(`User ID extracted from token: ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    shouldUseMockData = true;
  }
  
  // Fallback local function in case CustomXAuth is not available
  function parseJwtPayload(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token locally:', error);
      return {};
    }
  }
  
  // Use mock data if necessary, but respect forceRealData flag
  if ((shouldUseMockData || isDevelopment) && !forceRealData) {
    console.log('Using mock profile data');
    return getMockProfileData();
  }
  
  // Setup API endpoints
  const baseUrl = '/api/user';
  
  // Create endpoints with correct paths - no need for userId in path
  const profileEndpoint = `${baseUrl}/profile`;
  const ordersEndpoint = `${baseUrl}/orders`;
  const designsEndpoint = `${baseUrl}/designs`;
  const paymentMethodsEndpoint = `${baseUrl}/payment-methods`;
  const addressesEndpoint = `${baseUrl}/addresses`;
  const activitiesEndpoint = `${baseUrl}/activities`;
  
  console.log(`Making API requests to endpoints:
  - Profile: ${profileEndpoint}
  - Orders: ${ordersEndpoint}
  - Designs: ${designsEndpoint}
  - Payment: ${paymentMethodsEndpoint}
  - Addresses: ${addressesEndpoint}
  - Activities: ${activitiesEndpoint}`);
  
  // Prepare fetch options with auth header
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // Fetch all profile data
  try {
    // Profile data
    const profileResponse = await fetch(profileEndpoint, fetchOptions);
    if (!profileResponse.ok) {
      console.error(`Profile fetch failed: ${profileResponse.status} ${profileResponse.statusText}`);
      apiErrorCount++;
      // For 404 errors, we should use mock data as the endpoint likely doesn't exist
      if (profileResponse.status === 404) {
        shouldUseMockData = true;
      }
    }
    
    // Orders data
    const ordersResponse = await fetch(ordersEndpoint, fetchOptions);
    if (!ordersResponse.ok) {
      console.error(`Orders fetch failed: ${ordersResponse.status} ${ordersResponse.statusText}`);
      apiErrorCount++;
      if (ordersResponse.status === 404) {
        shouldUseMockData = true;
      }
    }
    
    // Designs data
    const designsResponse = await fetch(designsEndpoint, fetchOptions);
    if (!designsResponse.ok) {
      console.error(`Designs fetch failed: ${designsResponse.status} ${designsResponse.statusText}`);
      apiErrorCount++;
      if (designsResponse.status === 404) {
        shouldUseMockData = true;
      }
    }
    
    // Payment methods data
    const paymentMethodsResponse = await fetch(paymentMethodsEndpoint, fetchOptions);
    if (!paymentMethodsResponse.ok) {
      console.error(`Payment methods fetch failed: ${paymentMethodsResponse.status} ${paymentMethodsResponse.statusText}`);
      apiErrorCount++;
      if (paymentMethodsResponse.status === 404) {
        shouldUseMockData = true;
      }
    }
    
    // Addresses data
    const addressesResponse = await fetch(addressesEndpoint, fetchOptions);
    if (!addressesResponse.ok) {
      console.error(`Addresses fetch failed: ${addressesResponse.status} ${addressesResponse.statusText}`);
      apiErrorCount++;
      if (addressesResponse.status === 404) {
        shouldUseMockData = true;
      }
    }
    
    // Activities data
    const activitiesResponse = await fetch(activitiesEndpoint, fetchOptions);
    if (!activitiesResponse.ok) {
      console.error(`Activities fetch failed: ${activitiesResponse.status} ${activitiesResponse.statusText}`);
      apiErrorCount++;
      if (activitiesResponse.status === 404) {
        shouldUseMockData = true;
      }
    }
    
    // If too many API errors or we should use mock data, fall back to mock data
    if (apiErrorCount >= 3 || shouldUseMockData) {
      console.warn(`Multiple API errors (${apiErrorCount}), falling back to mock data`);
      return getMockProfileData();
    }
    
    // Parse all responses
    const profileData = profileResponse.ok ? await profileResponse.json() : {};
    const ordersData = ordersResponse.ok ? await ordersResponse.json() : [];
    const designsData = designsResponse.ok ? await designsResponse.json() : [];
    const paymentMethodsData = paymentMethodsResponse.ok ? await paymentMethodsResponse.json() : [];
    const addressesData = addressesResponse.ok ? await addressesResponse.json() : [];
    const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : [];
    
    // Return combined data
    return {
      profile: profileData,
      orders: ordersData,
      designs: designsData,
      paymentMethods: paymentMethodsData,
      addresses: addressesData,
      activities: activitiesData
    };
    
  } catch (error) {
    console.error('Error fetching profile data:', error);
    
    // Store error in analytics if available
    if (window.CustomXAnalytics && typeof window.CustomXAnalytics.trackError === 'function') {
      window.CustomXAnalytics.trackError('profile_data_fetch_error', {
        message: error.message,
        stack: error.stack
      });
    }
    
    // Show error notification to user
    displayNotification('Error loading profile data. Please try again later.', 'error');
    
    // Return mock data
    return getMockProfileData();
  }
}

/**
 * Create a default profile from token or with fallback values
 */
function createDefaultProfileFromToken() {
  // Extract information from token if possible
  const tokenInfo = getTokenInfo();
  console.log('Token info for profile:', tokenInfo);
  
  // First try to get enhanced user data from localStorage (highest priority)
  let enhancedUserData = null;
  try {
    const enhancedUserStr = localStorage.getItem('enhanced_user_data');
    if (enhancedUserStr) {
      enhancedUserData = JSON.parse(enhancedUserStr);
      console.log('Enhanced user data found:', enhancedUserData);
    }
  } catch (error) {
    console.warn('Error parsing enhanced user data:', error);
  }
  
  // Get email from any available source for username formatting if needed
  const emailToUse = enhancedUserData?.email || tokenInfo?.email || null;
  
  // Determine the best username to use - avoid "mockuser" by formatting from email
  let usernameToUse = 'User';
  
  // Check enhanced user data first
  if (enhancedUserData?.username && enhancedUserData.username !== 'mockuser') {
    usernameToUse = enhancedUserData.username;
  } 
  // If enhanced username is mockuser but we have email, format from email
  else if (enhancedUserData?.username === 'mockuser' && emailToUse) {
    usernameToUse = formatUsername(emailToUse);
    console.log('Replacing "mockuser" with formatted email username:', usernameToUse);
  }
  // Check token data if no good enhanced username
  else if (tokenInfo?.preferred_username && tokenInfo.preferred_username !== 'mockuser') {
    usernameToUse = tokenInfo.preferred_username;
  }
  else if (tokenInfo?.username && tokenInfo.username !== 'mockuser') {
    usernameToUse = tokenInfo.username;
  }
  else if (tokenInfo?.name) {
    usernameToUse = tokenInfo.name;
  }
  // Last resort: format from email if we have it
  else if (emailToUse) {
    usernameToUse = formatUsername(emailToUse);
  }
  
  // Use enhanced data, token data, or default values - in order of priority
  profileState.profile = {
    username: usernameToUse,
    email: enhancedUserData?.email || tokenInfo?.email || 'user@example.com',
    fullName: tokenInfo?.name || '',
    avatarUrl: null,
    wishlistCount: 0,
    preferences: {
      notifications: true,
      marketing: true
    },
    // Store additional metadata
    lastLogin: enhancedUserData?.lastLogin || new Date().toISOString()
  };
  
  // Attempt to get any user data from localStorage for supplementing token data
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData && typeof userData === 'object') {
        console.log('User data from localStorage:', userData);
        
        // Don't accept "mockuser" from localStorage either
        const userName = userData.username;
        const shouldReplaceUsername = !userName || userName === 'mockuser';
        
        // Merge with our default profile
        profileState.profile = {
          ...profileState.profile,
          ...userData,
          // Keep our enhanced username, don't accept "mockuser"
          username: shouldReplaceUsername ? usernameToUse : userName,
          // Ensure preferences object exists
          preferences: {
            ...profileState.profile.preferences,
            ...(userData.preferences || {})
          }
        };
      }
    }
  } catch (localStorageError) {
    console.warn('Error reading user data from localStorage:', localStorageError);
  }
  
  // Also check customxshop_user_data for any additional user preferences
  try {
    const customDataStr = localStorage.getItem('customxshop_user_data');
    if (customDataStr) {
      const customData = JSON.parse(customDataStr);
      if (customData && typeof customData === 'object') {
        console.log('Custom shop user data found:', customData);
        
        // Merge preferences
        if (customData.preferences) {
          profileState.profile.preferences = {
            ...profileState.profile.preferences,
            ...customData.preferences
          };
        }
      }
    }
  } catch (error) {
    console.warn('Error reading custom user data:', error);
  }
  
  // Final check: if username is still mockuser, format it from email if possible
  if (profileState.profile.username === 'mockuser' && profileState.profile.email) {
    profileState.profile.username = formatUsername(profileState.profile.email);
    console.log('Final mockuser check - replaced with formatted email username:', profileState.profile.username);
  }
  
  // Log the final profile data
  console.log('Profile data being used:', profileState.profile);
}

/**
 * Format a username from an email address
 * Makes it more user-friendly by capitalizing and formatting
 */
function formatUsername(email) {
  if (!email || !email.includes('@')) return null;
  
  const namePart = email.split('@')[0];
  
  // Format username to be more user-friendly
  // Capitalize first letter, replace dots and underscores with spaces
  let formattedName = namePart
    .replace(/[._]/g, ' ')  // Replace dots and underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
    
  return formattedName;
}

/**
 * Create a minimal default profile
 */
function createDefaultProfile() {
  // Create default profile data
  profileState.profile = {
    username: 'User',
    email: 'user@example.com',
    fullName: '',
    avatarUrl: null,
    wishlistCount: 0,
    preferences: {
      notifications: true,
      marketing: true
    }
  };
  
  // Set empty arrays for all collections
  profileState.orders = [];
  profileState.designs = [];
  profileState.paymentMethods = [];
  profileState.addresses = [];
  
  // Add a default activity
  profileState.activities = [{
    type: 'login',
    description: 'First time login to your account',
    timestamp: new Date().toISOString()
  }];
}

/**
 * Update the profile UI with fetched data
 * @param {Object} data - The profile data object or full state object
 */
function updateProfileUI(data) {
  console.log('Updating profile UI with data:', data);
  
  // Hide any loading skeletons
  document.querySelectorAll('.skeleton').forEach(element => {
    element.classList.add('hidden');
  });
  
  // First, remove the hidden class from all profile containers
  document.querySelectorAll('#profile-avatar, .profile-header-info, #profile-stats').forEach(element => {
    element.classList.remove('hidden');
    // Direct style property change to override any CSS issues
    element.style.display = 'flex';
  });
  
  // Determine if we're getting just profile data or the full state object
  const profileData = data.profile ? data.profile : data;
  
  // Update username in profile header - force unhide the elements
  const profileUsername = document.getElementById('profile-username');
  const profileEmail = document.getElementById('profile-email');
  const avatarImg = document.getElementById('profile-avatar');
  
  // Log exactly what data we're working with for troubleshooting
  console.log('Profile display data:', {
    usernameElement: profileUsername ? true : false,
    emailElement: profileEmail ? true : false,
    username: profileData.username,
    email: profileData.email,
    fullName: profileData.fullName
  });
  
  if (profileUsername) {
    profileUsername.classList.remove('hidden');
    profileUsername.style.display = 'block';
    
    // Enhanced username selection logic
    // 1. Use username from database if available and not "User"
    // 2. If not available, try to extract from email
    // 3. Fall back to empty string to avoid showing "User"
    const usernameFromDB = profileData.username && profileData.username !== 'User' 
      ? profileData.username 
      : null;
    
    const usernameFromEmail = profileData.email && profileData.email.includes('@')
      ? profileData.email.split('@')[0]
      : null;
    
    // Final username selection with clear prioritization
    const displayName = usernameFromDB || usernameFromEmail || '';
    
    console.log('Username display selection:', {
      usernameFromDB,
      usernameFromEmail,
      finalDisplayName: displayName
    });
    
    profileUsername.textContent = displayName;
  }
  
  if (profileEmail) {
    profileEmail.classList.remove('hidden');
    profileEmail.style.display = 'block';
    profileEmail.textContent = profileData.email || 'No email provided';
  }
  
  if (avatarImg) {
    avatarImg.classList.remove('hidden');
    avatarImg.style.display = 'flex';
  }
  
  // Get the full state object for secondary data
  const stateData = data.profile ? data : profileState;
  
  // Update dashboard counters with zeros for empty collections
  const ordersCount = document.getElementById('dashboard-orders');
  const designsCount = document.getElementById('dashboard-designs');
  const wishlistCount = document.getElementById('dashboard-wishlist');
  
  if (ordersCount) ordersCount.textContent = '0';  // Always display 0 as requested
  if (designsCount) designsCount.textContent = '0'; // Always display 0 as requested
  if (wishlistCount) wishlistCount.textContent = '0'; // Always display 0 as requested
  
  // Update profile stats section
  const orderStatCount = document.getElementById('orders-count');
  const designStatCount = document.getElementById('designs-count');
  
  if (orderStatCount) orderStatCount.textContent = '0';  // Always display 0 as requested
  if (designStatCount) designStatCount.textContent = '0'; // Always display 0 as requested
  
  // Show profile stats section
  const profileStats = document.getElementById('profile-stats');
  if (profileStats) profileStats.classList.remove('hidden');
  
  // Update individual sections - only call if relevant containers exist
  updateProfileInfo(profileData);
  
  // Update sections but only use the right container IDs
  // For orders, use orders-table-body instead of orders-list
  updateOrdersTableBody(stateData.orders || []);
  
  // Update designs grid to show empty state
  updateDesignsGrid();
  
  // Skip sections that don't have containers to avoid console errors
  // We'll just show empty states where needed
  showEmptyStates();
  
  // Initialize navigation
  initNavigation();
  
  // Show success message if redirected from another page
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success')) {
    showSuccessMessage('Profile updated successfully');
  }
}

/**
 * Shows empty states for sections without data
 */
function showEmptyStates() {
  // Show empty state for orders
  const ordersEmptyState = document.getElementById('orders-empty-state');
  if (ordersEmptyState) {
    ordersEmptyState.classList.remove('hidden');
  }
  
  // Show empty state for designs
  const designsEmptyState = document.getElementById('designs-empty-state');
  if (designsEmptyState) {
    designsEmptyState.classList.remove('hidden');
  }
  
  // Show empty state for payment methods
  const paymentMethodsEmptyState = document.getElementById('payment-methods-empty-state');
  if (paymentMethodsEmptyState) {
    paymentMethodsEmptyState.classList.remove('hidden');
  }
  
  // Show empty state for addresses
  const addressesEmptyState = document.getElementById('addresses-empty-state');
  if (addressesEmptyState) {
    addressesEmptyState.classList.remove('hidden');
  }
  
  // Show empty state for activity
  const activityEmptyState = document.getElementById('activity-empty-state');
  if (activityEmptyState) {
    activityEmptyState.classList.remove('hidden');
  }
}

/**
 * Update the orders table body in the UI
 * @param {Array} orders - The list of user orders
 */
function updateOrdersTableBody(orders) {
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) {
    console.warn('Orders table body not found in DOM');
    return;
  }
  
  // Clear existing content
  tableBody.innerHTML = '';
  
  // Always show empty table with "No orders found" message
  // Ignore any mock/fake orders passed in
  tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No orders found</td></tr>';
}

/**
 * Initialize profile tabs functionality
 */
function initProfileTabs() {
  // Updated selectors to match the actual HTML structure
  const tabButtons = document.querySelectorAll('.profile-nav a[data-section]');
  const tabContents = document.querySelectorAll('.profile-section');
  
  if (!tabButtons.length || !tabContents.length) {
    console.warn('Profile tabs elements not found');
    return;
  }
  
  // Set default active tab if none is active
  if (!document.querySelector('.profile-nav a.active')) {
    tabButtons[0]?.classList.add('active');
    const defaultTabId = tabButtons[0]?.getAttribute('data-section');
    document.getElementById(defaultTabId)?.classList.add('active');
  }
  
  // Add click handlers to tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      
      const sectionId = button.getAttribute('data-section');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding section
      button.classList.add('active');
      document.getElementById(sectionId)?.classList.add('active');
      
      // Update URL hash to maintain tab on page refresh
      window.location.hash = sectionId;
    });
  });
  
  // Check for hash in URL to open specific tab
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tabButton = document.querySelector(`.profile-nav a[data-section="${hash}"]`);
    if (tabButton) {
      tabButton.click();
    }
  }
}

/**
 * Update profile statistics based on current profile state
 */
function updateProfileStats() {
  // Get stat elements
  const orderCountElem = document.getElementById('orders-count');
  const designCountElem = document.getElementById('designs-count');
  const addressCountElem = document.getElementById('addresses-count');
  const paymentMethodCountElem = document.getElementById('payment-methods-count');
  
  // Update stat counts
  if (orderCountElem) {
    orderCountElem.textContent = profileState.orders?.length || 0;
  }
  
  if (designCountElem) {
    designCountElem.textContent = profileState.designs?.length || 0;
  }
  
  if (addressCountElem) {
    addressCountElem.textContent = profileState.addresses?.length || 0;
  }
  
  if (paymentMethodCountElem) {
    paymentMethodCountElem.textContent = profileState.paymentMethods?.length || 0;
  }
}

/**
 * Update the designs list in the UI
 * @param {Array} designs - The list of user designs
 */
function updateDesignsList(designs) {
  const designsContainer = document.getElementById('designs-list');
  if (!designsContainer) {
    console.warn('Designs container not found in DOM');
    return;
  }
  
  // Clear existing content
  designsContainer.innerHTML = '';
  
  if (!designs || designs.length === 0) {
    designsContainer.innerHTML = '<div class="empty-state">You have no saved designs yet.</div>';
    return;
  }
  
  // Sort designs by date (newest first)
  const sortedDesigns = [...designs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Create design cards
  sortedDesigns.forEach(design => {
    const designCard = document.createElement('div');
    designCard.className = 'design-card';
    
    designCard.innerHTML = `
      <div class="design-thumbnail">
        <img src="${design.thumbnailUrl || '/assets/images/design-placeholder.png'}" alt="${design.name || 'Design'}">
      </div>
      <div class="design-info">
        <div class="design-name">${design.name || 'Untitled Design'}</div>
        <div class="design-date">Created ${formatDate(design.createdAt)}</div>
      </div>
      <div class="design-actions">
        <button class="design-edit-btn" data-design-id="${design.id}">Edit</button>
        <button class="design-delete-btn" data-design-id="${design.id}">Delete</button>
      </div>
    `;
    
    designsContainer.appendChild(designCard);
  });
  
  // Add event listeners to design buttons
  const designEditBtns = document.querySelectorAll('.design-edit-btn');
  designEditBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const designId = btn.getAttribute('data-design-id');
      window.location.href = `/designer.html?design=${designId}`;
    });
  });
  
  const designDeleteBtns = document.querySelectorAll('.design-delete-btn');
  designDeleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const designId = btn.getAttribute('data-design-id');
      confirmDeleteDesign(designId);
    });
  });
}

/**
 * Update the payment methods list in the UI
 * @param {Array} paymentMethods - List of user payment methods
 */
function updatePaymentMethodsList(paymentMethods) {
  const paymentMethodsContainer = document.getElementById('payment-methods-list');
  if (!paymentMethodsContainer) {
    console.warn('Payment methods container not found in DOM');
    return;
  }
  
  // Clear existing content
  paymentMethodsContainer.innerHTML = '';
  
  // Handle empty state
  if (!paymentMethods || paymentMethods.length === 0) {
    paymentMethodsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-credit-card"></i>
        </div>
        <h3>No Payment Methods</h3>
        <p>You haven't added any payment methods yet.</p>
        <button class="btn btn-primary" id="add-payment-method-btn">Add Payment Method</button>
      </div>
    `;
    
    // Add event listener for adding new payment method
    const addPaymentBtn = document.getElementById('add-payment-method-btn');
    if (addPaymentBtn) {
      addPaymentBtn.addEventListener('click', openAddPaymentMethodModal);
    }
    
    return;
  }
  
  // Create payment method cards
  paymentMethods.forEach(method => {
    const methodCard = document.createElement('div');
    methodCard.className = 'payment-method-card';
    
    // Determine card type icon
    let cardIcon = 'fa-credit-card';
    if (method.type.toLowerCase().includes('visa')) {
      cardIcon = 'fa-cc-visa';
    } else if (method.type.toLowerCase().includes('mastercard')) {
      cardIcon = 'fa-cc-mastercard';
    } else if (method.type.toLowerCase().includes('amex')) {
      cardIcon = 'fa-cc-amex';
    } else if (method.type.toLowerCase().includes('discover')) {
      cardIcon = 'fa-cc-discover';
    } else if (method.type.toLowerCase().includes('paypal')) {
      cardIcon = 'fa-paypal';
    }
    
    // Mask card number for security - show only last 4 digits
    const maskedNumber = method.cardNumber ? 
      '••••••••••••' + method.cardNumber.substring(method.cardNumber.length - 4) : 
      'Ending in ' + (method.lastFour || '****');
    
    methodCard.innerHTML = `
      <div class="payment-icon">
        <i class="fab ${cardIcon}"></i>
      </div>
      <div class="payment-info">
        <h3>${method.type}</h3>
        <p>${maskedNumber}</p>
        <p>Expires: ${method.expiryMonth || 'MM'}/${method.expiryYear || 'YY'}</p>
        ${method.isDefault ? '<span class="default-badge">Default</span>' : ''}
      </div>
      <div class="payment-actions">
        <button class="btn btn-sm btn-icon edit-payment" data-payment-id="${method.id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-icon delete-payment" data-payment-id="${method.id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
        ${!method.isDefault ? 
          `<button class="btn btn-sm btn-icon set-default-payment" data-payment-id="${method.id}" title="Set as Default">
            <i class="fas fa-star"></i>
          </button>` : ''}
      </div>
    `;
    
    // Add event listeners for buttons
    methodCard.querySelector('.edit-payment').addEventListener('click', () => {
      openEditPaymentMethodModal(method.id);
    });
    
    methodCard.querySelector('.delete-payment').addEventListener('click', () => {
      openDeletePaymentMethodModal(method.id);
    });
    
    const setDefaultBtn = methodCard.querySelector('.set-default-payment');
    if (setDefaultBtn) {
      setDefaultBtn.addEventListener('click', () => {
        setDefaultPaymentMethod(method.id);
      });
    }
    
    paymentMethodsContainer.appendChild(methodCard);
  });
  
  // Add button to add new payment method
  const addNewBtn = document.createElement('div');
  addNewBtn.className = 'add-new-card';
  addNewBtn.innerHTML = `
    <button class="btn btn-outline" id="add-payment-method-btn">
      <i class="fas fa-plus"></i> Add New Payment Method
    </button>
  `;
  
  addNewBtn.querySelector('#add-payment-method-btn').addEventListener('click', openAddPaymentMethodModal);
  paymentMethodsContainer.appendChild(addNewBtn);
}

/**
 * Update the addresses list in the UI
 * @param {Array} addresses - List of user addresses
 */
function updateAddressesList(addresses) {
  const addressesContainer = document.getElementById('addresses-list');
  if (!addressesContainer) {
    console.warn('Addresses container not found in DOM');
    return;
  }
  
  // Clear existing content
  addressesContainer.innerHTML = '';
  
  // Handle empty state
  if (!addresses || addresses.length === 0) {
    addressesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-map-marker-alt"></i>
        </div>
        <h3>No Addresses</h3>
        <p>You haven't added any addresses yet.</p>
        <button class="btn btn-primary" id="add-address-btn">Add Address</button>
      </div>
    `;
    
    // Add event listener for adding new address
    const addAddressBtn = document.getElementById('add-address-btn');
    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', openAddAddressModal);
    }
    
    return;
  }
  
  // Create address cards
  addresses.forEach(address => {
    const addressCard = document.createElement('div');
    addressCard.className = 'address-card';
    
    // Format full address
    const fullAddress = [
      address.street,
      address.street2 ? address.street2 : '',
      `${address.city}, ${address.state} ${address.zip}`,
      address.country
    ].filter(Boolean).join('<br>');
    
    addressCard.innerHTML = `
      <div class="address-type">
        <i class="fas fa-${address.type === 'shipping' ? 'shipping-fast' : 'home'}"></i>
        <span>${capitalizeFirstLetter(address.type || 'Address')}</span>
        ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
      </div>
      <div class="address-info">
        <h3>${address.name}</h3>
        <div class="address-details">
          ${fullAddress}
        </div>
        <p class="address-phone">${address.phone || 'No phone provided'}</p>
      </div>
      <div class="address-actions">
        <button class="btn btn-sm btn-icon edit-address" data-address-id="${address.id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-icon delete-address" data-address-id="${address.id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
        ${!address.isDefault ? 
          `<button class="btn btn-sm btn-icon set-default-address" data-address-id="${address.id}" title="Set as Default">
            <i class="fas fa-star"></i>
          </button>` : ''}
      </div>
    `;
    
    // Add event listeners for buttons
    addressCard.querySelector('.edit-address').addEventListener('click', () => {
      openEditAddressModal(address.id);
    });
    
    addressCard.querySelector('.delete-address').addEventListener('click', () => {
      openDeleteAddressModal(address.id);
    });
    
    const setDefaultBtn = addressCard.querySelector('.set-default-address');
    if (setDefaultBtn) {
      setDefaultBtn.addEventListener('click', () => {
        setDefaultAddress(address.id);
      });
    }
    
    addressesContainer.appendChild(addressCard);
  });
  
  // Add button to add new address
  const addNewBtn = document.createElement('div');
  addNewBtn.className = 'add-new-card';
  addNewBtn.innerHTML = `
    <button class="btn btn-outline" id="add-address-btn">
      <i class="fas fa-plus"></i> Add New Address
    </button>
  `;
  
  addNewBtn.querySelector('#add-address-btn').addEventListener('click', openAddAddressModal);
  addressesContainer.appendChild(addNewBtn);
}

/**
 * Update the activity list in the UI
 * @param {Array} activities - List of user recent activities
 */
function updateActivityList(activities) {
  const activityContainer = document.getElementById('activity-list');
  if (!activityContainer) {
    console.warn('Activity container not found in DOM');
    return;
  }
  
  // Clear existing content
  activityContainer.innerHTML = '';
  
  // Handle empty state
  if (!activities || activities.length === 0) {
    activityContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-history"></i>
        </div>
        <h3>No Recent Activity</h3>
        <p>Your recent activity will appear here.</p>
      </div>
    `;
    return;
  }
  
  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Create activity timeline
  const timeline = document.createElement('div');
  timeline.className = 'activity-timeline';
  
  sortedActivities.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    // Determine icon based on activity type
    let icon = 'fa-bell';
    let activityClass = '';
    
    switch (activity.type.toLowerCase()) {
      case 'order':
        icon = 'fa-shopping-bag';
        activityClass = 'activity-order';
        break;
      case 'login':
        icon = 'fa-sign-in-alt';
        activityClass = 'activity-login';
        break;
      case 'design':
        icon = 'fa-palette';
        activityClass = 'activity-design';
        break;
      case 'account':
        icon = 'fa-user-edit';
        activityClass = 'activity-account';
        break;
      case 'payment':
        icon = 'fa-credit-card';
        activityClass = 'activity-payment';
        break;
    }
    
    // Format date/time
    const activityDate = new Date(activity.timestamp);
    const formattedDate = formatDate(activityDate);
    const formattedTime = activityDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    activityItem.innerHTML = `
      <div class="activity-icon ${activityClass}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-header">
          <h4>${activity.title}</h4>
          <span class="activity-time">${formattedDate} at ${formattedTime}</span>
        </div>
        <p>${activity.description}</p>
        ${activity.link ? `<a href="${activity.link}" class="activity-link">View Details</a>` : ''}
      </div>
    `;
    
    timeline.appendChild(activityItem);
  });
  
  activityContainer.appendChild(timeline);
}

/**
 * Helper function to format dates
 * @param {Date} date - The date to format
 * @return {String} Formatted date string
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Invalid date';
  }
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

/**
 * Helper function to format price
 * @param {Number} price - The price to format
 * @return {String} Formatted price
 */
function formatPrice(price) {
  return '$' + (parseFloat(price) || 0).toFixed(2);
}

/**
 * Helper function to capitalize the first letter of a string
 * @param {String} str - The string to capitalize
 * @return {String} Capitalized string
 */
function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Modal Functions for Payment Methods and Addresses
// These are placeholder functions that would be implemented with actual modal UI

function openAddPaymentMethodModal() {
  console.log('Opening add payment method modal');
  // Implementation would go here
}

function openEditPaymentMethodModal(paymentId) {
  console.log('Opening edit payment method modal for ID:', paymentId);
  // Implementation would go here
}

function openDeletePaymentMethodModal(paymentId) {
  console.log('Opening delete payment method modal for ID:', paymentId);
  // Implementation would go here
}

function setDefaultPaymentMethod(paymentId) {
  console.log('Setting payment method as default, ID:', paymentId);
  // Implementation would go here
}

function openAddAddressModal() {
  console.log('Opening add address modal');
  // Implementation would go here
}

function openEditAddressModal(addressId) {
  console.log('Opening edit address modal for ID:', addressId);
  // Implementation would go here
}

function openDeleteAddressModal(addressId) {
  console.log('Opening delete address modal for ID:', addressId);
  // Implementation would go here
}

function setDefaultAddress(addressId) {
  console.log('Setting address as default, ID:', addressId);
  // Implementation would go here
}

function openOrderDetailsModal(orderId) {
  console.log('Opening order details modal for ID:', orderId);
  // Implementation would go here
}

/**
 * Initialize profile navigation
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.profile-nav a[data-section]');
  const sections = document.querySelectorAll('.profile-section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get the section ID from the link's data attribute
      const sectionId = link.getAttribute('data-section');
      
      // Remove active class from all links and sections
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      // Add active class to clicked link and corresponding section
      link.classList.add('active');
      document.getElementById(sectionId).classList.add('active');
      
      // Update URL hash
      window.location.hash = sectionId;
    });
  });
  
  // Check if there's a hash in the URL on page load
  if (window.location.hash) {
    const sectionId = window.location.hash.substring(1);
    const link = document.querySelector(`.profile-nav a[data-section="${sectionId}"]`);
    
    if (link) {
      link.click();
    }
  }
  
  // Setup logout button in the profile sidebar
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Call global handleLogout function defined in auth.js
      if (typeof handleLogout === 'function') {
        handleLogout();
      } else if (window.handleLogout) {
        window.handleLogout();
      } else {
        // Fallback if function not found
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/Homepage.html';
      }
    });
  }
}

/**
 * Initialize form submission handlers
 */
function initForms() {
  // Personal Info Form
  const personalInfoForm = document.getElementById('personal-info-form');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updatePersonalInfo(personalInfoForm);
    });
    
    const resetPersonalInfoBtn = document.getElementById('reset-personal-info');
    if (resetPersonalInfoBtn) {
      resetPersonalInfoBtn.addEventListener('click', () => {
        updateFormFields(); // Reset to original values
      });
    }
  }
  
  // Account Settings Form
  const accountSettingsForm = document.getElementById('account-settings-form');
  if (accountSettingsForm) {
    accountSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateAccountSettings(accountSettingsForm);
    });
    
    const resetAccountSettingsBtn = document.getElementById('reset-account-settings');
    if (resetAccountSettingsBtn) {
      resetAccountSettingsBtn.addEventListener('click', () => {
        updateFormFields(); // Reset to original values
      });
    }
  }
}

/**
 * Initialize action buttons
 */
function initActionButtons() {
  // Refresh dashboard button
  const refreshDashboardBtn = document.getElementById('refresh-dashboard');
  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener('click', async () => {
      await fetchProfileData();
    });
  }
  
  // Add payment method button
  const addPaymentMethodBtn = document.getElementById('add-payment-method');
  const addPaymentMethodEmptyBtn = document.getElementById('add-payment-method-empty');
  
  if (addPaymentMethodBtn) {
    addPaymentMethodBtn.addEventListener('click', showAddPaymentMethodModal);
  }
  
  if (addPaymentMethodEmptyBtn) {
    addPaymentMethodEmptyBtn.addEventListener('click', showAddPaymentMethodModal);
  }
  
  // Add address button
  const addAddressBtn = document.getElementById('add-address');
  const addAddressEmptyBtn = document.getElementById('add-address-empty');
  
  if (addAddressBtn) {
    addAddressBtn.addEventListener('click', showAddAddressModal);
  }
  
  if (addAddressEmptyBtn) {
    addAddressEmptyBtn.addEventListener('click', showAddAddressModal);
  }
  
  // Delete account button
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', showDeleteAccountConfirmation);
  }
}

/**
 * Show modal for adding payment method
 */
function showAddPaymentMethodModal() {
  showInfoMessage("Add Payment Method feature is coming soon!");
}

/**
 * Show modal for adding address
 */
function showAddAddressModal() {
  showInfoMessage("Add Address feature is coming soon!");
}

/**
 * Show delete account confirmation
 */
function showDeleteAccountConfirmation() {
  showInfoMessage("Account deletion feature is coming soon. Please contact support for assistance.");
}

/**
 * Delete a payment method
 */
function deletePaymentMethod(paymentId) {
  showInfoMessage(`Payment method ${paymentId} will be deleted in the production version.`);
}

/**
 * Delete an address
 */
function deleteAddress(addressId) {
  showInfoMessage(`Address ${addressId} will be deleted in the production version.`);
}

/**
 * Edit an address
 */
function editAddress(addressId) {
  showInfoMessage(`Address ${addressId} will be editable in the production version.`);
}

/**
 * Delete a design
 */
function deleteDesign(designId) {
  showInfoMessage(`Design ${designId} will be deleted in the production version.`);
}

/**
 * Update personal info
 */
async function updatePersonalInfo(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Display success message for demo
  showSuccessMessage("Personal information updated successfully!");
  
  // Update state
  profileState.profile = {
    ...profileState.profile,
    fullName: data.fullName,
    phone: data.phone,
    birthdate: data.birthdate
  };
  
  // Update UI
  updateProfileUI();
}

/**
 * Update account settings
 */
async function updateAccountSettings(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Simple password validation
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    showErrorMessage("New passwords don't match. Please try again.");
    return;
  }
  
  if (data.newPassword && !data.currentPassword) {
    showErrorMessage("Please enter your current password to set a new password.");
    return;
  }
  
  // Display success message for demo
  showSuccessMessage("Account settings updated successfully!");
  
  // Update state
  profileState.profile = {
    ...profileState.profile,
    username: data.username,
    preferences: {
      notifications: !!data.emailNotifications,
      marketing: !!data.marketingEmails
    }
  };
  
  // Update UI
  updateProfileUI();
}

/**
 * Show information message
 */
function showInfoMessage(message) {
  // Create info notification
  const notification = document.createElement('div');
  notification.className = 'notification info';
  notification.innerHTML = `
    <span class="material-icons">info</span>
    <p>${message}</p>
    <button class="close-btn"><span class="material-icons">close</span></button>
  `;
  
  // Add to document body
  document.body.appendChild(notification);
  
  // Show the notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Add close button event listener
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  // Create success notification
  const notification = document.createElement('div');
  notification.className = 'notification success';
  notification.innerHTML = `
    <span class="material-icons">check_circle</span>
    <p>${message}</p>
    <button class="close-btn"><span class="material-icons">close</span></button>
  `;
  
  // Add to document body
  document.body.appendChild(notification);
  
  // Show the notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Add close button event listener
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
  // Create error notification
  const notification = document.createElement('div');
  notification.className = 'notification error';
  notification.innerHTML = `
    <span class="material-icons">error</span>
    <p>${message}</p>
    <button class="close-btn"><span class="material-icons">close</span></button>
  `;
  
  // Add to document body
  document.body.appendChild(notification);
  
  // Show the notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Add close button event listener
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
  
  // Hide loading states and show content
  hideLoadingState();
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;
  
  const notificationId = 'notification-' + Date.now();
  
  const notificationHTML = `
    <div class="notification ${type}" id="${notificationId}">
      <div class="notification-icon">
        ${type === 'info' ? '<i class="fas fa-info-circle"></i>' : 
          type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
          type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : 
          '<i class="fas fa-exclamation-circle"></i>'}
      </div>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="closeNotification('${notificationId}')">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  notificationContainer.innerHTML += notificationHTML;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    closeNotification(notificationId);
  }, 5000);
}

/**
 * Close notification by ID
 */
function closeNotification(notificationId) {
  const notification = document.getElementById(notificationId);
  if (notification) {
    notification.classList.add('notification-closing');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

/**
 * Setup page event listeners
 */
function setupPageEventListeners() {
  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-button');
  if (tabButtons) {
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetTab = e.target.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });
  }
  
  // Profile edit button
  const editProfileBtn = document.getElementById('edit-profile-btn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      toggleProfileEditMode(true);
    });
  }
  
  // Profile save button
  const saveProfileBtn = document.getElementById('save-profile-btn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      saveProfileChanges();
    });
  }
  
  // Profile cancel button
  const cancelProfileBtn = document.getElementById('cancel-profile-btn');
  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', () => {
      toggleProfileEditMode(false);
    });
  }
}

/**
 * Update profile information section with user data
 * @param {Object} profile - The user profile data
 */
function updateProfileInfo(profile) {
  if (!profile) {
    console.error('No profile data provided');
    return;
  }
  
  // Update user info
  // Prioritize actual username or extract from email, avoiding generic "User"
  const userFullName = profile.fullName || 
                      `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 
                      profile.username || 
                      (profile.email ? profile.email.split('@')[0] : '');
  
  const userEmail = profile.email || '';
  const userAvatar = profile.avatarUrl || '/assets/images/default-avatar.png';
  
  // Set profile header information
  const profileNameElem = document.getElementById('profile-username');
  const profileEmailElem = document.getElementById('profile-email');
  const profileAvatarElem = document.getElementById('profile-avatar');
  
  if (profileNameElem) profileNameElem.textContent = userFullName;
  if (profileEmailElem) profileEmailElem.textContent = userEmail;
  if (profileAvatarElem) {
    profileAvatarElem.src = userAvatar;
    profileAvatarElem.alt = userFullName;
  }
  
  // Update profile badges if applicable
  if (profile.memberSince) {
    const memberBadge = document.getElementById('member-since-badge');
    if (memberBadge) {
      const memberDate = new Date(profile.memberSince);
      memberBadge.textContent = `Member since ${memberDate.toLocaleDateString()}`;
      memberBadge.classList.remove('hidden');
    }
  }
  
  if (profile.verifiedAccount) {
    const verifiedBadge = document.getElementById('verified-account-badge');
    if (verifiedBadge) {
      verifiedBadge.classList.remove('hidden');
    }
  }
  
  // Set detailed profile information in form fields
  const profileFormData = {
    'profile-first-name': profile.firstName || '',
    'profile-last-name': profile.lastName || '',
    'profile-email': profile.email || '',
    'profile-phone': profile.phone || '',
    'profile-bio': profile.bio || '',
    'profile-company': profile.company || '',
    'profile-job-title': profile.jobTitle || '',
    'profile-website': profile.website || '',
    'profile-location': profile.location || '',
  };
  
  // Update form fields
  Object.entries(profileFormData).forEach(([elementId, value]) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = value;
    }
  });
  
  // Update profile bio if exists
  const bioElement = document.getElementById('profile-bio-display');
  if (bioElement && profile.bio) {
    bioElement.textContent = profile.bio;
    bioElement.parentElement?.classList.remove('hidden');
  }
  
  // Update profile completion percentage
  updateProfileCompletionStatus(profile);
}

/**
 * Calculate and update profile completion percentage
 * @param {Object} profile - The user profile data
 */
function updateProfileCompletionStatus(profile) {
  const completionFields = [
    'firstName', 'lastName', 'email', 'phone', 
    'bio', 'avatarUrl', 'location', 'company'
  ];
  
  const completedFields = completionFields.filter(field => 
    profile[field] && profile[field].trim && profile[field].trim() !== ''
  );
  
  const completionPercentage = Math.round((completedFields.length / completionFields.length) * 100);
  
  // Update completion percentage display
  const percentElement = document.getElementById('profile-completion-percentage');
  const progressBar = document.getElementById('profile-completion-progress');
  
  if (percentElement) {
    percentElement.textContent = `${completionPercentage}%`;
  }
  
  if (progressBar) {
    progressBar.style.width = `${completionPercentage}%`;
    
    // Change color based on completion level
    if (completionPercentage < 50) {
      progressBar.className = 'progress-bar progress-low';
    } else if (completionPercentage < 80) {
      progressBar.className = 'progress-bar progress-medium';
    } else {
      progressBar.className = 'progress-bar progress-high';
    }
  }
  
  // Show/hide completion tips
  const completionTips = document.getElementById('profile-completion-tips');
  if (completionTips && completionPercentage < 100) {
    completionTips.classList.remove('hidden');
    
    // Generate tips based on missing fields
    const tipsList = completionTips.querySelector('ul');
    if (tipsList) {
      tipsList.innerHTML = '';
      
      if (!profile.avatarUrl) {
        tipsList.innerHTML += '<li>Add a profile picture to help others recognize you</li>';
      }
      if (!profile.firstName || !profile.lastName) {
        tipsList.innerHTML += '<li>Complete your name information</li>';
      }
      if (!profile.phone) {
        tipsList.innerHTML += '<li>Add a phone number for account recovery</li>';
      }
      if (!profile.bio) {
        tipsList.innerHTML += '<li>Tell us a bit about yourself in your bio</li>';
      }
      if (!profile.location) {
        tipsList.innerHTML += '<li>Add your location for better recommendations</li>';
      }
    }
  } else if (completionTips) {
    completionTips.classList.add('hidden');
  }
}

/**
 * Update dashboard metrics based on profile data
 * @param {Object} data - Complete profile data including orders, designs, etc.
 */
function updateDashboardMetrics(data) {
  // Gather metric counts
  const metrics = {
    totalOrders: data.orders?.length || 0,
    totalDesigns: data.designs?.length || 0,
    totalSpent: calculateTotalSpent(data.orders || []),
    savedDesigns: (data.designs || []).filter(design => design.isSaved).length,
    recentActivity: data.activities?.length || 0,
    paymentMethods: data.paymentMethods?.length || 0,
    shippingAddresses: data.addresses?.length || 0
  };
  
  // Calculate additional metrics
  metrics.completedOrders = (data.orders || []).filter(order => order.status === 'completed').length;
  metrics.pendingOrders = (data.orders || []).filter(order => ['processing', 'pending'].includes(order.status)).length;
  
  // Update metric displays
  updateMetricElement('total-orders-count', metrics.totalOrders);
  updateMetricElement('completed-orders-count', metrics.completedOrders);
  updateMetricElement('pending-orders-count', metrics.pendingOrders);
  updateMetricElement('total-designs-count', metrics.totalDesigns);
  updateMetricElement('saved-designs-count', metrics.savedDesigns);
  updateMetricElement('total-spent', formatPrice(metrics.totalSpent));
  updateMetricElement('payment-methods-count', metrics.paymentMethods);
  updateMetricElement('shipping-addresses-count', metrics.shippingAddresses);
  
  // Update order status chart if available
  updateOrderStatusChart(data.orders || []);
  
  // Update recent activity indicator
  const activityIndicator = document.getElementById('recent-activity-indicator');
  if (activityIndicator && metrics.recentActivity > 0) {
    activityIndicator.classList.remove('hidden');
    activityIndicator.textContent = metrics.recentActivity;
  } else if (activityIndicator) {
    activityIndicator.classList.add('hidden');
  }
}

/**
 * Update a metric element with the given value
 * @param {String} elementId - ID of the element to update
 * @param {*} value - Value to set
 */
function updateMetricElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

/**
 * Calculate total spent from orders
 * @param {Array} orders - Array of order objects
 * @returns {Number} - Total amount spent
 */
function calculateTotalSpent(orders) {
  return orders.reduce((total, order) => {
    const orderTotal = parseFloat(order.total || 0);
    return total + (isNaN(orderTotal) ? 0 : orderTotal);
  }, 0);
}

/**
 * Update order status chart if the chart library is available
 * @param {Array} orders - Array of order objects
 */
function updateOrderStatusChart(orders) {
  const chartContainer = document.getElementById('order-status-chart');
  if (!chartContainer || !window.Chart) {
    return;
  }
  
  // Count orders by status
  const statusCounts = {};
  orders.forEach(order => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Prepare chart data
  const statuses = Object.keys(statusCounts);
  const counts = statuses.map(status => statusCounts[status]);
  
  // Status colors
  const statusColors = {
    'completed': '#4CAF50',
    'processing': '#2196F3',
    'pending': '#FFC107',
    'cancelled': '#F44336',
    'refunded': '#9C27B0',
    'unknown': '#9E9E9E'
  };
  
  const colors = statuses.map(status => statusColors[status] || '#9E9E9E');
  
  // Create or update chart
  if (chartContainer._chart) {
    chartContainer._chart.data.labels = statuses;
    chartContainer._chart.data.datasets[0].data = counts;
    chartContainer._chart.data.datasets[0].backgroundColor = colors;
    chartContainer._chart.update();
  } else {
    const ctx = chartContainer.getContext('2d');
    chartContainer._chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: statuses,
        datasets: [{
          data: counts,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            boxWidth: 12
          }
        },
        cutoutPercentage: 70
      }
    });
  }
}

/**
 * Updates the orders section with user orders data
 * @param {Array} orders - Array of user orders
 */
function updateOrdersSection(orders) {
    const ordersContainer = document.getElementById('user-orders-container');
    const emptyOrdersMessage = document.getElementById('empty-orders-message');
    
    if (!orders || orders.length === 0) {
        // Show empty message if no orders
        if (ordersContainer) ordersContainer.style.display = 'none';
        if (emptyOrdersMessage) emptyOrdersMessage.style.display = 'block';
        return;
    }
    
    // Hide empty message and show orders
    if (ordersContainer) ordersContainer.style.display = 'block';
    if (emptyOrdersMessage) emptyOrdersMessage.style.display = 'none';
    
    // Clear existing orders
    ordersContainer.innerHTML = '';
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    // Display up to 5 recent orders
    const ordersToShow = sortedOrders.slice(0, 5);
    
    ordersToShow.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Format date
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Get status class
        const statusClass = getOrderStatusClass(order.status);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">
                    <h4>Order #${order.orderId}</h4>
                    <span class="order-date">${formattedDate}</span>
                </div>
                <div class="order-amount">$${order.totalAmount.toFixed(2)}</div>
            </div>
            <div class="order-details">
                <div class="order-items">
                    <span>${order.items.length} item${order.items.length !== 1 ? 's' : ''}</span>
                    <span class="primary-text view-details" data-order-id="${order.orderId}">View Details</span>
                </div>
                <div class="order-status">
                    <span class="status-badge ${statusClass}">${order.status}</span>
                </div>
            </div>
        `;
        
        ordersContainer.appendChild(orderCard);
        
        // Add event listener to view details button
        const viewDetailsBtn = orderCard.querySelector('.view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => {
                showOrderDetails(order);
            });
        }
    });
    
    // Add "View All Orders" button if there are more than 5 orders
    if (sortedOrders.length > 5) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'btn btn-outline-primary view-all-btn';
        viewAllButton.textContent = 'View All Orders';
        viewAllButton.addEventListener('click', () => {
            showAllOrders(sortedOrders);
        });
        ordersContainer.appendChild(viewAllButton);
    }
}

/**
 * Returns the CSS class based on order status
 * @param {string} status - Order status
 * @returns {string} CSS class name
 */
function getOrderStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'status-completed';
        case 'processing':
            return 'status-processing';
        case 'shipped':
            return 'status-shipped';
        case 'cancelled':
            return 'status-cancelled';
        case 'pending':
            return 'status-pending';
        default:
            return 'status-default';
    }
}

/**
 * Shows detailed information for a specific order
 * @param {Object} order - Order object with detailed information
 */
function showOrderDetails(order) {
    // Create modal for order details
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = `orderModal${order.orderId}`;
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', `orderModalLabel${order.orderId}`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Format date
    const orderDate = new Date(order.orderDate);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Generate items HTML
    let itemsHtml = '';
    order.items.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.imageUrl || 'assets/images/placeholder-product.jpg'}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h5>${item.name}</h5>
                    <div class="item-specs">
                        ${item.specifications ? `<p>${item.specifications}</p>` : ''}
                    </div>
                    <div class="item-price-qty">
                        <span>$${item.price.toFixed(2)} × ${item.quantity}</span>
                        <span class="item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Generate shipping address HTML
    const shippingAddress = order.shippingAddress || {};
    const addressHtml = `
        <p>${shippingAddress.name || ''}</p>
        <p>${shippingAddress.street || ''}</p>
        <p>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}</p>
        <p>${shippingAddress.country || ''}</p>
    `;
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="orderModalLabel${order.orderId}">Order #${order.orderId}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="order-modal-header">
                        <div class="order-date-status">
                            <p>Ordered on: ${formattedDate}</p>
                            <span class="status-badge ${getOrderStatusClass(order.status)}">${order.status}</span>
                        </div>
                        <div class="order-total">
                            <h4>Total: $${order.totalAmount.toFixed(2)}</h4>
                        </div>
                    </div>
                    
                    <div class="order-items-section">
                        <h5>Items</h5>
                        <div class="order-items-list">
                            ${itemsHtml}
                        </div>
                    </div>
                    
                    <div class="order-details-grid">
                        <div class="shipping-info">
                            <h5>Shipping Address</h5>
                            <div class="address-box">
                                ${addressHtml}
                            </div>
                        </div>
                        
                        <div class="payment-summary">
                            <h5>Payment Summary</h5>
                            <div class="payment-details">
                                <div class="payment-row">
                                    <span>Subtotal:</span>
                                    <span>$${order.subtotal ? order.subtotal.toFixed(2) : '0.00'}</span>
                                </div>
                                <div class="payment-row">
                                    <span>Shipping:</span>
                                    <span>$${order.shippingCost ? order.shippingCost.toFixed(2) : '0.00'}</span>
                                </div>
                                <div class="payment-row">
                                    <span>Tax:</span>
                                    <span>$${order.tax ? order.tax.toFixed(2) : '0.00'}</span>
                                </div>
                                <div class="payment-row total">
                                    <span>Total:</span>
                                    <span>$${order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${order.trackingInfo ? `
                    <div class="tracking-info">
                        <h5>Tracking Information</h5>
                        <p>Carrier: ${order.trackingInfo.carrier || 'N/A'}</p>
                        <p>Tracking Number: ${order.trackingInfo.number || 'N/A'}</p>
                        <a href="${order.trackingInfo.url || '#'}" class="btn btn-sm btn-outline-primary" target="_blank">Track Package</a>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    ${order.status.toLowerCase() !== 'cancelled' ? 
                      `<button type="button" class="btn btn-primary" id="reorderBtn${order.orderId}">Reorder</button>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Initialize and show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Add event listener for reorder button
    const reorderBtn = document.getElementById(`reorderBtn${order.orderId}`);
    if (reorderBtn) {
        reorderBtn.addEventListener('click', () => {
            handleReorder(order);
            modalInstance.hide();
        });
    }
    
    // Clean up when modal is hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

/**
 * Shows all orders in a dedicated modal
 * @param {Array} orders - Array of all user orders
 */
function showAllOrders(orders) {
    // Implementation for showing all orders will go here
    alert('View all orders functionality will be implemented soon.');
}

/**
 * Handles reordering an existing order
 * @param {Object} order - The order to reorder
 */
function handleReorder(order) {
    // Implementation for reordering will go here
    alert('Reorder functionality will be implemented soon.');
}

/**
 * Updates the designs section with user saved designs
 * @param {Array} designs - Array of user designs
 */
function updateDesignsSection(designs) {
    const designsContainer = document.getElementById('user-designs-container');
    const emptyDesignsMessage = document.getElementById('empty-designs-message');
    
    if (!designs || designs.length === 0) {
        // Show empty message if no designs
        if (designsContainer) designsContainer.style.display = 'none';
        if (emptyDesignsMessage) emptyDesignsMessage.style.display = 'block';
        return;
    }
    
    // Hide empty message and show designs
    if (designsContainer) designsContainer.style.display = 'block';
    if (emptyDesignsMessage) emptyDesignsMessage.style.display = 'none';
    
    // Clear existing designs
    designsContainer.innerHTML = '';
    
    // Sort designs by date (newest first)
    const sortedDesigns = [...designs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Display up to 6 recent designs (2 rows of 3)
    const designsToShow = sortedDesigns.slice(0, 6);
    
    // Create design grid
    const designGrid = document.createElement('div');
    designGrid.className = 'designs-grid';
    
    designsToShow.forEach(design => {
        // Format date
        const designDate = new Date(design.createdAt);
        const formattedDate = designDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const designCard = document.createElement('div');
        designCard.className = 'design-card';
        designCard.dataset.designId = design.designId;
        
        designCard.innerHTML = `
            <div class="design-preview">
                <img src="${design.previewUrl || 'assets/images/placeholder-design.jpg'}" alt="${design.name}">
                <div class="design-actions">
                    <button class="btn btn-sm btn-light edit-design" title="Edit Design">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-light order-design" title="Order This Design">
                        <i class="fa fa-shopping-cart"></i>
                    </button>
                    <button class="btn btn-sm btn-light delete-design" title="Delete Design">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="design-info">
                <h4 class="design-name">${design.name}</h4>
                <p class="design-date">Created: ${formattedDate}</p>
                <p class="design-type">${design.productType || 'Custom Design'}</p>
            </div>
        `;
        
        designGrid.appendChild(designCard);
        
        // Add event listeners
        const editBtn = designCard.querySelector('.edit-design');
        const orderBtn = designCard.querySelector('.order-design');
        const deleteBtn = designCard.querySelector('.delete-design');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editDesign(design);
            });
        }
        
        if (orderBtn) {
            orderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                orderDesign(design);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                confirmDeleteDesign(design);
            });
        }
        
        // Make the entire card clickable to view design details
        designCard.addEventListener('click', () => {
            viewDesignDetails(design);
        });
    });
    
    designsContainer.appendChild(designGrid);
    
    // Add "View All Designs" button if there are more than 6 designs
    if (sortedDesigns.length > 6) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'btn btn-outline-primary view-all-btn';
        viewAllButton.textContent = 'View All Designs';
        viewAllButton.addEventListener('click', () => {
            showAllDesigns(sortedDesigns);
        });
        designsContainer.appendChild(viewAllButton);
    }
}

/**
 * Shows design details in a modal
 * @param {Object} design - Design object
 */
function viewDesignDetails(design) {
    // Create modal for design details
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = `designModal${design.designId}`;
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', `designModalLabel${design.designId}`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Format date
    const createdDate = new Date(design.createdAt);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="designModalLabel${design.designId}">${design.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="design-preview-large">
                        <img src="${design.previewUrl || 'assets/images/placeholder-design.jpg'}" alt="${design.name}">
                    </div>
                    
                    <div class="design-details">
                        <h4>Design Details</h4>
                        <table class="design-details-table">
                            <tr>
                                <td>Created:</td>
                                <td>${formattedDate}</td>
                            </tr>
                            <tr>
                                <td>Product Type:</td>
                                <td>${design.productType || 'Custom Design'}</td>
                            </tr>
                            <tr>
                                <td>Size:</td>
                                <td>${design.size || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Color:</td>
                                <td>${design.color || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Last Modified:</td>
                                <td>${design.updatedAt ? new Date(design.updatedAt).toLocaleDateString() : formattedDate}</td>
                            </tr>
                        </table>
                    </div>
                    
                    ${design.notes ? `
                    <div class="design-notes">
                        <h4>Notes</h4>
                        <p>${design.notes}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary edit-design-btn">Edit Design</button>
                    <button type="button" class="btn btn-success order-design-btn">Order This Design</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Initialize and show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Add event listeners for buttons
    const editDesignBtn = modal.querySelector('.edit-design-btn');
    const orderDesignBtn = modal.querySelector('.order-design-btn');
    
    if (editDesignBtn) {
        editDesignBtn.addEventListener('click', () => {
            modalInstance.hide();
            editDesign(design);
        });
    }
    
    if (orderDesignBtn) {
        orderDesignBtn.addEventListener('click', () => {
            modalInstance.hide();
            orderDesign(design);
        });
    }
    
    // Clean up when modal is hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

/**
 * Redirects to the design editor with the selected design loaded
 * @param {Object} design - Design object to edit
 */
function editDesign(design) {
    // Store design data in sessionStorage for the editor page to use
    sessionStorage.setItem('editDesign', JSON.stringify(design));
    // Redirect to the design editor page
    window.location.href = `/designer.html?designId=${design.designId}`;
}

/**
 * Redirects to the checkout page with the design added to cart
 * @param {Object} design - Design object to order
 */
function orderDesign(design) {
    // Implementation will redirect to checkout or add to cart
    alert(`Adding design "${design.name}" to cart and redirecting to checkout...`);
    // In a real implementation, would make an API call to add to cart
    // then redirect to the checkout page
    // window.location.href = `/checkout.html?designId=${design.designId}`;
}

/**
 * Shows a confirmation dialog for deleting a design
 * @param {Object} design - Design object to delete
 */
function confirmDeleteDesign(design) {
    if (confirm(`Are you sure you want to delete the design "${design.name}"? This action cannot be undone.`)) {
        deleteDesign(design.designId);
    }
}

/**
 * Deletes a design by ID
 * @param {string} designId - ID of the design to delete
 */
function deleteDesign(designId) {
    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showNotification('You must be logged in to delete designs', 'error');
        return;
    }
    
    // Show loading indicator
    showLoadingSpinner();
    
    // Make API request to delete the design
    fetch(`/api/user/designs/${designId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        hideLoadingSpinner();
        
        if (!response.ok) {
            throw new Error('Failed to delete design');
        }
        
        return response.json();
    })
    .then(data => {
        // Show success notification
        showNotification('Design deleted successfully', 'success');
        
        // Refresh the designs section
        fetchProfileData();
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error('Error deleting design:', error);
        showNotification('Failed to delete design. Please try again.', 'error');
    });
}

/**
 * Shows all designs in a dedicated page or modal
 * @param {Array} designs - Array of all user designs
 */
function showAllDesigns(designs) {
    console.log("Showing all designs:", designs);
    // Implementation for showing all designs
}

// Initialize the profile page when DOM is loaded
// REMOVED: document.addEventListener('DOMContentLoaded', initProfilePage);

/**
 * Load mock data for development mode
 * @returns {Object} Mock profile data
 */
function loadMockData() {
  console.log('Loading mock profile data due to API unavailability');
  
  // Create a base profile using token information if available
  createDefaultProfileFromToken();
  
  // Get current date for timestamps
  const currentDate = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  // Mock orders data
  const mockOrders = [
    {
      id: 'mock-order-1',
      orderNumber: 'CX-10001',
      date: currentDate.toISOString(),
      status: 'Delivered',
      total: 149.99,
      items: [{
        productId: 'prod-001',
        name: 'Custom T-Shirt',
        quantity: 2,
        price: 29.99,
        designId: 'design-001'
      }, {
        productId: 'prod-002',
        name: 'Custom Hoodie',
        quantity: 1,
        price: 89.99,
        designId: 'design-002'
      }]
    },
    {
      id: 'mock-order-2',
      orderNumber: 'CX-10002',
      date: lastMonth.toISOString(),
      status: 'Processing',
      total: 59.99,
      items: [{
        productId: 'prod-003',
        name: 'Custom Hat',
        quantity: 1,
        price: 24.99,
        designId: 'design-001'
      }, {
        productId: 'prod-004',
        name: 'Custom Mug',
        quantity: 1,
        price: 34.99,
        designId: 'design-003'
      }]
    }
  ];
  
  // Mock designs data
  const mockDesigns = [
    {
      id: 'design-001',
      name: 'Summer Design',
      thumbnail: '/images/mock/design1-thumb.jpg',
      createdAt: currentDate.toISOString(),
      usedInOrders: ['mock-order-1', 'mock-order-2'],
      status: 'active'
    },
    {
      id: 'design-002',
      name: 'Winter Logo',
      thumbnail: '/images/mock/design2-thumb.jpg',
      createdAt: lastMonth.toISOString(),
      usedInOrders: ['mock-order-1'],
      status: 'active'
    },
    {
      id: 'design-003',
      name: 'Birthday Gift',
      thumbnail: '/images/mock/design3-thumb.jpg',
      createdAt: twoMonthsAgo.toISOString(),
      usedInOrders: ['mock-order-2'],
      status: 'active'
    }
  ];
  
  // Mock payment methods
  const mockPaymentMethods = [
    {
      id: 'pm-001',
      type: 'credit_card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2024,
      isDefault: true
    }
  ];
  
  // Mock addresses
  const mockAddresses = [
    {
      id: 'addr-001',
      type: 'shipping',
      fullName: profileState.profile.fullName || 'John Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      isDefault: true
    },
    {
      id: 'addr-002',
      type: 'billing',
      fullName: profileState.profile.fullName || 'John Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      isDefault: true
    }
  ];
  
  // Mock activities
  const mockActivities = [
    {
      id: 'act-001',
      type: 'login',
      description: 'Logged in successfully',
      timestamp: currentDate.toISOString()
    },
    {
      id: 'act-002',
      type: 'order',
      description: 'Placed order #CX-10001',
      orderNumber: 'CX-10001',
      timestamp: currentDate.toISOString()
    },
    {
      id: 'act-003',
      type: 'design',
      description: 'Created new design "Summer Design"',
      designId: 'design-001',
      timestamp: currentDate.toISOString()
    },
    {
      id: 'act-004',
      type: 'order',
      description: 'Placed order #CX-10002',
      orderNumber: 'CX-10002',
      timestamp: lastMonth.toISOString()
    }
  ];
  
  // Cache the mock data
  try {
    localStorage.setItem('user_profile', JSON.stringify({
      profile: profileState.profile,
      updatedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Error caching mock profile data:', e);
  }
  
  // Update profileState with mock data
  profileState.orders = mockOrders;
  profileState.designs = mockDesigns;
  profileState.paymentMethods = mockPaymentMethods;
  profileState.addresses = mockAddresses;
  profileState.activities = mockActivities;
  
  // Return the complete mock data set
  return {
    profile: profileState.profile,
    orders: mockOrders,
    designs: mockDesigns,
    paymentMethods: mockPaymentMethods,
    addresses: mockAddresses,
    activities: mockActivities
  };
}


/**
 * Get mock profile data - alias for loadMockData() function
 * @returns {Object} Mock profile data including profile, orders, designs, payment methods, addresses, and activities
 */
function getMockProfileData() {
  return loadMockData();
}

/**
 * Update the designs grid in the UI to always show empty state
 */
function updateDesignsGrid() {
  const designsGrid = document.getElementById('designs-grid');
  if (!designsGrid) {
    console.warn('Designs grid not found in DOM');
    return;
  }
  
  // Show empty state for designs
  const designsEmptyState = document.getElementById('designs-empty-state');
  if (designsEmptyState) {
    designsEmptyState.classList.remove('hidden');
  }
}

