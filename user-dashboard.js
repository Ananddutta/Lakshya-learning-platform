// User Dashboard Script

let notificationUnsubscribe = null;

// Protect this page - only authenticated users can access
document.addEventListener('DOMContentLoaded', () => {
    if (!protectRoute()) {
        return;
    }
    
    // Load user information
    loadUserInfo();
    
    // Initialize notifications
    initializeNotifications();
    
    // Request browser notification permission
    requestNotificationPermission();
});

// Load user information
function loadUserInfo() {
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (userName) {
        document.getElementById('userName').textContent = userName;
    } else if (userEmail) {
        document.getElementById('userName').textContent = userEmail.split('@')[0];
    }
}

// Handle logout
async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Unsubscribe from notifications
        if (notificationUnsubscribe) {
            notificationUnsubscribe();
        }
        
        const result = await signOut();
        if (result.success) {
            window.location.href = 'login.html';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════

// Initialize notifications
function initializeNotifications() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    
    // Listen to real-time notifications
    notificationUnsubscribe = NotificationService.listenToNotifications(userId, (notifications) => {
        updateNotificationUI(notifications);
        
        // Show browser notification for new unread notifications
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length > 0 && document.hidden) {
            const latest = unreadNotifications[0];
            NotificationService.showBrowserNotification(latest.title, {
                body: latest.message,
                tag: latest.id
            });
        }
    });
}

// Update notification UI
function updateNotificationUI(notifications) {
    const notificationList = document.getElementById('notificationList');
    const notificationBadge = document.getElementById('notificationBadge');
    
    // Update badge
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        notificationBadge.style.display = 'block';
    } else {
        notificationBadge.style.display = 'none';
    }
    
    // Update list
    if (notifications.length === 0) {
        notificationList.innerHTML = '<p class="empty-message">No notifications</p>';
        return;
    }
    
    notificationList.innerHTML = '';
    notifications.slice(0, 20).forEach(notification => {
        const item = createNotificationItem(notification);
        notificationList.appendChild(item);
    });
}

// Create notification item
function createNotificationItem(notification) {
    const item = document.createElement('div');
    item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
    
    const typeIcons = {
        video: '🎬',
        notes: '📚',
        mcqTest: '📝',
        liveClass: '🎓',
        general: '🔔'
    };
    
    const icon = typeIcons[notification.category] || '🔔';
    
    const timeAgo = notification.createdAt ? getTimeAgo(notification.createdAt.toDate()) : 'Just now';
    
    item.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <span class="notification-time">${timeAgo}</span>
        </div>
        ${!notification.read ? '<div class="unread-dot"></div>' : ''}
    `;
    
    item.onclick = () => handleNotificationClick(notification);
    
    return item;
}

// Handle notification click
async function handleNotificationClick(notification) {
    // Mark as read
    if (!notification.read) {
        await NotificationService.markAsRead(notification.id);
    }
    
    // Navigate based on category and relatedId
    if (notification.relatedId) {
        switch(notification.category) {
            case 'video':
            case 'notes':
            case 'mcqTest':
            case 'liveClass':
                // Could navigate to specific content
                break;
        }
    }
    
    toggleNotifications();
}

// Toggle notification panel
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('open');
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    
    const result = await NotificationService.markAllAsRead(userId);
    if (result.success) {
        console.log('All notifications marked as read');
    }
}

// Request browser notification permission
async function requestNotificationPermission() {
    const result = await NotificationService.requestPermission();
    if (result.success) {
        console.log('Browser notifications enabled');
    }
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}

// ═══════════════════════════════════════════════════════════════════════
// DISCUSSION FORUM SYSTEM
// ═══════════════════════════════════════════════════════════════════════

let currentForumFilter = 'all';
let forumUnsubscribe = null;

// Initialize forum when page loads
function initializeForum() {
    loadForumPosts(currentForumFilter);
    
    // Set up real-time listener
    forumUnsubscribe = DiscussionService.listenToPosts(null, (posts) => {
        displayForumPosts(posts);
    });
}

// Load forum posts
async function loadForumPosts(filter = 'all') {
    const container = document.getElementById('forumPostsContainer');
    container.innerHTML = '<div class="loading-placeholder"><p>Loading discussions...</p></div>';
    
    let programType = null;
    if (filter !== 'all') {
        programType = filter;
    }
    
    const result = await DiscussionService.getPosts(programType);
    
    if (result.success) {
        displayForumPosts(result.posts);
    } else {
        container.innerHTML = '<p class="empty-message">Error loading discussions</p>';
    }
}

// Display forum posts
function displayForumPosts(posts) {
    const container = document.getElementById('forumPostsContainer');
    
    if (posts.length === 0) {
        container.innerHTML = '<p class="empty-message">No discussions yet. Be the first to start a conversation!</p>';
        return;
    }
    
    container.innerHTML = '';
    
    posts.forEach(post => {
        const postCard = createForumPostCard(post);
        container.appendChild(postCard);
    });
}

// Create forum post card
function createForumPostCard(post) {
    const card = document.createElement('div');
    card.className = 'forum-post-card';
    
    const timeAgo = post.createdAt ? getTimeAgo(post.createdAt.toDate()) : 'Just now';
    
    card.innerHTML = `
        <div class="post-header">
            <h3 class="post-title">${post.title}</h3>
        </div>
        <div class="post-author">By ${post.userName}</div>
        <div class="post-meta">
            <span>📅 ${timeAgo}</span>
            <span>🏷️ ${post.programType}</span>
            <span>💬 ${post.commentCount || 0} comments</span>
            <span>👍 ${post.upvotes || 0} upvotes</span>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
            <button class="action-btn" onclick="votePost('${post.id}', 'up')">👍 Upvote (${post.upvotes || 0})</button>
            <button class="action-btn" onclick="votePost('${post.id}', 'down')">👎 Downvote (${post.downvotes || 0})</button>
            <button class="action-btn" onclick="viewPostComments('${post.id}')">💬 View Comments</button>
        </div>
        <div class="comment-section" id="comments-${post.id}" style="display: none;">
            <div class="comment-form">
                <input type="text" class="comment-input" placeholder="Add your comment..." id="comment-input-${post.id}">
                <button class="comment-submit" onclick="addCommentToPost('${post.id}')">Post</button>
            </div>
            <div class="comments-list" id="comments-list-${post.id}">
                <p class="loading-comments">Loading comments...</p>
            </div>
        </div>
    `;
    
    return card;
}

// Filter forum posts
function filterForumPosts(filter) {
    currentForumFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(filter)) {
            btn.classList.add('active');
        }
    });
    
    loadForumPosts(filter);
}

// Vote on post
async function votePost(postId, voteType) {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        showNotification('Please login to vote', 'error');
        return;
    }
    
    const result = await DiscussionService.votePost(postId, userId, voteType);
    if (result.success) {
        showNotification('Vote recorded!', 'success');
        // Reload posts to update vote counts
        loadForumPosts(currentForumFilter);
    } else {
        showNotification('Error: ' + result.error, 'error');
    }
}

// View post comments
async function viewPostComments(postId) {
    const commentSection = document.getElementById(`comments-${postId}`);
    commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    
    if (commentSection.style.display === 'block') {
        await loadPostComments(postId);
    }
}

// Load post comments
async function loadPostComments(postId) {
    const result = await DiscussionService.getComments(postId);
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (result.success) {
        if (result.comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        commentsList.innerHTML = '';
        result.comments.forEach(comment => {
            const commentElement = createCommentElement(comment, postId);
            commentsList.appendChild(commentElement);
        });
    } else {
        commentsList.innerHTML = '<p class="error-comments">Error loading comments</p>';
    }
}

// Create comment element
function createCommentElement(comment, postId) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    
    const timeAgo = comment.createdAt ? getTimeAgo(comment.createdAt.toDate()) : 'Just now';
    
    commentElement.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">${comment.userName}</div>
            <div class="comment-date">${timeAgo}</div>
        </div>
        <div class="comment-content">${comment.content}</div>
        <div class="comment-actions">
            <button class="action-btn" onclick="voteComment('${postId}', '${comment.id}', 'up')">👍 (${comment.upvotes || 0})</button>
            <button class="action-btn" onclick="voteComment('${postId}', '${comment.id}', 'down')">👎 (${comment.downvotes || 0})</button>
            <button class="reply-btn" onclick="replyToComment('${postId}', '${comment.id}')">Reply</button>
        </div>
    `;
    
    return commentElement;
}

// Vote on comment
async function voteComment(postId, commentId, voteType) {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        showNotification('Please login to vote', 'error');
        return;
    }
    
    const result = await DiscussionService.voteComment(postId, commentId, userId, voteType);
    if (result.success) {
        showNotification('Vote recorded!', 'success');
        loadPostComments(postId); // Reload comments to update vote counts
    } else {
        showNotification('Error: ' + result.error, 'error');
    }
}

// Add comment to post
async function addCommentToPost(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) {
        showNotification('Please enter a comment', 'error');
        return;
    }
    
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail').split('@')[0];
    
    if (!userId) {
        showNotification('Please login to comment', 'error');
        return;
    }
    
    const commentData = {
        userId,
        userName,
        content
    };
    
    const result = await DiscussionService.addComment(postId, commentData);
    
    if (result.success) {
        input.value = '';
        showNotification('Comment added!', 'success');
        loadPostComments(postId); // Reload comments
    } else {
        showNotification('Error: ' + result.error, 'error');
    }
}

// Reply to comment (placeholder for nested replies)
function replyToComment(postId, commentId) {
    showNotification('Reply functionality coming soon!', 'info');
}

// Show forum modal
function showForumModal() {
    const modal = document.createElement('div');
    modal.className = 'forum-modal show';
    modal.innerHTML = `
        <div class="forum-modal-content">
            <div class="forum-modal-header">
                <h3>Create New Discussion</h3>
                <button class="forum-modal-close" onclick="closeForumModal()">&times;</button>
            </div>
            <div class="forum-modal-body">
                <form class="forum-form" id="createPostForm" onsubmit="createNewPost(event)">
                    <div class="form-group">
                        <label>Post Title *</label>
                        <input type="text" id="postTitle" required placeholder="Enter a descriptive title">
                    </div>
                    <div class="form-group">
                        <label>Program Type *</label>
                        <select id="postProgramType" required>
                            <option value="">-- Select Program --</option>
                            <option value="sikshak-sewa">Sikshak Sewa</option>
                            <option value="loksewa">Loksewa</option>
                            <option value="general">General Discussion</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="postCategory">
                            <option value="general">General</option>
                            <option value="question">Question</option>
                            <option value="resource">Resource Sharing</option>
                            <option value="motivation">Motivation</option>
                            <option value="study">Study Tips</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Content *</label>
                        <textarea id="postContent" required placeholder="Share your thoughts, ask questions, or provide helpful information..."></textarea>
                    </div>
                    <button type="submit" class="forum-form-submit">Create Post</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close forum modal
function closeForumModal() {
    const modal = document.querySelector('.forum-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Create new post
async function createNewPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const programType = document.getElementById('postProgramType').value;
    const category = document.getElementById('postCategory').value;
    const content = document.getElementById('postContent').value;
    
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail').split('@')[0];
    
    if (!userId) {
        showNotification('Please login to create a post', 'error');
        return;
    }
    
    const postData = {
        userId,
        userName,
        title,
        content,
        programType,
        category
    };
    
    showNotification('Creating post...', 'info');
    const result = await DiscussionService.createPost(postData);
    
    if (result.success) {
        showNotification('Post created successfully!', 'success');
        closeForumModal();
        loadForumPosts(currentForumFilter); // Reload posts
    } else {
        showNotification('Error: ' + result.error, 'error');
    }
}

// Add video comments to video modals
function addVideoComments(videoId, programType) {
    // This would be called when a video modal is opened
    // For now, we'll implement it as a placeholder
    console.log('Adding comments for video:', videoId);
}
// Initialize forum when page loads
initializeForum();
