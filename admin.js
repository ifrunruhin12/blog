// API Configuration
const API_BASE_URL = 'https://blog-backend-qlgd.onrender.com/api';
let authToken = localStorage.getItem('adminToken');
let isEditing = false;

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const postForm = document.getElementById('post-form');
const adminUsername = document.getElementById('admin-username');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // SIMPLE FIX: Always load posts when page loads
  loadPosts();
  
  if (authToken) {
    showDashboard();
  }

  // Auto-generate slug from title
  document.getElementById('post-title').addEventListener('input', function(e) {
    if (!isEditing) {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      document.getElementById('post-slug').value = slug;
    }
  });
});

// Login form handler
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const result = await response.json();
      authToken = result.token;
      localStorage.setItem('adminToken', authToken);
      localStorage.setItem('adminUser', result.user.username);
      showDashboard();
      loadPosts();
    } else {
      const result = await response.json();
      showMessage('login-message', result.error || 'Login failed', 'error');
    }
  } catch (error) {
    showMessage('login-message', 'Connection error: ' + error.message, 'error');
  }
});

// Post form handler
document.getElementById('post-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const title = document.getElementById('post-title').value;
  const slug = document.getElementById('post-slug').value;
  const content = document.getElementById('post-content').value;
  
  if (!title || !slug || !content) {
    showMessage('post-message', 'All fields are required', 'error');
    return;
  }
  
  const postData = { title, slug, content };
  const isEdit = isEditing;
  const url = isEdit ? `${API_BASE_URL}/blogs/${slug}` : `${API_BASE_URL}/blogs`;
  const method = isEdit ? 'PUT' : 'POST';
  
  try {
    console.log('Submitting post:', postData);
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(postData)
    });

    console.log('Post response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Post successful:', result);
      showMessage('post-message', 
        `Post ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
      postForm.reset();
      cancelEdit();
      loadPosts();
    } else {
      const result = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Post failed:', result);
      console.error('Response text:', await response.text().catch(() => 'Could not read response'));
      showMessage('post-message', result.error || `Post failed (${response.status})`, 'error');
    }
  } catch (error) {
    console.error('Post error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    showMessage('post-message', `Connection error: ${error.message}`, 'error');
  }
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  authToken = null;
  loginSection.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
  loginForm.reset();
});

// Show dashboard
function showDashboard() {
  console.log('showDashboard() called');
  loginSection.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
  adminUsername.textContent = `Welcome, ${localStorage.getItem('adminUser')}!`;
}

// Load posts
async function loadPosts() {
  console.log('loadPosts() called');
  const loadingEl = document.getElementById('posts-loading');
  const errorEl = document.getElementById('posts-error');
  const container = document.getElementById('posts-container');

  console.log('Elements found:', {
    loadingEl: !!loadingEl,
    errorEl: !!errorEl,
    container: !!container
  });

  try {
    console.log('Fetching posts from:', `${API_BASE_URL}/blogs`);
    const response = await fetch(`${API_BASE_URL}/blogs`);
    console.log('Posts response status:', response.status);
    
    const posts = await response.json();
    console.log('Posts loaded:', posts.length, 'posts');

    loadingEl.classList.add('hidden');

    if (posts.length === 0) {
      container.innerHTML = '<p>No posts yet. Create your first post above!</p>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <div class="post-card">
        <h3>${escapeHtml(post.title)}</h3>
        <p><strong>Slug:</strong> ${escapeHtml(post.slug)}</p>
        <p>${escapeHtml(truncateContent(post.content, 100))}</p>
        <p><small>Created: ${formatDate(post.created_at)}</small></p>
        <div class="post-actions">
          <button class="btn edit-btn" data-slug="${post.slug}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger delete-btn" data-slug="${post.slug}" data-title="${escapeHtml(post.title)}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `).join('');

    console.log('HTML generated, now attaching event listeners...');

    // Add event listeners for edit and delete buttons
    const editButtons = container.querySelectorAll('.edit-btn');
    const deleteButtons = container.querySelectorAll('.delete-btn');
    
    console.log('Found buttons:', {
      editButtons: editButtons.length,
      deleteButtons: deleteButtons.length
    });

    editButtons.forEach((btn, index) => {
      console.log(`Attaching edit listener to button ${index}:`, btn.dataset.slug);
      btn.addEventListener('click', () => editPost(btn.dataset.slug));
    });

    deleteButtons.forEach((btn, index) => {
      console.log(`Attaching delete listener to button ${index}:`, btn.dataset.slug, btn.dataset.title);
      btn.addEventListener('click', (e) => {
        console.log('Delete button clicked! Event:', e);
        window.deletePost(btn.dataset.slug, btn.dataset.title);
      });
    });

    console.log('Event listeners attached successfully');

  } catch (error) {
    console.error('Error in loadPosts:', error);
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.textContent = 'Failed to load posts';
  }
}

// Edit post
async function editPost(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/blogs/${slug}`);
    const post = await response.json();
    
    if (response.ok) {
      document.getElementById('form-title').textContent = '✏️ Edit Post';
      document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Update Post';
      document.getElementById('post-title').value = post.title;
      document.getElementById('post-slug').value = post.slug;
      document.getElementById('post-content').value = post.content;
      isEditing = true;
      
      // Scroll to form
      document.getElementById('post-form').scrollIntoView({ behavior: 'smooth' });
    } else {
      showMessage('post-message', 'Failed to load post for editing', 'error');
    }
  } catch (error) {
    showMessage('post-message', 'Failed to load post for editing', 'error');
  }
}

// Cancel edit
function cancelEdit() {
  document.getElementById('form-title').textContent = '✨ Create New Post';
  document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Create Post';
  postForm.reset();
  isEditing = false;
}

// Simple, direct delete function
window.deletePost = function(slug, title) {
  console.log('DELETE FUNCTION CALLED:', slug, title);
  
  if (!confirm(`Delete "${title}"?`)) {
    console.log('Delete cancelled');
    return;
  }
  
  console.log('Delete confirmed, making request...');
  
  fetch(`${API_BASE_URL}/blogs/${slug}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Delete response:', response.status);
    if (response.ok) {
      alert('Post deleted successfully!');
      location.reload(); // Simple reload to refresh the page
    } else {
      alert('Delete failed: ' + response.status);
    }
  })
  .catch(error => {
    console.error('Delete error:', error);
    alert('Delete error: ' + error.message);
  });
};

// Utility functions
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="${type}-message">${message}</div>`;
  setTimeout(() => {
    element.innerHTML = '';
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateContent(content, maxLength) {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
