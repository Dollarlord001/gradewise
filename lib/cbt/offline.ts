export const CBT_SCHEMA_VERSION = 1;
const DATABASE = "tutor-me-cbt";
const STORE = "records";

export type CbtPack = {
  id: string; version: number; schemaVersion: number; exam: string; year: number;
  subject: string; paper: string; durationSeconds: number;
  scoring: { correct: number; incorrect: number; unanswered: number };
  instructions: string[];
  questions: Array<{ id: string; number: number; prompt: string; options: Array<{ id: string; text: string }>; answer: string; explanation: string; topic?: string }>;
};
export type CbtAttempt = {
  id: string; packId: string; packVersion: number; startedAt: number; durationSeconds: number;
  answers: Record<string, string>; marked: string[]; status: "in_progress" | "submitted";
  submittedAt?: number; score?: number; syncState: "pending" | "synced";
};

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable on this device."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open offline storage."));
  });
}

async function record<T>(key: string, value?: T): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, value === undefined ? "readonly" : "readwrite");
    const store = tx.objectStore(STORE);
    const req = value === undefined ? store.get(key) : store.put({ key, value });
    req.onsuccess = () => resolve(value === undefined ? req.result?.value as T | undefined : value);
    req.onerror = () => reject(req.error ?? new Error("Offline storage failed."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Offline transaction failed.")); };
  });
}

export async function verifyPack(pack: CbtPack, expectedSha256: string): Promise<boolean> {
  if (pack.schemaVersion !== CBT_SCHEMA_VERSION || !pack.id || !Number.isSafeInteger(pack.version) || pack.questions.length === 0) return false;
  if (!globalThis.crypto?.subtle) throw new Error("This browser cannot verify CBT pack integrity.");
  const canonical = JSON.stringify(pack);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return actual === expectedSha256.toLowerCase();
}

export async function installPack(pack: CbtPack, expectedSha256: string): Promise<void> {
  if (!await verifyPack(pack, expectedSha256)) throw new Error("This CBT pack is corrupted or not compatible with this app.");
  await record(`pack:${pack.id}:${pack.version}`, pack);
}

export async function readPack(packId: string, version: number): Promise<CbtPack | null> {
  return (await record<CbtPack>(`pack:${packId}:${version}`)) ?? null;
}

export async function saveAttempt(attempt: CbtAttempt): Promise<void> {
  await record(`attempt:${attempt.id}`, attempt);
}

export async function readAttempt(id: string): Promise<CbtAttempt | null> {
  return (await record<CbtAttempt>(`attempt:${id}`)) ?? null;
}

export function remainingSeconds(attempt: Pick<CbtAttempt, "startedAt" | "durationSeconds" | "status">, now = Date.now()): number {
  return attempt.status === "submitted" ? 0 : Math.max(0, Math.ceil((attempt.startedAt + attempt.durationSeconds * 1000 - now) / 1000));
}

export function scoreAttempt(pack: CbtPack, answers: Record<string, string>): number {
  return pack.questions.reduce((score, question) => score + (answers[question.id] === question.answer ? pack.scoring.correct : 0) + (answers[question.id] && answers[question.id] !== question.answer ? pack.scoring.incorrect : 0), 0);
}
