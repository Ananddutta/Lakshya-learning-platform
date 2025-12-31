// Firebase Services - Real Backend Implementation
// This file handles all database operations for the LMS platform

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTIONS STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
// videos: { programType, title, description, duration, url, thumbnail, uploadedAt, uploadedBy, views }
// notes: { programType, title, description, pages, fileUrl, fileName, fileSize, uploadedAt, downloads }
// mcqTests: { programType, title, description, questions[], timeLimit, passingScore, attempts }
// liveClasses: { programType, title, description, scheduledDateTime, duration, meetingLink, status, participants }
// userProgress: { userId, videoId/testId, progress, score, completedAt }

const FirebaseService = {
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIDEO MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    async uploadVideo(videoData) {
        try {
            const data = {
                programType: videoData.programType,
                title: videoData.title,
                description: videoData.description,
                duration: parseInt(videoData.duration),
                url: videoData.url,
                thumbnail: videoData.thumbnail || '',
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                uploadedBy: auth.currentUser.uid,
                views: 0,
                createdAt: new Date().toISOString()
            };
            
            const docRef = await db.collection('videos').add(data);
            console.log('Video uploaded with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error uploading video:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getVideos(programType = null) {
        try {
            let query = db.collection('videos');
            
            if (programType) {
                query = query.where('programType', '==', programType);
            }
            
            const snapshot = await query.orderBy('uploadedAt', 'desc').get();
            const videos = [];
            
            snapshot.forEach(doc => {
                videos.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, videos };
        } catch (error) {
            console.error('Error fetching videos:', error);
            return { success: false, error: error.message, videos: [] };
        }
    },
    
    async deleteVideo(videoId) {
        try {
            await db.collection('videos').doc(videoId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting video:', error);
            return { success: false, error: error.message };
        }
    },
    
    async incrementVideoView(videoId) {
        try {
            await db.collection('videos').doc(videoId).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing view:', error);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // NOTES MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    async uploadNotes(notesData, file) {
        try {
            // Upload file to Storage
            const storageRef = storage.ref();
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const fileRef = storageRef.child(`notes/${notesData.programType}/${fileName}`);
            
            // Upload file
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Save metadata to Firestore
            const data = {
                programType: notesData.programType,
                title: notesData.title,
                description: notesData.description,
                pages: parseInt(notesData.pages),
                fileUrl: downloadURL,
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                uploadedBy: auth.currentUser.uid,
                downloads: 0,
                createdAt: new Date().toISOString()
            };
            
            const docRef = await db.collection('notes').add(data);
            console.log('Notes uploaded with ID:', docRef.id);
            return { success: true, id: docRef.id, url: downloadURL };
        } catch (error) {
            console.error('Error uploading notes:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getNotes(programType = null) {
        try {
            let query = db.collection('notes');
            
            if (programType) {
                query = query.where('programType', '==', programType);
            }
            
            const snapshot = await query.orderBy('uploadedAt', 'desc').get();
            const notes = [];
            
            snapshot.forEach(doc => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, notes };
        } catch (error) {
            console.error('Error fetching notes:', error);
            return { success: false, error: error.message, notes: [] };
        }
    },
    
    async deleteNotes(notesId, fileUrl) {
        try {
            // Delete from Firestore
            await db.collection('notes').doc(notesId).delete();
            
            // Delete from Storage
            if (fileUrl) {
                const fileRef = storage.refFromURL(fileUrl);
                await fileRef.delete();
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting notes:', error);
            return { success: false, error: error.message };
        }
    },
    
    async incrementNotesDownload(notesId) {
        try {
            await db.collection('notes').doc(notesId).update({
                downloads: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing download:', error);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // MCQ TEST MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    async createMCQTest(testData) {
        try {
            const data = {
                programType: testData.programType,
                title: testData.title,
                description: testData.description,
                questions: testData.questions || [],
                totalQuestions: testData.questions ? testData.questions.length : 0,
                timeLimit: parseInt(testData.timeLimit),
                passingScore: parseInt(testData.passingScore || 40),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid,
                attempts: 0,
                averageScore: 0
            };
            
            const docRef = await db.collection('mcqTests').add(data);
            console.log('MCQ Test created with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating MCQ test:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getMCQTests(programType = null) {
        try {
            let query = db.collection('mcqTests');
            
            if (programType) {
                query = query.where('programType', '==', programType);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const tests = [];
            
            snapshot.forEach(doc => {
                tests.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, tests };
        } catch (error) {
            console.error('Error fetching MCQ tests:', error);
            return { success: false, error: error.message, tests: [] };
        }
    },
    
    async getMCQTestById(testId) {
        try {
            const doc = await db.collection('mcqTests').doc(testId).get();
            if (doc.exists) {
                return { success: true, test: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Test not found' };
        } catch (error) {
            console.error('Error fetching test:', error);
            return { success: false, error: error.message };
        }
    },
    
    async updateMCQTest(testId, testData) {
        try {
            await db.collection('mcqTests').doc(testId).update({
                ...testData,
                totalQuestions: testData.questions ? testData.questions.length : 0,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating MCQ test:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Add individual question to existing test
    async addQuestionToTest(testId, question) {
        try {
            const testDoc = await db.collection('mcqTests').doc(testId).get();
            if (!testDoc.exists) {
                return { success: false, error: 'Test not found' };
            }
            
            const currentQuestions = testDoc.data().questions || [];
            currentQuestions.push(question);
            
            await db.collection('mcqTests').doc(testId).update({
                questions: currentQuestions,
                totalQuestions: currentQuestions.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, totalQuestions: currentQuestions.length };
        } catch (error) {
            console.error('Error adding question:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update specific question in test
    async updateQuestionInTest(testId, questionIndex, updatedQuestion) {
        try {
            const testDoc = await db.collection('mcqTests').doc(testId).get();
            if (!testDoc.exists) {
                return { success: false, error: 'Test not found' };
            }
            
            const questions = testDoc.data().questions || [];
            if (questionIndex < 0 || questionIndex >= questions.length) {
                return { success: false, error: 'Invalid question index' };
            }
            
            questions[questionIndex] = updatedQuestion;
            
            await db.collection('mcqTests').doc(testId).update({
                questions: questions,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error updating question:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete specific question from test
    async deleteQuestionFromTest(testId, questionIndex) {
        try {
            const testDoc = await db.collection('mcqTests').doc(testId).get();
            if (!testDoc.exists) {
                return { success: false, error: 'Test not found' };
            }
            
            const questions = testDoc.data().questions || [];
            if (questionIndex < 0 || questionIndex >= questions.length) {
                return { success: false, error: 'Invalid question index' };
            }
            
            questions.splice(questionIndex, 1);
            
            await db.collection('mcqTests').doc(testId).update({
                questions: questions,
                totalQuestions: questions.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, totalQuestions: questions.length };
        } catch (error) {
            console.error('Error deleting question:', error);
            return { success: false, error: error.message };
        }
    },
    
    async deleteMCQTest(testId) {
        try {
            await db.collection('mcqTests').doc(testId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting MCQ test:', error);
            return { success: false, error: error.message };
        }
    },
    
    async submitMCQTestAttempt(testId, userId, score, totalQuestions) {
        try {
            // Save user attempt
            await db.collection('userProgress').add({
                userId: userId,
                testId: testId,
                score: score,
                totalQuestions: totalQuestions,
                percentage: (score / totalQuestions) * 100,
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                timestamp: new Date().toISOString()
            });
            
            // Update test statistics
            await db.collection('mcqTests').doc(testId).update({
                attempts: firebase.firestore.FieldValue.increment(1)
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error submitting test attempt:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // LIVE CLASS MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    async scheduleLiveClass(classData) {
        try {
            const data = {
                programType: classData.programType,
                title: classData.title,
                description: classData.description,
                scheduledDateTime: classData.scheduledDateTime,
                duration: parseFloat(classData.duration),
                meetingLink: classData.meetingLink,
                status: 'scheduled',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid,
                participants: 0,
                timestamp: new Date().toISOString()
            };
            
            const docRef = await db.collection('liveClasses').add(data);
            console.log('Live class scheduled with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error scheduling live class:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getLiveClasses(programType = null, status = null) {
        try {
            let query = db.collection('liveClasses');
            
            if (programType) {
                query = query.where('programType', '==', programType);
            }
            
            if (status) {
                query = query.where('status', '==', status);
            }
            
            const snapshot = await query.orderBy('scheduledDateTime', 'desc').get();
            const classes = [];
            
            snapshot.forEach(doc => {
                classes.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, classes };
        } catch (error) {
            console.error('Error fetching live classes:', error);
            return { success: false, error: error.message, classes: [] };
        }
    },
    
    async updateLiveClassStatus(classId, status) {
        try {
            await db.collection('liveClasses').doc(classId).update({
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating class status:', error);
            return { success: false, error: error.message };
        }
    },
    
    async deleteLiveClass(classId) {
        try {
            await db.collection('liveClasses').doc(classId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting live class:', error);
            return { success: false, error: error.message };
        }
    },
    
    async joinLiveClass(classId, userId) {
        try {
            await db.collection('liveClasses').doc(classId).update({
                participants: firebase.firestore.FieldValue.increment(1)
            });
            
            // Track user participation
            await db.collection('userProgress').add({
                userId: userId,
                classId: classId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'live-class'
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error joining live class:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // REAL-TIME LISTENERS
    // ═══════════════════════════════════════════════════════════════════════
    
    listenToVideos(programType, callback) {
        let query = db.collection('videos');
        
        if (programType) {
            query = query.where('programType', '==', programType);
        }
        
        return query.orderBy('uploadedAt', 'desc').onSnapshot(snapshot => {
            const videos = [];
            snapshot.forEach(doc => {
                videos.push({ id: doc.id, ...doc.data() });
            });
            callback(videos);
        });
    },
    
    listenToNotes(programType, callback) {
        let query = db.collection('notes');
        
        if (programType) {
            query = query.where('programType', '==', programType);
        }
        
        return query.orderBy('uploadedAt', 'desc').onSnapshot(snapshot => {
            const notes = [];
            snapshot.forEach(doc => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            callback(notes);
        });
    },
    
    listenToMCQTests(programType, callback) {
        let query = db.collection('mcqTests');
        
        if (programType) {
            query = query.where('programType', '==', programType);
        }
        
        return query.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const tests = [];
            snapshot.forEach(doc => {
                tests.push({ id: doc.id, ...doc.data() });
            });
            callback(tests);
        });
    },
    
    listenToLiveClasses(programType, callback) {
        let query = db.collection('liveClasses');
        
        if (programType) {
            query = query.where('programType', '==', programType);
        }
        
        return query.orderBy('scheduledDateTime', 'desc').onSnapshot(snapshot => {
            const classes = [];
            snapshot.forEach(doc => {
                classes.push({ id: doc.id, ...doc.data() });
            });
            callback(classes);
        });
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // STATISTICS & ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════
    
    async getContentStats() {
        try {
            const [videosSnap, notesSnap, testsSnap, classesSnap] = await Promise.all([
                db.collection('videos').get(),
                db.collection('notes').get(),
                db.collection('mcqTests').get(),
                db.collection('liveClasses').get()
            ]);
            
            return {
                success: true,
                stats: {
                    videos: videosSnap.size,
                    notes: notesSnap.size,
                    tests: testsSnap.size,
                    classes: classesSnap.size
                }
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getUserProgress(userId) {
        try {
            const snapshot = await db.collection('userProgress')
                .where('userId', '==', userId)
                .get();
            
            const progress = [];
            snapshot.forEach(doc => {
                progress.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, progress };
        } catch (error) {
            console.error('Error fetching user progress:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADVANCED ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════
    
    async getDetailedAnalytics() {
        try {
            const analytics = {
                content: {},
                engagement: {},
                performance: {}
            };
            
            // Get all content counts
            const [videosSnapshot, notesSnapshot, testsSnapshot, classesSnapshot] = await Promise.all([
                db.collection('videos').get(),
                db.collection('notes').get(),
                db.collection('mcqTests').get(),
                db.collection('liveClasses').get()
            ]);
            
            analytics.content = {
                totalVideos: videosSnapshot.size,
                totalNotes: notesSnapshot.size,
                totalTests: testsSnapshot.size,
                totalClasses: classesSnapshot.size
            };
            
            // Calculate engagement metrics
            let totalViews = 0;
            let totalDownloads = 0;
            let totalTestAttempts = 0;
            let totalClassParticipants = 0;
            
            videosSnapshot.forEach(doc => {
                totalViews += doc.data().views || 0;
            });
            
            notesSnapshot.forEach(doc => {
                totalDownloads += doc.data().downloads || 0;
            });
            
            testsSnapshot.forEach(doc => {
                totalTestAttempts += doc.data().attempts || 0;
            });
            
            classesSnapshot.forEach(doc => {
                totalClassParticipants += doc.data().participants || 0;
            });
            
            analytics.engagement = {
                totalViews,
                totalDownloads,
                totalTestAttempts,
                totalClassParticipants
            };
            
            // Get test performance data
            const testAttempts = await db.collection('userProgress').get();
            let totalScore = 0;
            let attemptCount = 0;
            const scoreDistribution = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
            
            testAttempts.forEach(doc => {
                const data = doc.data();
                if (data.testsAttempted && Array.isArray(data.testsAttempted)) {
                    data.testsAttempted.forEach(attempt => {
                        const percentage = (attempt.score / attempt.totalMarks) * 100;
                        totalScore += percentage;
                        attemptCount++;
                        
                        if (percentage <= 40) scoreDistribution['0-40']++;
                        else if (percentage <= 60) scoreDistribution['41-60']++;
                        else if (percentage <= 80) scoreDistribution['61-80']++;
                        else scoreDistribution['81-100']++;
                    });
                }
            });
            
            analytics.performance = {
                averageScore: attemptCount > 0 ? (totalScore / attemptCount).toFixed(2) : 0,
                totalAttempts: attemptCount,
                scoreDistribution
            };
            
            return { success: true, analytics };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getContentEngagement(contentType, programType = null) {
        try {
            let query = db.collection(contentType);
            if (programType) {
                query = query.where('programType', '==', programType);
            }
            
            const snapshot = await query.get();
            const engagementData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                engagementData.push({
                    id: doc.id,
                    title: data.title,
                    programType: data.programType,
                    views: data.views || 0,
                    downloads: data.downloads || 0,
                    attempts: data.attempts || 0,
                    participants: data.participants || 0,
                    uploadedAt: data.uploadedAt || data.createdAt
                });
            });
            
            // Sort by engagement (views/downloads/attempts)
            engagementData.sort((a, b) => {
                const aEngagement = a.views + a.downloads + a.attempts + a.participants;
                const bEngagement = b.views + b.downloads + b.attempts + b.participants;
                return bEngagement - aEngagement;
            });
            
            return { success: true, data: engagementData };
        } catch (error) {
            console.error('Error fetching engagement data:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getUserPerformanceStats(userId) {
        try {
            const progressDoc = await db.collection('userProgress')
                .where('userId', '==', userId)
                .get();
            
            if (progressDoc.empty) {
                return { 
                    success: true, 
                    stats: {
                        videosWatched: 0,
                        notesDownloaded: 0,
                        testsCompleted: 0,
                        classesAttended: 0,
                        averageScore: 0,
                        testScores: []
                    }
                };
            }
            
            const userData = progressDoc.docs[0].data();
            const testScores = userData.testsAttempted || [];
            const avgScore = testScores.length > 0
                ? testScores.reduce((sum, t) => sum + (t.score / t.totalMarks * 100), 0) / testScores.length
                : 0;
            
            return {
                success: true,
                stats: {
                    videosWatched: (userData.videosWatched || []).length,
                    notesDownloaded: (userData.notesDownloaded || []).length,
                    testsCompleted: testScores.length,
                    classesAttended: (userData.classesAttended || []).length,
                    averageScore: avgScore.toFixed(2),
                    testScores: testScores
                }
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIDEO PROGRESS TRACKING
    // ═══════════════════════════════════════════════════════════════════════
    
    async saveVideoProgress(userId, videoId, progressData) {
        try {
            const progressRef = db.collection('videoProgress').doc(`${userId}_${videoId}`);
            
            const data = {
                userId: userId,
                videoId: videoId,
                currentTime: progressData.currentTime,
                duration: progressData.duration,
                percentageWatched: Math.floor((progressData.currentTime / progressData.duration) * 100),
                completed: progressData.completed || false,
                lastWatchedAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalWatchTime: firebase.firestore.FieldValue.increment(progressData.watchedDuration || 0)
            };
            
            await progressRef.set(data, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('Error saving video progress:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getVideoProgress(userId, videoId) {
        try {
            const doc = await db.collection('videoProgress')
                .doc(`${userId}_${videoId}`)
                .get();
            
            if (doc.exists) {
                return { success: true, progress: doc.data() };
            }
            return { success: true, progress: null };
        } catch (error) {
            console.error('Error fetching video progress:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getUserVideoProgress(userId) {
        try {
            const snapshot = await db.collection('videoProgress')
                .where('userId', '==', userId)
                .get();
            
            const progressList = [];
            snapshot.forEach(doc => {
                progressList.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, progressList };
        } catch (error) {
            console.error('Error fetching user progress:', error);
            return { success: false, error: error.message };
        }
    },
    
    async markVideoComplete(userId, videoId, videoData) {
        try {
            // Mark video as complete
            await this.saveVideoProgress(userId, videoId, {
                currentTime: videoData.duration,
                duration: videoData.duration,
                completed: true,
                watchedDuration: 0
            });
            
            // Update user progress collection
            const userProgressRef = db.collection('userProgress')
                .where('userId', '==', userId)
                .limit(1);
            
            const snapshot = await userProgressRef.get();
            
            if (snapshot.empty) {
                await db.collection('userProgress').add({
                    userId: userId,
                    videosWatched: [videoId],
                    completedVideos: [videoId],
                    lastActivity: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                const doc = snapshot.docs[0];
                const currentData = doc.data();
                const videosWatched = currentData.videosWatched || [];
                const completedVideos = currentData.completedVideos || [];
                
                if (!videosWatched.includes(videoId)) {
                    videosWatched.push(videoId);
                }
                if (!completedVideos.includes(videoId)) {
                    completedVideos.push(videoId);
                }
                
                await doc.ref.update({
                    videosWatched,
                    completedVideos,
                    lastActivity: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error marking video complete:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Check if user meets certificate criteria
    async checkCertificateEligibility(userId, programType) {
        try {
            // Get all videos for this program
            const videosSnapshot = await db.collection('videos')
                .where('programType', '==', programType)
                .get();
            
            const totalVideos = videosSnapshot.size;
            
            if (totalVideos === 0) {
                return { success: true, eligible: false, reason: 'No videos available' };
            }
            
            // Get user's completed videos for this program
            const progressSnapshot = await db.collection('videoProgress')
                .where('userId', '==', userId)
                .where('completed', '==', true)
                .get();
            
            const completedVideoIds = [];
            progressSnapshot.forEach(doc => {
                completedVideoIds.push(doc.data().videoId);
            });
            
            // Check which completed videos belong to this program
            let completedCount = 0;
            videosSnapshot.forEach(doc => {
                if (completedVideoIds.includes(doc.id)) {
                    completedCount++;
                }
            });
            
            const completionPercentage = (completedCount / totalVideos) * 100;
            const eligible = completionPercentage >= 80; // 80% completion required
            
            return {
                success: true,
                eligible,
                completionPercentage: completionPercentage.toFixed(2),
                completedCount,
                totalVideos,
                reason: eligible ? 'Meets criteria' : `Need ${Math.ceil(totalVideos * 0.8) - completedCount} more videos`
            };
        } catch (error) {
            console.error('Error checking certificate eligibility:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Generate certificate
    async generateCertificate(userId, programType, userName) {
        try {
            const eligibility = await this.checkCertificateEligibility(userId, programType);
            
            if (!eligibility.success || !eligibility.eligible) {
                return { success: false, error: 'Not eligible for certificate' };
            }
            
            const certificateData = {
                userId,
                userName,
                programType,
                issueDate: firebase.firestore.FieldValue.serverTimestamp(),
                certificateId: `LAKSHYA-${programType.toUpperCase()}-${Date.now()}`,
                completionPercentage: eligibility.completionPercentage,
                status: 'issued'
            };
            
            const docRef = await db.collection('certificates').add(certificateData);
            
            return { 
                success: true, 
                certificateId: docRef.id,
                certificate: certificateData
            };
        } catch (error) {
            console.error('Error generating certificate:', error);
            return { success: false, error: error.message };
        }
    },
    
    async getUserCertificates(userId) {
        try {
            const snapshot = await db.collection('certificates')
                .where('userId', '==', userId)
                .orderBy('issueDate', 'desc')
                .get();
            
            const certificates = [];
            snapshot.forEach(doc => {
                certificates.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, certificates };
        } catch (error) {
            console.error('Error fetching certificates:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.FirebaseService = FirebaseService;
}
