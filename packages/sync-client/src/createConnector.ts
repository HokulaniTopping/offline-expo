import {
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/common';

export interface TableRoute {
  /** REST path segment for this table's writes, e.g. 'notes' -> /api/notes/:id */
  endpoint: string;
}

export interface CreateConnectorOptions {
  /** Base URL of the app's sync backend, e.g. http://localhost:8091 */
  backendUrl: string;
  /**
   * Path that returns `{ token, endpoint }` for this device. This is the seam
   * between the app's login system and the sync layer: whatever auth the app
   * already has, it supplies a path (or query params) that yields a JWT here.
   */
  authPath?: string;
  /**
   * Send cookies with the token request (fetch `credentials: 'include'`).
   * Needed when the app's session lives in an httpOnly cookie (web logins)
   * rather than a header the connector could attach itself.
   */
  credentialsInclude?: boolean;
  /** Maps each synced table name to its backend REST route. */
  tableRoutes: Record<string, TableRoute>;
}

/**
 * A PowerSync backend connector for backends following this repo's REST
 * convention (PUT/PATCH/DELETE /api/<endpoint>/:id, bearer-token auth).
 * Apps with a different backend shape can still hand-roll their own
 * PowerSyncBackendConnector — this covers the common case.
 */
export function createConnector({
  backendUrl,
  tableRoutes,
  authPath = '/api/auth/token',
  credentialsInclude = false,
}: CreateConnectorOptions): PowerSyncBackendConnector {
  let currentToken: string | null = null;

  async function applyOp(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (response.status === 409) {
      // The backend detected and recorded a write conflict server-side.
      // Discard rather than throw: throwing would retry this op forever,
      // and a stale write can never succeed on retry.
      return;
    }
    if (!response.ok) {
      throw new Error(`${method} ${url} failed: ${response.status}`);
    }
  }

  return {
    async fetchCredentials() {
      const response = await fetch(`${backendUrl}${authPath}`, {
        credentials: credentialsInclude ? 'include' : undefined,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch PowerSync credentials: ${response.status}`);
      }
      const { token, endpoint } = await response.json();
      // Stashed so uploadData can attach it — the backend verifies this on
      // every write instead of trusting requests blindly.
      currentToken = token;
      return { endpoint, token };
    },

    async uploadData(database: AbstractPowerSyncDatabase) {
      const transaction = await database.getNextCrudTransaction();
      if (!transaction) {
        return;
      }

      for (const op of transaction.crud) {
        const route = tableRoutes[op.table];
        if (!route) {
          throw new Error(`No tableRoute configured for table "${op.table}"`);
        }
        const url = `${backendUrl}/api/${route.endpoint}/${op.id}`;
        switch (op.op) {
          case UpdateType.PUT:
            await applyOp(url, 'PUT', op.opData);
            break;
          case UpdateType.PATCH:
            await applyOp(url, 'PATCH', op.opData);
            break;
          case UpdateType.DELETE:
            await applyOp(url, 'DELETE');
            break;
        }
      }

      // Thrown errors above skip this, leaving the transaction queued for retry.
      await transaction.complete();
    },
  };
}
