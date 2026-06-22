import { describe, it, expect, beforeEach } from "vitest";
import { addDays, computeLongest, computeStrength, mergeMorning, mergeEvening, storage } from "./logic.js";

// ─── addDays ──────────────────────────────────────────────────────────────────

describe("addDays", () => {
  it("adds positive days", () => {
    expect(addDays("2026-06-01", 5)).toBe("2026-06-06");
  });

  it("subtracts negative days", () => {
    expect(addDays("2026-06-21", -7)).toBe("2026-06-14");
  });

  it("wraps across month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });
});

// ─── computeLongest ───────────────────────────────────────────────────────────

describe("computeLongest", () => {
  it("returns 1 for an empty array", () => {
    expect(computeLongest([])).toBe(1);
  });

  it("returns 1 for a single entry", () => {
    expect(computeLongest(["2026-06-01"])).toBe(1);
  });

  it("counts a fully consecutive streak", () => {
    expect(computeLongest(["2026-06-01", "2026-06-02", "2026-06-03"])).toBe(3);
  });

  it("finds the longest streak across gaps", () => {
    expect(computeLongest([
      "2026-06-01", "2026-06-02",          // streak of 2
      "2026-06-05", "2026-06-06", "2026-06-07", // streak of 3
    ])).toBe(3);
  });

  it("returns 1 when no two days are consecutive", () => {
    expect(computeLongest(["2026-06-01", "2026-06-03", "2026-06-05"])).toBe(1);
  });
});

// ─── computeStrength ──────────────────────────────────────────────────────────

describe("computeStrength", () => {
  const TODAY = "2026-06-21";

  it("returns 0 for empty array", () => {
    expect(computeStrength([], 14, TODAY)).toBe(0);
  });

  it("returns 100 when all 14 days are logged", () => {
    const keys = Array.from({ length: 14 }, (_, i) => addDays(TODAY, -i)).sort();
    expect(computeStrength(keys, 14, TODAY)).toBe(100);
  });

  it("returns 0 when all entries are outside the window", () => {
    expect(computeStrength(["2026-05-01", "2026-05-02"], 14, TODAY)).toBe(0);
  });

  it("returns correct percentage for partial activity", () => {
    // 7 out of 14 days = 50 %
    const keys = Array.from({ length: 7 }, (_, i) => addDays(TODAY, -i)).sort();
    expect(computeStrength(keys, 14, TODAY)).toBe(50);
  });

  it("ignores future dates beyond today", () => {
    expect(computeStrength(["2026-07-01", "2026-07-02"], 14, TODAY)).toBe(0);
  });

  it("includes today itself in the window", () => {
    expect(computeStrength([TODAY], 14, TODAY)).toBe(7); // 1/14 ≈ 7 %
  });
});

// ─── mergeMorning ─────────────────────────────────────────────────────────────

describe("mergeMorning", () => {
  it("creates a morning sub-object when no entry exists", () => {
    const result = mergeMorning({}, "2026-06-21", {
      intention: "Präsent sein",
      gratitudeFor: "Kaffee",
      affirmation: "Ich schaffe das",
    });
    expect(result["2026-06-21"].morning.intention).toBe("Präsent sein");
    expect(result["2026-06-21"].morning.gratitudeFor).toBe("Kaffee");
    expect(result["2026-06-21"].morning.affirmation).toBe("Ich schaffe das");
    expect(typeof result["2026-06-21"].morning.ts).toBe("number");
  });

  it("preserves existing evening fields when saving morning", () => {
    const existing = { "2026-06-21": { mood: 4, woStehe: "Gut", tags: ["Sport"] } };
    const result = mergeMorning(existing, "2026-06-21", { intention: "Fokus" });
    expect(result["2026-06-21"].mood).toBe(4);
    expect(result["2026-06-21"].woStehe).toBe("Gut");
    expect(result["2026-06-21"].tags).toEqual(["Sport"]);
    expect(result["2026-06-21"].morning.intention).toBe("Fokus");
  });

  it("overwrites previous morning data on a second save", () => {
    const existing = { "2026-06-21": { morning: { intention: "Alter Vorsatz" } } };
    const result = mergeMorning(existing, "2026-06-21", { intention: "Neuer Vorsatz" });
    expect(result["2026-06-21"].morning.intention).toBe("Neuer Vorsatz");
  });

  it("does not touch other days in the map", () => {
    const existing = { "2026-06-20": { mood: 3 } };
    const result = mergeMorning(existing, "2026-06-21", { intention: "Fokus" });
    expect(result["2026-06-20"].mood).toBe(3);
  });

  it("does not mutate the original entries object", () => {
    const original = {};
    mergeMorning(original, "2026-06-21", { intention: "x" });
    expect(original).toEqual({});
  });
});

// ─── mergeEvening ─────────────────────────────────────────────────────────────

describe("mergeEvening", () => {
  it("creates an evening entry when nothing exists", () => {
    const result = mergeEvening({}, "2026-06-21", { mood: 4, woStehe: "Guter Tag", tags: ["Sport"] });
    expect(result["2026-06-21"].mood).toBe(4);
    expect(result["2026-06-21"].woStehe).toBe("Guter Tag");
    expect(result["2026-06-21"].tags).toEqual(["Sport"]);
    expect(typeof result["2026-06-21"].ts).toBe("number");
  });

  it("preserves morning data when saving evening", () => {
    const existing = {
      "2026-06-21": { morning: { intention: "Präsent sein", gratitudeFor: "Kaffee" } },
    };
    const result = mergeEvening(existing, "2026-06-21", { mood: 3, woStehe: "Müde" });
    expect(result["2026-06-21"].morning.intention).toBe("Präsent sein");
    expect(result["2026-06-21"].morning.gratitudeFor).toBe("Kaffee");
    expect(result["2026-06-21"].mood).toBe(3);
  });

  it("overwrites previous evening data on a second save", () => {
    const existing = { "2026-06-21": { mood: 2, woStehe: "Schwierig" } };
    const result = mergeEvening(existing, "2026-06-21", { mood: 4, woStehe: "Besser jetzt" });
    expect(result["2026-06-21"].mood).toBe(4);
    expect(result["2026-06-21"].woStehe).toBe("Besser jetzt");
  });

  it("full cycle: morning then evening both survive", () => {
    let entries = {};
    entries = mergeMorning(entries, "2026-06-21", { intention: "Freundlich sein", gratitudeFor: "Sonne" });
    entries = mergeEvening(entries, "2026-06-21", { mood: 5, woStehe: "Toller Tag", tags: ["Sozial"] });
    expect(entries["2026-06-21"].morning.intention).toBe("Freundlich sein");
    expect(entries["2026-06-21"].morning.gratitudeFor).toBe("Sonne");
    expect(entries["2026-06-21"].mood).toBe(5);
    expect(entries["2026-06-21"].tags).toEqual(["Sozial"]);
  });

  it("full cycle: evening then morning both survive", () => {
    let entries = {};
    entries = mergeEvening(entries, "2026-06-21", { mood: 3, woStehe: "Neutral" });
    entries = mergeMorning(entries, "2026-06-21", { intention: "Nachträglicher Vorsatz" });
    expect(entries["2026-06-21"].mood).toBe(3);
    expect(entries["2026-06-21"].morning.intention).toBe("Nachträglicher Vorsatz");
  });

  it("does not touch other days in the map", () => {
    const existing = { "2026-06-20": { mood: 3 } };
    const result = mergeEvening(existing, "2026-06-21", { mood: 5 });
    expect(result["2026-06-20"].mood).toBe(3);
  });

  it("does not mutate the original entries object", () => {
    const original = {};
    mergeEvening(original, "2026-06-21", { mood: 4 });
    expect(original).toEqual({});
  });
});

// ─── storage ──────────────────────────────────────────────────────────────────

describe("storage", () => {
  // Lightweight localStorage mock — reset before each test
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it("returns null for a key that was never set", async () => {
    expect(await storage.get("entries")).toBeNull();
  });

  it("stores a value and retrieves it", async () => {
    await storage.set("entries", '{"date":"2026-06-21"}');
    const result = await storage.get("entries");
    expect(result).not.toBeNull();
    expect(result.value).toBe('{"date":"2026-06-21"}');
  });

  it("namespaces keys with the innenschau: prefix", async () => {
    await storage.set("entries", "test");
    expect(localStorage.getItem("innenschau:entries")).toBe("test");
    expect(localStorage.getItem("entries")).toBeNull();
  });

  it("roundtrips serialised JSON correctly", async () => {
    const data = { "2026-06-21": { mood: 4, tags: ["Sport"] } };
    await storage.set("entries", JSON.stringify(data));
    const result = await storage.get("entries");
    expect(JSON.parse(result.value)).toEqual(data);
  });

  it("returns the key in the result object", async () => {
    const result = await storage.set("goals", "[]");
    expect(result.key).toBe("goals");
  });

  it("returns null from get() when localStorage throws", async () => {
    global.localStorage = { getItem: () => { throw new Error("blocked"); } };
    expect(await storage.get("entries")).toBeNull();
  });

  it("returns null from set() when localStorage throws", async () => {
    global.localStorage = { setItem: () => { throw new Error("blocked"); } };
    expect(await storage.set("entries", "x")).toBeNull();
  });
});
