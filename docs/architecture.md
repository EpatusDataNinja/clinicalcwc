# ClinicalCWC Architecture

ClinicalCWC is an offline-first clinical case tracker. The web app stores encrypted case and task records in IndexedDB through Dexie, keeps active UI state in Zustand, and queues local mutations for server sync.

The API stores encrypted blobs only. JWT-authenticated sync endpoints accept push mutations and expose a snapshot endpoint for restoring encrypted records to a client device.
