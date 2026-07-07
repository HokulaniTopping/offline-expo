import {
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8081';

async function applyOp(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${response.status}`);
  }
}

export class Connector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const response = await fetch(`${BACKEND_URL}/api/auth/token`);
    if (!response.ok) {
      throw new Error(`Failed to fetch PowerSync credentials: ${response.status}`);
    }
    const { token, endpoint } = await response.json();
    return { endpoint, token };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    for (const op of transaction.crud) {
      const url = `${BACKEND_URL}/api/notes/${op.id}`;
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
  }
}
