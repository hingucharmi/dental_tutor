# Troubleshooting Guide

## Common Errors and Solutions

### POST /api/auth/register 500 Error

This error can occur for several reasons. The improved error handling will now provide specific error messages.

#### 1. Database Authentication Failed

**Error Message:** "Database connection failed. Please check your database credentials in .env.local"

**Solution:**
1. Check your `.env.local` file exists
2. Verify `DB_USER` and `DB_PASSWORD` are correct
3. Test your PostgreSQL password:
   ```bash
   psql -U postgres -h localhost
   ```
4. If password is wrong, reset it:
   ```sql
   ALTER USER postgres PASSWORD 'newpassword';
   ```
5. Update `.env.local` with the correct password
6. **Restart your Next.js dev server**

#### 2. Database Not Found

**Error Message:** "Database not found. Please create the database and run migrations"

**Solution:**
```bash
# Create the database
createdb -U postgres dental_tutor

# Or using psql
psql -U postgres
CREATE DATABASE dental_tutor;
```

#### 3. Database Tables Not Found

**Error Message:** "Database tables not found. Please run migrations"

**Solution:**
```bash
npm run db:migrate
```

#### 4. JWT_SECRET Not Configured

**Error Message:** "JWT_SECRET is not configured. Please add it to .env.local"

**Solution:**
1. Open `.env.local`
2. Add or update:
   ```env
   JWT_SECRET=your_secure_random_string_here
   ```
3. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
4. **Restart your Next.js dev server**

#### 5. PostgreSQL Not Running

**Error Message:** "Cannot connect to database. Please ensure PostgreSQL is running"

**Solution:**

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-14  # Replace with your version
```

**Linux/Mac:**
```bash
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql
```

#### 6. Connection Refused

**Error Message:** "Cannot connect to PostgreSQL at localhost:5432"

**Solution:**
1. Verify PostgreSQL is running (see above)
2. Check if PostgreSQL is listening on port 5432:
   ```bash
   # Windows
   netstat -an | findstr 5432
   
   # Linux/Mac
   netstat -an | grep 5432
   ```
3. Verify connection settings in `.env.local`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   ```

### General Debugging Steps

1. **Check Environment Variables:**
   ```bash
   # Verify .env.local exists
   cat .env.local  # Linux/Mac
   type .env.local # Windows
   ```

2. **Test Database Connection:**
   ```bash
   psql -U postgres -h localhost -d dental_tutor
   ```

3. **Check Server Logs:**
   Look at your Next.js dev server console for detailed error messages.

4. **Verify Database Setup:**
   ```bash
   # Check if database exists
   psql -U postgres -l | grep dental_tutor
   
   # Check if tables exist
   psql -U postgres -d dental_tutor -c "\dt"
   ```

5. **Restart Everything:**
   - Stop Next.js dev server (Ctrl+C)
   - Restart PostgreSQL service (if needed)
   - Start Next.js dev server again: `npm run dev`

### Quick Checklist

- [ ] `.env.local` file exists
- [ ] `DB_PASSWORD` is correct
- [ ] `JWT_SECRET` is set
- [ ] PostgreSQL is running
- [ ] Database `dental_tutor` exists
- [ ] Migrations have been run (`npm run db:migrate`)
- [ ] Next.js dev server has been restarted after changing `.env.local`

### Still Having Issues?

1. Check the server console for the full error stack trace
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is accessible from your application
4. Check that the database name matches in `.env.local` and migrations
5. Review the error message returned by the API - it should now be more specific

