// Program Content Loader - Real-time Firebase Data for Users
// This script dynamically loads content for Sikshak Sewa and Loksewa pages

// Get program type from page
const getProgramType = () => {
    const path = window.location.pathname;
    if (path.includes('sikshak-sewa')) return 'sikshak-sewa';
    if (path.includes('loksewa')) return 'loksewa';
    return null;
};

const programType = getProgramType();

// Store unsubscribe functions for cleanup
const unsubscribeFunctions = [];

// Initialize Content Loading
document.addEventListener('DOMContentLoaded', () => {
    if (!programType) {
        console.error('Unknown program type');
        return;
    }
    
    console.log('Loading content for:', programType);
    
    // Set up real-time listeners for all content types
    setupVideoListener();
    setupNotesListener();
    setupMCQListener();
    setupLiveClassListener();
});

// Clean up listeners when page unloads
window.addEventListener('beforeunload', () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
});

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO LISTENERS & RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function setupVideoListener() {
    const unsubscribe = FirebaseService.listenToVideos(programType, (videos) => {
        console.log(`${programType} videos updated:`, videos.length);
        renderVideos(videos);
    });
    unsubscribeFunctions.push(unsubscribe);
}

function renderVideos(videos) {
    const container = document.querySelector('#videos .content-grid');
    if (!container) return;
    
    if (videos.length === 0) {
        container.innerHTML = '<p class="empty-message">No videos available yet. Check back later!</p>';
        return;
    }
    
    container.innerHTML = '';
    videos.forEach(video => {
        const card = createVideoCard(video);
        container.appendChild(card);
    });
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.onclick = () => playVideoFromFirebase(video);
    
    const durationText = formatDuration(video.duration);
    const viewsText = video.views || 0;
    
    card.innerHTML = `
        <h3>${video.title}</h3>
        <p>${video.description}</p>
        <div class="content-meta">
            <span>📹 Duration: ${durationText}</span>
            <span>👁️ Views: ${viewsText}</span>
        </div>
    `;
    
    return card;
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

async function playVideoFromFirebase(video) {
    // Increment view count
    await FirebaseService.incrementVideoView(video.id);
    
    // Call enhanced video player with progress tracking
    playVideoWithTracking(video);
}

function showVideoModal(video) {
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content video-modal">
            <div class="modal-header">
                <h2>${video.title}</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="video-container">
                    ${getVideoEmbed(video.url)}
                </div>
                <div class="video-details">
                    <h3>Description</h3>
                    <p>${video.description}</p>
                    <p><strong>Duration:</strong> ${formatDuration(video.duration)}</p>
                    <p><strong>Views:</strong> ${video.views || 0}</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

function getVideoEmbed(url) {
    // Check if YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" 
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

// ═══════════════════════════════════════════════════════════════════════════
// NOTES LISTENERS & RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function setupNotesListener() {
    const unsubscribe = FirebaseService.listenToNotes(programType, (notes) => {
        console.log(`${programType} notes updated:`, notes.length);
        renderNotes(notes);
    });
    unsubscribeFunctions.push(unsubscribe);
}

function renderNotes(notes) {
    const container = document.querySelector('#notes .content-grid');
    if (!container) return;
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="empty-message">No notes available yet. Check back later!</p>';
        return;
    }
    
    container.innerHTML = '';
    notes.forEach(note => {
        const card = createNotesCard(note);
        container.appendChild(card);
    });
}

function createNotesCard(note) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    const fileSizeText = formatFileSize(note.fileSize);
    const downloadsText = note.downloads || 0;
    
    card.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.description}</p>
        <div class="content-meta">
            <span>📄 ${note.pages} pages</span>
            <span>💾 ${fileSizeText}</span>
            <span>⬇️ ${downloadsText} downloads</span>
        </div>
        <button class="btn btn-download" onclick="downloadNotesFromFirebase('${note.id}', '${note.fileUrl}', '${note.fileName}')">
            DOWNLOAD PDF
        </button>
    `;
    
    return card;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function downloadNotesFromFirebase(notesId, fileUrl, fileName) {
    // Increment download count\n    await FirebaseService.incrementNotesDownload(notesId);
    
    // Download file
    showNotification('Downloading ' + fileName + '...', 'info');
    
    try {
        // Open file in new tab for download
        window.open(fileUrl, '_blank');
        showNotification('Download started!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Error downloading file', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MCQ TEST LISTENERS & RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function setupMCQListener() {
    const unsubscribe = FirebaseService.listenToMCQTests(programType, (tests) => {
        console.log(`${programType} MCQ tests updated:`, tests.length);
        renderMCQTests(tests);
    });
    unsubscribeFunctions.push(unsubscribe);
}

function renderMCQTests(tests) {
    const container = document.querySelector('#mcq .content-grid');
    if (!container) return;
    
    if (tests.length === 0) {
        container.innerHTML = '<p class="empty-message">No tests available yet. Check back later!</p>';
        return;
    }
    
    container.innerHTML = '';
    tests.forEach(test => {
        const card = createMCQCard(test);
        container.appendChild(card);
    });
}

function createMCQCard(test) {
    const card = document.createElement('div');
    card.className = 'content-card test-card';
    
    const attemptsText = test.attempts || 0;
    
    card.innerHTML = `
        <h3>${test.title}</h3>
        <p>${test.description}</p>
        <div class="content-meta">
            <span>❓ ${test.totalQuestions || 0} questions</span>
            <span>⏰ ${test.timeLimit} minutes</span>
            <span>✅ ${attemptsText} attempts</span>
        </div>
        <button class="btn btn-start" onclick="startTestFromFirebase('${test.id}')">
            START TEST
        </button>
    `;
    
    return card;
}

async function startTestFromFirebase(testId) {
    showNotification('Loading test...', 'info');
    
    const result = await FirebaseService.getMCQTestById(testId);
    
    if (!result.success) {
        showNotification('Error loading test: ' + result.error, 'error');
        return;
    }
    
    const test = result.test;
    
    // Check if test has questions
    if (!test.questions || test.questions.length === 0) {
        showNotification('This test is not ready yet. Questions are being prepared.', 'error');
        return;
    }
    
    // Show test modal
    showTestModal(test);
}

function showTestModal(test) {
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content test-modal">
            <div class="modal-header">
                <h2>MCQ Test Instructions</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="test-instructions">
                    <h3>${test.title}</h3>
                    <p>${test.description}</p>
                    <ul>
                        <li>✓ Read each question carefully before answering</li>
                        <li>✓ You can navigate between questions using Next/Previous buttons</li>
                        <li>✓ Time remaining will be displayed at the top</li>
                        <li>✓ Your progress will be automatically saved</li>
                    </ul>
                    <div class="test-info">
                        <p><strong>Total Questions:</strong> ${test.totalQuestions}</p>
                        <p><strong>Time Limit:</strong> ${test.timeLimit} minutes</p>
                        <p><strong>Passing Score:</strong> ${test.passingScore}%</p>
                    </div>
                    <div class="test-actions">
                        <button class="btn" onclick="beginTestInterface('${test.id}')">BEGIN TEST</button>
                        <button class="btn back-btn" onclick="closeModal()">CANCEL</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

async function beginTestInterface(testId) {
    // This would open the full test interface
    // For now, show placeholder
    closeModal();
    showNotification('Test interface will be implemented with full question management', 'info');
    
    // Record that user started the test
    const userId = auth.currentUser?.uid;
    if (userId) {
        // Save test attempt start
        console.log('User', userId, 'started test', testId);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE CLASS LISTENERS & RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function setupLiveClassListener() {
    const unsubscribe = FirebaseService.listenToLiveClasses(programType, (classes) => {
        console.log(`${programType} live classes updated:`, classes.length);
        renderLiveClasses(classes);
    });
    unsubscribeFunctions.push(unsubscribe);
}

function renderLiveClasses(classes) {
    const container = document.querySelector('#live .content-grid');
    if (!container) return;
    
    if (classes.length === 0) {
        container.innerHTML = '<p class="empty-message">No live classes scheduled yet. Check back later!</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Separate upcoming and past classes
    const now = new Date();
    const upcomingClasses = classes.filter(c => new Date(c.scheduledDateTime) > now);
    const pastClasses = classes.filter(c => new Date(c.scheduledDateTime) <= now);
    
    upcomingClasses.forEach(classData => {
        const card = createLiveClassCard(classData, true);
        container.appendChild(card);
    });
    
    pastClasses.forEach(classData => {
        const card = createLiveClassCard(classData, false);
        container.appendChild(card);
    });
}

function createLiveClassCard(classData, isUpcoming) {
    const card = document.createElement('div');
    card.className = `content-card ${isUpcoming ? 'live-card' : 'scheduled-card'}`;
    
    const scheduleDate = new Date(classData.scheduledDateTime);
    const dateStr = scheduleDate.toLocaleString();
    const participants = classData.participants || 0;
    
    const badge = isUpcoming ? 
        '<div class="live-badge">📅 UPCOMING</div>' :
        '<div class="scheduled-badge">✓ COMPLETED</div>';
    
    const button = isUpcoming ?
        `<button class="btn btn-join" onclick="joinLiveClassFromFirebase('${classData.id}', '${classData.meetingLink}')">JOIN CLASS</button>` :
        `<button class="btn" disabled>COMPLETED</button>`;
    
    card.innerHTML = `
        ${badge}
        <h3>${classData.title}</h3>
        <p>${classData.description}</p>
        <div class="content-meta">
            <span>📆 ${dateStr}</span>
            <span>⏱️ ${classData.duration} hours</span>
            <span>👥 ${participants} participants</span>
        </div>
        ${button}
    `;
    
    return card;
}

async function joinLiveClassFromFirebase(classId, meetingLink) {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
        showNotification('Please log in to join live classes', 'error');
        return;
    }
    
    showNotification('Joining live class...', 'info');
    
    try {
        // Record participation
        await FirebaseService.joinLiveClass(classId, userId);
        
        // Open meeting link
        window.open(meetingLink, '_blank');
        
        showNotification('Joined successfully! Opening meeting...', 'success');
    } catch (error) {
        console.error('Error joining class:', error);
        showNotification('Error joining class: ' + error.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    return modal;
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
