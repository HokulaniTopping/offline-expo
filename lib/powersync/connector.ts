import {
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/web';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8081';

// No real login yet — which demo identity this device acts as. See
// powersync/backend/src/auth.ts for what this stands in for.
const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER ?? 'user-a';

export class Connector implements PowerSyncBackendConnector {
  private currentToken: string | null = null;

  private async applyOp(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(this.currentToken ? { Authorization: `Bearer ${this.currentToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`${method} ${url} failed: ${response.status}`);
    }
  }

  async fetchCredentials() {
    const response = await fetch(`${BACKEND_URL}/api/auth/token?demo=${DEMO_USER_ID}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch PowerSync credentials: ${response.status}`);
    }
    const { token, endpoint } = await response.json();
    // Stashed so uploadData can attach it as a bearer token — the backend now
    // verifies this on every write instead of trusting requests blindly.
    this.currentToken = token;
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
          await this.applyOp(url, 'PUT', op.opData);
          break;
        case UpdateType.PATCH:
          await this.applyOp(url, 'PATCH', op.opData);
          break;
        case UpdateType.DELETE:
          await this.applyOp(url, 'DELETE');
          break;
      }
    }

    // Thrown errors above skip this, leaving the transaction queued for retry.
    await transaction.complete();
  }
}
