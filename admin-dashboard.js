// Admin Dashboard Script - Real Backend Implementation

// Protect this page - only admin can access
document.addEventListener('DOMContentLoaded', () => {
    if (!protectAdminRoute()) {
        return;
    }
    
    // Initialize admin dashboard
    initAdminDashboard();
});

// Initialize Admin Dashboard
function initAdminDashboard() {
    // Set up tab switching
    setupTabs();
    
    // Load existing content
    loadAllContent();
    
    // Load MCQ tests
    loadMCQTests();
    
    // Load live classes
    loadLiveClasses();
    
    // Update statistics
    updateContentStats();
    
    // Set up real-time listeners
    setupRealtimeListeners();
}

// Setup Tab Switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Handle Video Upload - Real Firebase Implementation
async function handleVideoUpload(event) {
    event.preventDefault();
    
    const programType = document.getElementById('videoProgramType').value;
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value;
    const duration = document.getElementById('videoDuration').value;
    const url = document.getElementById('videoUrl').value;
    
    const videoData = {
        programType,
        title,
        description,
        duration,
        url,
        thumbnail: '' // Can be extracted from YouTube URL or provided separately
    };
    
    showNotification('Uploading video...', 'info');
    
    try {
        const result = await FirebaseService.uploadVideo(videoData);
        
        if (result.success) {
            showNotification('Video uploaded successfully!', 'success');
            document.getElementById('videoUploadForm').reset();
            updateContentStats();
            
            // Send notification to all users
            await NotificationService.notifyNewContent('video', {
                id: result.id,
                title,
                programType
            });
            
            // Content will auto-update via real-time listener
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        showNotification('Error uploading video: ' + error.message, 'error');
    }
}

// Handle Notes Upload - Real Firebase Storage Implementation
async function handleNotesUpload(event) {
    event.preventDefault();
    
    const programType = document.getElementById('notesProgramType').value;
    const title = document.getElementById('notesTitle').value;
    const description = document.getElementById('notesDescription').value;
    const pages = document.getElementById('notesPages').value;
    const file = document.getElementById('notesFile').files[0];
    
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please upload a PDF or Word document', 'error');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }
    
    const notesData = {
        programType,
        title,
        description,
        pages
    };
    
    showNotification('Uploading file to Firebase Storage...', 'info');
    
    try {
        const result = await FirebaseService.uploadNotes(notesData, file);
        
        if (result.success) {
            showNotification('Notes uploaded successfully!', 'success');
            document.getElementById('notesUploadForm').reset();
            updateContentStats();
            // Content will auto-update via real-time listener
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error uploading notes:', error);
        showNotification('Error uploading notes: ' + error.message, 'error');
    }
}

// Handle MCQ Test Creation - Real Backend with Question Management
async function handleMCQCreate(event) {
    event.preventDefault();
    
    const programType = document.getElementById('mcqProgramType').value;
    const title = document.getElementById('mcqTitle').value;
    const description = document.getElementById('mcqDescription').value;
    const questionsCount = document.getElementById('mcqQuestions').value;
    const timeLimit = document.getElementById('mcqTime').value;
    
    // For now, create test structure - questions can be added separately
    const testData = {
        programType,
        title,
        description,
        timeLimit,
        passingScore: 40,
        questions: [] // Questions will be added via edit functionality
    };
    
    showNotification('Creating MCQ test...', 'info');
    
    try {
        const result = await FirebaseService.createMCQTest(testData);
        
        if (result.success) {
            showNotification('MCQ Test created successfully! Add questions to complete.', 'success');
            document.getElementById('mcqCreateForm').reset();
            loadMCQTests();
            updateContentStats();
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error creating MCQ test:', error);
        showNotification('Error creating test: ' + error.message, 'error');
    }
}

// Handle Live Class Schedule - Real Backend Implementation
async function handleLiveClassSchedule(event) {
    event.preventDefault();
    
    const programType = document.getElementById('liveProgramType').value;
    const title = document.getElementById('liveTitle').value;
    const description = document.getElementById('liveDescription').value;
    const dateTime = document.getElementById('liveDateTime').value;
    const duration = document.getElementById('liveDuration').value;
    const meetingLink = document.getElementById('liveMeetingLink').value;
    
    const classData = {
        programType,
        title,
        description,
        scheduledDateTime: dateTime,
        duration,
        meetingLink
    };
    
    showNotification('Scheduling live class...', 'info');
    
    try {
        const result = await FirebaseService.scheduleLiveClass(classData);
        
        if (result.success) {
            showNotification('Live class scheduled successfully!', 'success');
            document.getElementById('liveClassForm').reset();
            loadLiveClasses();
            updateContentStats();
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error scheduling class:', error);
        showNotification('Error scheduling class: ' + error.message, 'error');
    }
}

// Load MCQ Tests - Real Backend
async function loadMCQTests() {
    try {
        const result = await FirebaseService.getMCQTests();
        const listElement = document.getElementById('mcqTestsList');
        
        if (!result.success || result.tests.length === 0) {
            listElement.innerHTML = '<p class="empty-message">No tests created yet.</p>';
            return;
        }
        
        listElement.innerHTML = '';
        result.tests.forEach(test => {
            const item = createContentItem(test.id, test, 'mcq');
            listElement.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading MCQ tests:', error);
    }
}

// Load Live Classes - Real Backend
async function loadLiveClasses() {
    try {
        const result = await FirebaseService.getLiveClasses();
        const listElement = document.getElementById('liveClassesList');
        
        if (!result.success || result.classes.length === 0) {
            listElement.innerHTML = '<p class="empty-message">No classes scheduled yet.</p>';
            return;
        }
        
        listElement.innerHTML = '';
        result.classes.forEach(classData => {
            const item = createContentItem(classData.id, classData, 'live-class');
            listElement.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading live classes:', error);
    }
}

// Load All Content - Real Backend
async function loadAllContent() {
    try {
        const listElement = document.getElementById('allContentList');
        listElement.innerHTML = '<p class="empty-message">Loading content...</p>';
        
        // Fetch all content types
        const [videosResult, notesResult, testsResult, classesResult] = await Promise.all([
            FirebaseService.getVideos(),
            FirebaseService.getNotes(),
            FirebaseService.getMCQTests(),
            FirebaseService.getLiveClasses()
        ]);
        
        const allContent = [];
        
        if (videosResult.success) {
            videosResult.videos.forEach(v => allContent.push({...v, type: 'video'}));
        }
        
        if (notesResult.success) {
            notesResult.notes.forEach(n => allContent.push({...n, type: 'notes'}));
        }
        
        if (testsResult.success) {
            testsResult.tests.forEach(t => allContent.push({...t, type: 'mcq'}));
        }
        
        if (classesResult.success) {
            classesResult.classes.forEach(c => allContent.push({...c, type: 'live-class'}));
        }
        
        if (allContent.length === 0) {
            listElement.innerHTML = '<p class="empty-message">No content available.</p>';
            return;
        }
        
        // Sort by creation date
        allContent.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.uploadedAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.uploadedAt || b.timestamp || 0);
            return dateB - dateA;
        });
        
        listElement.innerHTML = '';
        allContent.forEach(content => {
            const item = createContentItem(content.id, content, content.type);
            listElement.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('allContentList').innerHTML = 
            '<p class="empty-message">Error loading content. Please refresh.</p>';
    }
}

// Create Content Item Element
function createContentItem(id, data, contentType) {
    const item = document.createElement('div');
    item.className = 'content-item';
    
    const typeIcons = {
        'video': '📹',
        'notes': '📄',
        'mcq': '📝',
        'live-class': '🎓'
    };
    
    const displayDate = data.uploadedAt || data.createdAt || data.scheduledDateTime || data.timestamp;
    const dateStr = displayDate ? new Date(displayDate.seconds ? displayDate.seconds * 1000 : displayDate).toLocaleDateString() : 'N/A';
    
    const info = document.createElement('div');
    info.className = 'content-item-info';
    info.innerHTML = `
        <h4>${typeIcons[contentType]} ${data.title}</h4>
        <p>${data.programType} • ${contentType} • ${dateStr}</p>
    `;
    
    const actions = document.createElement('div');
    actions.className = 'content-item-actions';
    actions.innerHTML = `
        <button class="item-action-btn delete-btn" onclick="deleteContent('${id}', '${contentType}', '${data.fileUrl || ''}')">Delete</button>
    `;
    
    item.appendChild(info);
    item.appendChild(actions);
    
    return item;
}

// Delete Content - Real Backend with Type-Specific Deletion
async function deleteContent(id, contentType, fileUrl) {
    if (!confirm('Are you sure you want to delete this content?')) {
        return;
    }
    
    showNotification('Deleting content...', 'info');
    
    try {
        let result;
        
        switch(contentType) {
            case 'video':
                result = await FirebaseService.deleteVideo(id);
                break;
            case 'notes':
                result = await FirebaseService.deleteNotes(id, fileUrl);
                break;
            case 'mcq':
                result = await FirebaseService.deleteMCQTest(id);
                break;
            case 'live-class':
                result = await FirebaseService.deleteLiveClass(id);
                break;
            default:
                showNotification('Unknown content type', 'error');
                return;
        }
        
        if (result.success) {
            showNotification('Content deleted successfully', 'success');
            // Reload the specific content list
            if (contentType === 'mcq') loadMCQTests();
            if (contentType === 'live-class') loadLiveClasses();
            loadAllContent();
            updateContentStats();
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        showNotification('Error deleting content: ' + error.message, 'error');
    }
}

// Update Content Statistics - Real Backend
async function updateContentStats() {
    try {
        const result = await FirebaseService.getContentStats();
        
        if (result.success) {
            document.getElementById('totalVideos').textContent = result.stats.videos;
            document.getElementById('totalNotes').textContent = result.stats.notes;
            document.getElementById('totalTests').textContent = result.stats.tests;
            document.getElementById('totalClasses').textContent = result.stats.classes;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Filter Content - Real Backend
async function filterContent() {
    const filter = document.getElementById('contentFilter').value;
    const listElement = document.getElementById('allContentList');
    
    listElement.innerHTML = '<p class="empty-message">Loading filtered content...</p>';
    
    try {
        const programType = filter === 'all' ? null : filter;
        
        const [videosResult, notesResult, testsResult, classesResult] = await Promise.all([
            FirebaseService.getVideos(programType),
            FirebaseService.getNotes(programType),
            FirebaseService.getMCQTests(programType),
            FirebaseService.getLiveClasses(programType)
        ]);
        
        const allContent = [];
        
        if (videosResult.success) {
            videosResult.videos.forEach(v => allContent.push({...v, type: 'video'}));
        }
        
        if (notesResult.success) {
            notesResult.notes.forEach(n => allContent.push({...n, type: 'notes'}));
        }
        
        if (testsResult.success) {
            testsResult.tests.forEach(t => allContent.push({...t, type: 'mcq'}));
        }
        
        if (classesResult.success) {
            classesResult.classes.forEach(c => allContent.push({...c, type: 'live-class'}));
        }
        
        if (allContent.length === 0) {
            listElement.innerHTML = '<p class="empty-message">No content available for this filter.</p>';
            return;
        }
        
        allContent.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.uploadedAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.uploadedAt || b.timestamp || 0);
            return dateB - dateA;
        });
        
        listElement.innerHTML = '';
        allContent.forEach(content => {
            const item = createContentItem(content.id, content, content.type);
            listElement.appendChild(item);
        });
    } catch (error) {
        console.error('Error filtering content:', error);
        listElement.innerHTML = '<p class="empty-message">Error filtering content.</p>';
    }
}

// Setup Real-time Listeners for Instant Updates
function setupRealtimeListeners() {
    console.log('Setting up real-time listeners for admin dashboard...');
    
    // Listen to all videos
    FirebaseService.listenToVideos(null, (videos) => {
        console.log('Videos updated:', videos.length);
        updateContentStats();
    });
    
    // Listen to all notes
    FirebaseService.listenToNotes(null, (notes) => {
        console.log('Notes updated:', notes.length);
        updateContentStats();
    });
    
    // Listen to MCQ tests
    FirebaseService.listenToMCQTests(null, (tests) => {
        console.log('MCQ tests updated:', tests.length);
        const listElement = document.getElementById('mcqTestsList');
        if (tests.length === 0) {
            listElement.innerHTML = '<p class="empty-message">No tests created yet.</p>';
        } else {
            listElement.innerHTML = '';
            tests.forEach(test => {
                const item = createContentItem(test.id, test, 'mcq');
                listElement.appendChild(item);
            });
        }
        updateContentStats();
    });
    
    // Listen to live classes
    FirebaseService.listenToLiveClasses(null, (classes) => {
        console.log('Live classes updated:', classes.length);
        const listElement = document.getElementById('liveClassesList');
        if (classes.length === 0) {
            listElement.innerHTML = '<p class="empty-message">No classes scheduled yet.</p>';
        } else {
            listElement.innerHTML = '';
            classes.forEach(classData => {
                const item = createContentItem(classData.id, classData, 'live-class');
                listElement.appendChild(item);
            });
        }
        updateContentStats();
    });
}

// Handle Admin Logout
async function handleAdminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        const result = await signOut();
        if (result.success) {
            window.location.href = 'login.html';
        }
    }
}

// Show Notification (reuse from main script)
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

// ═══════════════════════════════════════════════════════════════════════
// QUESTION BANK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

let currentTestId = null;
let currentTestData = null;

// Load all tests into the selector
async function loadTestSelector() {
    const result = await FirebaseService.getMCQTests();
    const testSelector = document.getElementById('testSelector');
    
    if (result.success && result.tests.length > 0) {
        testSelector.innerHTML = '<option value="">-- Select a test --</option>';
        result.tests.forEach(test => {
            const option = document.createElement('option');
            option.value = test.id;
            option.textContent = `${test.title} (${test.programType}) - ${test.totalQuestions || 0} questions`;
            testSelector.appendChild(option);
        });
    } else {
        testSelector.innerHTML = '<option value="">No tests available</option>';
    }
}

// Load questions for selected test
async function loadTestQuestions() {
    const testSelector = document.getElementById('testSelector');
    const testId = testSelector.value;
    const container = document.getElementById('questionBankContainer');
    
    if (!testId) {
        container.style.display = 'none';
        currentTestId = null;
        currentTestData = null;
        return;
    }
    
    currentTestId = testId;
    const result = await FirebaseService.getMCQTestById(testId);
    
    if (result.success) {
        currentTestData = result.test;
        container.style.display = 'block';
        
        // Update test info
        document.getElementById('selectedTestTitle').textContent = currentTestData.title;
        document.getElementById('selectedTestInfo').textContent = 
            `Program: ${currentTestData.programType} | Time Limit: ${currentTestData.timeLimit} mins | Passing Score: ${currentTestData.passingScore}%`;
        
        // Display questions
        displayQuestions(currentTestData.questions || []);
    } else {
        showNotification('Error loading test: ' + result.error, 'error');
    }
}

// Display all questions
function displayQuestions(questions) {
    const questionsList = document.getElementById('questionsList');
    const questionsCount = document.getElementById('questionsCount');
    
    questionsCount.textContent = questions.length;
    
    if (questions.length === 0) {
        questionsList.innerHTML = '<p class="empty-message">No questions in this test yet.</p>';
        return;
    }
    
    questionsList.innerHTML = '';
    questions.forEach((question, index) => {
        const questionCard = createQuestionCard(question, index);
        questionsList.appendChild(questionCard);
    });
}

// Create question card
function createQuestionCard(question, index) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
        <div class="question-header">
            <h4>Question ${index + 1}</h4>
            <div class="question-actions">
                <button class="btn-icon" onclick="editQuestion(${index})" title="Edit Question">✏️</button>
                <button class="btn-icon btn-delete" onclick="deleteQuestion(${index})" title="Delete Question">🗑️</button>
            </div>
        </div>
        <p class="question-text">${question.question}</p>
        <div class="question-options">
            ${question.options.map((opt, i) => `
                <div class="option ${i === question.correctAnswer ? 'correct-option' : ''}">
                    <strong>${String.fromCharCode(65 + i)})</strong> ${opt}
                    ${i === question.correctAnswer ? '<span class="correct-badge">✓ Correct</span>' : ''}
                </div>
            `).join('')}
        </div>
        <div class="question-meta">
            <span>🎯 Marks: ${question.marks || 1}</span>
        </div>
    `;
    return card;
}

// Handle add new question
async function handleAddQuestion(event) {
    event.preventDefault();
    
    if (!currentTestId) {
        showNotification('Please select a test first', 'error');
        return;
    }
    
    const questionText = document.getElementById('newQuestionText').value;
    const optionA = document.getElementById('newOptionA').value;
    const optionB = document.getElementById('newOptionB').value;
    const optionC = document.getElementById('newOptionC').value;
    const optionD = document.getElementById('newOptionD').value;
    const correctAnswer = parseInt(document.getElementById('newCorrectAnswer').value);
    const marks = parseInt(document.getElementById('newQuestionMarks').value);
    
    const newQuestion = {
        question: questionText,
        options: [optionA, optionB, optionC, optionD],
        correctAnswer: correctAnswer,
        marks: marks
    };
    
    showNotification('Adding question...', 'info');
    const result = await FirebaseService.addQuestionToTest(currentTestId, newQuestion);
    
    if (result.success) {
        showNotification('Question added successfully!', 'success');
        document.getElementById('addQuestionForm').reset();
        await loadTestQuestions(); // Reload questions
    } else {
        showNotification('Error adding question: ' + result.error, 'error');
    }
}

// Edit question
async function editQuestion(index) {
    if (!currentTestData || !currentTestData.questions[index]) return;
    
    const question = currentTestData.questions[index];
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Edit Question ${index + 1}</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <form class="upload-form" id="editQuestionForm" onsubmit="saveEditedQuestion(event, ${index})">
                    <div class="form-group">
                        <label>Question Text *</label>
                        <textarea id="editQuestionText" rows="3" class="form-control" required>${question.question}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Option A *</label>
                        <input type="text" id="editOptionA" class="form-control" required value="${question.options[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Option B *</label>
                        <input type="text" id="editOptionB" class="form-control" required value="${question.options[1]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Option C *</label>
                        <input type="text" id="editOptionC" class="form-control" required value="${question.options[2]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Option D *</label>
                        <input type="text" id="editOptionD" class="form-control" required value="${question.options[3]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Correct Answer *</label>
                        <select id="editCorrectAnswer" class="form-control" required>
                            <option value="0" ${question.correctAnswer === 0 ? 'selected' : ''}>Option A</option>
                            <option value="1" ${question.correctAnswer === 1 ? 'selected' : ''}>Option B</option>
                            <option value="2" ${question.correctAnswer === 2 ? 'selected' : ''}>Option C</option>
                            <option value="3" ${question.correctAnswer === 3 ? 'selected' : ''}>Option D</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Marks</label>
                        <input type="number" id="editQuestionMarks" class="form-control" value="${question.marks || 1}" min="1" max="10">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn">💾 Save Changes</button>
                        <button type="button" class="btn back-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Save edited question
async function saveEditedQuestion(event, index) {
    event.preventDefault();
    
    const questionText = document.getElementById('editQuestionText').value;
    const optionA = document.getElementById('editOptionA').value;
    const optionB = document.getElementById('editOptionB').value;
    const optionC = document.getElementById('editOptionC').value;
    const optionD = document.getElementById('editOptionD').value;
    const correctAnswer = parseInt(document.getElementById('editCorrectAnswer').value);
    const marks = parseInt(document.getElementById('editQuestionMarks').value);
    
    const updatedQuestion = {
        question: questionText,
        options: [optionA, optionB, optionC, optionD],
        correctAnswer: correctAnswer,
        marks: marks
    };
    
    showNotification('Updating question...', 'info');
    const result = await FirebaseService.updateQuestionInTest(currentTestId, index, updatedQuestion);
    
    if (result.success) {
        showNotification('Question updated successfully!', 'success');
        document.querySelectorAll('.modal').forEach(m => m.remove());
        await loadTestQuestions(); // Reload questions
    } else {
        showNotification('Error updating question: ' + result.error, 'error');
    }
}

// Delete question
async function deleteQuestion(index) {
    if (!confirm(`Are you sure you want to delete Question ${index + 1}?`)) return;
    
    showNotification('Deleting question...', 'info');
    const result = await FirebaseService.deleteQuestionFromTest(currentTestId, index);
    
    if (result.success) {
        showNotification('Question deleted successfully!', 'success');
        await loadTestQuestions(); // Reload questions
    } else {
        showNotification('Error deleting question: ' + result.error, 'error');
    }
}

// Initialize question bank when tab is opened
document.addEventListener('DOMContentLoaded', function() {
    const questionBankTab = document.querySelector('[data-tab="question-bank"]');
    if (questionBankTab) {
        questionBankTab.addEventListener('click', function() {
            loadTestSelector();
        });
    }
    
    // Load analytics when tab is opened
    const analyticsTab = document.querySelector('[data-tab="analytics"]');
    if (analyticsTab) {
        analyticsTab.addEventListener('click', function() {
            loadAnalytics();
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════
// ADVANCED ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

let currentTopContentType = 'videos';

// Load analytics data
async function loadAnalytics() {
    showNotification('Loading analytics...', 'info');
    
    const result = await FirebaseService.getDetailedAnalytics();
    
    if (result.success) {
        const { content, engagement, performance } = result.analytics;
        
        // Update content counts
        document.getElementById('analyticsVideoCount').textContent = content.totalVideos;
        document.getElementById('analyticsNotesCount').textContent = content.totalNotes;
        document.getElementById('analyticsTestsCount').textContent = content.totalTests;
        document.getElementById('analyticsClassesCount').textContent = content.totalClasses;
        
        // Update engagement metrics
        document.getElementById('totalViews').textContent = engagement.totalViews.toLocaleString();
        document.getElementById('totalDownloads').textContent = engagement.totalDownloads.toLocaleString();
        document.getElementById('totalTestAttempts').textContent = engagement.totalTestAttempts.toLocaleString();
        document.getElementById('totalParticipants').textContent = engagement.totalClassParticipants.toLocaleString();
        
        // Update performance metrics
        document.getElementById('averageScore').textContent = performance.averageScore + '%';
        document.getElementById('totalAttempts').textContent = performance.totalAttempts;
        
        // Update score distribution
        updateScoreDistribution(performance.scoreDistribution, performance.totalAttempts);
        
        // Load top content
        loadTopContent(currentTopContentType);
        
        showNotification('Analytics loaded successfully!', 'success');
    } else {
        showNotification('Error loading analytics: ' + result.error, 'error');
    }
}

// Update score distribution bars
function updateScoreDistribution(distribution, total) {
    const ranges = ['0-40', '41-60', '61-80', '81-100'];
    
    ranges.forEach(range => {
        const count = distribution[range] || 0;
        const percentage = total > 0 ? (count / total * 100) : 0;
        
        const bar = document.getElementById(`bar-${range}`);
        const value = document.getElementById(`val-${range}`);
        
        if (bar && value) {
            bar.style.width = percentage + '%';
            value.textContent = count;
        }
    });
}

// Switch top content type
async function switchTopContent(contentType) {
    currentTopContentType = contentType;
    
    // Update tab buttons
    document.querySelectorAll('.top-content-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-content') === contentType) {
            btn.classList.add('active');
        }
    });
    
    await loadTopContent(contentType);
}

// Load top performing content
async function loadTopContent(contentType) {
    const topContentList = document.getElementById('topContentList');
    topContentList.innerHTML = '<p class="empty-message">Loading...</p>';
    
    const result = await FirebaseService.getContentEngagement(contentType);
    
    if (result.success && result.data.length > 0) {
        topContentList.innerHTML = '';
        
        // Show top 10
        const topItems = result.data.slice(0, 10);
        
        topItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'top-content-item';
            
            let engagementMetric = '';
            if (contentType === 'videos') {
                engagementMetric = `👁️ ${item.views} views`;
            } else if (contentType === 'notes') {
                engagementMetric = `⬇️ ${item.downloads} downloads`;
            } else if (contentType === 'mcqTests') {
                engagementMetric = `✅ ${item.attempts} attempts`;
            }
            
            card.innerHTML = `
                <div class="rank-badge">#${index + 1}</div>
                <div class="top-content-info">
                    <h4>${item.title}</h4>
                    <p class="content-program">${item.programType}</p>
                </div>
                <div class="top-content-metric">${engagementMetric}</div>
            `;
            
            topContentList.appendChild(card);
        });
    } else {
        topContentList.innerHTML = '<p class="empty-message">No data available</p>';
    }
}

// Refresh analytics
async function refreshAnalytics() {
    await loadAnalytics();
}

// Export analytics report
function exportAnalytics() {
    showNotification('Preparing analytics report...', 'info');
    
    FirebaseService.getDetailedAnalytics().then(result => {
        if (result.success) {
            const report = {
                generatedAt: new Date().toISOString(),
                content: result.analytics.content,
                engagement: result.analytics.engagement,
                performance: result.analytics.performance
            };
            
            const dataStr = JSON.stringify(report, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lakshya-analytics-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            showNotification('Analytics report exported!', 'success');
        } else {
            showNotification('Error exporting report: ' + result.error, 'error');
        }
    });
}
