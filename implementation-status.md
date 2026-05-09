Current implementation status

Implemented Features (Full React/Next.js stack finalized)
- Frontend type-checks and production-builds successfully.
- Active case tracker reads live Zustand/IndexedDB-backed case state.
- Task management performs persisted encrypted CRUD through `clinicalDataService`.
- Task completion, deletion, creation, overdue counts, and linked case task counts are wired to the store/DB.
- Auth forms call `/api/auth/login` and `/api/auth/register`, persist JWT/user state, and trigger sync.
- Client sync supports push plus authenticated snapshot pull from the backend.
- Backend sync exposes `GET /api/sync/snapshot` and uses upsert for update drift.
- Encryption passcode handling securely uses app state or a persisted per-device key fallback.
- Settings export, import, clear-local-data, manual sync, and pending sync display are implemented.
- Case analytics KPIs, logbook table, condition distribution, cases-over-time, and task completion read live case/task state.
- Drug reference uses the persisted drug store plus bundled extra reference entries.
- Dexie schema has a version 2 migration with optimized indexes.
- Offline production builds no longer depend on fetching Google Fonts.

Verification & Cleanup
- All Vite migration scaffolds (`apps/web`, `apps/api`) have been deleted as requested to focus solely on the fully-featured Next.js app.
- Empty placeholder monorepo packages (`packages/ui`, `packages/types`, etc.) have been removed to eliminate duplicated `package.json` and `index.ts` files.
- `npm.cmd run type-check` passes in `clinicalcwc`.
- `npm.cmd run build` passes in `clinicalcwc`.

Remaining notes
- The full application (Frontend + Backend) resides in `clinicalcwc` and `clinicalcwc/api`.
- API dependencies are declared in `clinicalcwc/api/package.json`; install them before running the API outside Docker.
- The project is fully complete according to requirements.
