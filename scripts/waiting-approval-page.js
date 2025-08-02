// Page-specific logic for waiting-approval.html

import { authManager } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const checkStatusBtn = document.querySelector('button');
    const messageDiv = document.getElementById('status-message');

    function showMessage(message, type = 'info') {
        messageDiv.classList.remove('hidden');
        messageDiv.textContent = message;

        messageDiv.className = 'mt-4 p-3 rounded-lg font-bold';

        const typeClasses = {
            success: 'bg-green-100 border border-green-400 text-green-700',
            error: 'bg-red-100 border border-red-400 text-red-700',
            warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border border-blue-400 text-blue-700'
        };
        messageDiv.classList.add(typeClasses[type] || typeClasses.info);
    }

    async function checkApprovalStatus() {
        const user = authManager.getCurrentUser();
        if (!user) {
            showMessage('You must be logged in to check your status.', 'error');
            return;
        }

        const userProfile = await authManager.getUserProfile();

        if (userProfile && userProfile.is_approved) {
            showMessage('Congratulations! You have been approved. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showMessage('Your account is still pending approval. Please wait.', 'warning');
        }
    }

    checkStatusBtn.addEventListener('click', checkApprovalStatus);

    // Also check status immediately on page load
    checkApprovalStatus();
});
