// Page-specific logic for signup.html

import { authManager } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const messageContainer = document.getElementById('message-container');
    const messageText = document.getElementById('message-text');
    const signupBtn = document.getElementById('signupBtn');
    const signupBtnText = document.getElementById('signupBtnText');
    const signupBtnLoading = document.getElementById('signupBtnLoading');
    const googleSignupBtn = document.getElementById('googleSignup');

    // Show/Hide Message
    function showMessage(message, type = 'error') {
      messageContainer.className = `mb-4 p-4 rounded-lg text-center ${type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`;
      messageText.textContent = message;
      messageContainer.classList.remove('hidden');
    }

    // Loading State
    function setLoading(loading) {
        signupBtn.disabled = loading;
        if (loading) {
            signupBtnText.classList.add('hidden');
            signupBtnLoading.classList.remove('hidden');
        } else {
            signupBtnText.classList.remove('hidden');
            signupBtnLoading.classList.add('hidden');
        }
    }

    // Signup Form Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        const userData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            userType: document.getElementById('userType').value,
        };

        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic validation
        if (userData.password !== confirmPassword) {
            showMessage('كلمة المرور غير متطابقة.');
            setLoading(false);
            return;
        }

        const { success, error, user } = await authManager.signUp(userData);

        if (error) {
            showMessage(error.message);
        } else {
            showMessage('تم إنشاء الحساب بنجاح! سيتم توجيهك لإكمال ملفك الشخصي.', 'success');
            // The global onAuthStateChange listener in auth.js will handle the redirect.
        }

        setLoading(false);
    });

    // Google Signup
    googleSignupBtn.addEventListener('click', async () => {
        await authManager.signInWithGoogle();
    });
});
