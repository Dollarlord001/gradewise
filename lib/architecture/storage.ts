import "server-only";

export type PrivateObject = { key: string; contentType: string; byteSize: number };
export interface ObjectStorage {
  createUploadUrl(input: { ownerId: string; filename: string; contentType: string; byteSize: number }): Promise<{ key: string; uploadUrl: string }>;
  createDownloadUrl(object: PrivateObject, ownerId: string): Promise<string>;
}

/** Storage is external and private by default; implementations issue short-lived signed URLs. */
export const objectStorage: ObjectStorage = {
  async createUploadUrl() { throw new Error("Object storage is not configured."); },
  async createDownloadUrl() { throw new Error("Object storage is not configured."); },
};
