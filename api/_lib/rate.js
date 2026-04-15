const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;

const store = global._iepdesk_rate || new Map();
if (!global._iepdesk_rate) global._iepdesk_rate = store;

export function checkRateLimit(key) {
  const now = Date.now();
  const entry = store.get(key) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  store.set(key, entry);
  if (entry.count > RATE_MAX) {
    const error = new Error("Too many AI requests. Please wait and try again.");
    error.statusCode = 429;
    throw error;
  }
}
