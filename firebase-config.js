// Firebase Configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Configure Facebook Auth Provider
const facebookProvider = new firebase.auth.FacebookAuthProvider();

// Admin credentials
const ADMIN_EMAIL = 'admin123@gmail.com';
const ADMIN_PASSWORD = 'jnk522337';

// Check if user is admin
function isAdmin(email) {
    return email === ADMIN_EMAIL;
}

// Get current user role
async function getUserRole() {
    const user = auth.currentUser;
    if (!user) return null;
    
    if (isAdmin(user.email)) {
        return 'admin';
    }
    return 'user';
}

// Auth state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const role = await getUserRole();
        console.log('User logged in:', user.email, 'Role:', role);
        
        // Store user info in sessionStorage
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('userId', user.uid);
        sessionStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
    } else {
        console.log('User logged out');
        sessionStorage.clear();
    }
});
