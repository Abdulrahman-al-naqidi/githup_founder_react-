/* GitHub API + security helpers */

export const API = "https://api.github.com";
export const PER_PAGE = 30;
export const TIMEOUT_MS = 10000;

// GitHub username rules: 1-39 chars, alphanumeric or single hyphens, no leading/trailing hyphen
export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
export const AVATAR_HOSTS = ["avatars.githubusercontent.com"];
export const GITHUB_HOSTS = ["github.com", "www.github.com"];

// Only allow http/https links (blocks javascript:, data:, ...), optionally restricted to given hosts
export function safeUrl(raw, allowedHosts) {
  if (!raw || typeof raw !== "string") return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (allowedHosts && !allowedHosts.includes(u.hostname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

// Accepts "torvalds", "@torvalds" or a pasted link like https://github.com/torvalds
export function extractUsername(raw) {
  const u = raw.includes("github.com") ? safeUrl(raw, GITHUB_HOSTS) : null;
  if (u) {
    const seg = new URL(u).pathname.split("/").filter(Boolean)[0];
    if (seg) return seg;
  }
  return raw;
}

// Preferences are validated against a whitelist before use
export function readPref(key, allowed) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : null;
  } catch {
    return null;
  }
}
export function savePref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable */
  }
}

// One cancellable request with a timeout (used by every useEffect fetch)
export function createRequest(ms = TIMEOUT_MS) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    done: () => clearTimeout(timer),
    cancel: () => {
      clearTimeout(timer);
      controller.abort();
    },
  };
}

// GET https://api.github.com/<path>
export async function ghFetch(path, signal) {
  const res = await fetch(`${API}${path}`, {
    signal,
    headers: { Accept: "application/vnd.github+json" },
    credentials: "omit", // never send cookies
    referrerPolicy: "no-referrer",
  });
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    const err = new Error("RATE_LIMIT");
    err.reset = reset ? new Date(reset * 1000) : null;
    throw err;
  }
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json();
}
