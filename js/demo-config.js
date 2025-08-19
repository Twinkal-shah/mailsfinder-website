// Demo Configuration for Testing
// This file provides a mock Supabase client for testing the UI without actual Supabase credentials

// Mock Supabase client for demo purposes
const mockSupabase = {
    auth: {
        signUp: async (credentials) => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock validation
            if (!credentials.email || !credentials.password) {
                return { error: { message: 'Email and password are required' } };
            }
            
            if (credentials.password.length < 6) {
                return { error: { message: 'Password must be at least 6 characters' } };
            }
            
            // Mock success response
            return {
                data: {
                    user: {
                        id: 'demo-user-id',
                        email: credentials.email,
                        created_at: new Date().toISOString()
                    }
                },
                error: null
            };
        },
        
        signInWithPassword: async (credentials) => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock validation
            if (!credentials.email || !credentials.password) {
                return { error: { message: 'Email and password are required' } };
            }
            
            // Mock demo credentials
            if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
                return {
                    data: {
                        user: {
                            id: 'demo-user-id',
                            email: credentials.email,
                            last_sign_in_at: new Date().toISOString()
                        }
                    },
                    error: null
                };
            }
            
            // Mock error for invalid credentials
            return { error: { message: 'Invalid email or password' } };
        },
        
        signOut: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { error: null };
        },
        
        getUser: async () => {
            return {
                data: { user: null },
                error: null
            };
        },
        
        onAuthStateChange: (callback) => {
            // Mock auth state listener
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {}
                    }
                }
            };
        },
        
        resetPasswordForEmail: async (email, options) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!email) {
                return { error: { message: 'Email is required' } };
            }
            
            return { error: null };
        }
    }
};

// Mock auth helper functions
const mockAuthHelpers = {
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await mockSupabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });
            
            if (error) throw error;
            
            return {
                success: true,
                user: data.user,
                message: 'Account created successfully! Please check your email for verification.'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async signIn(email, password) {
        try {
            const { data, error } = await mockSupabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            return {
                success: true,
                user: data.user,
                message: 'Successfully signed in!'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async signOut() {
        try {
            const { error } = await mockSupabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getCurrentUser() {
        try {
            const { data: { user } } = await mockSupabase.auth.getUser();
            return user;
        } catch (error) {
            return null;
        }
    },
    
    onAuthStateChange(callback) {
        return mockSupabase.auth.onAuthStateChange(callback);
    },
    
    async resetPassword(email) {
        try {
            const { error } = await mockSupabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });
            
            if (error) throw error;
            
            return {
                success: true,
                message: 'Password reset email sent! Check your inbox.'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Export mock objects for demo
window.supabaseClient = mockSupabase;
window.auth = mockSupabase.auth;
window.authHelpers = mockAuthHelpers;

// Demo instructions
console.log('🎭 Demo Mode Active!');
console.log('📧 Use demo@example.com / demo123 to test login');
console.log('🔧 Replace with actual Supabase credentials in production');