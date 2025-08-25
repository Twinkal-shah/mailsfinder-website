# Supabase Profile Creation Fix

## Problem
New user profile data is not being stored in the `profiles` table despite successful user authentication. This is likely due to Row Level Security (RLS) policies preventing inserts.

## Root Cause
The issue appears to be with Supabase Row Level Security (RLS) policies that are blocking profile creation for new users.

## Solution

### Step 1: Fix RLS Policies in Supabase Dashboard

Go to your Supabase dashboard → SQL Editor and run these commands:

```sql
-- First, check if RLS is enabled on profiles table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Create proper RLS policies
-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Step 2: Alternative - Disable RLS Temporarily (for testing)

If you want to test without RLS first:

```sql
-- Disable RLS temporarily for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Step 3: Verify Database Schema

Ensure your `profiles` table has the correct structure:

```sql
-- Check table structure
\d profiles;

-- If table doesn't exist or is missing columns, create/update it:
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company TEXT,
    plan TEXT DEFAULT 'free',
    plan_expiry TIMESTAMPTZ,
    credits INTEGER DEFAULT 25,
    credits_find INTEGER DEFAULT 25,
    credits_verify INTEGER DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles(plan);
```

### Step 4: Test the Fix

1. Open `http://localhost:8000/rls-test.html`
2. Click "Test Direct Insert" to verify database access
3. Open `http://localhost:8000/final-signup-test.html`
4. Test the complete signup process

### Step 5: Create Database Trigger (Optional)

For automatic profile creation, you can also create a database trigger:

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company, plan, plan_expiry, credits, credits_find, credits_verify)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
                 CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')),
        NEW.raw_user_meta_data->>'company',
        'free',
        NOW() + INTERVAL '3 days',
        25,
        25,
        25
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        company = COALESCE(EXCLUDED.company, profiles.company),
        plan_expiry = COALESCE(profiles.plan_expiry, NOW() + INTERVAL '3 days'),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Testing Steps

1. **Run the SQL commands** in your Supabase dashboard
2. **Test RLS policies** using the RLS test page
3. **Test signup process** using the final signup test page
4. **Check browser console** for any remaining errors
5. **Verify in Supabase dashboard** that profiles are being created

## Expected Results

After implementing these fixes:
- New user signups should create profiles with all data
- Existing users should be able to update their profiles
- The `full_name` and `company` fields should no longer be NULL
- All test pages should show successful operations

## Troubleshooting

If issues persist:
1. Check Supabase logs in the dashboard
2. Verify your Supabase project URL and anon key
3. Ensure the `profiles` table exists and has correct permissions
4. Test with RLS disabled first, then re-enable with proper policies