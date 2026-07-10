import { createConnector } from '@offline-expo/sync-client';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8081';

// No real login yet — which demo identity this device acts as. See
// powersync/backend/src/auth.ts for what this stands in for. When real login
// exists, authPath points at an endpoint backed by the app's actual session.
const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER ?? 'user-a';

export const connector = createConnector({
  backendUrl: BACKEND_URL,
  authPath: `/api/auth/token?demo=${DEMO_USER_ID}`,
  tableRoutes: {
    notes: { endpoint: 'notes' },
  },
});
