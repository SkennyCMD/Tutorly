/**
 *
 * Login Page Script
 *
 *
 * Client-side logic for the tutor login page.
 *
 * Features:
 * - Password visibility toggle (show/hide)
 *
 * Dependencies:
 * - Requires login.ejs template
 *
 */


// Password Visibility Toggle


/**
 * Toggle the password field's visibility between masked and visible.
 *
 * Changes the input type between 'password' and 'text' and swaps the eye
 * icon to reflect the current state - same behavior/markup as the admin
 * login page's toggle (see adminLogin.js), reused here for a tutor.
 */
document.getElementById('togglePw').addEventListener('click', () => {
    const input = document.getElementById('password');
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
