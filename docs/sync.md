# Sync Model

- Local writes update Zustand, persist encrypted records to IndexedDB, and enqueue a sync item.
- `runSync` pushes pending mutations to the API with a bearer token.
- `pullRemoteSnapshot` restores encrypted server blobs back into IndexedDB, then decrypts them into the local store.
- Conflict handling is last-write-wins based on the latest client push.
