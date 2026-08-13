/**
 * In-memory idempotency store.
 *
 * Protects against duplicate deck generation (and duplicate charges) when a
 * client retries a request it already paid for. Intentionally process-local:
 * the MVP has no database, and a lost cache only means the user is asked to
 * pay again for a *new* generation, never that a paid deck is lost mid-flight.
 */

interface Entry<T> {
  value: T;
  at: number;
}

const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 200;

const store = new Map<string, Entry<unknown>>();

function prune() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.at > TTL_MS) store.delete(key);
  }
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

/**
 * Reads a previously completed result for an idempotency key.
 *
 * @param key - Client-supplied idempotency key.
 * @returns The stored value, or undefined when unknown/expired.
 */
export function getCompleted<T>(key: string): T | undefined {
  prune();
  const entry = store.get(key);
  return entry ? (entry.value as T) : undefined;
}

/**
 * Records a completed result so retries are served without a second payment.
 *
 * @param key - Client-supplied idempotency key.
 * @param value - The result to remember.
 */
export function setCompleted<T>(key: string, value: T): void {
  store.set(key, { value, at: Date.now() });
  prune();
}
