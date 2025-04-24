async function handleSignup(event) {
    event.preventDefault();
    
    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate password match
    if (password !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // User is now registered but not yet logged in
            
            // Clear any existing user data to ensure clean start
            localStorage.removeItem('customxshop_user_creation_date');
            localStorage.removeItem('customxshop_user_data');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Inform user and redirect to login
            alert('Signup successful! Please login with your new credentials.');
            window.location.href = '/HTML/index.html';
        } else {
            document.getElementById('username-error').textContent = data.message || 'Signup failed';
        }
    } catch (error) {
        console.error('Signup error:', error);
        document.getElementById('username-error').textContent = 'Server error. Please try again.';
    }
}