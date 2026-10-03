import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve("scripts/content-pipeline.mjs");
const fixture = (name) => resolve(`tests/fixtures/cbt/${name}`);

test("content validation accepts a structurally valid isolated fixture", () => {
  const run = spawnSync(process.execPath, [script, "validate", "--file", fixture("valid.json")], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /"accepted": 1/);
  assert.match(run.stdout, /"rejected": 0/);
});

test("content validation rejects missing prompts, invalid options and unmatched answers", () => {
  const run = spawnSync(process.execPath, [script, "validate", "--file", fixture("invalid.json")], { encoding: "utf8" });
  assert.equal(run.status, 1, run.stderr || run.stdout);
  assert.match(run.stdout, /missing prompt/);
  assert.match(run.stdout, /missing\/invalid options/);
  assert.match(run.stdout, /answer does not match an option/);
});
