# ClinicalCWC API

This is the Express + TypeScript backend for ClinicalCWC. It provides JWT authentication, encrypted data sync endpoints, Prisma database access, and a Railway health check endpoint.

## Requirements

- Node.js 20+
- npm
- PostgreSQL database

## Local Setup

From the repository root:

```bash
npm install
copy apps\api\.env.example apps\api\.env
```

On macOS/Linux:

```bash
npm install
cp apps/api/.env.example apps/api/.env
```

Set local backend variables in `apps/api/.env`:

```env
PORT=3001
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-local-development-secret"
FRONTEND_URL="http://localhost:4028"
NODE_ENV="development"
```

## Database

Run Prisma migrations:

```bash
npm run migrate
```

Generate Prisma client if needed:

```bash
npm run prisma -- generate
```

## Scripts

Run from `apps/api`:

```bash
npm run dev
npm run build
npm start
npm run type-check
```

Important scripts:

- `npm run dev`: starts the TypeScript dev server with `tsx`
- `npm run build`: compiles TypeScript into `dist`
- `npm start`: runs `node dist/index.js`
- `npm run type-check`: verifies TypeScript without emitting files

## Health Check

Local:

```text
http://localhost:3001/health
```

Response:

```json
{ "status": "ok" }
```

## Railway Deployment

Railway service root directory:

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

Required Railway variables:

```env
DATABASE_URL=your Supabase Transaction Mode PostgreSQL URL
JWT_SECRET=make-this-a-long-random-secret
FRONTEND_URL=https://your-web.up.railway.app
NODE_ENV=production
```

Railway provides `PORT`; you usually do not need to set it manually.

## Notes

- Do not commit `apps/api/.env`.
- The example file `apps/api/.env.example` is safe to commit.
- Production CORS uses `FRONTEND_URL`.
- Do not use wildcard CORS in production.
