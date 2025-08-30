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
            console.log('Starting comprehensive authentication state check...');
            
            // First, check for session from multiple sources
            let session = null;
            let sessionSource = 'none';
            
            // Try to get session from Supabase
            try {
                const { data: { session: supabaseSession }, error: sessionError } = await window.supabaseClient.auth.getSession();
                
                if (sessionError) {
                    console.warn('Supabase session retrieval error:', sessionError);
                } else if (supabaseSession) {
                    session = supabaseSession;
                    sessionSource = 'supabase';
                    console.log('Session found from Supabase');
                }
            } catch (supabaseError) {
                console.warn('Error accessing Supabase session:', supabaseError);
            }
            
            // If no Supabase session, try backup storage
            if (!session) {
                try {
                    const backupSession = localStorage.getItem('mailsfinder_session_backup');
                    if (backupSession) {
                        const parsedSession = JSON.parse(backupSession);
                        const currentTime = Math.floor(Date.now() / 1000);
                        
                        // Check if backup session is still valid
                        if (parsedSession.expires_at && parsedSession.expires_at > currentTime) {
                            console.log('Valid backup session found, attempting to restore...');
                            
                            // Try to restore session to Supabase
                            const { data, error } = await window.supabaseClient.auth.setSession({
                                access_token: parsedSession.access_token,
                                refresh_token: parsedSession.refresh_token
                            });
                            
                            if (!error && data.session) {
                                session = data.session;
                                sessionSource = 'backup_restored';
                                console.log('Session successfully restored from backup');
                            } else {
                                console.warn('Failed to restore backup session:', error);
                                localStorage.removeItem('mailsfinder_session_backup');
                            }
                        } else {
                            console.log('Backup session expired, removing...');
                            localStorage.removeItem('mailsfinder_session_backup');
                        }
                    }
                } catch (backupError) {
                    console.warn('Error processing backup session:', backupError);
                    localStorage.removeItem('mailsfinder_session_backup');
                }
            }
            
            // Validate session if found
            if (session && session.access_token) {
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Check if session is expired
                if (session.expires_at && session.expires_at <= currentTime) {
                    console.log('Session expired, attempting refresh...');
                    
                    try {
                        const { data: refreshData, error: refreshError } = await window.supabaseClient.auth.refreshSession();
                        
                        if (refreshError || !refreshData.session) {
                            console.error('Session refresh failed:', refreshError);
                            throw new Error('Session expired and refresh failed');
                        }
                        
                        session = refreshData.session;
                        sessionSource = 'refreshed';
                        console.log('Session refreshed successfully');
                        
                        // Update backup storage with refreshed session
                        try {
                            localStorage.setItem('mailsfinder_session_backup', JSON.stringify({
                                access_token: session.access_token,
                                refresh_token: session.refresh_token,
                                user_id: session.user.id,
                                expires_at: session.expires_at,
                                timestamp: Date.now()
                            }));
                        } catch (storageError) {
                            console.warn('Could not update session backup:', storageError);
                        }
                    } catch (refreshError) {
                        console.error('Critical session refresh error:', refreshError);
                        session = null;
                        sessionSource = 'none';
                        
                        // Clean up invalid session data
                        try {
                            localStorage.removeItem('mailsfinder_session_backup');
                            await window.supabaseClient.auth.signOut();
                        } catch (cleanupError) {
                            console.warn('Error during session cleanup:', cleanupError);
                        }
                    }
                }
            }
            
            // Process authenticated state
            if (session && session.user) {
                console.log(`User is authenticated (source: ${sessionSource}):`, session.user);
                
                // Get comprehensive user data
                const userData = await window.auth.getCurrentUserWithData();
                
                // Try to get cached user data for faster navbar update
                let cachedUserData = userData;
                if (!cachedUserData) {
                    try {
                        const cached = localStorage.getItem('mailsfinder_user_cache');
                        if (cached) {
                            const parsedCache = JSON.parse(cached);
                            // Use cache if it's less than 5 minutes old
                            if (Date.now() - parsedCache.timestamp < 300000) {
                                cachedUserData = parsedCache;
                            }
                        }
                    } catch (e) {
                        console.warn('[Auth] Failed to parse cached user data:', e);
                    }
                }
                
                // Update navbar to show user profile
                await updateNavbarForUser(session.user, cachedUserData);
                
                // Handle page-specific redirects for authenticated users
                const currentPath = window.location.pathname;
                if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
                    console.log('Authenticated user on auth page, redirecting to home...');
                    window.location.href = 'index.html';
                }
                
                // Store successful authentication state
                try {
                    localStorage.setItem('mailsfinder_auth_state', JSON.stringify({
                        authenticated: true,
                        user_id: session.user.id,
                        timestamp: Date.now(),
                        source: sessionSource
                    }));
                } catch (storageError) {
                    console.warn('Could not store auth state:', storageError);
                }
                
            } else {
                console.log('No valid authentication found');
                
                // Clear authentication state
                try {
                    localStorage.removeItem('mailsfinder_auth_state');
                    localStorage.removeItem('mailsfinder_session_backup');
                } catch (storageError) {
                    console.warn('Error clearing auth state:', storageError);
                }
                
                // Reset navbar to show login state
                resetNavbarToLoginState();
            }
            
        } catch (error) {
            console.error('Critical error during auth state check:', error);
            
            // Comprehensive error cleanup
            try {
                localStorage.removeItem('mailsfinder_auth_state');
                localStorage.removeItem('mailsfinder_session_backup');
                await window.supabaseClient.auth.signOut();
            } catch (cleanupError) {
                console.warn('Error during error cleanup:', cleanupError);
            }
            
            // Reset navbar to safe state
            resetNavbarToLoginState();
        }
    }
    
    // Helper function to reset navbar to login state
    function resetNavbarToLoginState() {
        try {
            const authButton = document.getElementById('authButton');
            const mobileAuthButton = document.getElementById('mobileAuthButton');
            
            if (authButton) {
                authButton.innerHTML = `
                    <a href="#" onclick="redirectToDashboard()" class="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105">
                        Start Finding Emails
                    </a>
                `;
            }
            
            if (mobileAuthButton) {
                mobileAuthButton.innerHTML = `
                    <a href="#" onclick="redirectToDashboard()" class="w-full text-left bg-primary hover:bg-blue-700 text-white px-3 py-2 rounded-md text-base font-medium transition-colors mt-2 block">
                        Start Finding Emails
                    </a>
                `;
            }
        } catch (resetError) {
            console.warn('Error resetting navbar to login state:', resetError);
        }
    }

    // Listen for auth state changes
    if (typeof window.auth !== 'undefined' && window.auth.onAuthStateChange) {
        window.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', session.user);
                
                // Try to get cached user data for faster navbar update
                let cachedUserData = null;
                try {
                    const cached = localStorage.getItem('mailsfinder_user_cache');
                    if (cached) {
                        const parsedCache = JSON.parse(cached);
                        // Use cache if it's less than 5 minutes old
                        if (Date.now() - parsedCache.timestamp < 300000) {
                            cachedUserData = parsedCache;
                        }
                    }
                } catch (e) {
                    console.warn('[Auth] Failed to parse cached user data:', e);
                }
                
                // Update navbar to show user profile
                await updateNavbarForUser(session.user, cachedUserData);
            } else if (event === 'INITIAL_SESSION') {
                // Supabase v2 emits INITIAL_SESSION on load when a session already exists
                if (session?.user) {
                    console.log('Initial session detected, updating navbar for existing user');
                    
                    // Try to get cached user data for faster navbar update
                    let cachedUserData = null;
                    try {
                        const cached = localStorage.getItem('mailsfinder_user_cache');
                        if (cached) {
                            const parsedCache = JSON.parse(cached);
                            // Use cache if it's less than 5 minutes old
                            if (Date.now() - parsedCache.timestamp < 300000) {
                                cachedUserData = parsedCache;
                            }
                        }
                    } catch (e) {
                        console.warn('[Auth] Failed to parse cached user data:', e);
                    }
                    
                    await updateNavbarForUser(session.user, cachedUserData);
                }
            } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    console.log('Session token refreshed/user updated, ensuring navbar is up to date');
                    
                    // Try to get cached user data for faster navbar update
                    let cachedUserData = null;
                    try {
                        const cached = localStorage.getItem('mailsfinder_user_cache');
                        if (cached) {
                            const parsedCache = JSON.parse(cached);
                            // Use cache if it's less than 5 minutes old
                            if (Date.now() - parsedCache.timestamp < 300000) {
                                cachedUserData = parsedCache;
                            }
                        }
                    } catch (e) {
                        console.warn('[Auth] Failed to parse cached user data:', e);
                    }
                    
                    await updateNavbarForUser(session.user, cachedUserData);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                
                // Clear cached user data on sign out
                try {
                    localStorage.removeItem('mailsfinder_user_cache');
                    localStorage.removeItem('forceAuthUpdate');
                } catch (e) {
                    console.warn('[Auth] Failed to clear cached user data:', e);
                }
                
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

    // Helper to ensure navbar is in sync with current session
    async function ensureNavbarUpdated(reason = 'manual') {
        try {
            const user = await window.auth.getCurrentUser();
            console.log(`[Navbar] ensureNavbarUpdated (${reason}) ->`, !!user);
            if (user) {
                await updateNavbarForUser(user);
            }
        } catch (e) {
            console.warn('[Navbar] ensureNavbarUpdated error:', e);
        }
    }

    // Refresh navbar when the tab regains focus or page is shown from bfcache
    window.addEventListener('focus', () => ensureNavbarUpdated('window-focus'));
    window.addEventListener('pageshow', (e) => {
        // pageshow fires on back/forward cache restores as well
        ensureNavbarUpdated(e.persisted ? 'pageshow-bfcache' : 'pageshow');
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            ensureNavbarUpdated('visibilitychange-visible');
        }
    });

    // Update navbar for authenticated user
    async function updateNavbarForUser(user, userData = null, _retryCount = 0) {
        // Prefer IDs (unique) then fallback to class selectors
        let authButton = document.getElementById('authButton') || document.querySelector('.auth-button');
        let mobileAuthButton = document.getElementById('mobileAuthButton') || document.querySelector('.mobile-auth-button');

        // If DOM not ready or elements not yet mounted, retry a few times
        if ((!authButton && !mobileAuthButton) && _retryCount < 5) {
            console.log(`[Navbar] Targets not ready (retry ${_retryCount + 1}/5) – delaying updateNavbarForUser`);
            await new Promise(r => setTimeout(r, 200));
            return updateNavbarForUser(user, userData, _retryCount + 1);
        }

        if (!user) {
            console.warn('[Navbar] No user provided to updateNavbarForUser');
            return;
        }

        try {
            console.log('[Navbar] Updating navbar for user:', user.email);
            
            // Compute default display values
            let userName = user.email?.split('@')[0] || 'User';
            const userEmail = user.email || 'User';
            let userCredits = { find: 0, verify: 0 };
            let userPlan = 'Free';

            // Use provided userData if available, otherwise fetch it
            let userWithData = userData;
            if (!userWithData) {
                // Race profile fetch with a timeout so UI doesn't stall
                const withTimeout = (p, ms) => Promise.race([
                    p,
                    new Promise(resolve => setTimeout(() => resolve(null), ms))
                ]);

                try {
                    userWithData = await withTimeout(window.auth.getCurrentUserWithData(), 2000);
                    console.log('[Navbar] Fetched user data:', userWithData);
                } catch (fetchError) {
                    console.warn('[Navbar] Failed to fetch user data:', fetchError);
                }
            } else {
                console.log('[Navbar] Using provided user data:', userWithData);
            }

            // Extract user information from multiple sources
            if (userWithData?.profile?.full_name) {
                userName = userWithData.profile.full_name;
            } else if (userWithData?.name) {
                userName = userWithData.name;
            } else if (user.user_metadata?.full_name) {
                userName = user.user_metadata.full_name;
            } else if (user.user_metadata?.name) {
                userName = user.user_metadata.name;
            }
            
            // Extract credits information
            if (userWithData?.credits_find !== undefined) {
                userCredits.find = userWithData.credits_find;
            }
            if (userWithData?.credits_verify !== undefined) {
                userCredits.verify = userWithData.credits_verify;
            }
            
            // Extract plan information
            if (userWithData?.plan) {
                userPlan = userWithData.plan;
            }

            // Cache for fast restore on next visits and cross-domain access
            try {
                const cachePayload = {
                    user: { 
                        id: user.id, 
                        email: user.email,
                        user_metadata: user.user_metadata 
                    },
                    profile: { 
                        full_name: userName,
                        plan: userPlan,
                        credits_find: userCredits.find,
                        credits_verify: userCredits.verify
                    },
                    timestamp: Date.now()
                };
                localStorage.setItem('forceAuthUpdate', JSON.stringify(cachePayload));
                localStorage.setItem('mailsfinder_user_cache', JSON.stringify(cachePayload));
                console.log('[Navbar] Cached comprehensive user data for fast restore');
            } catch (e) {
                console.warn('[Navbar] Failed to cache user data:', e);
            }

            if (authButton) {
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
                            <div class="text-xs text-blue-600 mt-1">${userPlan} Plan</div>
                        </div>
                        <a href="#" onclick="redirectToDashboard()" class="block px-4 py-2 text-sm text-text-gray hover:bg-gray-100">Dashboard</a>
                        <button onclick="handleLogout()" class="block w-full text-left px-4 py-2 text-sm text-text-gray hover:bg-gray-100">Sign Out</button>
                    </div>
                </div>`;
                console.log('[Navbar] ✓ Desktop navbar updated');
            }

            if (mobileAuthButton) {
                const mobileUserName = userName; // keep same name for consistency
                mobileAuthButton.innerHTML = `
                <div class="px-3 py-2 border-t border-gray-200">
                    <div class="flex items-center space-x-3 mb-2">
                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            ${mobileUserName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-text-dark">${mobileUserName}</div>
                            <div class="text-xs text-text-gray">${userEmail}</div>
                            <div class="text-xs text-blue-600">${userPlan} Plan</div>
                        </div>
                    </div>
                    <a href="#" onclick="redirectToDashboard()" class="block w-full text-left bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-md text-sm font-medium transition-colors mb-2">Dashboard</a>
                    <button onclick="handleLogout()" class="block w-full text-left text-text-gray hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Sign Out</button>
                </div>`;
                console.log('[Navbar] ✓ Mobile navbar updated');
            }
        } catch (error) {
            console.error('[Navbar] Error updating navbar for user:', error);
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
            console.log('Starting dashboard redirect with authentication check...');
            
            // First, try to get the current session
            const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
            
            if (sessionError) {
                console.error('Session retrieval error:', sessionError);
                throw sessionError;
            }
            
            // Validate session and check if it's still valid
            if (session && session.access_token && session.expires_at) {
                const currentTime = Math.floor(Date.now() / 1000);
                const expiresAt = session.expires_at;
                
                // Check if session is expired
                if (expiresAt <= currentTime) {
                    console.log('Session expired, attempting refresh...');
                    
                    // Try to refresh the session
                    const { data: refreshData, error: refreshError } = await window.supabaseClient.auth.refreshSession();
                    
                    if (refreshError || !refreshData.session) {
                        console.error('Session refresh failed:', refreshError);
                        throw new Error('Session expired and refresh failed');
                    }
                    
                    // Use the refreshed session
                    session = refreshData.session;
                    console.log('Session refreshed successfully');
                }
                
                // Get comprehensive user data for dashboard
                let userData = null;
                try {
                    userData = await window.auth.getCurrentUserWithData();
                    console.log('[Dashboard] Retrieved user data for redirect:', userData);
                } catch (e) {
                    console.warn('[Dashboard] Failed to get user data:', e);
                }
                
                // Prepare secure URL parameters with session tokens
                const params = new URLSearchParams({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    user_id: session.user.id,
                    user_email: session.user.email,
                    expires_at: session.expires_at,
                    timestamp: Date.now() // Add timestamp for cache busting
                });
                
                // Add comprehensive user data if available
                if (userData) {
                    if (userData.name) params.append('user_name', userData.name);
                    if (userData.company) params.append('user_company', userData.company);
                    if (userData.plan) params.append('user_plan', userData.plan);
                    if (userData.credits_find !== undefined) params.append('credits_find', userData.credits_find);
                    if (userData.credits_verify !== undefined) params.append('credits_verify', userData.credits_verify);
                }
                
                // Store session data in localStorage for backup
                try {
                    const sessionBackup = {
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                        user_id: session.user.id,
                        expires_at: session.expires_at,
                        timestamp: Date.now()
                    };
                    
                    // Include user data if available
                    if (userData) {
                        sessionBackup.userData = userData;
                    }
                    
                    localStorage.setItem('mailsfinder_session_backup', JSON.stringify(sessionBackup));
                    console.log('[Dashboard] Session backup stored with user data');
                } catch (e) {
                    console.warn('[Dashboard] Failed to store session backup:', e);
                }
                
                // Update navbar before redirect
                await updateNavbarForUser(session.user, userData);
                
                // Redirect to dashboard with comprehensive auth data
                const dashboardUrl = `https://app.mailsfinder.com?${params.toString()}`;
                console.log('Redirecting to dashboard with validated auth tokens');
                window.location.href = dashboardUrl;
                
            } else {
                // No valid session found
                console.log('No valid session found, redirecting to login');
                
                // Clear any stale session data
                try {
                    localStorage.removeItem('mailsfinder_session_backup');
                    await window.supabaseClient.auth.signOut();
                } catch (cleanupError) {
                    console.warn('Error during session cleanup:', cleanupError);
                }
                
                window.location.href = 'login.html';
            }
            
        } catch (error) {
            console.error('Critical error during dashboard redirect:', error);
            
            // Enhanced error handling with user feedback
            const errorMessage = error.message || 'Authentication error occurred';
            
            // Try to show user-friendly error if possible
            if (typeof showError === 'function') {
                showError(`Authentication failed: ${errorMessage}. Please try logging in again.`);
            }
            
            // Clear potentially corrupted session data
            try {
                localStorage.removeItem('mailsfinder_session_backup');
                await window.supabaseClient.auth.signOut();
            } catch (cleanupError) {
                console.warn('Error during error cleanup:', cleanupError);
            }
            
            // Fallback: redirect to login with error indication
            setTimeout(() => {
                window.location.href = 'login.html?error=auth_failed';
            }, 2000); // Give time for error message to be seen
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