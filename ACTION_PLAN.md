# ClinicalCWC Action Plan

## Product Boundaries & Philosophy

1. Explicit product boundary: ClinicalCWC must remain a personal offline-first physician workflow companion, not a hospital EMR or shared patient record system.

2. Offline-first sync philosophy: Local device is source of truth; cloud sync is backup/recovery only.

3. Regulatory posture note: Patient alias only, encryption at rest/in transit, minimal PHI footprint.

4. **Clinical Safety Disclaimer**: ClinicalCWC is a workflow management tool designed for task organization. It is NOT a medical device. It does not provide diagnosis, treatment decisions, or clinical advice. It is not a replacement for institutional Electronic Medical Records (EMR).

5. **Data Ownership**: All clinical data remains user-owned and stored locally unless explicitly synced. The system never assumes server-side authority over patient data; the local device is the ultimate source of truth.

## Security Incident Handling

If encryption failure or repeated authentication failures occur:
- **Lock App**: Temporarily disable UI access to clinical data by setting a `isLocked` state in the store.
- **Re-authentication**: Require the user to re-enter their credentials and encryption passcode to regain access.
- **Telemetry Logging**: Record the incident (failure type, timestamp, attempt count) in the local telemetry log for audit purposes.
- **Backoff**: Implement incremental delays after consecutive failed decryption attempts.

## Threat Model Coverage

Include stolen/lost device scenarios, auto-lock timeout, optional biometric unlock, and session expiration.

## Rollback Strategies
- **Schema**: Maintain Prisma migration history; use `prisma migrate diff` for manual down-migrations if automated rollback fails.
- **Sync**: Support versioned sync payloads; allow falling back to full snapshot pull if delta-sync logic fails.
- **Encryption**: Rotation logic must verify successful decryption of a test record with the new key before committing the full re-encryption to IndexedDB.

## P0 — Security & Architecture Cleanup

1. Require secure environment variables
   - Stop using hard-coded fallback values for `JWT_SECRET`.
   - Fail fast on startup if required secrets are missing.

2. P0.5 — Secret & Key Rotation
   - Implement logic to re-encrypt local IndexedDB data when the user changes their passcode.
   - Document the process for JWT secret rotation on the backend to ensure session continuity.
   - Ensure rotation doesn't lead to data loss during partial failures.

3. Harden auth and encryption key handling
   - Remove storing plaintext passwords in `localStorage`.
   - Use a proper encryption key derivation and storage approach that does not expose raw credentials.
   - Add rate limiting or brute-force protection for auth endpoints.

4. Consolidate backend API implementation
   - Keep `apps/api` as primary backend and remove duplicate Next.js API routes.

5. Enforce static analysis and build quality
   - Disable `ignoreBuildErrors` and `ignoreDuringBuilds` in `apps/web/next.config.mjs`.
   - Ensure `npm run lint`, `npm run type-check`, and `npm run build` are part of CI.

**Definition of Done (P0):**
- No hardcoded secrets in the codebase.
- `apps/web/src/app/api` routes are deleted in favor of `apps/api`.
- `npm run build` fails in CI if TypeScript or ESLint errors exist.
- Passwords are never stored in `localStorage`.

## Priority 1 — Sync Hardening

1. Improve sync robustness
   - Add exponential backoff or retry limits to sync queue processing.
   - Protect sync endpoints with validation and server-side input size checks.
   - Consider delta sync or merge semantics instead of full snapshot overwrites.

**Definition of Done (P1):**
- Sync queue handles 429/500 errors with backoff.
- Payload limits enforced at the Express middleware level.
- Sync consistency verified via unit tests.

## Priority 2 — Tests & CI

1. Add automated testing
   - Create unit tests for auth, sync, local DB access, encryption, and key workflows.
   - Add integration tests for critical sync flows and backup/restore behavior.

2. Disaster Recovery Validation
   - Create a simulated "Lost Device" test case.
   - Verify that an encrypted backup can be imported onto a fresh device using the original passcode.
   - Document the recovery RTO/RPO expectations.

3. Add CI/CD automation
   - Introduce a GitHub Actions workflow or equivalent to run tests, lint, type-check, and builds.
   - Include environment validation checks and Prisma migrations in CI.

**Definition of Done (P2):**
- >80% code coverage on `lib/encryptionService.ts` and `lib/syncService.ts`.
- Automated test successfully restores data from an exported JSON backup.
- CI green on every PR.

## Priority 3 — UX, Documentation, and Maintainability

1. Improve documentation
   - Create a root-level `README.md` with setup, run, and deployment instructions.
   - Document environment variables, database setup, and backup/restore flow.

2. Improve local data handling UX
   - Add explicit user messaging for encryption passcode/key mismatch.
   - Avoid destructive restore behavior without user confirmation.

3. Validate infrastructure support
   - Review `infra/docker/docker-compose.yml` and confirm it matches backend and DB requirements.
   - Add instructions for running the app locally and in production containers.

4. Refine telemetry and observability
   - Add a clear way to export telemetry logs for debugging.
   - Consider optional remote logging or error-reporting integration for production.

5. Clarify package structure
   - Remove unused placeholder packages under `packages/` or integrate them clearly into the monorepo.

**Definition of Done (P3):**
- Root `README.md` allows a new dev to set up the app in < 10 mins.
- Encryption mismatch UI displays a clear "Incorrect Passcode" warning.
- Telemetry logs can be exported as JSON from the UI.

## Priority 4 — Performance and Scalability

1. Add measurable performance targets
   - Cold start < 2 sec
   - Navigation < 300 ms
   - Sync < 5 sec
   - Enforce bundle size budgets

2. Audit Dexie schema and migrations
   - Confirm migration logic is correct and add versioned data migrations as needed.
   - Add unit tests for migration behavior and schema upgrades.

3. Review IndexedDB retention and local storage
   - Confirm telemetry retention policy meets product goals.
   - Avoid silent data drops during bulk task upserts.

4. Strengthen backend database operations
   - Add indexes for sync query patterns if scaling to many users.
   - Review Prisma logging and production DB connection settings.

## Notes

- Keep `AUDIT_REPORT.md` unchanged; this `ACTION_PLAN.md` is intended as the execution roadmap.
- Start with security and backend consolidation before adding broader test and CI coverage.
- Use this plan as the basis for sprint-level tickets or engineering work items.
