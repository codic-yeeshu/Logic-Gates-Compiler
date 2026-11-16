import assert from "node:assert/strict";
import { after, afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const server = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const { DRAFT_KEY, loadDraft, saveDraft } = await server.ssrLoadModule(
  "/src/draft.ts",
);
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
});

function useStorage(initial) {
  const entries = new Map(initial === undefined ? [] : [[DRAFT_KEY, initial]]);
  globalThis.window = {
    localStorage: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    },
  };
  return entries;
}

for (const draft of [
  { source: "OUTPUT out; out = 1;", optimization: true },
  { source: "", optimization: false },
  { source: "// Custom circuit\nOUTPUT out; out = 0;", optimization: false },
]) {
  test(`round-trips ${JSON.stringify(draft)}`, () => {
    const entries = useStorage();
    assert.equal(loadDraft(), null);
    assert.equal(saveDraft(draft), true);
    assert.deepEqual(JSON.parse(entries.get(DRAFT_KEY)), draft);
    assert.deepEqual(loadDraft(), draft);
  });
}

for (const stored of [
  "",
  "not JSON",
  "null",
  "false",
  "42",
  '"source"',
  "[]",
  "{}",
  '{"source":"OUTPUT out; out = 1;"}',
  '{"optimization":true}',
  '{"source":null,"optimization":true}',
  '{"source":42,"optimization":true}',
  '{"source":"","optimization":"false"}',
  '{"source":"","optimization":0}',
]) {
  test(`ignores malformed or invalid stored draft: ${stored}`, () => {
    useStorage(stored);
    assert.equal(loadDraft(), null);
  });
}

test("loads and saves only source and optimization", () => {
  const draft = { source: "", optimization: false };
  const entries = useStorage(
    JSON.stringify({ ...draft, result: { success: true }, extra: "ignored" }),
  );
  assert.deepEqual(loadDraft(), draft);
  assert.equal(saveDraft({ ...draft, result: { success: true } }), true);
  assert.deepEqual(JSON.parse(entries.get(DRAFT_KEY)), draft);
});

test("works without window during server rendering", () => {
  delete globalThis.window;
  assert.equal(loadDraft(), null);
  assert.equal(saveDraft({ source: "", optimization: false }), false);
});

test("handles unavailable localStorage", () => {
  globalThis.window = {};
  assert.equal(loadDraft(), null);
  assert.equal(saveDraft({ source: "", optimization: false }), false);
});

test("handles a blocked localStorage accessor", () => {
  globalThis.window = {
    get localStorage() {
      throw new Error("Storage blocked");
    },
  };
  assert.equal(loadDraft(), null);
  assert.equal(saveDraft({ source: "", optimization: false }), false);
});

test("handles a failed storage read", () => {
  globalThis.window = {
    localStorage: {
      getItem() {
        throw new Error("Read blocked");
      },
    },
  };
  assert.equal(loadDraft(), null);
});

test("reports a failed storage write", () => {
  globalThis.window = {
    localStorage: {
      setItem() {
        throw new Error("Storage quota exceeded");
      },
    },
  };
  assert.equal(saveDraft({ source: "", optimization: false }), false);
});
