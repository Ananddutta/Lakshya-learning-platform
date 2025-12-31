// Login Page Script

// Check if already authenticated
document.addEventListener('DOMContentLoaded', () => {
    redirectIfAuthenticated();
});

// Show/Hide Login Forms
function showSelection() {
    document.getElementById('loginSelection').style.display = 'block';
    document.getElementById('userLoginForm').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'none';
}

function showUserLogin() {
    document.getElementById('loginSelection').style.display = 'none';
    document.getElementById('userLoginForm').style.display = 'block';
    document.getElementById('adminLoginForm').style.display = 'none';
}

function showAdminLogin() {
    document.getElementById('loginSelection').style.display = 'none';
    document.getElementById('userLoginForm').style.display = 'none';
    document.getElementById('adminLoginForm').style.display = 'block';
}

// Show/Hide Loading
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Handle Google Login
async function handleGoogleLogin() {
    showLoading();
    
    try {
        const result = await signInWithGoogle();
        
        if (result.success) {
            // Wait for auth state to update
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1000);
        } else {
            hideLoading();
            alert('Login failed: ' + result.error);
        }
    } catch (error) {
        hideLoading();
        alert('An error occurred during login');
        console.error(error);
    }
}

// Handle Facebook Login
async function handleFacebookLogin() {
    showLoading();
    
    try {
        const result = await signInWithFacebook();
        
        if (result.success) {
            // Wait for auth state to update
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1000);
        } else {
            hideLoading();
            alert('Login failed: ' + result.error);
        }
    } catch (error) {
        hideLoading();
        alert('An error occurred during login');
        console.error(error);
    }
}

// Handle Admin Login
async function handleAdminLogin(event) {
    event.preventDefault();
    showLoading();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const result = await signInAsAdmin(email, password);
        
        if (result.success) {
            // Wait for auth state to update
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            hideLoading();
            alert('Admin login failed: ' + result.error);
        }
    } catch (error) {
        hideLoading();
        alert('An error occurred during admin login');
        console.error(error);
    }
}
