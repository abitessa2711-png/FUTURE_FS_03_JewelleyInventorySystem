# Supabase Setup Guide for TAS Jewellers

Follow these steps to connect the "TAS Jewellers" system to your Supabase backend.

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Choose a project name (e.g., `tas-jewellers`), password, and region.
4. Wait for the project database to spin up (takes 1-2 minutes).

## Step 2: Run the SQL Schema

1. Once your project is ready, navigate to the **SQL Editor** from the left-hand sidebar in the Supabase Dashboard.
2. Click **New query**.
3. Open the file `supabase_schema.sql` (located in the root of this project) and copy all its contents.
4. Paste the SQL query into the editor and click **Run** (at the bottom right).
5. Ensure the query runs successfully. This will create all necessary tables, constraints, Row Level Security policies, and populate the tables with master data.

## Step 3: Configure Environment Variables

1. Go to **Project Settings** (gear icon in the sidebar) -> **API**.
2. Find the following API credentials:
   - **Project URL** (`URL`)
   - **Anon Key** (`anon` / `public`)
3. In the root directory of this project, create a new file named `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Replace the values with your actual project URL and anon public key.

## Step 4: Add Auth Users

1. Navigate to the **Authentication** tab in the Supabase Dashboard.
2. Click **Add User** -> **Create User**.
3. Enter the email address and password you wish to use for login.
4. Turn off **Confirm User Email** in **Auth Settings** -> **Providers** -> **Email** if you wish to log in immediately without verifying email, or just click "Confirm Email" manually in the dashboard after creating the user.

## Step 5: Start the Development Server

Run the following command to start your development server with the Supabase integration:
```bash
npm run dev
```
All dashboards will now fetch, update, and sync in real-time with your database!
