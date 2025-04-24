async function handleLogin(event) {
    event.preventDefault();
    
    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Get email from the username field (the field is labeled as Email in the form)
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email) {
        document.getElementById('username-error').textContent = 'Email is required';
        return;
    }
    
    if (!password) {
        document.getElementById('password-error').textContent = 'Password is required';
        return;
    }

    // Show loading indicator
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;

        if (response.ok) {
            console.log('Login successful, server response:', data);
            
            // Get token from response
            const token = data.token;
            
            if (!token) {
                console.error('No token received from server');
                document.getElementById('username-error').textContent = 'Authentication error: No token received';
                return;
            }
            
            // Extract and format user info
            const userData = {
                id: data.user?.id || '',
                username: data.user?.username || email.split('@')[0],
                email: email,
                // Add creation timestamp for new users
                created_at: new Date().toISOString()
            };
            
            console.log('Enhanced user data created:', userData);
            
            // Store enhanced user data in localStorage for better offline experience
            localStorage.setItem('enhanced_user_data', JSON.stringify({
                email: email,
                username: userData.username,
                lastLogin: new Date().toISOString()
            }));
            
            // Use the centralized auth handler for consistent behavior
            CustomXAuth.handleLogin(userData, token);
            
            // Check if this is first login (no creation date yet)
            if (!localStorage.getItem('customxshop_user_creation_date')) {
                // Mark as new user
                localStorage.setItem('customxshop_user_creation_date', new Date().toISOString());
                console.log('First login detected - user marked as new');
                
                // Initialize empty user data
                if (!localStorage.getItem('customxshop_user_data')) {
                    localStorage.setItem('customxshop_user_data', JSON.stringify({
                        preferences: {
                            notifications: true,
                            marketing: true
                        }
                    }));
                }
            }
            
            // Get the redirect URL from localStorage or default to homepage
            const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/HTML/Homepage.html';
            console.log('Redirecting to:', redirectUrl);
            
            // Redirect to the destination page
            window.location.href = redirectUrl;
        } else {
            // Display specific error message based on the response
            if (data.message === 'Invalid credentials') {
                document.getElementById('username-error').textContent = 'Invalid email or password';
            } else {
                document.getElementById('username-error').textContent = data.message || 'Login failed';
            }
            console.error('Login error:', data);
        }
    } catch (error) {
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        
        console.error('Login error:', error);
        document.getElementById('username-error').textContent = 'Server error. Please try again.';
    }
}