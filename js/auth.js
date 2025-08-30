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
        console.log('[Auth] Resetting navbar to login state');
        
        try {
            // Hide loading states
            const loadingElements = ['navbar-loading', 'mobile-navbar-loading'];
            loadingElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'none';
            });
            
            // Hide user menus
            const userMenuElements = ['user-menu', 'mobile-user-menu'];
            userMenuElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'none';
            });
            
            // Show CTA buttons
            const ctaElements = ['cta-button', 'mobile-cta-button'];
            ctaElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'block';
            });
            
            // Clear any cached user data
            localStorage.removeItem('mailsfinder_user_cache');
            localStorage.removeItem('mailsfinder_session_backup');
            
            console.log('[Auth] Navbar reset to logged-out state');
        } catch (resetError) {
            console.warn('Error resetting navbar to login state:', resetError);
        }
    }

    // Listen for auth state changes
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State change:', event, session?.user?.email);
        
        try {
            switch (event) {
                case 'SIGNED_IN':
                case 'INITIAL_SESSION':
                case 'TOKEN_REFRESHED':
                case 'USER_UPDATED':
                    if (session?.user) {
                        console.log('[Auth] User authenticated, updating navbar');
                        
                        // Try to get cached user data first for faster UI update
                        let cachedData = null;
                        try {
                            const cached = localStorage.getItem('mailsfinder_user_cache');
                            if (cached) {
                                const parsedCache = JSON.parse(cached);
                                // Check if cache is recent (within 5 minutes)
                                const cacheAge = Date.now() - new Date(parsedCache.last_updated).getTime();
                                if (cacheAge < 5 * 60 * 1000) {
                                    cachedData = parsedCache;
                                    console.log('[Auth] Using cached user data for navbar');
                                }
                            }
                        } catch (e) {
                            console.warn('[Auth] Failed to parse cached user data:', e);
                        }
                        
                        // Update navbar with cached data first, then fetch fresh data if needed
                        if (cachedData) {
                            updateNavbarForUser(session.user, cachedData);
                        } else {
                            updateNavbarForUser(session.user);
                        }
                    }
                    break;
                    
                case 'SIGNED_OUT':
                    console.log('[Auth] User signed out, resetting navbar');
                    resetNavbarToLoginState();
                    break;
                    
                default:
                    console.log('[Auth] Unhandled auth event:', event);
            }
        } catch (error) {
            console.error('[Auth] Error handling auth state change:', error);
            resetNavbarToLoginState();
        }
    });
    
    // Initial session check with loading state management
    async function initializeAuthState() {
        try {
            console.log('[Auth] Initializing authentication state...');
            
            // Show loading state initially
            const loadingElements = ['navbar-loading', 'mobile-navbar-loading'];
            loadingElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'block';
            });
            
            // Get current session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('[Auth] Error getting session:', error);
                resetNavbarToLoginState();
                return;
            }
            
            if (session?.user) {
                console.log('[Auth] Found existing session for:', session.user.email);
                // Let the auth state change handler take care of updating the navbar
            } else {
                console.log('[Auth] No existing session found');
                resetNavbarToLoginState();
            }
            
        } catch (error) {
            console.error('[Auth] Error during auth initialization:', error);
            resetNavbarToLoginState();
        }
    }
    
    // Initialize auth when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuthState);
    } else {
        initializeAuthState();
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
        console.log('[Auth] Updating navbar for user:', user?.email);
        
        if (!user) {
            console.warn('[Navbar] No user provided to updateNavbarForUser');
            return;
        }

        try {
            // Get user information from various sources
            const email = user?.email || userData?.email || '';
            const fullName = userData?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
            const credits = userData?.credits_find || user?.user_metadata?.credits_find || 0;
            const plan = userData?.plan || user?.user_metadata?.plan || 'free';
            
            // If we don't have userData, try to fetch it
            if (!userData && user) {
                try {
                    const fetchedData = await window.auth.getCurrentUserWithData();
                    if (fetchedData) {
                        return updateNavbarForUser(user, fetchedData);
                    }
                } catch (error) {
                    console.warn('[Auth] Could not fetch user data for navbar:', error);
                    // Continue with available data
                }
            }
            
            const displayName = fullName || email.split('@')[0] || 'User';
            
            // Hide loading states
            const loadingElements = ['navbar-loading', 'mobile-navbar-loading'];
            loadingElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'none';
            });
            
            // Hide CTA buttons
            const ctaElements = ['cta-button', 'mobile-cta-button'];
            ctaElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.style.display = 'none';
            });
            
            // Update and show desktop user menu
            const welcomeText = document.getElementById('welcome-text');
            const userMenu = document.getElementById('user-menu');
            if (welcomeText && userMenu) {
                welcomeText.textContent = `Welcome, ${displayName}`;
                userMenu.style.display = 'flex';
            }
            
            // Update and show mobile user menu
            const mobileWelcomeText = document.getElementById('mobile-welcome-text');
            const mobileUserMenu = document.getElementById('mobile-user-menu');
            if (mobileWelcomeText && mobileUserMenu) {
                mobileWelcomeText.textContent = `Welcome, ${displayName}`;
                mobileUserMenu.style.display = 'block';
            }
            
            // Add event listeners for sign-out buttons
            const signoutBtn = document.getElementById('signout-btn');
            const mobileSignoutBtn = document.getElementById('mobile-signout-btn');
            
            if (signoutBtn) {
                signoutBtn.onclick = handleGlobalLogout;
            }
            if (mobileSignoutBtn) {
                mobileSignoutBtn.onclick = handleGlobalLogout;
            }
            
            // Cache comprehensive user data for cross-domain access
            const userCache = {
                id: user.id,
                email: email,
                full_name: fullName,
                credits_find: credits,
                plan: plan,
                last_updated: new Date().toISOString()
            };
            
            localStorage.setItem('mailsfinder_user_cache', JSON.stringify(userCache));
            
            console.log('[Auth] Navbar updated successfully for:', displayName);
            
        } catch (error) {
            console.error('[Auth] Error updating navbar:', error);
            resetNavbarToLoginState();
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
    
    // Global logout function for cross-domain sign out
    async function handleGlobalLogout() {
        try {
            console.log('[Auth] Starting global logout process...');
            
            // Clear all local storage data
            localStorage.removeItem('mailsfinder_user_cache');
            localStorage.removeItem('mailsfinder_session_backup');
            localStorage.removeItem('mailsfinder_auth_state');
            localStorage.removeItem('forceAuthUpdate');
            
            // Sign out from Supabase
            await window.supabaseClient.auth.signOut();
            
            // Reset navbar immediately
            resetNavbarToLoginState();
            
            // Redirect to home page
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('[Auth] Error during global logout:', error);
            // Force reload as fallback
            window.location.reload();
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
            console.log('[Auth] Redirecting to dashboard...');
            
            // Get current session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('[Auth] Error getting session for dashboard redirect:', error);
                window.location.href = 'login.html';
                return;
            }
            
            if (!session) {
                console.log('[Auth] No session found, redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            
            // Since we're using cookie-based sessions, the dashboard should automatically
            // detect the user's session. Just redirect directly.
            console.log('[Auth] Session found, redirecting to dashboard');
            window.location.href = 'https://app.mailsfinder.com/dashboard';
            
        } catch (error) {
            console.error('[Auth] Error during dashboard redirect:', error);
            
            // Redirect to login as fallback
            window.location.href = 'login.html';
        }
    }

    // Make functions globally available
    window.handleLogin = handleLogin;
    window.handleSignup = handleSignup;
    window.checkAuthState = checkAuthState;
    window.toggleUserDropdown = toggleUserDropdown;
    window.handleLogout = handleLogout;
    window.handleGlobalLogout = handleGlobalLogout;
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