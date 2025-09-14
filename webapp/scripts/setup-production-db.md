# Production Database Setup Guide

## Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Choose a region close to your users
5. Set a strong database password
6. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Get Database Credentials

Once your project is ready:

1. Go to Settings → Database
2. Copy the connection strings:
   - **Connection Pooling (Transaction)**: Use this for `DATABASE_URL`
   - **Direct Connection**: Use this for `DIRECT_DATABASE_URL`

3. Go to Settings → API
4. Copy these values:
   - **Project URL**: Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key**: Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: Use for `SUPABASE_SERVICE_KEY` (keep this secret!)

## Step 3: Update Environment Variables

1. Copy `.env.production` to `.env.production.local`
2. Replace all placeholder values with your actual credentials
3. Generate a secure NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

## Step 4: Run Database Migrations

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to production database
npx prisma db push --accept-data-loss

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

## Step 5: Seed Initial Data (Optional)

```bash
# Run the seed script
npm run db:seed:production
```

## Step 6: Set Up Database Backups

In Supabase Dashboard:
1. Go to Settings → Backups
2. Enable Point-in-Time Recovery (PITR)
3. Configure backup retention (7-30 days recommended)

## Step 7: Configure Row Level Security (RLS)

For additional security, enable RLS in Supabase:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Create policies (example for users table)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## Step 8: Monitor Database Performance

1. In Supabase Dashboard, go to Reports
2. Monitor:
   - Database size
   - Connection count
   - Query performance
   - Error logs

## Alternative: Using Other Providers

### Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Get database URL
railway variables
```

### PlanetScale
```bash
# Install PlanetScale CLI
brew install planetscale/tap/pscale

# Create database
pscale database create verbio-ai --region us-west

# Get connection string
pscale password create verbio-ai main production-password
```

### Neon.tech
1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `.env.production.local`

## Production Deployment Checklist

- [ ] Database credentials configured
- [ ] Schema migrated to production
- [ ] SSL/TLS enabled on database connections
- [ ] Connection pooling configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerts set up
- [ ] Rate limiting configured
- [ ] Security policies (RLS) enabled
- [ ] Database indexes optimized
- [ ] Connection limits configured

## Troubleshooting

### SSL Connection Issues
Add `?sslmode=require` to your DATABASE_URL if you get SSL errors.

### Connection Pool Exhaustion
Use connection pooling URL and add `?pgbouncer=true&connection_limit=1`

### Migration Failures
```bash
# Reset and try again (CAUTION: This will delete all data)
npx prisma migrate reset --force

# Or create a migration without applying it
npx prisma migrate dev --create-only
```

### Performance Issues
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
```