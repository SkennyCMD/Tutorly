/**
 *
 * Admin Login Script
 *
 * 
 * Client-side logic for the admin login page.
 * 
 * Features:
 * - Password visibility toggle (show/hide)
 * - Form submission with loading state
 * - Error handling and display
 * - Automatic redirect on successful login
 * 
 * Security:
 * - Credentials validated on server side
 * - Login attempts are logged (see adminLogger.js)
 * - Rate limiting enforced by backend
 * 
 * Dependencies:
 * - Backend endpoint: POST /adminLogin
 * - Requires adminLogin.ejs template
 *
 */


// Password Visibility Toggle


/**
 * Toggle password field visibility between masked and visible.
 * 
 * Changes the input type between 'password' and 'text' and updates
 * the eye icon to reflect the current state.
 */
document.getElementById('togglePw').addEventListener('click', () => {
    const input = document.getElementById('adminPassword');
    const icon = document.getElementById('pwEye');
    
    if (input.type === 'password') {
        // Show password - change to eye-off icon
        input.type = 'text';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/>';
    } else {
        // Hide password - change to eye icon
        input.type = 'password';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
    }
});


// Admin Login Form Submission


/**
 * Handle admin login form submission.
 * 
 * Flow:
 * 1. Prevent default form submission
 * 2. Extract username and password
 * 3. Show loading state (disable button, spinner)
 * 4. Send credentials to backend
 * 5. On success: redirect to /admin
 * 6. On failure: show error message and reset button
 * 
 * Error Handling:
 * - Network errors
 * - Invalid credentials
 * - Server errors
 * 
 * @listens submit
 */
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form elements
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('errorText');
    const username = document.getElementById('adminId').value;
    const password = document.getElementById('adminPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');

    // Hide any previous error messages
    errorDiv.classList.add('hidden');
    
    // Disable button and show loading spinner
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Verifying...';

    try {
        // Send login request to backend
        const response = await fetch('/adminLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            // Login successful - redirect to admin panel
            window.location.href = '/admin';
        } else {
            // Login failed - show error message
            const data = await response.json();
            errorDiv.classList.remove('hidden');
            errorText.textContent = data.error || 'Invalid admin credentials';
            
            // Reset button to allow retry
            btn.disabled = false;
            btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Sign in as Admin';
        }
    } catch (error) {
        // Network or unexpected error
        console.error('Login error:', error);
        errorDiv.classList.remove('hidden');
        errorText.textContent = 'An error occurred. Please try again.';
        
        // Reset button to allow retry
        btn.disabled = false;
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Sign in as Admin';
    }
});