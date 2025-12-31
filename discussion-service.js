// Discussion Forum Service - Handles Q&A, comments, and peer discussions

const DiscussionService = {
    // ═══════════════════════════════════════════════════════════════════════
    // FORUM POSTS MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Create a new forum post
    async createPost(postData) {
        try {
            const data = {
                userId: postData.userId,
                userName: postData.userName,
                title: postData.title,
                content: postData.content,
                programType: postData.programType,
                category: postData.category || 'general',
                tags: postData.tags || [],
                upvotes: 0,
                downvotes: 0,
                commentCount: 0,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await firebase.firestore().collection('forumPosts').add(data);
            console.log('Forum post created:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating forum post:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get forum posts
    async getPosts(programType = null, category = null, limit = 20) {
        try {
            let query = firebase.firestore().collection('forumPosts');
            
            if (programType) {
                query = query.where('programType', '==', programType);
            }
            if (category) {
                query = query.where('category', '==', category);
            }
            
            const snapshot = await query
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, posts };
        } catch (error) {
            console.error('Error fetching forum posts:', error);
            return { success: false, error: error.message, posts: [] };
        }
    },
    
    // Get post by ID
    async getPostById(postId) {
        try {
            const doc = await firebase.firestore().collection('forumPosts').doc(postId).get();
            
            if (doc.exists) {
                return { success: true, post: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Post not found' };
        } catch (error) {
            console.error('Error fetching post:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update post
    async updatePost(postId, updateData) {
        try {
            await firebase.firestore().collection('forumPosts').doc(postId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating post:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete post
    async deletePost(postId) {
        try {
            await firebase.firestore().collection('forumPosts').doc(postId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting post:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Vote on post
    async votePost(postId, userId, voteType) {
        try {
            const postRef = firebase.firestore().collection('forumPosts').doc(postId);
            const postDoc = await postRef.get();
            
            if (!postDoc.exists) {
                return { success: false, error: 'Post not found' };
            }
            
            // Check if user already voted
            const userVotesRef = postRef.collection('votes').doc(userId);
            const voteDoc = await userVotesRef.get();
            
            let voteChange = 0;
            if (voteDoc.exists) {
                const currentVote = voteDoc.data().voteType;
                if (currentVote === voteType) {
                    // Remove vote
                    await userVotesRef.delete();
                    voteChange = voteType === 'up' ? -1 : 1;
                } else {
                    // Change vote
                    await userVotesRef.set({ voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                    voteChange = voteType === 'up' ? 2 : -2;
                }
            } else {
                // New vote
                await userVotesRef.set({ voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                voteChange = voteType === 'up' ? 1 : -1;
            }
            
            // Update vote counts
            if (voteChange !== 0) {
                await postRef.update({
                    upvotes: firebase.firestore.FieldValue.increment(voteType === 'up' ? voteChange : 0),
                    downvotes: firebase.firestore.FieldValue.increment(voteType === 'down' ? voteChange : 0)
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error voting on post:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // COMMENTS MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Add comment to post
    async addComment(postId, commentData) {
        try {
            const data = {
                userId: commentData.userId,
                userName: commentData.userName,
                content: commentData.content,
                parentId: commentData.parentId || null, // For nested replies
                upvotes: 0,
                downvotes: 0,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await firebase.firestore()
                .collection('forumPosts')
                .doc(postId)
                .collection('comments')
                .add(data);
            
            // Update comment count on parent post
            await firebase.firestore().collection('forumPosts').doc(postId).update({
                commentCount: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding comment:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get comments for post
    async getComments(postId, parentId = null) {
        try {
            let query = firebase.firestore()
                .collection('forumPosts')
                .doc(postId)
                .collection('comments');
            
            if (parentId) {
                query = query.where('parentId', '==', parentId);
            } else {
                query = query.where('parentId', '==', null); // Top-level comments only
            }
            
            const snapshot = await query.orderBy('createdAt', 'asc').get();
            
            const comments = [];
            snapshot.forEach(doc => {
                comments.push({ id: doc.id, ...doc.data() });
            });
            
            // Add nested replies
            for (let i = 0; i < comments.length; i++) {
                const replies = await this.getComments(postId, comments[i].id);
                comments[i].replies = replies.comments;
            }
            
            return { success: true, comments };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return { success: false, error: error.message, comments: [] };
        }
    },
    
    // Vote on comment
    async voteComment(postId, commentId, userId, voteType) {
        try {
            const commentRef = firebase.firestore()
                .collection('forumPosts')
                .doc(postId)
                .collection('comments')
                .doc(commentId);
            
            const commentDoc = await commentRef.get();
            if (!commentDoc.exists) {
                return { success: false, error: 'Comment not found' };
            }
            
            // Check if user already voted
            const userVotesRef = commentRef.collection('votes').doc(userId);
            const voteDoc = await userVotesRef.get();
            
            let voteChange = 0;
            if (voteDoc.exists) {
                const currentVote = voteDoc.data().voteType;
                if (currentVote === voteType) {
                    // Remove vote
                    await userVotesRef.delete();
                    voteChange = voteType === 'up' ? -1 : 1;
                } else {
                    // Change vote
                    await userVotesRef.set({ voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                    voteChange = voteType === 'up' ? 2 : -2;
                }
            } else {
                // New vote
                await userVotesRef.set({ voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                voteChange = voteType === 'up' ? 1 : -1;
            }
            
            // Update vote counts
            if (voteChange !== 0) {
                await commentRef.update({
                    upvotes: firebase.firestore.FieldValue.increment(voteType === 'up' ? voteChange : 0),
                    downvotes: firebase.firestore.FieldValue.increment(voteType === 'down' ? voteChange : 0)
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error voting on comment:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete comment
    async deleteComment(postId, commentId) {
        try {
            const commentRef = firebase.firestore()
                .collection('forumPosts')
                .doc(postId)
                .collection('comments')
                .doc(commentId);
            
            // Delete all nested replies first
            const repliesSnapshot = await commentRef.collection('comments').get();
            for (const replyDoc of repliesSnapshot.docs) {
                await this.deleteComment(postId, replyDoc.id);
            }
            
            // Delete votes collection
            const votesSnapshot = await commentRef.collection('votes').get();
            for (const voteDoc of votesSnapshot.docs) {
                await voteDoc.ref.delete();
            }
            
            // Delete the comment itself
            await commentRef.delete();
            
            // Update comment count on parent post
            await firebase.firestore().collection('forumPosts').doc(postId).update({
                commentCount: firebase.firestore.FieldValue.increment(-1)
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting comment:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIDEO COMMENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Add comment to video
    async addVideoComment(videoId, commentData) {
        try {
            const data = {
                userId: commentData.userId,
                userName: commentData.userName,
                content: commentData.content,
                upvotes: 0,
                downvotes: 0,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await firebase.firestore()
                .collection('videoComments')
                .doc(videoId)
                .collection('comments')
                .add(data);
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding video comment:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get video comments
    async getVideoComments(videoId) {
        try {
            const snapshot = await firebase.firestore()
                .collection('videoComments')
                .doc(videoId)
                .collection('comments')
                .orderBy('createdAt', 'asc')
                .get();
            
            const comments = [];
            snapshot.forEach(doc => {
                comments.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, comments };
        } catch (error) {
            console.error('Error fetching video comments:', error);
            return { success: false, error: error.message, comments: [] };
        }
    },
    
    // Vote on video comment
    async voteVideoComment(videoId, commentId, userId, voteType) {
        try {
            const commentRef = firebase.firestore()
                .collection('videoComments')
                .doc(videoId)
                .collection('comments')
                .doc(commentId);
            
            const commentDoc = await commentRef.get();
            if (!commentDoc.exists) {
                return { success: false, error: 'Comment not found' };
            }
            
            // Check if user already voted
            const userVotesRef = commentRef.collection('votes').doc(userId);
            const voteDoc = await userVotesRef.get();
            
            let voteChange = 0;
            if (voteDoc.exists) {
                const currentVote = voteDoc.data().voteType;
                if (currentVote === voteType) {
                    // Remove vote
                    await userVotesRef.delete();
                    voteChange = voteType === 'up' ? -1 : 1;
                } else {
                    // Change vote
                    await userVotesRef.set({ voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                    voteChange = voteType === 'up' ? 2 : -2;
                }
            } else {
                // New vote
                await userVotesRef.set({ voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                voteChange = voteType === 'up' ? 1 : -1;
            }
            
            // Update vote counts
            if (voteChange !== 0) {
                await commentRef.update({
                    upvotes: firebase.firestore.FieldValue.increment(voteType === 'up' ? voteChange : 0),
                    downvotes: firebase.firestore.FieldValue.increment(voteType === 'down' ? voteChange : 0)
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error voting on video comment:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Listen to real-time forum posts
    listenToPosts(programType, callback) {
        let query = firebase.firestore().collection('forumPosts');
        if (programType) {
            query = query.where('programType', '==', programType);
        }
        
        return query
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const posts = [];
                snapshot.forEach(doc => {
                    posts.push({ id: doc.id, ...doc.data() });
                });
                callback(posts);
            });
    },
    
    // Listen to real-time comments for a post
    listenToComments(postId, callback) {
        return firebase.firestore()
            .collection('forumPosts')
            .doc(postId)
            .collection('comments')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const comments = [];
                snapshot.forEach(doc => {
                    comments.push({ id: doc.id, ...doc.data() });
                });
                callback(comments);
            });
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.DiscussionService = DiscussionService;
}
