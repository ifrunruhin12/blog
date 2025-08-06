// API Configuration
const API_BASE_URL = 'https://blog-backend-qlgd.onrender.com';

// Fetch and display blog posts
async function loadBlogPosts() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');
  const container = document.getElementById('posts-container');

  try {
    const response = await fetch(`${API_BASE_URL}/blogs`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const posts = await response.json();
    
    // Hide loading indicator
    loadingEl.style.display = 'none';
    
    if (posts.length === 0) {
      container.innerHTML = '<p>No blog posts available yet. Check back soon!</p>';
      return;
    }
    
    // Generate HTML for each post
    container.innerHTML = posts.map(post => `
      <div class="project-card" data-aos="fade-up">
        <div class="project-content">
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(truncateContent(post.content, 150))}</p>
          <div class="project-meta">
            <small><i class="fas fa-calendar"></i> ${formatDate(post.created_at)}</small>
            <small><i class="fas fa-link"></i> ${escapeHtml(post.slug)}</small>
          </div>
          <div class="project-links">
            <button onclick="viewPost('${post.slug}')" class="btn-primary">
              <i class="fas fa-eye"></i> Read More
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading blog posts:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
}

// Utility functions
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
    month: 'short',
    day: 'numeric'
  });
}

function viewPost(slug) {
  window.location.href = `post.html?slug=${slug}`;
}

// Initialize AOS and load posts when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init();
  }
  
  // Load blog posts
  loadBlogPosts();
});
