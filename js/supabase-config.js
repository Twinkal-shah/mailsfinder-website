// Supabase Configuration
// Your Supabase project credentials
const SUPABASE_URL = 'https://wbcfsffssphgvpnbrvve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiY2ZzZmZzc3BoZ3ZwbmJydnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM3NTQsImV4cCI6MjA3MDc0OTc1NH0.3GV4dQm0Aqm8kbNzPJYOCFLnvhyNqxCJCtwfmUAw29Y';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User management functions for custom users table
const userManager = {
    // Create or update user in custom users table
    async createOrUpdateUser(authUser, additionalData = {}) {
        try {
            const userData = {
                id: authUser.id,
                email: authUser.email,
                plan: 'free', // Default plan
                credits_find: 25, // Default credits
                credits_verify: 25, // Default credits
                updated_at: new Date().toISOString(),
                ...additionalData
            };

            // Use upsert to create or update user
            const { data, error } = await supabase
                .from('users')
                .upsert(userData, { 
                    onConflict: 'id',
                    ignoreDuplicates: false 
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating/updating user:', error);
                return { success: false, error: error.message };
            }

            console.log('User created/updated successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('User management error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user from custom users table
    async getUser(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user credits
    async updateCredits(userId, creditsFind, creditsVerify) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({ 
                    credits_find: creditsFind,
                    credits_verify: creditsVerify,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error updating credits:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Update credits error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user plan
    async updatePlan(userId, plan, planExpiry = null, subscriptionId = null, customerId = null) {
        try {
            const updateData = {
                plan: plan,
                updated_at: new Date().toISOString()
            };

            if (planExpiry) updateData.plan_expiry = planExpiry;
            if (subscriptionId) updateData.subscription_id = subscriptionId;
            if (customerId) updateData.customer_id = customerId;

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error updating plan:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Update plan error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Authentication helper functions
const auth = {
    // Sign up new user
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });
            
            if (error) throw error;

            // If user was created successfully, create record in users table
            if (data.user && !data.user.email_confirmed_at) {
                // User needs email confirmation, but we can prepare the user record
                console.log('User signed up, email confirmation required');
            } else if (data.user) {
                // User is immediately confirmed, create user record
                const userResult = await userManager.createOrUpdateUser(data.user, {
                    // Add any additional data from signup form
                    ...userData
                });
                
                if (!userResult.success) {
                    console.warn('User auth created but failed to create user record:', userResult.error);
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
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

            // After successful login, ensure user exists in users table
            if (data.user) {
                const userResult = await userManager.createOrUpdateUser(data.user);
                
                if (!userResult.success) {
                    console.warn('Login successful but failed to update user record:', userResult.error);
                    // Don't fail the login, just log the warning
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
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
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },

    // Get current user with custom user data
    async getCurrentUserWithData() {
        try {
            const authUser = await this.getCurrentUser();
            if (!authUser) return null;

            const userResult = await userManager.getUser(authUser.id);
            if (userResult.success) {
                return {
                    ...authUser,
                    userData: userResult.data
                };
            }

            return authUser;
        } catch (error) {
            console.error('Get user with data error:', error);
            return null;
        }
    },

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            // Handle email confirmation
            if (event === 'SIGNED_IN' && session?.user) {
                // Ensure user exists in users table when they sign in
                const userResult = await userManager.createOrUpdateUser(session.user);
                if (!userResult.success) {
                    console.warn('Failed to create/update user record on auth state change:', userResult.error);
                }
            }
            
            // Call the original callback
            callback(event, session);
        });
    },

    // Reset password
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export for use in other files
window.supabaseClient = supabase;
window.auth = auth;
window.userManager = userManager;

// Also create a global reference for backwards compatibility
window.supabase = window.supabase || {};
window.supabase.client = supabase;