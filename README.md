# ClinicalCWC

ClinicalCWC is an offline-first clinical workflow companion. The repository is a monorepo with a Next.js frontend and an Express/TypeScript backend that syncs encrypted clinical data to PostgreSQL.

## Project Structure

```text
cwc/
+-- apps/
|   +-- web/   # Next.js frontend
|   +-- api/   # Express + TypeScript backend
+-- packages/
+-- infra/docker/docker-compose.yml
+-- package.json
+-- package-lock.json
```

## Requirements

- Node.js 20+
- npm
- PostgreSQL database, local or hosted
- Supabase Transaction Mode PostgreSQL URL if using Supabase

The repo includes `.nvmrc` with Node `20`.

## First Setup After Cloning

Install dependencies from the repository root:

```bash
npm install
```

If PowerShell blocks `npm.ps1` on Windows, use:

```bash
cmd /c npm install
```

Create local env files from the examples:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```

On macOS/Linux:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Local Environment Variables

Backend: `apps/api/.env`

```env
PORT=3001
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-local-development-secret"
FRONTEND_URL="http://localhost:4028"
NODE_ENV="development"
```

Frontend: `apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Do not commit real `.env` files. Keep real database URLs and secrets only in local env files or Railway variables.

## Database Setup

The backend uses Prisma. After configuring `apps/api/.env`, run migrations:

```bash
npm --workspace clinicalcwc-api run migrate
```

If you only need to generate Prisma client after installing dependencies:

```bash
npm --workspace clinicalcwc-api run prisma -- generate
```

## Run Locally

Start the backend:

```bash
npm --workspace clinicalcwc-api run dev
```

Start the frontend in another terminal:

```bash
npm --workspace clinicalcwc run dev
```

Local URLs:

- Frontend: `http://localhost:4028`
- Backend health check: `http://localhost:3001/health`

Expected health response:

```json
{ "status": "ok" }
```

## Verification Commands

Frontend:

```bash
cd apps/web
npm run lint
npm run type-check
npm run build
```

Backend:

```bash
cd apps/api
npm run build
```

From the root you can also use workspace commands:

```bash
npm --workspace clinicalcwc run build
npm --workspace clinicalcwc-api run build
```

## Railway Deployment

Deploy this repository as two Railway services in one Railway project.

### Backend Service

Service root directory:

```text
apps/api
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Backend Railway variables:

```env
DATABASE_URL=your Supabase Transaction Mode PostgreSQL URL
JWT_SECRET=make-this-a-long-random-secret
FRONTEND_URL=https://your-web.up.railway.app
NODE_ENV=production
```

Railway provides `PORT`; you usually do not need to set it manually.

### Frontend Service

Service root directory:

```text
apps/web
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Frontend Railway variables:

```env
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
```

Deploy the backend first, copy its public Railway URL into the frontend as `NEXT_PUBLIC_API_URL`, then copy the frontend public Railway URL into the backend as `FRONTEND_URL`.

## Before Deleting Your Local Copy

Run this checklist so you can safely clone the project later:

```bash
git status
git add .
git commit -m "Prepare Railway deployment and README setup"
git push
```

Then verify on GitHub that the latest commit includes:

- `README.md`
- `apps/web/README.md`
- `apps/api/README.md`
- `apps/web/.env.example`
- `apps/api/.env.example`
- `.nvmrc`

After that, it is safe to delete the local folder if you no longer need untracked files.

## Notes

- The frontend calls the backend through `NEXT_PUBLIC_API_URL`.
- The backend allows browser calls through `FRONTEND_URL`.
- Production CORS is not wildcarded.
- Build artifacts, dependency folders, logs, and real env files are ignored by Git.
