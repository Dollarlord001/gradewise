import "server-only";

export type JobName = "mastery.recalculate" | "progress.aggregate" | "notification.deliver" | "cbt.pack.generate" | "search.index" | "ai.preprocess";
export type JobEnvelope<T = unknown> = { id: string; name: JobName; idempotencyKey: string; payload: T; createdAt: string };

/** Provider boundary for a managed, durable queue (for example Inngest or QStash). */
export interface JobQueue {
  enqueue<T>(name: JobName, idempotencyKey: string, payload: T): Promise<void>;
}

/** Never silently pretends work was queued. Configure a provider before using async jobs. */
export const jobs: JobQueue = {
  async enqueue() { throw new Error("No durable job provider is configured."); },
};
