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

                // Redirect after successful login to dashboard
                setTimeout(() => {
                    window.location.href = 'https://app.mailsfinder.com';
                }, 1500);
            } else {
                // Handle specific error cases
                if (result.error && result.error.includes('Email not confirmed')) {
                    showError('Please verify your email address before signing in. Check your inbox for a confirmation email. <a href="#" id="resendConfirmation" class="text-primary hover:underline ml-2">Resend confirmation email</a>');
                    
                    // Add click handler for resend confirmation
                    setTimeout(() => {
                        const resendLink = document.getElementById('resendConfirmation');
                        if (resendLink) {
                            resendLink.addEventListener('click', async (e) => {
                                e.preventDefault();
                                await resendConfirmationEmail(email);
                            });
                        }
                    }, 100);
                } else {
                    showError(result.error || 'Login failed. Please try again.');
                }
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
            errorText.innerHTML = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-hide after 8 seconds for longer messages
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 8000);
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

    // Resend confirmation email
    async function resendConfirmationEmail(email) {
        try {
            showSuccess('Sending confirmation email...');
            
            const { error } = await window.supabaseClient.auth.resend({
                type: 'signup',
                email: email
            });
            
            if (error) {
                showError('Failed to resend confirmation email: ' + error.message);
            } else {
                showSuccess('Confirmation email sent! Please check your inbox.');
            }
        } catch (error) {
            console.error('Resend confirmation error:', error);
            showError('Failed to resend confirmation email. Please try again.');
        }
    }

    // Check Authentication State
    async function checkAuthState() {
        try {
            // First try to get the current session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Session retrieval error:', error);
                return;
            }
            
            if (session && session.user) {
                // User has an active session
                console.log('Active session found for user:', session.user.email);
                
                // Update navbar to show user profile
                await updateNavbarForUser(session.user);
                
                // If on login/signup page and user is authenticated, redirect to dashboard
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.includes('signup.html')) {
                    window.location.href = 'index.html';
                }
            } else {
                // No active session, try getCurrentUser as fallback
                const user = await window.auth.getCurrentUser();
                
                if (user) {
                    console.log('User found via getCurrentUser:', user.email);
                    await updateNavbarForUser(user);
                    
                    if (window.location.pathname.includes('login.html') || 
                        window.location.pathname.includes('signup.html')) {
                        window.location.href = 'index.html';
                    }
                } else {
                    console.log('No authenticated user found');
                }
            }
        } catch (error) {
            console.error('Auth state check error:', error);
        }
    }

    // Listen for auth state changes
    if (typeof window.auth !== 'undefined' && window.auth.onAuthStateChange) {
        window.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', session.user);
                // Update navbar to show user profile
                await updateNavbarForUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                // Reset navbar to show login button
                window.location.reload();
                // Redirect to login if on protected pages
                if (window.location.pathname.includes('dashboard') || 
                    window.location.pathname.includes('profile')) {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Update navbar for authenticated user
    async function updateNavbarForUser(user) {
        const authButton = document.querySelector('.auth-button');
        const mobileAuthButton = document.querySelector('.mobile-auth-button');
        
        if (authButton && user) {
            // Get user profile data from profiles table
            let userName = user.email?.split('@')[0] || 'User';
            const userEmail = user.email || 'User';
            
            try {
                const userWithData = await window.auth.getCurrentUserWithData();
                if (userWithData?.profile?.full_name) {
                    userName = userWithData.profile.full_name;
                } else if (user.user_metadata?.full_name) {
                    userName = user.user_metadata.full_name;
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                // Fallback to metadata or email
                userName = user.user_metadata?.full_name || userEmail.split('@')[0];
            }
            
            authButton.innerHTML = `
                <div class="relative">
                    <button class="flex items-center space-x-2 text-text-gray hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors" onclick="toggleUserDropdown()">
                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        <span class="hidden lg:block">${userName}</span>
                        <i class="fas fa-chevron-down text-xs"></i>
                    </button>
                    <div id="userDropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border" style="z-index: 9999;">
                        <div class="px-4 py-2 text-sm text-text-gray border-b">
                            <div class="font-medium">${userName}</div>
                            <div class="text-xs text-text-gray">${userEmail}</div>
                        </div>
                        <a href="#" onclick="redirectToDashboard()" class="block px-4 py-2 text-sm text-text-gray hover:bg-gray-100">Dashboard</a>
                        <button onclick="handleLogout()" class="block w-full text-left px-4 py-2 text-sm text-text-gray hover:bg-gray-100">Sign Out</button>
                    </div>
                </div>
            `;
        }
        
        if (mobileAuthButton && user) {
            // Use the same userName that was fetched above
            let mobileUserName = user.email?.split('@')[0] || 'User';
            const userEmail = user.email || 'User';
            
            try {
                const userWithData = await window.auth.getCurrentUserWithData();
                if (userWithData?.profile?.full_name) {
                    mobileUserName = userWithData.profile.full_name;
                } else if (user.user_metadata?.full_name) {
                    mobileUserName = user.user_metadata.full_name;
                }
            } catch (error) {
                console.error('Error fetching user profile for mobile:', error);
                // Fallback to metadata or email
                mobileUserName = user.user_metadata?.full_name || userEmail.split('@')[0];
            }
            
            mobileAuthButton.innerHTML = `
                <div class="px-3 py-2 border-t border-gray-200">
                    <div class="flex items-center space-x-3 mb-2">
                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            ${mobileUserName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-text-dark">${mobileUserName}</div>
                            <div class="text-xs text-text-gray">${userEmail}</div>
                        </div>
                    </div>
                    <a href="#" onclick="redirectToDashboard()" class="block w-full text-left bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-md text-sm font-medium transition-colors mb-2">Dashboard</a>
                    <button onclick="handleLogout()" class="block w-full text-left text-text-gray hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Sign Out</button>
                </div>
            `;
        }
    }
    
    // Handle user logout
    async function handleLogout() {
        try {
            await window.supabaseClient.auth.signOut();
            // Reload page to reset navbar
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    // Toggle user dropdown
    function toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('userDropdown');
        const button = event.target.closest('[onclick="toggleUserDropdown()"]');
        
        if (dropdown && !button && !dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Redirect to dashboard
    async function redirectToDashboard() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (session && session.access_token) {
                // Redirect directly to dashboard
                window.location.href = 'https://app.mailsfinder.com';
            } else {
                // If no session, redirect to login
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error getting session for dashboard redirect:', error);
            // Fallback: redirect to login
            window.location.href = 'login.html';
        }
    }

    // Make functions globally available
    window.handleLogin = handleLogin;
    window.handleSignup = handleSignup;
    window.checkAuthState = checkAuthState;
    window.toggleUserDropdown = toggleUserDropdown;
    window.handleLogout = handleLogout;
    window.redirectToDashboard = redirectToDashboard;
    
    // Export functions for global use
    window.authFunctions = {
        showError,
        showSuccess,
        hideMessages,
        setLoadingState,
        isValidEmail,
        isStrongPassword,
        updateNavbarForUser,
        handleLogout,
        toggleUserDropdown,
        checkAuthState
    };

})();