// Authentication Utilities

// Sign in with Google
async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        console.log('Google sign-in successful:', user.email);
        return { success: true, user };
    } catch (error) {
        console.error('Google sign-in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in with Facebook
async function signInWithFacebook() {
    try {
        const result = await auth.signInWithPopup(facebookProvider);
        const user = result.user;
        console.log('Facebook sign-in successful:', user.email);
        return { success: true, user };
    } catch (error) {
        console.error('Facebook sign-in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in as Admin
async function signInAsAdmin(email, password) {
    try {
        // Verify admin credentials
        if (email !== ADMIN_EMAIL) {
            throw new Error('Invalid admin credentials');
        }
        
        const result = await auth.signInWithEmailAndPassword(email, password);
        const user = result.user;
        
        if (!isAdmin(user.email)) {
            await auth.signOut();
            throw new Error('Unauthorized: Not an admin account');
        }
        
        console.log('Admin sign-in successful:', user.email);
        return { success: true, user };
    } catch (error) {
        console.error('Admin sign-in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        sessionStorage.clear();
        console.log('Sign-out successful');
        return { success: true };
    } catch (error) {
        console.error('Sign-out error:', error);
        return { success: false, error: error.message };
    }
}

// Check authentication status
function checkAuth() {
    const user = auth.currentUser;
    const role = sessionStorage.getItem('userRole');
    return {
        isAuthenticated: !!user,
        user: user,
        role: role
    };
}

// Protect route - redirect if not authenticated
function protectRoute(requiredRole = null) {
    const authStatus = checkAuth();
    
    if (!authStatus.isAuthenticated) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (requiredRole && authStatus.role !== requiredRole) {
        alert('Access denied: Insufficient permissions');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Protect admin routes
function protectAdminRoute() {
    return protectRoute('admin');
}

// Redirect if already logged in
function redirectIfAuthenticated() {
    const authStatus = checkAuth();
    
    if (authStatus.isAuthenticated) {
        if (authStatus.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
        return true;
    }
    
    return false;
}

// Create admin account if it doesn't exist
async function ensureAdminAccount() {
    try {
        // Try to create admin account
        await auth.createUserWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Admin account created successfully');
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('Admin account already exists');
        } else {
            console.error('Error creating admin account:', error);
        }
    }
}

// Initialize admin account on first load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Ensure admin account exists
        ensureAdminAccount();
    });
}
