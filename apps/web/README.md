# ClinicalCWC Web

This is the Next.js 15 frontend for ClinicalCWC.

## Requirements

- Node.js 20+
- npm
- Running ClinicalCWC API backend

## Local Setup

From the repository root:

```bash
npm install
copy apps\web\.env.example apps\web\.env
```

On macOS/Linux:

```bash
npm install
cp apps/web/.env.example apps/web/.env
```

Set the API URL in `apps/web/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Scripts

Run from `apps/web`:

```bash
npm run dev
npm run lint
npm run type-check
npm run build
npm start
```

Important scripts:

- `npm run dev`: local development server
- `npm run build`: production Next.js build
- `npm start`: production Next.js server
- `npm run lint`: ESLint
- `npm run type-check`: TypeScript check

## Railway Deployment

Railway service root directory:

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

Required Railway variable:

```env
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
```

Set this before building the frontend because `NEXT_PUBLIC_*` variables are included in the client bundle at build time.

## Notes

- Do not use hardcoded backend URLs in frontend code.
- Use `NEXT_PUBLIC_API_URL` for API calls.
- Do not commit `apps/web/.env`.
- The example file `apps/web/.env.example` is safe to commit.
