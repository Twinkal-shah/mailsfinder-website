// Supabase configuration
const SUPABASE_URL = 'https://wbcfsffssphgvpnbrvve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiY2ZzZmZzc3BoZ3ZwbmJydnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM3NTQsImV4cCI6MjA3MDc0OTc1NH0.3GV4dQm0Aqm8kbNzPJYOCFLnvhyNqxCJCtwfmUAw29Y';

// Initialize Supabase client with cross-subdomain session persistence
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
            getItem: (key) => {
                // Use localStorage but with domain-wide cookie fallback
                const localValue = localStorage.getItem(key);
                if (localValue) return localValue;
                
                // Fallback to cookie for cross-subdomain sharing
                const cookieValue = getCookie(key);
                return cookieValue;
            },
            setItem: (key, value) => {
                // Store in localStorage
                localStorage.setItem(key, value);
                
                // Also store in domain-wide cookie for cross-subdomain access
                setCookie(key, value, {
                    domain: '.mailsfinders.com',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    secure: true,
                    sameSite: 'Lax'
                });
            },
            removeItem: (key) => {
                localStorage.removeItem(key);
                deleteCookie(key, { domain: '.mailsfinders.com', path: '/' });
            }
        }
    }
});

// Cookie utility functions for cross-subdomain session persistence
function setCookie(name, value, options = {}) {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (options.domain) cookieString += `; Domain=${options.domain}`;
    if (options.path) cookieString += `; Path=${options.path}`;
    if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
    if (options.secure) cookieString += '; Secure';
    if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
    
    document.cookie = cookieString;
}

function getCookie(name) {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

function deleteCookie(name, options = {}) {
    setCookie(name, '', { ...options, maxAge: -1 });
}

// User management functions for custom profiles table
const userManager = {
    // Create or update user in custom profiles table
    async createOrUpdateUser(authUser, additionalData = {}) {
        try {
            console.log('createOrUpdateUser called with:', {
                authUser: {
                    id: authUser.id,
                    email: authUser.email,
                    user_metadata: authUser.user_metadata
                },
                additionalData
            });
            
            // Calculate plan expiry (3 days from created_at date for free plan)
            const createdAt = new Date();
            const planExpiry = new Date(createdAt);
            planExpiry.setDate(createdAt.getDate() + 3);
            
            // Merge user metadata with additional data, prioritizing additionalData
            const metadata = authUser.user_metadata || {};
            const firstName = additionalData.first_name || metadata.first_name || '';
            const lastName = additionalData.last_name || metadata.last_name || '';
            const fullName = additionalData.full_name || metadata.full_name || `${firstName} ${lastName}`.trim() || null;
            const company = additionalData.company || metadata.company || null;
            
            const userData = {
                id: authUser.id,
                email: authUser.email,
                full_name: fullName,
                company: company,
                plan: 'free', // Default plan
                plan_expiry: planExpiry.toISOString(),
                credits: 25, // Total credits for backward compatibility
                credits_find: 25, // Credits for email finding
                credits_verify: 25, // Credits for email verification
                created_at: createdAt.toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('Prepared userData for database:', userData);

            // Use upsert to create or update user
            console.log('Attempting to upsert user data to profiles table:', userData);
            
            const { data, error } = await supabase
                .from('profiles')
                .upsert(userData, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                })
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('Upsert successful, data returned:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Error in createOrUpdateUser:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user by ID
    async getUser(userId) {
        try {
            console.log('Fetching user from profiles table for ID:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user:', error);
            return { success: false, error: error.message };
        }
    },

    // Update credits
    async updateCredits(userId, creditsFind, creditsVerify) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    credits_find: creditsFind,
                    credits_verify: creditsVerify,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating credits:', error);
            return { success: false, error: error.message };
        }
    },

    // Deduct find credits
    async deductFindCredits(userId, amount = 1) {
        try {
            // Get current credits
            const user = await this.getUser(userId);
            if (!user.success) throw new Error('Failed to fetch user for deducting credits');
            
            const newCreditsFind = Math.max(0, (user.data.credits_find || 0) - amount);
            
            // Update credits
            return await this.updateCredits(userId, newCreditsFind, user.data.credits_verify || 0);
        } catch (error) {
            console.error('Error deducting find credits:', error);
            return { success: false, error: error.message };
        }
    },

    // Deduct verify credits
    async deductVerifyCredits(userId, amount = 1) {
        try {
            // Get current credits
            const user = await this.getUser(userId);
            if (!user.success) throw new Error('Failed to fetch user for deducting credits');
            
            const newCreditsVerify = Math.max(0, (user.data.credits_verify || 0) - amount);
            
            // Update credits
            return await this.updateCredits(userId, user.data.credits_find || 0, newCreditsVerify);
        } catch (error) {
            console.error('Error deducting verify credits:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user plan
    async updatePlan(userId, plan, planExpiry = null, subscriptionId = null, customerId = null) {
        try {
            const updateData = {
                plan,
                updated_at: new Date().toISOString()
            };
            
            if (planExpiry) updateData.plan_expiry = planExpiry;
            if (subscriptionId) updateData.subscription_id = subscriptionId;
            if (customerId) updateData.customer_id = customerId;
            
            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating plan:', error);
            return { success: false, error: error.message };
        }
    }
};

const auth = {
    // Sign up new user
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        full_name: userData.full_name,
                        company: userData.company
                    }
                }
            });
            
            if (error) throw error;
            
            console.log('Supabase signup response:', {
                user: data.user ? {
                    id: data.user.id,
                    email: data.user.email,
                    email_confirmed_at: data.user.email_confirmed_at,
                    user_metadata: data.user.user_metadata
                } : null,
                session: data.session ? 'exists' : 'null'
            });

            // Always create user profile immediately, regardless of email confirmation status
            if (data.user) {
                console.log('Creating user profile for:', data.user.id);
                
                // Create user profile with the provided userData
                const userResult = await userManager.createOrUpdateUser(data.user, userData);
                if (!userResult.success) {
                    console.error('Failed to create user profile:', userResult.error);
                } else {
                    console.log('User profile created successfully:', userResult.data);
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in existing user
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;

            // Ensure user profile exists in profiles table
            if (data.user) {
                const userResult = await userManager.getUser(data.user.id);
                if (!userResult.success) {
                    // Create profile if it doesn't exist, preserve user metadata
                    const userData = {
                        first_name: data.user.user_metadata?.first_name,
                        last_name: data.user.user_metadata?.last_name,
                        full_name: data.user.user_metadata?.full_name,
                        company: data.user.user_metadata?.company
                    };
                    await userManager.createOrUpdateUser(data.user, userData);
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('Signin error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out user
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Signout error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session?.user || null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    // Get current user with custom user data
    async getCurrentUserWithData() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            const userResult = await userManager.getUser(user.id);
            if (userResult.success) {
                return { ...user, profile: userResult.data };
            }
            
            return user;
        } catch (error) {
            console.error('Get current user with data error:', error);
            return null;
        }
    },

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // Ensure user profile exists
                const userResult = await userManager.getUser(session.user.id);
                if (!userResult.success) {
                    // Only create profile if it doesn't exist, preserve user metadata
                    const userData = {
                        first_name: session.user.user_metadata?.first_name,
                        last_name: session.user.user_metadata?.last_name,
                        full_name: session.user.user_metadata?.full_name,
                        company: session.user.user_metadata?.company
                    };
                    await userManager.createOrUpdateUser(session.user, userData);
                }
            }
            callback(event, session);
        });
    },

    // Reset password
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export to global scope
window.supabaseClient = supabase;
window.auth = auth;
window.userManager = userManager;

// Legacy support
window.supabase = window.supabase || {};
window.supabase.client = supabase;
