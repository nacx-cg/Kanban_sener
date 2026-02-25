# Deploy Kanban to Vercel

This guide walks through deploying the Kanban app to Vercel. Git is initialized and the project is ready.

## Step 1: Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) named `Kanban_sener` (or your preferred name).
2. Run:

```bash
./scripts/push-to-github.sh https://github.com/YOUR_USERNAME/Kanban_sener.git
```

Or manually:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Kanban_sener.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Provision Cloud PostgreSQL

Choose one provider and create a database:

| Provider | Free Tier | Setup |
|----------|-----------|-------|
| [Vercel Postgres](https://vercel.com/storage/postgres) | 256 MB | Add from Vercel project dashboard |
| [Neon](https://neon.tech) | 512 MB | Create project, copy connection string (use **pooled** URL) |
| [Supabase](https://supabase.com) | 500 MB | Create project, copy connection string from Settings → Database |

**Important**: Use the **pooled** connection string when available (e.g. Neon adds `?pgbouncer=true`) to avoid serverless connection limits.

## Step 3: Deploy on Vercel

### Option A: Via Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo `Kanban_sener`
3. Before deploying, add environment variables (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your cloud PostgreSQL connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `NEXTAUTH_URL` | `https://YOUR_PROJECT.vercel.app` (update after first deploy) |
| `ADMIN_EMAILS` | `ncalva@energia.gob.mx` (optional) |

4. Click **Deploy**
5. After deploy, update `NEXTAUTH_URL` in Vercel to match your actual URL (e.g. `https://kanban-sener.vercel.app`)

### Option B: Via Vercel CLI

```bash
# Login first (opens browser)
npx vercel login

# Deploy (set env vars in Vercel dashboard first)
npx vercel --prod
```

## Step 4: Run Database Migrations

After the first successful deploy:

```bash
# Set DATABASE_URL to your cloud DB, then:
DATABASE_URL="your-cloud-db-url" npx prisma migrate deploy
```

Or add `DATABASE_URL` to GitHub repo secrets and the existing [.github/workflows/migrate.yml](.github/workflows/migrate.yml) will run migrations on push (when prisma files change).

## Step 5: Verify

1. Open your Vercel URL
2. Register a new user (or run migrations and seed if you have seed data)
3. Test login and board creation

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Prisma Client not generated" | `postinstall` runs `prisma generate` – ensure it's in package.json |
| "Too many connections" | Use pooled connection string |
| Auth redirect fails | Set `NEXTAUTH_URL` to exact production URL |
| Build fails | Check Vercel build logs; ensure all env vars are set |
