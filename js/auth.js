// Authentication JavaScript for Mailsfinder
(function() {
    'use strict';

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeAuth();
    });

    function initializeAuth() {
        // Check if we're on login or signup page
        const isLoginPage = document.getElementById('loginForm');
        const isSignupPage = document.getElementById('signupForm');

        if (isLoginPage) {
            initializeLoginPage();
        }

        if (isSignupPage) {
            initializeSignupPage();
        }

        // Check authentication state
        checkAuthState();
    }

    // Initialize Login Page
    function initializeLoginPage() {
        const loginForm = document.getElementById('loginForm');
        const togglePassword = document.getElementById('togglePassword');
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');

        // Handle form submission
        loginForm.addEventListener('submit', handleLogin);

        // Toggle password visibility
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility('password', 'togglePassword');
        });

        // Handle forgot password
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }

    // Initialize Signup Page
    function initializeSignupPage() {
        const signupForm = document.getElementById('signupForm');
        const togglePassword = document.getElementById('togglePassword');
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Handle form submission
        signupForm.addEventListener('submit', handleSignup);

        // Toggle password visibility
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility('password', 'togglePassword');
        });

        toggleConfirmPassword.addEventListener('click', function() {
            togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
        });

        // Password strength checker
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });

        // Password confirmation checker
        confirmPasswordInput.addEventListener('input', function() {
            checkPasswordMatch();
        });

        passwordInput.addEventListener('input', checkPasswordMatch);
    }

    // Handle Login
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!email || !password) {
            showError('Please fill in all fields.');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        // Show loading state
        setLoadingState('login', true);
        hideMessages();

        try {
            // Attempt to sign in with Supabase
            const result = await window.auth.signIn(email, password);


            if (result.success) {
                showSuccess('Login successful! Redirecting...');
                
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }

                // Redirect after successful login
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showError(result.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('login', false);
        }
    }

    // Handle Signup
    async function handleSignup(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const company = document.getElementById('company').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validate inputs
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showError('Please fill in all required fields.');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }

        if (!isStrongPassword(password)) {
            showError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.');
            return;
        }

        if (!agreeTerms) {
            showError('Please agree to the Terms of Service and Privacy Policy.');
            return;
        }

        // Show loading state
        setLoadingState('signup', true);
        hideMessages();

        try {
            // Prepare user data
            const userData = {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`,
                company: company || null
            };

            // Attempt to sign up with Supabase
            const result = await window.auth.signUp(email, password, userData);

            if (result.success) {
                showSuccess('Account created successfully! Please check your email to verify your account.');
                
                // Clear form
                document.getElementById('signupForm').reset();
                
                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                showError(result.error || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('signup', false);
        }
    }

    // Handle Forgot Password
    async function handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showError('Please enter your email address first.');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        try {
            const result = await window.auth.resetPassword(email);
            
            if (result.success) {
                showSuccess('Password reset email sent! Please check your inbox.');
            } else {
                showError(result.error || 'Failed to send reset email. Please try again.');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showError('An unexpected error occurred. Please try again.');
        }
    }

    // Toggle Password Visibility
    function togglePasswordVisibility(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Check Password Strength
    function checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (!strengthIndicator || !strengthText) return;

        const strength = calculatePasswordStrength(password);
        
        // Remove all strength classes
        strengthIndicator.classList.remove('strength-weak', 'strength-fair', 'strength-good', 'strength-strong');
        
        if (password.length === 0) {
            strengthIndicator.classList.add('bg-gray-300');
            strengthText.textContent = 'Password strength';
            return;
        }

        switch (strength) {
            case 1:
                strengthIndicator.classList.add('strength-weak');
                strengthText.textContent = 'Weak password';
                break;
            case 2:
                strengthIndicator.classList.add('strength-fair');
                strengthText.textContent = 'Fair password';
                break;
            case 3:
                strengthIndicator.classList.add('strength-good');
                strengthText.textContent = 'Good password';
                break;
            case 4:
                strengthIndicator.classList.add('strength-strong');
                strengthText.textContent = 'Strong password';
                break;
        }
    }

    // Calculate Password Strength
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        return Math.min(strength - 1, 4);
    }

    // Check Password Match
    function checkPasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');
        
        if (confirmPassword.length === 0) {
            confirmInput.classList.remove('border-red-300', 'border-green-300');
            confirmInput.classList.add('border-gray-300');
            return;
        }
        
        if (password === confirmPassword) {
            confirmInput.classList.remove('border-red-300', 'border-gray-300');
            confirmInput.classList.add('border-green-300');
        } else {
            confirmInput.classList.remove('border-green-300', 'border-gray-300');
            confirmInput.classList.add('border-red-300');
        }
    }

    // Validation Functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isStrongPassword(password) {
        return password.length >= 8 && 
               /[a-z]/.test(password) && 
               /[A-Z]/.test(password) && 
               /[0-9]/.test(password) && 
               /[^A-Za-z0-9]/.test(password);
    }

    // UI Helper Functions
    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
    }

    function showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        
        if (successDiv && successText) {
            successText.textContent = message;
            successDiv.classList.remove('hidden');
        }
    }

    function hideMessages() {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
    }

    function setLoadingState(type, isLoading) {
        const btn = document.getElementById(type + 'Btn');
        const btnText = document.getElementById(type + 'BtnText');
        const btnLoading = document.getElementById(type + 'BtnLoading');
        
        if (btn && btnText && btnLoading) {
            btn.disabled = isLoading;
            
            if (isLoading) {
                btnText.classList.add('hidden');
                btnLoading.classList.remove('hidden');
                btn.classList.add('opacity-75', 'cursor-not-allowed');
            } else {
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        }
    }

    // Check Authentication State
    async function checkAuthState() {
        try {
            const user = await window.auth.getCurrentUser();
            
            if (user) {
                // User is logged in
                console.log('User is authenticated:', user);
                
                // If on login/signup page and user is authenticated, redirect to dashboard
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.includes('signup.html')) {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Auth state check error:', error);
        }
    }

    // Listen for auth state changes
    if (typeof window.auth !== 'undefined' && window.auth.onAuthStateChange) {
        window.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                // Redirect to login if on protected pages
                if (window.location.pathname.includes('dashboard') || 
                    window.location.pathname.includes('profile')) {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Export functions for global use
    window.authFunctions = {
        showError,
        showSuccess,
        hideMessages,
        setLoadingState,
        isValidEmail,
        isStrongPassword
    };

})();