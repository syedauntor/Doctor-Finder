# Admin Setup Guide

This guide explains how to set up the admin system for the Doctor Directory platform.

## Demo Admin Account (Already Created)

A demo admin account has been created for you:

**Email:** admin@demo.com
**Password:** demo123456

You can use this account to login and test the admin dashboard immediately!

## Creating Additional Admin Users

To create an admin user, you need to:

1. First, create a regular user account via Supabase Auth
2. Then, add that user to the `admin_users` table

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run this SQL query (replace with actual user details):

```sql
-- First, create an auth user (if not already created)
-- You can do this via Supabase Auth UI or via the dashboard

-- Then add the user to admin_users table
-- Replace 'YOUR_USER_ID' with the actual UUID from auth.users
-- Replace 'admin@example.com' with the admin's email

INSERT INTO admin_users (user_id, email, full_name, role)
VALUES (
  'YOUR_USER_ID',  -- Get this from auth.users table
  'admin@example.com',
  'Admin Name',
  'super_admin'
);
```

### Option 2: Complete Setup Query

If you haven't created the auth user yet, you can create both at once:

```sql
-- This creates an admin user with email and password
-- Replace the email and encrypted_password as needed

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users (Note: You should use Supabase Auth API for production)
  -- For testing, you can create a user via Supabase Dashboard > Authentication > Users

  -- After creating the user via dashboard, get their ID and run:
  -- Replace 'USER_ID_HERE' with the actual user ID

  INSERT INTO admin_users (user_id, email, full_name, role)
  VALUES (
    'USER_ID_HERE'::uuid,
    'admin@example.com',
    'Super Admin',
    'super_admin'
  );
END $$;
```

## Admin Login

Once the admin user is created:

1. Go to the website footer and click "Admin"
2. Login with the admin credentials
3. You'll be redirected to the Admin Dashboard

## Admin Features

The admin dashboard allows you to:

1. **Review Registration Requests**: View all pending doctor registration requests
2. **Approve Doctors**: Approve requests and automatically create doctor profiles
3. **Reject Requests**: Reject unsuitable registration requests
4. **Manage Doctors**: View all doctors and manage their verification status
5. **Add Notes**: Add verification notes for tracking and record-keeping

## Security

- Only users in the `admin_users` table can access the admin dashboard
- Row Level Security (RLS) policies ensure data protection
- Admin access is checked on every dashboard load
