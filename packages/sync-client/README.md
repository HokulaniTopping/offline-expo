# @offline-expo/sync-client

Reusable offline-first sync layer for company apps, built on [PowerSync](https://docs.powersync.com/).
It gives you a local-first SQLite database, a REST upload connector, and a sync-status
banner — so a new app gets offline support in ~3 lines instead of a from-scratch PowerSync
integration.

PowerSync is the engine (local DB + sync loop + offline queue). This package is the
**opinionated wiring** around it: how the DB is opened, how writes upload to your backend,
how conflicts are handled, and how sync status is shown. Bring your schema + ~3 lines of
config; skip the week of setup.

---

## Requirements

This package is **not** a drop-in for any app. A consuming app must be:

| Requirement | Why |
|---|---|
| **A PowerSync app** | The package *is* PowerSync — it returns a `PowerSyncDatabase` and a `PowerSyncBackendConnector`. You need a running PowerSync service + a Postgres-backed API. |
| **A web app (browser)** | `createSyncClient` uses `@powersync/web` (WASM SQLite). Native iOS/Android is **not supported yet** — it would need a separate open-factory variant. |
| **Expo / React-Native-shaped** | `SyncStatusIndicator` renders `react-native` components, and `react-native` is a required peer dep. It works in an Expo web app today. Plain web-React apps (Vite/Next/Redwood) can use `createSyncClient` + `createConnector`, but **not** `SyncStatusIndicator` without `react-native-web`. |
| **A backend following the REST contract** | See [Backend contract](#backend-contract). Backends with a different shape (e.g. GraphQL) must hand-roll their own connector. |

---

## Installation

### From a tarball (current)
Until this is published to a registry, install the packed tarball directly:

```bash
npm install /path/to/offline-expo-sync-client-0.1.0.tgz
# or: pnpm add /path/to/offline-expo-sync-client-0.1.0.tgz
```

> ⚠️ Use `npm`/`pnpm`, **not** `npx expo install`, for a local tarball — `expo install`
> mis-records a local `.tgz` (writes an `undefined` dependency). `expo install` only works
> correctly once the package is published to a registry.

### Peer dependencies
Install these in the consuming app (versions should match its Expo SDK):

```bash
npx expo install @powersync/common @powersync/react @powersync/web react react-native
```

---

## App-side setup

The package is the client library; the app still needs a little environment setup PowerSync's
web SDK depends on.

**1. Serve the WASM workers** — add a postinstall step so the workers land in `public/`:
```jsonc
// package.json
"scripts": {
  "postinstall": "powersync-web copy-assets"
}
```

**2. Metro config** — treat `.wasm` as an asset and set cross-origin isolation headers
(needed for OPFS/SharedArrayBuffer in the browser):
```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  },
};

module.exports = config;
```

**3. Async-iterator polyfill** — import once, first thing in your entrypoint (PowerSync's
watched queries rely on async iterators):
```ts
// index.ts (before anything else)
import '@azure/core-asynciterator-polyfill';
```

> Metro package-exports must be enabled to resolve `@powersync/web/umd`. It's **on by default
> in Expo SDK 57+**; on older SDKs set `config.resolver.unstable_enablePackageExports = true`.

---

## Usage

Four small files. This is the entire client layer — you supply your schema, queries, and config.

### 1. Define your schema
```ts
// lib/powersync/schema.ts
import { column, Schema, Table } from '@powersync/common';

// PowerSync auto-adds an `id` primary key — don't declare one.
const items = new Table({
  user_id: column.text,
  title: column.text,
  created_at: column.text,
  updated_at: column.text,
});

export const AppSchema = new Schema({ items });
export type Database = (typeof AppSchema)['types'];
export type ItemRecord = Database['items'];
```

### 2. Create the client
```ts
// lib/powersync/client.ts
import { createSyncClient } from '@offline-expo/sync-client';
import { AppSchema } from './schema';

export const powersync = createSyncClient(AppSchema, { dbFilename: 'myapp.db' });
```

### 3. Create the connector
```ts
// lib/powersync/connector.ts
import { createConnector } from '@offline-expo/sync-client';

export const connector = createConnector({
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8081',
  authPath: '/api/auth/token',            // returns { token, endpoint }
  tableRoutes: {
    items: { endpoint: 'items' },         // table name -> /api/items/:id
  },
});
```

### 4. Wire it up
```tsx
// App.tsx
import { PowerSyncContext } from '@powersync/react';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SyncStatusIndicator } from '@offline-expo/sync-client';
import { powersync } from './lib/powersync/client';
import { connector } from './lib/powersync/connector';

export default function App() {
  useEffect(() => {
    powersync.connect(connector);
    return () => { powersync.disconnect(); };
  }, []);

  return (
    <PowerSyncContext.Provider value={powersync}>
      <View style={{ flex: 1 }}>
        <SyncStatusIndicator />
        {/* your screens */}
      </View>
    </PowerSyncContext.Provider>
  );
}
```

### Reading and writing
Reads are reactive via `useQuery`; writes go through `powersync.execute` and sync automatically.
```tsx
import { useQuery } from '@powersync/react';
import { powersync } from './lib/powersync/client';

// live query — re-renders on every local or synced change
const { data: items } = useQuery<ItemRecord>('SELECT * FROM items ORDER BY updated_at DESC');

// write locally; the connector uploads it when online
await powersync.execute(
  'INSERT INTO items (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  [id, userId, title, now, now],
);
```

---

## API

### `createSyncClient(schema, options)`
Returns a web `PowerSyncDatabase`.
- `schema: Schema` — your PowerSync schema.
- `options.dbFilename: string` — local DB filename (use a distinct one per app, e.g. `'myapp.db'`).
- `options.dbWorker?`, `options.syncWorker?` — worker URL overrides. Default to the
  `powersync-web copy-assets` layout (`/@powersync/worker/...`).

### `createConnector(options)`
Returns a `PowerSyncBackendConnector` for backends following the [contract](#backend-contract).
- `backendUrl: string` — base URL of your sync backend.
- `tableRoutes: Record<string, { endpoint: string }>` — maps each synced table to its REST path.
- `authPath?: string` — path returning `{ token, endpoint }`. Default `'/api/auth/token'`.
- `credentialsInclude?: boolean` — send cookies on the token request (for httpOnly-cookie sessions). Default `false`.

### `SyncStatusIndicator`
A `react-native` banner showing connection/sync state (offline / syncing / connecting /
up-to-date). Must be rendered inside a `PowerSyncContext.Provider`.

---

## Backend contract

`createConnector` speaks a specific REST shape. Your backend must implement it (or you
hand-roll your own connector).

**Auth / credentials**
```
GET  <authPath>            -> 200 { "token": "<JWT>", "endpoint": "<PowerSync URL>" }
```
`token` is an RS256 JWT whose `sub` is the user id; the client attaches it as a bearer token
on every write.

**Per-table writes** — `/api/<endpoint>/:id`, all with `Authorization: Bearer <token>`:

| Method | Body | Meaning | Success |
|---|---|---|---|
| `PUT` | full row | upsert | `204` |
| `PATCH` | changed fields | partial update | `204` |
| `DELETE` | none | delete | `204` |

- **`409`** → the client **discards** the op (server-detected conflict; a stale write can't win on retry).
- Any other **non-2xx** → the client **throws**, leaving the op queued for retry.
- The server must derive the row owner from the JWT `sub`, **never** from the request body.

A matching self-hostable backend + PowerSync stack lives in `powersync/` in this repo.

---

## Limitations / not yet

- **Web only.** No native iOS/Android target yet.
- **React-Native-coupled UI.** `SyncStatusIndicator` and the `react-native` peer dep tie the
  full package to Expo/RN. The core (`createSyncClient` + `createConnector`) is framework-neutral
  web JS and can run in any web-React app.
- **One backend convention.** Non-REST backends (e.g. GraphQL) need a custom connector.
- **Not published.** Distributed as a tarball for now; publishing unlocks `expo install`.
