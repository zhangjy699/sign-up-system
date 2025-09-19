// 1. Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// 2. Form Validation & Submission
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    let isValid = true;

    // HKUST Email Validation
    if (email === '') {
        showError('email', 'HKUST ITSC email is required.');
        isValid = false;
    } else if (!isValidHKUSTEmail(email)) {
        showError('email', 'Please use a valid HKUST ITSC email address (@connect.ust.hk or @ust.hk).');
        isValid = false;
    } else {
        clearError('email');
    }

    // Password Validation
    if (password === '') {
        showError('password', 'Password is required.');
        isValid = false;
    } else if (password.length < 8) {
        showError('password', 'Password must be at least 8 characters long.');
        isValid = false;
    } else {
        clearError('password');
    }

    if (isValid) {
        // Simulate login process for QFIN portal
        simulateQFINLogin(email);
    }
});

// Validate HKUST email format
function isValidHKUSTEmail(email) {
    const hkustEmailRegex = /^[a-zA-Z0-9._%+-]+@(connect\.)?ust\.hk$/;
    return hkustEmailRegex.test(email);
}

// Simulate QFIN-specific login process
function simulateQFINLogin(email) {
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    
    // Show loading state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accessing QFIN Portal...';
    loginBtn.disabled = true;
    
    // Simulate API call delay
    setTimeout(() => {
        console.log('QFIN Login Attempt:');
        console.log('Email:', email);
        console.log('Time:', new Date().toLocaleString('en-HK'));
        
        alert('Welcome to HKUST QFIN Portal!\n\nAccess granted to:\n- Bloomberg Terminals\n- WRDS Databases\n- Risk Analytics Tools');
        
        // Reset button
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }, 1500);
}

// Helper functions for showing/clearing errors
function showError(inputId, message) {
    const inputGroup = document.getElementById(inputId).closest('.input-group');
    inputGroup.classList.add('error');
    clearError(inputId);
    
    const errorElement = document.createElement('small');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    inputGroup.appendChild(errorElement);
}

function clearError(inputId) {
    const inputGroup = document.getElementById(inputId).closest('.input-group');
    inputGroup.classList.remove('error');
    const existingError = inputGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Additional QFIN-specific feature: Quick info display
document.addEventListener('DOMContentLoaded', function() {
    console.log('HKUST QFIN Login Portal Loaded');
    console.log('Financial Data Systems: Online');
    console.log('Trading Simulations: Available');
});