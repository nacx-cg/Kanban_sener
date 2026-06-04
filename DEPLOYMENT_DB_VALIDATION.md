# Database Safety Validation for Vercel Deployment

This document validates that your current database will not be adversely affected when deploying new features to Vercel.

## Executive Summary

| Check | Status | Notes |
|------|--------|-------|
| Migration safety | ✅ Safe | All migrations are additive; no destructive operations |
| Existing data | ✅ Protected | No DROP, TRUNCATE, or data-modifying migrations |
| Deployment order | ⚠️ Risk | Migrations and Vercel deploy run in parallel |
| Prisma setup | ✅ Correct | `prisma` in dependencies; `postinstall` runs `prisma generate` |
| Env isolation | ✅ Correct | `.env` is gitignored; production uses Vercel env vars |

---

## 1. Migration Safety Analysis

All migrations in `prisma/migrations/` have been reviewed:

| Migration | Operations | Data Impact |
|-----------|------------|-------------|
| `init` | CREATE TABLE (User, Team, Board, Task, etc.) | None (initial) |
| `add_motivational_messages` | CREATE TABLE | None |
| `add_user_team_relations` | CREATE TABLE, ADD CONSTRAINT | None |
| `add_created_by_to_task` | ADD COLUMN | Additive only |
| `add_user_role_active_hidden` | ADD COLUMN with DEFAULT | Additive only |
| `add_meetings` | CREATE TABLE (Meeting, MeetingAttendant) | None |
| `add_audit_log` | CREATE TABLE (AuditLog) | None |

**Conclusion:** All migrations use only:
- `CREATE TABLE` (new tables)
- `ALTER TABLE ADD COLUMN` (with `DEFAULT` where needed)
- `CREATE INDEX`
- `ADD CONSTRAINT` / foreign keys

**No destructive operations:** No `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `DELETE`.

---

## 2. Deployment Flow & Race Condition

### Current behavior

1. **On push to `main`** (when `prisma/` files change):
   - **Vercel** starts a build and deploy (runs `npm run build`)
   - **GitHub Actions** (`migrate.yml`) runs `prisma migrate deploy`

2. **These run in parallel.** Vercel does not wait for the migration workflow.

### Risk

If the Vercel deploy finishes before migrations complete:
- New app code expects new schema (e.g. `AuditLog`, `Meeting`)
- Database may not yet have those tables
- Result: 500 errors until migrations finish

### Mitigation options

**Option A (recommended): Run migrations in the Vercel build**

Add a `vercel-build` script so migrations run before the Next.js build:

```json
// package.json
"scripts": {
  "vercel-build": "prisma generate && prisma migrate deploy && next build"
}
```

Then in Vercel: **Settings → General → Build Command** → set to `npm run vercel-build`.

This ensures:
1. Migrations run before the build
2. Deploy only succeeds if migrations succeed
3. Schema is always in sync with the deployed app

**Option B: Keep current setup**

If you prefer migrations in GitHub Actions:
- Run migrations manually before pushing schema changes, or
- Accept a short window where the new deploy may 500 until migrations complete

---

## 3. Environment & Database Isolation

| Item | Status |
|------|--------|
| `.env` in `.gitignore` | ✅ Yes – local credentials not committed |
| Production `DATABASE_URL` | Set in Vercel dashboard (not from repo) |
| Preview deployments | ⚠️ Use a separate DB for preview if PRs include migrations |

From Prisma docs: if preview and production share `DATABASE_URL`, a PR with migrations will change the production schema. Use a separate preview database and set `DATABASE_URL` only for the Preview environment in Vercel.

---

## 4. Pre-Deploy Checklist

Before pushing schema changes:

- [ ] Run `npx prisma migrate dev` locally to create migrations
- [ ] Commit `prisma/migrations/` and `prisma/schema.prisma`
- [ ] Ensure `DATABASE_URL` in Vercel points to the production database
- [ ] (Optional) Run `npx prisma migrate deploy` manually before pushing, or use `vercel-build` as above

---

## 5. Rollback

If a deployment causes issues:

1. **Code rollback:** Revert the commit in GitHub; Vercel will redeploy the previous version.
2. **Schema rollback:** Prisma Migrate does not support automatic rollbacks. To undo a migration you would need to:
   - Create a new migration that reverses the changes, or
   - Restore from a database backup.

**Recommendation:** Take a backup before deploying schema changes:

```bash
DATABASE_URL="your-production-url" npm run db:backup
```

---

## Summary

- **Existing data is safe:** Migrations are additive and non-destructive.
- **Deployment order:** Add `vercel-build` (or equivalent) so migrations run before the build to avoid schema/app mismatches.
- **Environment isolation:** `.env` is gitignored; production uses Vercel env vars.
- **Preview deployments:** Use a separate database for preview if PRs include migrations.
