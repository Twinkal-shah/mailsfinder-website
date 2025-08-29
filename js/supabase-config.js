// Supabase configuration
const SUPABASE_URL = 'https://wbcfsffssphgvpnbrvve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiY2ZzZmZzc3BoZ3ZwbmJydnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM3NTQsImV4cCI6MjA3MDc0OTc1NH0.3GV4dQm0Aqm8kbNzPJYOCFLnvhyNqxCJCtwfmUAw29Y';

// Initialize Supabase client with session persistence
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

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

            if (error) {
                console.error('Error creating/updating user:', {
                    error: error,
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                return { success: false, error: error.message, fullError: error };
            }

            console.log('User created/updated successfully:', data);
            
            // Verify the data was actually saved
            const { data: verifyData, error: verifyError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userData.id)
                .single();
                
            if (verifyError) {
                console.error('Error verifying saved data:', verifyError);
            } else {
                console.log('Verified saved data:', verifyData);
            }
            
            return { success: true, data, verified: verifyData };
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
            console.log('Starting signup with userData:', userData);
            
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
            // First try to get the current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Session retrieval error:', sessionError);
                return null;
            }
            
            if (session && session.user) {
                return session.user;
            }
            
            // Fallback to getUser if no session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Get current user error:', userError);
                return null;
            }
            
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
