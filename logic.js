// Pure helper functions extracted from App.jsx.
// Exported so they can be unit-tested independently of React state.

export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeLongest(sortedKeys) {
  if (!sortedKeys.length) return 1;
  let longest = 1, run = 1;
  for (let i = 1; i < sortedKeys.length; i++) {
    const diff = (new Date(sortedKeys[i]) - new Date(sortedKeys[i - 1])) / 86400000;
    run = diff === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  return longest;
}

// `today` is injectable so tests don't depend on the real clock.
export function computeStrength(sortedKeys, days = 14, today = new Date().toISOString().slice(0, 10)) {
  if (!sortedKeys.length) return 0;
  const cutoff = addDays(today, -(days - 1));
  const count = sortedKeys.filter((k) => k >= cutoff && k <= today).length;
  return Math.round((count / days) * 100);
}

// Merges morning fields into the existing entries map without touching evening data.
export function mergeMorning(entries, dateKey, morningData) {
  const existing = entries[dateKey] || {};
  return {
    ...entries,
    [dateKey]: { ...existing, morning: { ...morningData, ts: Date.now() } },
  };
}

// Merges evening fields into the existing entries map without touching morning data.
export function mergeEvening(entries, dateKey, eveningData) {
  const existing = entries[dateKey] || {};
  return {
    ...entries,
    [dateKey]: { ...existing, ...eveningData, ts: Date.now() },
  };
}

export const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(`innenschau:${key}`);
      return value !== null ? { key, value } : null;
    } catch { return null; }
  },
  async set(key, value) {
    try {
      localStorage.setItem(`innenschau:${key}`, value);
      return { key, value };
    } catch { return null; }
  },
};
