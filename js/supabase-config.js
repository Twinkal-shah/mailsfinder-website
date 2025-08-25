// Supabase configuration
const SUPABASE_URL = 'https://wbcfsffssphgvpnbrvve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiY2ZzZmZzc3BoZ3ZwbmJydnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM3NTQsImV4cCI6MjA3MDc0OTc1NH0.3GV4dQm0Aqm8kbNzPJYOCFLnvhyNqxCJCtwfmUAw29Y';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User management functions for custom profiles table
const userManager = {
    // Create or update user in custom profiles table
    async createOrUpdateUser(authUser, additionalData = {}) {
        try {
            // Calculate plan expiry (3 days from now for free plan)
            const planExpiry = new Date();
            planExpiry.setDate(planExpiry.getDate() + 3);
            
            const userData = {
                id: authUser.id,
                email: authUser.email,
                full_name: additionalData.full_name || `${additionalData.first_name || ''} ${additionalData.last_name || ''}`.trim(),
                company: additionalData.company || null,
                plan: 'free', // Default plan
                plan_expiry: planExpiry.toISOString(),
                credits: 25, // Total credits for backward compatibility
                credits_find: 25, // Credits for email finding
                credits_verify: 25, // Credits for email verification
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...additionalData
            };

            // Use upsert to create or update user
            const { data, error } = await supabase
                .from('profiles')
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

    // Get user from custom profiles table
    async getUser(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
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
                .from('profiles')
                .update({
                    credits_find: creditsFind,
                    credits_verify: creditsVerify,
                    credits: creditsFind + creditsVerify, // Update total credits
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

    // Deduct credits for email finding
    async deductFindCredits(userId, amount = 1) {
        try {
            // First get current credits
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return { success: false, error: 'Failed to get user data' };
            }

            const currentCredits = userResult.data.credits_find || 0;
            if (currentCredits < amount) {
                return { success: false, error: 'Insufficient credits for email finding' };
            }

            const newCredits = currentCredits - amount;
            const updateResult = await this.updateCredits(userId, newCredits, userResult.data.credits_verify || 0);
            
            if (updateResult.success) {
                console.log(`Deducted ${amount} find credit(s). Remaining: ${newCredits}`);
            }
            
            return updateResult;
        } catch (error) {
            console.error('Deduct find credits error:', error);
            return { success: false, error: error.message };
        }
    },

    // Deduct credits for email verification
    async deductVerifyCredits(userId, amount = 1) {
        try {
            // First get current credits
            const userResult = await this.getUser(userId);
            if (!userResult.success) {
                return { success: false, error: 'Failed to get user data' };
            }

            const currentCredits = userResult.data.credits_verify || 0;
            if (currentCredits < amount) {
                return { success: false, error: 'Insufficient credits for email verification' };
            }

            const newCredits = currentCredits - amount;
            const updateResult = await this.updateCredits(userId, userResult.data.credits_find || 0, newCredits);
            
            if (updateResult.success) {
                console.log(`Deducted ${amount} verify credit(s). Remaining: ${newCredits}`);
            }
            
            return updateResult;
        } catch (error) {
            console.error('Deduct verify credits error:', error);
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
                .from('profiles')
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
                    data: {
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        full_name: userData.full_name,
                        company: userData.company
                    }
                }
            });
            
            if (error) throw error;

            // If user was created successfully, create record in profiles table
            if (data.user && !data.user.email_confirmed_at) {
                // User needs email confirmation, but we can prepare the user record
                console.log('User signed up, email confirmation required');
                
                // Create user profile immediately (will be activated upon email confirmation)
                const userResult = await userManager.createOrUpdateUser(data.user, userData);
                if (!userResult.success) {
                    console.error('Failed to create user profile:', userResult.error);
                }
            } else if (data.user) {
                // User is immediately confirmed, create user record
                const userResult = await userManager.createOrUpdateUser(data.user, userData);
                if (!userResult.success) {
                    console.error('Failed to create user profile:', userResult.error);
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
                    // Create profile if it doesn't exist
                    await userManager.createOrUpdateUser(data.user);
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
            const { data: { user } } = await supabase.auth.getUser();
            return user;
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
                    await userManager.createOrUpdateUser(session.user);
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
