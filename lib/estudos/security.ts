import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export type Entry = { slug: string; revision: number; accessHash: string; dataKey: string; enabled: boolean };
export type Registry = { sessionKey: Buffer; studies: readonly Entry[] };
export const SESSION_COOKIE = "__Host-ab_study", CSRF_COOKIE = "__Host-ab_study_csrf", SESSION_SECONDS = 28800;
const keyPattern = /^[a-f0-9]{64}$/;
export function configuration(): Registry {
  const key = process.env.AB_STUDIES_SESSION_KEY ?? "";
  if (!keyPattern.test(key)) throw new Error("STUDIES_CONFIGURATION");
  const input: unknown = JSON.parse(process.env.AB_STUDIES_REGISTRY ?? "null");
  if (!Array.isArray(input) || !input.length || input.length > 64) throw new Error("STUDIES_CONFIGURATION");
  const ids = new Set<string>(), hashes = new Set<string>();
  const studies = input.map((value: unknown) => {
    if (!value || typeof value !== "object") throw new Error("STUDIES_CONFIGURATION");
    const e = value as Entry;
    if (typeof e.slug !== "string" || e.slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.slug) || !Number.isSafeInteger(e.revision) || e.revision < 1 || typeof e.enabled !== "boolean" || !keyPattern.test(e.accessHash) || !keyPattern.test(e.dataKey) || ids.has(e.slug) || hashes.has(e.accessHash)) throw new Error("STUDIES_CONFIGURATION");
    ids.add(e.slug); hashes.add(e.accessHash);
    return Object.freeze({ slug: e.slug, revision: e.revision, accessHash: e.accessHash, dataKey: e.dataKey, enabled: e.enabled });
  });
  return { sessionKey: Buffer.from(key, "hex"), studies: Object.freeze(studies) };
}
export function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
// Apenas credenciais geradas com 144 bits aleatórios. Não substituir por senhas humanas curtas.
export function digest(password: string, r: Registry): string {
  return createHmac("sha256", r.sessionKey).update("ab-studies:password:v1\0").update(password).digest("hex");
}
export function authenticate(password: string, r: Registry): Entry | null {
  if (password.length < 20 || password.length > 128) return null;
  const hash = digest(password, r); let match: Entry | null = null;
  for (const e of r.studies) if (safeEqual(hash, e.accessHash) && e.enabled) match = e;
  return match;
}
function signature(payload: string, r: Registry, purpose: string): string {
  return createHmac("sha256", r.sessionKey).update("ab-studies:" + purpose + ":v1\0").update(payload).digest("base64url");
}
function encode(data: Record<string, unknown>, r: Registry, purpose: string): string {
  const p = Buffer.from(JSON.stringify(data)).toString("base64url"); return p + "." + signature(p, r, purpose);
}
function decode(token: string, r: Registry, purpose: string): Record<string, unknown> | null {
  if (!token || token.length > 1024 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [p, h] = token.split("."); if (!safeEqual(h, signature(p, r, purpose))) return null;
  try { const t: unknown = JSON.parse(Buffer.from(p, "base64url").toString()); return t && typeof t === "object" && !Array.isArray(t) ? t as Record<string, unknown> : null; } catch { return null; }
}
export function createSession(e: Entry, r: Registry, now = Math.floor(Date.now() / 1000)): string {
  return encode({ v: 1, s: e.slug, r: e.revision, i: now, e: now + SESSION_SECONDS, n: randomBytes(16).toString("base64url") }, r, "session");
}
export function validateSession(token: string, r: Registry, now = Math.floor(Date.now() / 1000)): Entry | null {
  const t = decode(token, r, "session");
  if (!t || t.v !== 1 || !Number.isSafeInteger(t.i) || !Number.isSafeInteger(t.e) || (t.i as number) > now + 30 || (t.e as number) <= now || (t.e as number) - (t.i as number) !== SESSION_SECONDS || typeof t.n !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(t.n)) return null;
  return r.studies.find(e => e.slug === t.s && e.revision === t.r && e.enabled) ?? null;
}
export function createCsrf(r: Registry, now = Math.floor(Date.now() / 1000)): string {
  return encode({ v: 1, n: randomBytes(24).toString("base64url"), i: now, e: now + 1200 }, r, "csrf");
}
export function validateCsrf(token: string, cookie: string, r: Registry, now = Math.floor(Date.now() / 1000)): boolean {
  if (!safeEqual(token, cookie)) return false;
  const t = decode(token, r, "csrf");
  return !!t && t.v === 1 && typeof t.n === "string" && /^[A-Za-z0-9_-]{32}$/.test(t.n) && Number.isSafeInteger(t.i) && Number.isSafeInteger(t.e) && (t.i as number) <= now + 30 && (t.e as number) > now && (t.e as number) - (t.i as number) === 1200;
}
export function cookieValue(request: Request, name: string): string {
  const values = (request.headers.get("cookie") ?? "").split(";").map(s => s.trim()).filter(s => s.startsWith(name + "="));
  return values.length === 1 ? values[0].slice(name.length + 1) : "";
}
export function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
export function sameOrigin(request: Request): boolean {
  try {
    const u = new URL(request.url), hosts = new Set(["alexandrebelo.com.br", "www.alexandrebelo.com.br", process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean));
    return u.protocol === "https:" && hosts.has(u.hostname) && request.headers.get("origin") === u.origin && !["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "");
  } catch { return false; }
}
export async function boundedForm(request: Request): Promise<URLSearchParams> {
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get("content-type") ?? "")) throw new Error("FORM_INVALID");
  const n = request.headers.get("content-length"); if (n !== null && (!/^\d+$/.test(n) || Number(n) > 2048)) throw new Error("FORM_INVALID");
  const reader = request.body?.getReader(); if (!reader) throw new Error("FORM_INVALID");
  const chunks: Uint8Array[] = []; let total = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; total += value.length; if (total > 2048) { await reader.cancel(); throw new Error("FORM_INVALID"); } chunks.push(value); } } finally { reader.releaseLock(); }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}
const attempts = new Map<string, { count: number; until: number }>();
export function consumeAttempt(request: Request, r: Registry, now = Date.now()): boolean {
  const ip = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim().slice(0, 80);
  const key = createHmac("sha256", r.sessionKey).update("rate\0" + ip).digest("hex");
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  const previous = attempts.get(key); if (previous) return ++previous.count <= 10;
  if (attempts.size >= 4096) return false; attempts.set(key, { count: 1, until: now + 60000 }); return true;
}
export function responseHeaders(html?: string): Headers {
  const hashes = html ? [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => "'sha256-" + createHash("sha256").update(m[1]).digest("base64") + "'") : [];
  return new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "Pragma": "no-cache", "Expires": "0", "Vary": "Cookie", "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()", "Content-Security-Policy": `default-src 'none'; script-src ${hashes.length ? hashes.join(" ") : "'none'"}; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; frame-src 'none'; upgrade-insecure-requests` });
}
