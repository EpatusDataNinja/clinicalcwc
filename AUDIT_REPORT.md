# ClinicalCWC Audit Report

## Executive Summary

ClinicalCWC is a strong offline-first clinical case tracking platform built as a monorepo with a Next.js frontend and a Prisma-backed backend. The project demonstrates solid architecture in offline persistence, encrypted local storage, sync queueing, telemetry, and JWT-based auth. However, several production-readiness and security gaps remain, especially around test coverage, CI, credential handling, duplicated API surfaces, and build enforcement.

## Repository Structure

- `apps/api/`: Express backend with Prisma, auth, sync endpoints, and PostgreSQL schema.
- `apps/web/`: Next.js frontend using App Router, Dexie offline DB, Zustand state, encryption services, and local sync queue.
- `packages/`: `config`, `types`, `ui`, `utils` packages appear present but are not clearly integrated.
- `docs/`: architecture notes and implementation status documentation.
- `infra/docker/`: container support exists, but was not deeply audited.

## Architecture & Components

### Backend (`apps/api`)
- Express server with `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, and `@prisma/client`.
- Auth routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`.
- Sync routes: `/api/sync/case`, `/api/sync/task`, `/api/sync/snapshot`.
- Prisma models: `User`, `SyncedCaseBlob`, `SyncedTaskBlob`.
- Uses `upsert` for last-write-wins sync conflict handling.
- Health endpoint and graceful shutdown logic are implemented.

### Frontend (`apps/web`)
- Next.js 15 App Router with offline-first design.
- Dexie IndexedDB schema for `cases`, `tasks`, `drugs`, `syncQueue`, `appConfig`, `telemetry`, `migrations`.
- Zustand persisted store for auth, case/task state, sync status and app lifecycle.
- Encryption with Web Crypto AES-GCM and PBKDF2.
- Sync queue with retry logic, online detection, and snapshot restore.
- Local auth service integrates with backend/Next API for login/register/profile.
- Telemetry service persists app lifecycle and performance events.
- Data management service supports backup/import and local clear operations.
- Service worker registration logic present in root layout.

### Duplicate API Surface
- Frontend also implements App Router API endpoints under `apps/web/src/app/api/*` for auth and sync.
- These routes duplicate functionality available in `apps/api` and introduce architectural confusion.

## Feature & Capability Assessment

### Strengths
- Offline-first UX: Dexie storage, sync queue, local state persistence.
- Encryption-first data storage: encrypted case/task blobs before local persistence.
- Telemetry retention built into local DB.
- Good modular separation: auth, sync, encryption, telemetry, data management.
- Production-ready build scripts exist for both frontend and backend.
- Prisma schema and migrations provide structured backend state.
- `next.config.mjs` includes browser source maps and remote image host configuration.

### Weaknesses
- No automated tests found in the repository.
- No CI workflow or GitHub Actions config detected.
- `next.config.mjs` ignores TypeScript and ESLint build errors on production builds.
- Backend and frontend both default `JWT_SECRET` to a hard-coded string if env is missing.
- Encryption key management is insecure: user password is stored in `localStorage` and used as the passcode.
- Duplicate sync/auth endpoints across two backend surfaces may cause deployment/runtime mismatch.
- Some local DB operations assume a single device key and may silently drop orphan tasks.
- The sync restore process clears local data and replaces it wholesale, which can lead to data loss on partial sync failures.
- Some code references appear inconsistent (`setIsInitialized` is referenced but not present in the store definition).
- Placeholder packages in `packages/` increase repo complexity without clear usage.

## Security Assessment

### High-Priority Risks
- `JWT_SECRET` fallback to `'secret'` in both `apps/api/src/middleware/auth.ts` and `apps/web/src/lib/serverAuth.ts`.
- Storing plaintext user password in `localStorage` as encryption passcode in `apps/web/src/lib/authService.ts`.
- Using localStorage for key material/salt in `encryptionService.ts`.
- No rate limiting, abuse protection, or brute-force defenses on auth endpoints.
- CORS config allows origin from env only, but defaults to localhost; production should lock this down.

### Data Flow Concerns
- Encrypted payload transport is good, but key management is brittle client-side.
- Sync queue items are retried without exponential backoff or failure analysis.
- Snapshot restore uses a full replace strategy without merge semantics.

## Reliability & Production Readiness

### Observability
- Telemetry persists logs with retention and console logging.
- Health endpoint exists on Express backend.

### Production Gaps
- No test suite or coverage metrics.
- Build lint ignoring can mask regressions.
- No CI or deployment automation detected.
- Database migration strategy exists, but the migration payload is currently placeholder.
- Local backup/import lacks integrity validation beyond version checking.
- No explicit error boundary or fallback UI details visible in this audit.

## Maintainability & Scalability

### Good Practices
- Strong TypeScript usage and explicit interfaces.
- Clean separation of concerns across auth, data, sync, encryption, telemetry.
- App follows modern patterns: Next App Router, Zustand persistence, Dexie migrations.
- Backend uses Prisma + PostgreSQL, which is scalable for moderate loads.

### Improvement Areas
- Remove unused or placeholder packages under `packages/` or integrate them.
- Consolidate API implementation to a single backend surface (either Express or Next API routes).
- Replace `ignoreBuildErrors` and `ignoreDuringBuilds` with enforced static analysis in CI.
- Improve module imports and code consistency around store actions and lifecycle state.

## Usability & Adoption

### Positive Aspects
- Strong offline-first semantics increase app availability.
- Persistent state and sync status indicators improve user trust.
- Clinical case/task analytics and drug reference features align with product goals.
- App metadata and PWA hints are present.

### UX Risks
- Encryption UX is opaque and may confuse users if passcode/key mismatch occurs.
- Data restore or logout may unexpectedly clear local state.
- No visible test automation may slow adoption for production teams.

## Recommendations

1. Add automated testing across frontend and backend.
   - Unit, integration, and end-to-end coverage for auth, sync, encryption, and DB persistence.
2. Introduce CI/CD.
   - Add GitHub Actions or equivalent to run lint, type-check, build, and tests.
3. Secure credential handling.
   - Require `JWT_SECRET` from env and fail fast if missing.
   - Stop storing user passwords in `localStorage`.
   - Derive and store encryption keys securely, not raw passwords.
4. Consolidate backend APIs.
   - Choose either `apps/api` or Next API routes in `apps/web`, and remove duplication.
5. Harden sync.
   - Add conflict resolution, backoff, and delta sync instead of full snapshots.
   - Protect sync endpoints with stronger validation and request size limits.
6. Enforce build quality.
   - Disable `ignoreBuildErrors` and `ignoreDuringBuilds` in Next config for CI.
7. Clarify package usage.
   - Remove empty `packages/*` or integrate them with `apps/*`.
8. Improve documentation.
   - Add a root `README.md` or update existing docs with setup, deployment, env requirements, and architecture.
9. Validate infrastructure.
   - Confirm Docker compose and deployment environment are aligned with the backend and DB settings.
10. Review data retention and backup strategy.
   - Add backup integrity checks and documented restore flow.

## Missing or Not Found

- No test files or test runner configuration.
- No CI workflow files.
- No centralized root `README.md` describing project setup.
- No explicit React error boundary or fallback page logic in audited files.

## Conclusion

ClinicalCWC has a compelling offline-first architecture and a functional modern stack. It is a strong candidate for MVP deployment once the security and production-readiness gaps are addressed. The highest-priority fixes are: secure auth/encryption, remove duplicated API layers, add testing/CI, and enforce static analysis in build.
