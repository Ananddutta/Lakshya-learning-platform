// Notification Service - Handles in-app notifications and browser push notifications

const NotificationService = {
    // ═══════════════════════════════════════════════════════════════════════
    // IN-APP NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Save notification to Firestore
    async createNotification(notificationData) {
        try {
            const data = {
                userId: notificationData.userId || 'all', // 'all' for broadcast
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'info', // info, success, warning, error
                category: notificationData.category || 'general', // general, video, notes, test, class
                relatedId: notificationData.relatedId || null,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: notificationData.expiresAt || null
            };
            
            const docRef = await firebase.firestore().collection('notifications').add(data);
            console.log('Notification created:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get user notifications
    async getUserNotifications(userId, limit = 50) {
        try {
            const db = firebase.firestore();
            const notifications = [];
            
            // Get user-specific notifications
            const userQuery = await db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            userQuery.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            
            // Get broadcast notifications
            const broadcastQuery = await db.collection('notifications')
                .where('userId', '==', 'all')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            broadcastQuery.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by createdAt
            notifications.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
            
            return { success: true, notifications: notifications.slice(0, limit) };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, error: error.message, notifications: [] };
        }
    },
    
    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            await firebase.firestore().collection('notifications')
                .doc(notificationId)
                .update({ read: true });
            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Mark all notifications as read for user
    async markAllAsRead(userId) {
        try {
            const db = firebase.firestore();
            const batch = db.batch();
            
            const snapshot = await db.collection('notifications')
                .where('userId', 'in', [userId, 'all'])
                .where('read', '==', false)
                .get();
            
            snapshot.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error marking all as read:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete notification
    async deleteNotification(notificationId) {
        try {
            await firebase.firestore().collection('notifications')
                .doc(notificationId)
                .delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Listen to notifications in real-time
    listenToNotifications(userId, callback) {
        const db = firebase.firestore();
        
        const unsubscribe = db.collection('notifications')
            .where('userId', 'in', [userId, 'all'])
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({ id: doc.id, ...doc.data() });
                });
                callback(notifications);
            });
        
        return unsubscribe;
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // BROWSER PUSH NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Request notification permission
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return { success: false, error: 'Not supported' };
        }
        
        const permission = await Notification.requestPermission();
        return { 
            success: permission === 'granted', 
            permission 
        };
    },
    
    // Show browser notification
    showBrowserNotification(title, options = {}) {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return;
        }
        
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: options.body || '',
                icon: options.icon || '/favicon.ico',
                badge: options.badge || '/favicon.ico',
                tag: options.tag || 'lakshya-notification',
                requireInteraction: options.requireInteraction || false,
                ...options
            });
            
            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                if (options.onClick) {
                    options.onClick();
                }
                notification.close();
            };
            
            return notification;
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // AUTOMATED NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Notify about new content upload
    async notifyNewContent(contentType, contentData) {
        const titles = {
            video: '🎥 New Video Added',
            notes: '📄 New Study Notes Available',
            mcqTest: '📝 New Test Published',
            liveClass: '🎓 Live Class Scheduled'
        };
        
        const messages = {
            video: `New video: ${contentData.title} (${contentData.programType})`,
            notes: `New notes: ${contentData.title} (${contentData.programType})`,
            mcqTest: `New test: ${contentData.title} (${contentData.programType})`,
            liveClass: `Live class: ${contentData.title} on ${contentData.scheduledDate} at ${contentData.scheduledTime}`
        };
        
        return await this.createNotification({
            userId: 'all',
            title: titles[contentType] || 'New Content Added',
            message: messages[contentType] || 'Check out the latest update!',
            type: 'info',
            category: contentType,
            relatedId: contentData.id
        });
    },
    
    // Remind about upcoming live class
    async remindLiveClass(classData, userIds = 'all') {
        return await this.createNotification({
            userId: userIds,
            title: '⏰ Live Class Reminder',
            message: `"${classData.title}" starts in 30 minutes!`,
            type: 'warning',
            category: 'liveClass',
            relatedId: classData.id
        });
    },
    
    // Notify test results
    async notifyTestResult(userId, testData, score, totalMarks) {
        const percentage = (score / totalMarks * 100).toFixed(2);
        const passed = percentage >= testData.passingScore;
        
        return await this.createNotification({
            userId: userId,
            title: passed ? '🎉 Test Passed!' : '📊 Test Completed',
            message: `You scored ${score}/${totalMarks} (${percentage}%) in "${testData.title}"`,
            type: passed ? 'success' : 'info',
            category: 'mcqTest',
            relatedId: testData.id
        });
    },
    
    // Notify certificate earned
    async notifyCertificate(userId, programType) {
        return await this.createNotification({
            userId: userId,
            title: '🏆 Certificate Earned!',
            message: `Congratulations! You've completed the ${programType} program and earned your certificate.`,
            type: 'success',
            category: 'general'
        });
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.NotificationService = NotificationService;
}
