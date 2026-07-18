import { db } from './firebase-config.js';
import { collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('create-post-form');
    const imageInput = document.getElementById('post-image');
    const uploadText = document.getElementById('upload-text');
    const submitBtn = document.getElementById('submit-btn');
    const pageTitle = document.getElementById('page-title');

    // Check for Edit Mode
    const urlParams = new URLSearchParams(window.location.search);
    const editPostId = urlParams.get('edit');
    let existingPost = null;

    if (editPostId) {
        if (pageTitle) pageTitle.innerText = "Edit Post";
        submitBtn.innerText = "Update Post";
        loadPostDataForEdit(editPostId);
    }

    async function loadPostDataForEdit(id) {
        try {
            const docRef = doc(db, "posts", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                existingPost = docSnap.data();
                document.getElementById('post-title').value = existingPost.title;
                document.getElementById('post-category').value = existingPost.category;
                document.getElementById('post-content').value = existingPost.content;
            } else {
                alert("Post not found.");
                window.location.href = 'feed.html';
            }
        } catch (e) {
            console.error("Error fetching post for edit:", e);
        }
    }

    imageInput.addEventListener('change', () => {
        if (imageInput.files && imageInput.files.length > 0) {
            uploadText.innerText = "Photo Selected: " + imageInput.files[0].name;
        } else {
            uploadText.innerText = "Upload Photo";
        }
    });

    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.innerText = "Publishing...";

        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;

        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                await saveToFirestore({
                    title,
                    category,
                    content,
                    base64Image: e.target.result
                });
            }
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            await saveToFirestore({
                title,
                category,
                content,
                base64Image: null
            });
        }
    });

    async function saveToFirestore({ title, category, content, base64Image }) {
        const postData = {
            title,
            category,
            content,
            image: base64Image || (existingPost ? existingPost.image : null),
            author: existingPost ? existingPost.author : "Campus Admin",
            authorColor: existingPost ? existingPost.authorColor : "EF4444",
            date: existingPost ? existingPost.date : new Date().toISOString(),
            likedBy: existingPost && existingPost.likedBy ? existingPost.likedBy : []
        };

        try {
            if (editPostId) {
                const docRef = doc(db, "posts", editPostId);
                await updateDoc(docRef, postData);
            } else {
                await addDoc(collection(db, "posts"), postData);
            }
            
            // Navigate back to the channel feed
            window.location.href = `feed.html?channel=${encodeURIComponent(postData.category)}`;
        } catch (e) {
            console.error("Error adding/updating document: ", e);
            alert("Error publishing post. Make sure your Firebase Config is setup and you have write permissions.");
            submitBtn.disabled = false;
            submitBtn.innerText = editPostId ? "Update Post" : "Publish Post";
        }
    }
});
