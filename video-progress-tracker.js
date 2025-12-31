// Video Progress Tracking Module
// Handles watch time, resume, completion, and certificate generation

let progressTrackingInterval = null;
let lastSavedTime = 0;
let startWatchTime = 0;
let currentVideoData = null;

// Enhanced play video with progress tracking
async function playVideoWithTracking(video) {
    // Increment view count
    await FirebaseService.incrementVideoView(video.id);
    
    const userId = sessionStorage.getItem('userId');
    
    // Get saved progress if user is logged in
    let savedProgress = null;
    if (userId) {
        const progressResult = await FirebaseService.getVideoProgress(userId, video.id);
        if (progressResult.success && progressResult.progress) {
            savedProgress = progressResult.progress;
        }
    }
    
    currentVideoData = video;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content video-modal">
            <div class="modal-header">
                <h2>${video.title}</h2>
                <button class="close-modal" onclick="closeVideoModalWithTracking()">&times;</button>
            </div>
            ${savedProgress && !savedProgress.completed && savedProgress.currentTime > 30 ? `
                <div class="video-resume-banner">
                    <p>⏱️ You left off at ${formatVideoTime(savedProgress.currentTime)}</p>
                    <button class="btn-small" onclick="resumeVideo(${savedProgress.currentTime})">Resume</button>
                    <button class="btn-text-small" onclick="startFromBeginning()">Start from beginning</button>
                </div>
            ` : ''}
            <div class="modal-body">
                <div class="video-container">
                    ${getVideoEmbedWithTracking(video.url, video.id)}
                </div>
                <div class="video-progress-indicator">
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="progressBar-${video.id}" style="width: ${savedProgress ? savedProgress.percentageWatched : 0}%"></div>
                    </div>
                    <p class="progress-text" id="progressText-${video.id}">${savedProgress ? savedProgress.percentageWatched : 0}% completed</p>
                </div>
                ${savedProgress && savedProgress.completed ? `
                    <div class="completion-badge">
                        ✓ Video Completed
                    </div>
                ` : ''}
                <div class="video-details">
                    <h3>Description</h3>
                    <p>${video.description}</p>
                    <p><strong>Duration:</strong> ${formatDuration(video.duration)}</p>
                    <p><strong>Views:</strong> ${video.views || 0}</p>
                </div>
                
                <!-- Video Comments Section -->
                <div class="video-comments-section">
                    <h3>💬 Video Comments</h3>
                    <div class="comment-form">
                        <input type="text" class="comment-input" placeholder="Share your thoughts about this video..." id="video-comment-input-${video.id}">
                        <button class="comment-submit" onclick="addVideoComment('${video.id}', '${video.programType}')">Comment</button>
                    </div>
                    <div class="comments-list" id="video-comments-${video.id}">
                        <p class="loading-comments">Loading comments...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Start progress tracking if user is logged in
    if (userId) {
        const videoDurationSeconds = video.duration * 60; // Convert minutes to seconds
        lastSavedTime = savedProgress && savedProgress.currentTime ? savedProgress.currentTime : 0;
        startVideoProgressTracking(video.id, userId, videoDurationSeconds);
        
        // Load video comments
        setTimeout(() => loadVideoComments(video.id), 1000);
    }
}

function getVideoEmbedWithTracking(url, videoId) {
    // Check if YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const ytId = extractYouTubeId(url);
        if (ytId) {
            return `<iframe id="videoPlayer-${videoId}" width="100%" height="450" 
                    src="https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0" 
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>`;
        }
    }
    
    // Default video player
    return `
        <div class="video-placeholder">
            <div class="play-icon">▶</div>
            <p>Video URL: ${url}</p>
            <p class="video-info">Click to open in new window</p>
            <a href="${url}" target="_blank" class="btn">Open Video</a>
        </div>
    `;
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function startVideoProgressTracking(videoId, userId, videoDuration) {
    // Clear any existing interval
    if (progressTrackingInterval) {
        clearInterval(progressTrackingInterval);
    }
    
    startWatchTime = Date.now();
    
    // Save progress every 15 seconds
    progressTrackingInterval = setInterval(async () => {
        try {
            // Calculate elapsed time since last save
            const elapsedSeconds = Math.floor((Date.now() - startWatchTime) / 1000);
            const currentTime = lastSavedTime + elapsedSeconds;
            
            // Don't track beyond video duration
            if (currentTime > videoDuration) {
                // Mark video as complete
                await FirebaseService.markVideoComplete(userId, videoId, { duration: videoDuration });
                clearInterval(progressTrackingInterval);
                
                // Update UI to show completion
                updateProgressUI(videoId, 100);
                showCompletionMessage(videoId);
                
                // Check certificate eligibility
                const programType = currentVideoData.programType;
                checkAndShowCertificateEligibility(userId, programType);
                
                return;
            }
            
            const watchedDuration = elapsedSeconds;
            
            // Save progress to Firestore
            await FirebaseService.saveVideoProgress(userId, videoId, {
                currentTime,
                duration: videoDuration,
                watchedDuration,
                completed: false
            });
            
            // Update UI progress bar
            const percentage = Math.min(Math.floor((currentTime / videoDuration) * 100), 100);
            updateProgressUI(videoId, percentage);
            
            // Reset for next interval
            lastSavedTime = currentTime;
            startWatchTime = Date.now();
        } catch (error) {
            console.error('Error tracking video progress:', error);
        }
    }, 15000); // Every 15 seconds
}

function updateProgressUI(videoId, percentage) {
    const progressBar = document.getElementById(`progressBar-${videoId}`);
    const progressText = document.getElementById(`progressText-${videoId}`);
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = `${percentage}% completed`;
    }
}

function showCompletionMessage(videoId) {
    const modal = document.querySelector('.video-modal');
    if (!modal) return;
    
    const completionBadge = document.createElement('div');
    completionBadge.className = 'completion-badge animate-in';
    completionBadge.innerHTML = '✓ Video Completed!';
    
    const videoDetails = modal.querySelector('.video-details');
    if (videoDetails) {
        videoDetails.insertBefore(completionBadge, videoDetails.firstChild);
    }
}

async function checkAndShowCertificateEligibility(userId, programType) {
    try {
        const eligibility = await FirebaseService.checkCertificateEligibility(userId, programType);
        
        if (eligibility.success && eligibility.eligible) {
            // User is eligible for certificate
            showCertificateNotification(programType, eligibility);
        }
    } catch (error) {
        console.error('Error checking certificate eligibility:', error);
    }
}

function showCertificateNotification(programType, eligibilityData) {
    // Remove any existing certificate notification
    const existing = document.querySelector('.certificate-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'certificate-notification show';
    notification.innerHTML = `
        <div class="certificate-content">
            <div class="certificate-icon">🏆</div>
            <h3>Congratulations!</h3>
            <p>You've completed <strong>${eligibilityData.completionPercentage}%</strong> of ${programType} videos!</p>
            <p>You're eligible for a completion certificate.</p>
            <div class="certificate-actions">
                <button class="btn btn-certificate" onclick="claimCertificate('${programType}')">Generate Certificate</button>
                <button class="btn btn-secondary" onclick="this.closest('.certificate-notification').remove()">Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 30 seconds if not interacted with
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 30000);
}

async function claimCertificate(programType) {
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail')?.split('@')[0] || 'Student';
    
    // Show loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Generating...';
    btn.disabled = true;
    
    try {
        const result = await FirebaseService.generateCertificate(userId, programType, userName);
        
        if (result.success) {
            // Show success notification
            showNotificationMessage('Certificate Generated Successfully!', `Certificate ID: ${result.certificate.certificateId}`, 'success');
            
            // Remove certificate notification
            document.querySelector('.certificate-notification').remove();
            
            // Optionally download or display certificate
            displayCertificate(result.certificate);
        } else {
            showNotificationMessage('Error', result.error, 'error');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error claiming certificate:', error);
        showNotificationMessage('Error', 'Failed to generate certificate', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function displayCertificate(certificate) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content certificate-modal">
            <div class="modal-header">
                <h2>🎓 Completion Certificate</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="certificate-display">
                    <div class="certificate-border">
                        <h1>LAKSHYA EDUCATION</h1>
                        <h3>Certificate of Completion</h3>
                        <p class="certificate-text">This is to certify that</p>
                        <h2 class="certificate-name">${certificate.userName}</h2>
                        <p class="certificate-text">has successfully completed</p>
                        <h3 class="certificate-program">${certificate.programType.toUpperCase()}</h3>
                        <p class="certificate-text">with ${certificate.completionPercentage}% completion</p>
                        <div class="certificate-footer">
                            <p class="certificate-id">Certificate ID: ${certificate.certificateId}</p>
                            <p class="certificate-date">Issued: ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="certificate-actions-bottom">
                        <button class="btn" onclick="downloadCertificate('${certificate.certificateId}')">Download PDF</button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function downloadCertificate(certificateId) {
    // In a real implementation, this would generate a PDF
    // For now, we'll create a simple HTML download
    alert(`Certificate ${certificateId} download would start here. In production, this would generate a PDF.`);
}

function resumeVideo(startTime) {
    lastSavedTime = startTime;
    startWatchTime = Date.now();
    const banner = document.querySelector('.video-resume-banner');
    if (banner) {
        banner.style.display = 'none';
    }
    // Note: Actual seeking in YouTube iframe requires YouTube IFrame API
}

function startFromBeginning() {
    lastSavedTime = 0;
    startWatchTime = Date.now();
    const banner = document.querySelector('.video-resume-banner');
    if (banner) {
        banner.style.display = 'none';
    }
}

function closeVideoModalWithTracking() {
    // Stop tracking when modal closes
    if (progressTrackingInterval) {
        clearInterval(progressTrackingInterval);
        progressTrackingInterval = null;
    }
    
    // Reset tracking variables
    lastSavedTime = 0;
    startWatchTime = 0;
    currentVideoData = null;
    
    // Close modal
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
}

function formatVideoTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

function showNotificationMessage(title, message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (progressTrackingInterval) {
        clearInterval(progressTrackingInterval);
    }
});

// Add video comment functionality
async function addVideoComment(videoId, programType) {
    const input = document.getElementById(`video-comment-input-${videoId}`);
    const content = input.value.trim();
    
    if (!content) {
        showNotificationMessage('Please enter a comment', 'Please enter your comment', 'error');
        return;
    }
    
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail')?.split('@')[0] || 'User';
    
    if (!userId) {
        showNotificationMessage('Login Required', 'Please login to comment', 'error');
        return;
    }
    
    const commentData = {
        userId,
        userName,
        content
    };
    
    const result = await DiscussionService.addVideoComment(videoId, commentData);
    
    if (result.success) {
        input.value = '';
        showNotificationMessage('Success', 'Comment added successfully!', 'success');
        loadVideoComments(videoId); // Reload comments
    } else {
        showNotificationMessage('Error', result.error, 'error');
    }
}

async function loadVideoComments(videoId) {
    const result = await DiscussionService.getVideoComments(videoId);
    const commentsList = document.getElementById(`video-comments-${videoId}`);
    
    if (result.success) {
        if (result.comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        commentsList.innerHTML = '';
        result.comments.forEach(comment => {
            const commentElement = createVideoCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    } else {
        commentsList.innerHTML = '<p class="error-comments">Error loading comments</p>';
    }
}

function createVideoCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    
    const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'Just now';
    
    commentElement.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">${comment.userName}</div>
            <div class="comment-date">${timeAgo}</div>
        </div>
        <div class="comment-content">${comment.content}</div>
        <div class="comment-actions">
            <button class="action-btn" onclick="voteVideoComment('${comment.id}', 'up')">👍 (${comment.upvotes || 0})</button>
            <button class="action-btn" onclick="voteVideoComment('${comment.id}', 'down')">👎 (${comment.downvotes || 0})</button>
        </div>
    `;
    
    return commentElement;
}

async function voteVideoComment(commentId, voteType) {
    const videoId = getCurrentVideoId(); // This would need to be implemented
    const userId = sessionStorage.getItem('userId');
    
    if (!videoId || !userId) return;
    
    const result = await DiscussionService.voteVideoComment(videoId, commentId, userId, voteType);
    if (result.success) {
        showNotificationMessage('Vote Recorded', 'Your vote has been recorded', 'success');
        loadVideoComments(videoId);
    } else {
        showNotificationMessage('Error', result.error, 'error');
    }
}

function getCurrentVideoId() {
    // This would return the current video ID from the modal
    const modal = document.querySelector('.video-modal');
    if (modal) {
        // Extract video ID from the modal elements
        const progressBar = modal.querySelector('.progress-bar');
        if (progressBar && progressBar.id.includes('progressBar-')) {
            return progressBar.id.replace('progressBar-', '');
        }
    }
    return null;
}

function formatTimeAgo(date) {
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
