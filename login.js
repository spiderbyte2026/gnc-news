import { auth, googleProvider } from './firebase-config.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// TODO: Replace this with the real admin email(s) for your campus
const ADMIN_EMAILS = [
    "admin@college.edu",
    "testadmin@gmail.com",
    "megalak766@gmail.com"
];

document.addEventListener('DOMContentLoaded', () => {
    const googleLoginBtn = document.getElementById('google-login-btn');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                googleLoginBtn.disabled = true;
                googleLoginBtn.innerText = "Signing in...";

                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                // Determine Role
                const userRole = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'student';
                
                // Store auth state locally for quick UI checks across pages
                localStorage.setItem('auth', 'true');
                localStorage.setItem('role', userRole);
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userName', user.displayName);
                
                // Redirect to Feed
                window.location.href = 'feed.html';

            } catch (error) {
                console.error("Error signing in with Google:", error);
                alert("Login failed. Check console or make sure Firebase Config is set up.");
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = `
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" style="width: 20px; height: 20px;">
                    Sign in with Google
                `;
            }
        });
    }
});
