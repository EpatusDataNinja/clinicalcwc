# ClinicalCWC — Frontend Web Application

A high-performance, offline-first Next.js 15 clinical companion application designed for speed, security, and portability.

---

## 🛠️ Tech Stack & Key Elements

* **Framework**: Next.js 15 (App Router) + React 19
* **Styling**: Modern, premium CSS styling system with customized dark modes, elegant gradients, glassmorphism, and responsive screens.
* **Offline Storage**: Dexie.js (IndexedDB wrapper) with customized indexing and versioned schemas.
* **State Management**: Zustand (Pure memory cache, 100% database-isolated render-loop).
* **Crypto Engine**: Web Crypto API executing AES-256-GCM client-side encryption.
* **Componentry**: Tailwind CSS with clean utility grids, Lucide-React icons, and custom status badges.

---

## ⚙️ Architectural Layering (Frontend)

```
        [ React Components / Pages ]
                     │  (subscribes to Zustand state)
                     ▼
         [ Zustand Store (Pure Cache) ]
                     ▲
                     │  (hydrates cache via restoreDataFromDB)
          [ clinicalDataService.ts ]
                     │  (encrypts data blobs / manages CRUD)
                     ▼
             [ Dexie IndexedDB ]
```

---

## 🚀 Available Scripts (Workspace context)

These frontend-specific tasks are executed inside the `apps/web` context or via the monorepo root:

```bash
# Run local web development server on port 4028
npm run dev

# Run static type verification
npm run type-check

# Run frontend ESLint rules
npm run lint

# Run the Vitest test suite
npm run test

# Compile optimized production bundle
npm run build
```

---

## 🔐 Client Security Guidelines

1. **Client-Side Cryptography**: Patient records are encrypted client-side. The database never contains plaintext PHI (Protected Health Information).
2. **Volatile Key Management**: Passcodes and key material reside entirely in volatile memory. Sessions automatically lock upon tab close, logout, explicit commands, or 15 minutes of inactivity.
3. **Decoupled Business Logic**: Schema validations, default fallback assignments, and entity creations are isolated within `clinicalDataService.ts` to protect UI components from business side-effects.

---

For full operational runbooks, monorepo scripts, docker setup, or database migrations, please refer to the main [Root README](file:///c:/Users/lebbi/Desktop/cwc/README.md).
