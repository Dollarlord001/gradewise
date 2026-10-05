const BLOCK_PATTERNS = [
  /api[_-]?key/i,
  /service[_-]?role/i,
  /sk-[a-zA-Z0-9]{10,}/,
  /BEGIN PRIVATE KEY/,
];

export function scrubSecrets(text: string): string {
  let out = text;
  for (const re of BLOCK_PATTERNS) {
    out = out.replace(re, "[redacted]");
  }
  return out;
}

export function assertNoStudentCrossTalk(requestedStudentId: string, sessionStudentId: string): void {
  if (requestedStudentId !== sessionStudentId) {
    throw new Error("Forbidden: conversation does not belong to this student");
  }
}
