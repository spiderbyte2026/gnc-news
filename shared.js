import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication (for protected pages)
    const isAuthenticated = localStorage.getItem('auth') === 'true';
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    if (!isAuthenticated && !isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    // Role Logic
    const userRole = localStorage.getItem('role') || 'student';
    const navCreateBtn = document.getElementById('nav-create-btn');
    if (navCreateBtn) {
        if (userRole === 'student') {
            navCreateBtn.style.display = 'none';
        } else {
            navCreateBtn.style.display = 'flex';
        }
    }

    // Logout
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Error signing out of Firebase:", error);
            }
            localStorage.removeItem('auth');
            localStorage.removeItem('role');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            window.location.href = 'index.html';
        });
    });

    // Theme Toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-regular fa-sun"></i>';
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggle.innerHTML = '<i class="fa-regular fa-moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggle.innerHTML = '<i class="fa-regular fa-sun"></i>';
            }
        });
    }

    // Sidebar active state logic
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            if (targetId === 'channel-feed') {
                const channel = encodeURIComponent(item.getAttribute('data-channel'));
                window.location.href = `feed.html?channel=${channel}`;
            } else if (targetId === 'create-post') {
                window.location.href = 'create.html';
            }
        });
    });
});
