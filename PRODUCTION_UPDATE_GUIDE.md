# Production Update Guide: Safely Adding Features Without Data Loss

## 🎯 Key Principle: **Database Persistence**

**The most important thing to understand:** Your database is **separate** from your application code. When you deploy updates, you're only updating the application code - your database (with all boards, tasks, users, etc.) remains untouched and persists across deployments.

---

## 📊 How Data Persistence Works

### Database vs Application Code

```
┌─────────────────────────────────────────┐
│         Your Application Code           │
│  (Next.js app, components, API routes)  │
│         ↕ Deployed Separately           │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│         Your Database (PostgreSQL)      │
│  (Users, Boards, Tasks, Stats, etc.)     │
│         ↕ Persists Independently         │
└─────────────────────────────────────────┘
```

**What happens during deployment:**
1. ✅ Your database stays connected (same `DATABASE_URL`)
2. ✅ All existing data remains intact
3. ✅ Only your application code gets updated
4. ✅ Database migrations run to update schema (if needed)

---

## 🔄 Safe Update Workflow

### Step 1: Development Workflow (Local)

```bash
# 1. Make your code changes locally
# 2. Test thoroughly with your local database
# 3. Create migration if schema changed
npx prisma migrate dev --name add_new_feature

# 4. Test migration locally
npm run dev
```

### Step 2: Production Deployment

#### Option A: Vercel (Recommended)

**Automatic Deployment:**
1. Push to your main branch → Vercel auto-deploys
2. Database connection persists (same `DATABASE_URL`)
3. Run migrations manually or via GitHub Actions

**Manual Migration (After Deployment):**
```bash
# Connect to production database
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

**Or via GitHub Actions** (see below)

#### Option B: DigitalOcean App Platform

1. Push to your repository
2. App Platform detects changes and rebuilds
3. Database connection persists
4. Run migrations via build hook or manually

---

## 🛡️ Migration Strategy: Adding Schema Changes Safely

### Understanding Prisma Migrations

Prisma migrations are **additive** - they add new tables/columns without deleting existing data (unless explicitly specified).

### Example: Adding a New Feature

**Scenario:** You want to add a "comments" feature to tasks.

#### 1. Update Schema Locally

```prisma
// prisma/schema.prisma
model Task {
  // ... existing fields ...
  comments TaskComment[]  // NEW FIELD
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([taskId])
}
```

#### 2. Create Migration

```bash
npx prisma migrate dev --name add_task_comments
```

This creates a new migration file that:
- ✅ Creates the new `TaskComment` table
- ✅ Adds the relation to `Task` and `User`
- ✅ Does NOT delete or modify existing data

#### 3. Test Locally

```bash
npm run dev
# Test that existing tasks still work
# Test that new comments feature works
```

#### 4. Deploy to Production

```bash
# Deploy code (Vercel auto-deploys on push)
git push origin main

# Run migration on production database
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

**What happens:**
- ✅ Existing tasks remain untouched
- ✅ New `TaskComment` table is created
- ✅ All existing data is preserved
- ✅ New feature is now available

---

## 🔐 Best Practices for Safe Updates

### 1. Always Backup Before Major Changes

#### Vercel Postgres Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Or use Vercel dashboard → Database → Backups
```

#### DigitalOcean Managed Database Backup
- Automatic daily backups (configurable)
- Manual backups via dashboard
- Point-in-time recovery available

### 2. Use Migration Best Practices

#### ✅ DO:
- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- Test migrations locally first
- Make migrations additive (add, don't delete)
- Use `@default()` for new required fields

#### ❌ DON'T:
- Don't use `prisma db push` in production
- Don't delete columns with data without migration script
- Don't make breaking changes without data migration

### 3. Handle Breaking Changes Safely

**Example: Renaming a Column**

```prisma
// OLD
model Task {
  dueDate DateTime?
}

// NEW - Add new column, keep old temporarily
model Task {
  dueDate    DateTime?  // Keep for migration period
  dueDateNew DateTime?  // New column name
}
```

**Migration Strategy:**
1. Add new column (nullable)
2. Copy data: `UPDATE Task SET dueDateNew = dueDate`
3. Update application code to use new column
4. Deploy and verify
5. Remove old column in next migration

### 4. Environment Variable Management

**Never lose your `DATABASE_URL`:**
- Store in platform's environment variables (not in code)
- Use different databases for dev/staging/production
- Document all required environment variables

---

## 🚀 Automated Migration Workflow

### GitHub Actions for Vercel

Create `.github/workflows/migrate.yml`:

```yaml
name: Run Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'prisma/migrations/**'
      - 'prisma/schema.prisma'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Prisma
        run: npx prisma generate
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### DigitalOcean App Platform Build Hook

Add to `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**⚠️ Warning:** Only do this if migrations are safe to run automatically. Otherwise, run migrations manually.

---

## 📋 Pre-Deployment Checklist

Before deploying updates:

- [ ] **Backup database** (especially for major changes)
- [ ] **Test migrations locally** with production-like data
- [ ] **Verify environment variables** are set correctly
- [ ] **Check `DATABASE_URL`** points to production database
- [ ] **Review migration files** for data safety
- [ ] **Test feature locally** with existing data
- [ ] **Document breaking changes** (if any)

---

## 🔍 Monitoring After Deployment

### Check Migration Status

```bash
# See migration history
npx prisma migrate status

# Check database connection
npx prisma db pull
```

### Verify Data Integrity

1. Check that existing boards/tasks are accessible
2. Verify user authentication still works
3. Test new features don't break old ones
4. Monitor error logs for database issues

---

## 🆘 Rollback Strategy

### If Something Goes Wrong

#### 1. Rollback Application Code
```bash
# Vercel: Revert to previous deployment in dashboard
# DigitalOcean: Redeploy previous version
```

#### 2. Rollback Database Migration (if needed)

**⚠️ Only if absolutely necessary:**

```bash
# Create a new migration that reverses changes
npx prisma migrate dev --name rollback_feature_x

# Or manually restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

#### 3. Restore from Backup

```bash
# Restore database from backup
psql $DATABASE_URL < backup_file.sql
```

---

## 💡 Common Scenarios

### Scenario 1: Adding a New Field to Existing Model

**Safe:** Adding optional fields
```prisma
model Task {
  // existing fields...
  estimatedHours Int?  // ✅ Safe - nullable, no data loss
}
```

**Requires Care:** Adding required fields
```prisma
model Task {
  // existing fields...
  category String  // ⚠️ Need default value
}

// Solution: Add with default
category String @default("general")
```

### Scenario 2: Adding a New Table

**Always Safe:** New tables don't affect existing data
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Scenario 3: Changing Relationships

**Safe:** Adding new relations
```prisma
model Task {
  // existing...
  attachments TaskAttachment[]  // ✅ Safe - new relation
}
```

**Requires Care:** Changing existing relations
- Always test with existing data
- Use migration scripts to update foreign keys

---

## 🎓 Key Takeaways

1. **Database persists independently** - Your data survives deployments
2. **Migrations are additive** - They add structure without deleting data
3. **Always test locally first** - Use production-like data
4. **Backup before major changes** - Better safe than sorry
5. **Use `migrate deploy` in production** - Never use `db push`
6. **Monitor after deployment** - Verify everything works

---

## 📚 Additional Resources

- [Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate)
- [Vercel Database Guide](https://vercel.com/docs/storage/vercel-postgres)
- [DigitalOcean Managed Databases](https://docs.digitalocean.com/products/databases/)

---

## ✅ Quick Reference Commands

```bash
# Development
npx prisma migrate dev --name feature_name
npx prisma generate
npm run dev

# Production Migration
DATABASE_URL="prod-url" npx prisma migrate deploy

# Backup
pg_dump $DATABASE_URL > backup.sql

# Check Migration Status
npx prisma migrate status

# View Database
npx prisma studio
```

