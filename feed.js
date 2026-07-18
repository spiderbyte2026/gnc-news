import { db } from './firebase-config.js';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const feedContainer = document.getElementById('dynamic-feed-container');
    const channelTitle = document.getElementById('channel-title');
    const searchInput = document.getElementById('search-input');
    const navItems = document.querySelectorAll('.nav-item');

    // Determine current channel from URL or default to GNC News
    const urlParams = new URLSearchParams(window.location.search);
    let currentFilter = urlParams.get('channel') || 'GNC News';
    let currentSearchQuery = '';
    let loadedPosts = [];

    // Set Active Nav Item
    navItems.forEach(nav => {
        if (nav.getAttribute('data-channel') === currentFilter) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    if (channelTitle) channelTitle.innerText = currentFilter;

    // Load Posts from Firestore
    async function loadPosts() {
        feedContainer.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading posts...</p></div>';
        try {
            const postsRef = collection(db, "posts");
            // Remove orderBy to prevent Firebase Index requirement, sort in memory instead!
            const q = query(postsRef, where("category", "==", currentFilter));
            const querySnapshot = await getDocs(q);
            
            loadedPosts = [];
            querySnapshot.forEach((doc) => {
                loadedPosts.push({ id: doc.id, ...doc.data() });
            });

            // Sort posts by date descending in memory
            loadedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

            renderFilteredPosts();
        } catch (error) {
            console.error("Error loading posts: ", error);
            
            let errorMsg = "Error loading posts from Firebase. Did you add your config?";
            if (error.code === 'permission-denied') {
                errorMsg = "Permission Denied: Make sure your Firestore Security Rules allow read/write access!";
            }

            feedContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${errorMsg}</p></div>`;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase();
            renderFilteredPosts();
        });
    }

    function renderFilteredPosts() {
        let filtered = loadedPosts;
        if (currentSearchQuery) {
            filtered = loadedPosts.filter(p => 
                p.title.toLowerCase().includes(currentSearchQuery) || 
                p.content.toLowerCase().includes(currentSearchQuery)
            );
        }
        renderPostList(feedContainer, filtered);
    }

    function renderPostList(container, postArray) {
        container.innerHTML = '';
        
        if (postArray.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>No posts found in this category.</p></div>';
            return;
        }

        const userRole = localStorage.getItem('role') || 'student';
        const currentUserEmail = localStorage.getItem('userEmail') || '';

        postArray.forEach(post => {
            const article = document.createElement('article');
            article.className = 'news-card glass-card hover-lift';
            
            let imageHtml = post.image 
                ? `<div class="card-image" style="background-image: url('${post.image}')"></div>` 
                : '';
                
            let tagClass = post.category === 'GNC News' || post.category === 'Important News' ? 'tag-primary' : 'tag-secondary';

            let adminActions = '';
            if (userRole === 'admin') {
                adminActions = `
                    <button class="action-btn edit-btn" data-id="${post.id}" title="Edit Post">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${post.id}" title="Delete Post">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
            }

            // Calculate likes and active state
            let likedArray = post.likedBy || [];
            let likeCount = likedArray.length;
            let hasLiked = currentUserEmail && likedArray.includes(currentUserEmail);
            let likeIconClass = hasLiked ? 'fa-solid' : 'fa-regular';
            let likeBtnClass = hasLiked ? 'action-btn like-btn active' : 'action-btn like-btn';

            article.innerHTML = `
                ${imageHtml}
                <div class="card-content">
                    <div class="card-meta">
                        <span class="tag ${tagClass}">${post.category}</span>
                        <span class="date">${timeSince(post.date)}</span>
                    </div>
                    <h3 class="card-title">${post.title}</h3>
                    <p class="card-excerpt">${post.content}</p>
                    <div class="author-row">
                        <div class="avatar small"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=${post.authorColor}&color=fff" alt="Author"></div>
                        <span>${post.author}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="${likeBtnClass}" data-id="${post.id}" data-likes="${likeCount}">
                        <i class="${likeIconClass} fa-heart"></i> <span>${likeCount}</span>
                    </button>
                    <div class="spacer"></div>
                    ${adminActions}
                    <button class="action-btn share-btn" data-title="${encodeURIComponent(post.title)}" data-text="${encodeURIComponent(post.content)}" title="Share">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                </div>
            `;
            container.appendChild(article);
        });

        // Attach Like Listeners (Firestore Update)
        container.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (!currentUserEmail) {
                    alert("Please log in to like posts.");
                    return;
                }

                const postId = this.getAttribute('data-id');
                let currentLikes = parseInt(this.getAttribute('data-likes'));
                const icon = this.querySelector('i');
                const span = this.querySelector('span');
                
                try {
                    const postRef = doc(db, "posts", postId);

                    if (this.classList.contains('active')) {
                        // Unlike
                        this.classList.remove('active');
                        icon.classList.remove('fa-solid');
                        icon.classList.add('fa-regular');
                        currentLikes--;
                        span.innerText = currentLikes;
                        this.setAttribute('data-likes', currentLikes);

                        await updateDoc(postRef, {
                            likedBy: arrayRemove(currentUserEmail)
                        });
                    } else {
                        // Like
                        this.classList.add('active');
                        icon.classList.remove('fa-regular');
                        icon.classList.add('fa-solid');
                        currentLikes++;
                        span.innerText = currentLikes;
                        this.setAttribute('data-likes', currentLikes);

                        await updateDoc(postRef, {
                            likedBy: arrayUnion(currentUserEmail)
                        });
                    }
                } catch(e) {
                    console.error("Error updating likes:", e);
                }
            });
        });

        // Attach Share Listeners
        container.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const title = decodeURIComponent(this.getAttribute('data-title'));
                const text = decodeURIComponent(this.getAttribute('data-text'));
                if (navigator.share) {
                    try { await navigator.share({ title, text, url: window.location.href }); } 
                    catch (err) { console.error('Error sharing:', err); }
                } else {
                    alert('Sharing not supported:\n\n' + title + '\n' + text);
                }
            });
        });

        // Attach Admin Listeners
        if (userRole === 'admin') {
            container.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const postId = btn.getAttribute('data-id');
                    window.location.href = `create.html?edit=${postId}`;
                });
            });

            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const postId = btn.getAttribute('data-id');
                    const confirmDelete = confirm("Are you sure you want to delete this post? This cannot be undone.");
                    if (confirmDelete) {
                        try {
                            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                            await deleteDoc(doc(db, "posts", postId));
                            
                            // Remove from local array and re-render
                            loadedPosts = loadedPosts.filter(p => p.id !== postId);
                            renderFilteredPosts();
                        } catch (e) {
                            console.error("Error deleting post:", e);
                            alert("Failed to delete post. Check permissions.");
                            btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                        }
                    }
                });
            });
        }
    }

    function timeSince(dateString) {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    }

    // Trigger load
    loadPosts();
});
