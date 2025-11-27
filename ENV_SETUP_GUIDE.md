# Environment Variables Setup Guide

## Quick Setup

Run the setup script to create environment files:

```bash
npm run setup:env
```

Or manually:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**Linux/Mac:**
```bash
cp .env.example .env.local
```

## Environment Files Created

### `.env.example`
Template file with all required environment variables (safe to commit to git).

### `.env.local`
Your local environment configuration (DO NOT commit to git - already in .gitignore).

## Required Environment Variables

### Database Configuration

```env
DB_HOST=localhost          # PostgreSQL host (default: localhost)
DB_PORT=5432               # PostgreSQL port (default: 5432)
DB_NAME=dental_tutor       # Database name (default: dental_tutor)
DB_USER=postgres          # PostgreSQL username (default: postgres)
DB_PASSWORD=your_password # ⚠️ REQUIRED: Your PostgreSQL password
```

**Important**: Update `DB_PASSWORD` with your actual PostgreSQL password!

### JWT Authentication

```env
JWT_SECRET=your_secret_key_here  # ⚠️ REQUIRED: Secret for JWT token signing
JWT_EXPIRES_IN=7d                # Token expiration (default: 7d)
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### OpenAI API (Optional)

```env
OPENAI_API_KEY=your_api_key_here  # Only needed for chatbot feature
```

Get your API key from: https://platform.openai.com/api-keys

### Application URL

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Public URL of your app
```

## Setup Steps

1. **Create environment files:**
   ```bash
   npm run setup:env
   ```

2. **Edit `.env.local`** and update:
   - `DB_PASSWORD` - Your PostgreSQL password
   - `JWT_SECRET` - A secure random string
   - `OPENAI_API_KEY` - (Optional) Your OpenAI API key

3. **Restart your Next.js dev server** after making changes:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Troubleshooting

### "Password authentication failed" Error

This means your `DB_PASSWORD` in `.env.local` doesn't match your PostgreSQL password.

**Solution:**
1. Find or reset your PostgreSQL password:
   ```sql
   psql -U postgres
   ALTER USER postgres PASSWORD 'newpassword';
   ```

2. Update `.env.local` with the correct password

3. Restart your Next.js dev server

### Environment Variables Not Loading

- Make sure the file is named `.env.local` (not `.env.local.txt`)
- Restart your Next.js dev server after creating/updating `.env.local`
- Check that variables don't have quotes around them (unless the value itself needs quotes)
- Ensure there are no spaces around the `=` sign

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Test connection manually:**
   ```bash
   psql -U postgres -h localhost -d dental_tutor
   ```

3. **Create database if it doesn't exist:**
   ```bash
   createdb -U postgres dental_tutor
   ```

## File Locations

- `.env.example` - Template (safe to commit)
- `.env.local` - Your local config (DO NOT commit)
- `scripts/setup-env.js` - Setup script

## Next Steps

After setting up environment variables:

1. Create the database:
   ```bash
   createdb -U postgres dental_tutor
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed initial data (optional):
   ```bash
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

