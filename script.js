// Smooth scroll behavior
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initAnimations();
    
    // Tab functionality for dynamic pages
    initTabs();
    
    // Smooth scrolling for scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const programsSection = document.querySelector('.programs');
            if (programsSection) {
                programsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Add intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe program cards
    const programCards = document.querySelectorAll('.program-card');
    programCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });
});

// Initialize animations
function initAnimations() {
    // Counter animation for stats
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = stat.textContent;
        animateCounter(stat, target);
    });
}

// Animate counter
function animateCounter(element, target) {
    const duration = 2000;
    const start = 0;
    const end = parseInt(target.replace(/\D/g, ''));
    const suffix = target.replace(/[\d,]/g, '');
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString() + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(update);
}

// Tab functionality for dynamic pages
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Video player function
function playVideo(videoId) {
    showNotification(`Loading video: ${videoId}`, 'info');
    
    // Create modal for video player
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content video-modal">
            <div class="modal-header">
                <h2>Video Player</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="video-container">
                    <div class="video-placeholder">
                        <div class="play-icon">▶</div>
                        <p>Video Player: ${videoId}</p>
                        <p class="video-info">This is a demo. In production, this would load the actual video content.</p>
                    </div>
                </div>
                <div class="video-details">
                    <h3>Video Information</h3>
                    <p>Quality: HD 1080p</p>
                    <p>Subtitles: Available in Nepali and English</p>
                    <p>Download: Available for offline viewing</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Join live class function
function joinLiveClass(classId) {
    showNotification('Connecting to live class...', 'info');
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content live-modal">
            <div class="modal-header">
                <h2>🔴 Live Class</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="live-stream-container">
                    <div class="stream-placeholder">
                        <div class="live-indicator">● LIVE</div>
                        <p>Live Stream: ${classId}</p>
                        <p class="stream-info">This is a demo. In production, this would connect to the live stream.</p>
                    </div>
                </div>
                <div class="live-chat">
                    <h3>Live Chat</h3>
                    <div class="chat-messages">
                        <div class="chat-message">
                            <strong>Student1:</strong> Great explanation!
                        </div>
                        <div class="chat-message">
                            <strong>Student2:</strong> Can you repeat that point?
                        </div>
                        <div class="chat-message">
                            <strong>Instructor:</strong> Sure, let me clarify...
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" placeholder="Type your message...">
                        <button class="btn">Send</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Register for class function
function registerClass(classId) {
    showNotification('Registration successful! You will receive a reminder before the class starts.', 'success');
    
    // Add visual feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✓ REGISTERED';
    button.style.background = '#4CAF50';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        button.disabled = false;
    }, 3000);
}

// Download notes function
function downloadNotes(notesId) {
    showNotification(`Preparing download: ${notesId}`, 'info');
    
    // Simulate download
    setTimeout(() => {
        showNotification('Download started! Check your downloads folder.', 'success');
    }, 1000);
}

// Start test function
function startTest(testId) {
    showNotification('Loading test...', 'info');
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content test-modal">
            <div class="modal-header">
                <h2>MCQ Test Instructions</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="test-instructions">
                    <h3>Test: ${testId}</h3>
                    <ul>
                        <li>✓ Read each question carefully before answering</li>
                        <li>✓ You can navigate between questions using Next/Previous buttons</li>
                        <li>✓ Mark questions for review if you're unsure</li>
                        <li>✓ Submit the test only when you've answered all questions</li>
                        <li>✓ Time remaining will be displayed at the top</li>
                        <li>✓ Your progress will be automatically saved</li>
                    </ul>
                    <div class="test-info">
                        <p><strong>Total Questions:</strong> 50</p>
                        <p><strong>Total Marks:</strong> 100</p>
                        <p><strong>Time Limit:</strong> 60 minutes</p>
                        <p><strong>Passing Marks:</strong> 40%</p>
                    </div>
                    <div class="test-actions">
                        <button class="btn" onclick="beginTest('${testId}')">BEGIN TEST</button>
                        <button class="btn back-btn" onclick="closeModal()">CANCEL</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Begin test function
function beginTest(testId) {
    closeModal();
    showNotification('Test started! Good luck!', 'success');
    
    // In production, this would navigate to the test interface
    setTimeout(() => {
        const testModal = createModal();
        testModal.innerHTML = `
            <div class="modal-content test-interface">
                <div class="modal-header">
                    <h2>Question 1 of 50</h2>
                    <div class="timer">⏱️ 59:45</div>
                    <button class="close-modal" onclick="confirmExit()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="question">
                        <h3>Sample Question</h3>
                        <p>What is the capital of Nepal?</p>
                        <div class="options">
                            <label class="option">
                                <input type="radio" name="answer" value="a">
                                <span>A) Pokhara</span>
                            </label>
                            <label class="option">
                                <input type="radio" name="answer" value="b">
                                <span>B) Kathmandu</span>
                            </label>
                            <label class="option">
                                <input type="radio" name="answer" value="c">
                                <span>C) Lalitpur</span>
                            </label>
                            <label class="option">
                                <input type="radio" name="answer" value="d">
                                <span>D) Bhaktapur</span>
                            </label>
                        </div>
                    </div>
                    <div class="test-navigation">
                        <button class="btn">Previous</button>
                        <button class="btn">Mark for Review</button>
                        <button class="btn">Next</button>
                        <button class="btn" onclick="submitTest()">Submit Test</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(testModal);
        setTimeout(() => testModal.classList.add('show'), 10);
    }, 500);
}

// Submit test function
function submitTest() {
    if (confirm('Are you sure you want to submit the test?')) {
        closeModal();
        showNotification('Test submitted successfully! You will receive your results shortly.', 'success');
    }
}

// Confirm exit function
function confirmExit() {
    if (confirm('Are you sure you want to exit the test? Your progress will be saved.')) {
        closeModal();
    }
}

// Create modal
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

// Close modal
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
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

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Prevent right-click on content cards (optional security)
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.content-card')) {
        // Uncomment to prevent right-click
        // e.preventDefault();
    }
});

// Add touch support for mobile devices
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left
            const activeTab = document.querySelector('.tab-btn.active');
            const nextTab = activeTab?.nextElementSibling;
            if (nextTab && nextTab.classList.contains('tab-btn')) {
                nextTab.click();
            }
        } else {
            // Swipe right
            const activeTab = document.querySelector('.tab-btn.active');
            const prevTab = activeTab?.previousElementSibling;
            if (prevTab && prevTab.classList.contains('tab-btn')) {
                prevTab.click();
            }
        }
    }
}

// Page load performance
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Add loading state
document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('loading');
    
    window.addEventListener('load', function() {
        setTimeout(() => {
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
        }, 500);
    });
});

// Toggle Read More functionality
function toggleReadMore(button) {
    const infoCard = button.closest('.info-card');
    const preview = infoCard.querySelector('.info-preview');
    const full = infoCard.querySelector('.info-full');
    
    if (full.style.display === 'none') {
        // Show full text
        preview.style.display = 'none';
        full.style.display = 'block';
        button.textContent = 'Read Less';
        button.classList.add('expanded');
    } else {
        // Show preview
        preview.style.display = 'block';
        full.style.display = 'none';
        button.textContent = 'Read More';
        button.classList.remove('expanded');
    }
}
