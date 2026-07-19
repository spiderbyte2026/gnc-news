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
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggles.forEach(t => {
            const icon = t.querySelector('i');
            if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
        });
    }

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggles.forEach(t => {
                    const icon = t.querySelector('i');
                    if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
                });
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggles.forEach(t => {
                    const icon = t.querySelector('i');
                    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
                });
            }
        });
    });

    // Mobile Menu Toggle
    const menuBtns = document.querySelectorAll('.menu-btn');
    const glassNav = document.querySelector('.glass-nav');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (glassNav && mobileOverlay) {
        menuBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                glassNav.classList.toggle('open');
                mobileOverlay.classList.toggle('open');
            });
        });

        mobileOverlay.addEventListener('click', () => {
            glassNav.classList.remove('open');
            mobileOverlay.classList.remove('open');
        });
    }

    // Sidebar active state logic
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Close mobile menu if open
            if (glassNav && glassNav.classList.contains('open')) {
                glassNav.classList.remove('open');
                mobileOverlay.classList.remove('open');
            }

            const channel = item.getAttribute('data-channel');
            if (channel) {
                window.location.href = `feed.html?channel=${encodeURIComponent(channel)}`;
            } else if (item.classList.contains('create-btn') || item.getAttribute('data-target') === 'create-post') {
                window.location.href = 'create.html';
            }
        });
    });
});
