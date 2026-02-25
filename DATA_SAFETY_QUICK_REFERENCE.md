# Data Safety Quick Reference

## 🎯 Core Principle

**Your database persists independently from your application code.**
- ✅ Deploying updates = Only code changes
- ✅ Database stays connected (same `DATABASE_URL`)
- ✅ All existing data (boards, tasks, users) remains intact
- ✅ Migrations update schema without deleting data

---

## 🚀 Standard Update Workflow

### 1. Make Changes Locally
```bash
# Edit code, update schema if needed
npx prisma migrate dev --name add_feature_name
npm run dev  # Test locally
```

### 2. Deploy Code
```bash
git add .
git commit -m "Add new feature"
git push origin main
# Vercel auto-deploys, or DigitalOcean rebuilds
```

### 3. Run Migrations (Production)
```bash
# Option A: Manual
DATABASE_URL="your-production-url" npm run db:migrate:deploy

# Option B: GitHub Actions (automatic)
# Push to main → Workflow runs migrations automatically
```

### 4. Verify
- Check that existing boards/tasks are accessible
- Test new features work
- Monitor for errors

---

## 🛡️ Before Major Changes: Backup

```bash
# Quick backup
npm run db:backup

# Or use script
./scripts/backup-db.sh

# Or manual
pg_dump $DATABASE_URL > backup.sql
```

---

## 📋 Available Commands

```bash
# Development
npm run dev                    # Start dev server
npm run db:migrate             # Create new migration
npm run db:generate            # Generate Prisma client
npm run db:studio              # Open Prisma Studio (DB GUI)

# Production
npm run db:migrate:deploy      # Run migrations (production)
npm run db:status              # Check migration status
npm run db:backup              # Create backup

# Backup/Restore Scripts
./scripts/backup-db.sh         # Create backup
./scripts/restore-db.sh backup.sql  # Restore from backup
```

---

## ⚠️ Important Rules

### ✅ DO:
- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- Test migrations locally first
- Backup before major changes
- Keep `DATABASE_URL` in environment variables (not code)

### ❌ DON'T:
- Don't use `prisma db push` in production
- Don't delete columns without migration script
- Don't commit `.env` files
- Don't lose your `DATABASE_URL`

---

## 🔄 Adding New Features

### Adding a New Table (Always Safe)
```prisma
model NewFeature {
  id        String   @id @default(cuid())
  // ... fields
}
```
✅ No impact on existing data

### Adding Optional Field (Safe)
```prisma
model Task {
  // existing fields...
  newField String?  // ✅ Safe - nullable
}
```
✅ No impact on existing data

### Adding Required Field (Needs Default)
```prisma
model Task {
  // existing fields...
  newField String @default("default-value")  // ✅ Safe with default
}
```
✅ Existing records get default value

---

## 🆘 If Something Goes Wrong

### Rollback Code
- **Vercel**: Dashboard → Deployments → Revert
- **DigitalOcean**: Redeploy previous version

### Rollback Database
```bash
# Restore from backup
./scripts/restore-db.sh backups/backup_20240101_120000.sql
```

---

## 📞 Quick Checklist

Before deploying:
- [ ] Tested locally with existing data
- [ ] Migration tested successfully
- [ ] Backup created (for major changes)
- [ ] `DATABASE_URL` verified
- [ ] Environment variables set

After deploying:
- [ ] Migration ran successfully
- [ ] Existing data accessible
- [ ] New features work
- [ ] No errors in logs

---

## 🔗 Full Documentation

See `PRODUCTION_UPDATE_GUIDE.md` for detailed information.

