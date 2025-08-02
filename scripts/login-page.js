// Page-specific logic for login.html

document.addEventListener('DOMContentLoaded', () => {
    // Ensure AuthManager is available
    if (!window.AuthManager) {
        console.error('AuthManager is not loaded. Login form will not work.');
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const message = document.getElementById('message');
    const googleLogin = document.getElementById('googleLogin');

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitButton = loginForm.querySelector('button[type="submit"]');

        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> جاري الدخول...';
        message.textContent = '';

        const { success, error } = await window.AuthManager.signIn(email, password);

        if (error) {
            message.textContent = 'خطأ في البيانات. جرب تاني.';
            message.style.color = '#fca5a5'; // Light red
        } else {
            message.textContent = 'تم تسجيل الدخول بنجاح! جاري التوجيه...';
            message.style.color = '#86efac'; // Light green
            // The global onAuthStateChange listener in auth-guard.js will handle the redirect.
        }

        // Re-enable button
        submitButton.disabled = false;
        submitButton.innerHTML = 'دخول';
    });

    // Handle Google login
    googleLogin.addEventListener('click', async () => {
        googleLogin.disabled = true;
        googleLogin.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> جاري...';

        const { error } = await window.AuthManager.signInWithGoogle();

        if (error) {
            message.textContent = 'تعذر تسجيل الدخول بجوجل';
            console.error(error);
            googleLogin.disabled = false;
            googleLogin.innerHTML = '<i class="fab fa-google ml-2"></i> دخول بجوجل';
        }
    });

    // Listen for global messages from AuthManager or other modules
    window.addEventListener('showMessage', (e) => {
        message.textContent = e.detail.message;
        const type = e.detail.type || 'info';
        if (type === 'error') {
            message.style.color = '#fca5a5';
        } else if (type === 'success') {
            message.style.color = '#86efac';
        } else {
            message.style.color = '#93c5fd'; // Light blue
        }
    });

    // Redirect if already logged in
    if(window.AuthManager.isAuthenticated()) {
        console.log('User is already logged in. Redirecting to dashboard.');
        window.location.href = 'dashboard.html';
    }
});
