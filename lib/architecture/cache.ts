import "server-only";

/** Cache boundary for public, non-sensitive data. Implementations must always be disposable. */
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/** A no-op adapter keeps PostgreSQL authoritative when no shared cache is configured. */
export const cache: CacheStore = {
  async get() { return null; },
  async set() {},
  async delete() {},
};
