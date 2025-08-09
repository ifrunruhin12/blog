// API Configuration
const API_BASE_URL = 'https://blog-backend-qlgd.onrender.com/api';

// Get slug from URL parameters
function getSlugFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('slug');
}

// Load and display post
async function loadPost() {
  const slug = getSlugFromURL();
  
  if (!slug) {
    showError('No post specified in URL. Please check the link.');
    return;
  }

  console.log('Loading post with slug:', slug); // Debug log

  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const articleEl = document.getElementById('post-article');

  try {
    console.log('Fetching from:', `${API_BASE_URL}/blogs/${slug}`); // Debug log
    const response = await fetch(`${API_BASE_URL}/blogs/${slug}`);
    
    console.log('Response status:', response.status); // Debug log
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Post not found. The post may have been deleted or the URL is incorrect.');
      } else if (response.status === 500) {
        throw new Error('Server error. Please check if the backend is running.');
      } else {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
    }

    const post = await response.json();
    console.log('Post loaded:', post); // Debug log
    
    // Hide loading, show post
    loadingEl.classList.add('hidden');
    articleEl.classList.remove('hidden');

    // Update page title
    document.title = `${post.title} | Ifrun Kader Ruhin`;

    // Display post content
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-meta').innerHTML = `
      <i class="fas fa-calendar"></i> ${formatDate(post.created_at)}
      <span style="margin: 0 1rem;">•</span>
      <i class="fas fa-link"></i> ${post.slug}
    `;
    
    // Process and display content (basic markdown-like formatting)
    document.getElementById('post-content').innerHTML = formatContent(post.content);

  } catch (error) {
    console.error('Error loading post:', error);
    showError(`Failed to load post: ${error.message}`);
  }
}

// Show error state
function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('error').innerHTML = `<p>${message}</p>`;
}

// Format content with markdown-like styling
function formatContent(content) {
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="post-image">')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    
    // Lists
    .replace(/^\s*[-*] (.*$)/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    
    // Paragraphs (add this after other replacements)
    .split('\n\n')
    .map(paragraph => {
      if (!paragraph.trim().startsWith('<') || 
          paragraph.trim().startsWith('<p>') || 
          paragraph.trim().startsWith('<img') ||
          paragraph.trim().startsWith('<ul>') || 
          paragraph.trim().startsWith('<ol>') || 
          paragraph.trim().startsWith('<blockquote>') ||
          paragraph.trim().startsWith('<h1>') ||
          paragraph.trim().startsWith('<h2>') ||
          paragraph.trim().startsWith('<h3>') ||
          paragraph.trim().startsWith('<pre>')) {
        return paragraph;
      }
      return `<p>${paragraph}</p>`;
    })
    .join('\n\n')
    .replace(/\n/g, '<br>');
}

// Format date
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

// Initialize AOS and load post when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init();
  }
  
  // Load the post
  loadPost();
});
