// ************************Signup***************************
// Function to handle signup
function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
        alert('All fields are required.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    // Store user data in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    if (users.some(user => user.username === username)) {
        alert('Username already exists. Please choose another.');
        return;
    }

    // Add new user
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Signup successful!');
    window.location.href = 'index.html';
}

// ***************************Login****************************
// Function to handle login
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!username || !password) {
        alert('Username and password cannot be empty.');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        alert('Login successful!');
        localStorage.setItem('currentUser', username);
        window.location.href = 'Homepage.html';
    } else {
        alert('Invalid username or password.');
    }
}

// ****************************************Save Design*************************************




// Add event listeners to forms
document.addEventListener('DOMContentLoaded', function() {
    // For signup page
    const signupForm = document.querySelector('.signup-container form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // For login page
    const loginForm = document.querySelector('.login-container form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // For saving the design
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', handleSaveDesign);
    }

    // Show user designs when "Your Designs" page loads
    if (document.getElementById('design-container')) {
        showUserDesigns();
    }
});

// Color change functionality
document.getElementById('product-type').addEventListener('change', function() {
    document.getElementById('product-image').src = this.value;
});

// JavaScript to handle color selection and image change
const productImage = document.getElementById('product-image');
const colorRadios = document.querySelectorAll('input[name="color"]');

colorRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        productImage.src = this.value;
    });
});
