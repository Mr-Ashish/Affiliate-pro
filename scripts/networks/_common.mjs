import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const secrets = [];

export function rememberSecret(value) {
  if (value && !secrets.includes(value)) secrets.push(value);
}

export function redact(value) {
  let text = String(value);
  for (const secret of secrets) {
    if (secret.length < 6) continue;
    text = text.split(secret).join("[redacted]");
  }
  return text;
}

export async function loadNetworkEnv() {
  const filePath = path.join(repoRoot, ".env.networks");
  let raw = "";
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.networks.example to .env.networks and fill it in. See docs/networks/.`,
    );
  }
  rememberSecret(value);
  return value;
}

export function optionalEnv(name) {
  const value = process.env[name]?.trim();
  if (value) rememberSecret(value);
  return value || "";
}

export async function requestJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const detail =
      typeof body === "string" ? body.slice(0, 800) : JSON.stringify(body).slice(0, 800);
    throw new Error(
      `${init.method ?? "GET"} ${redact(url)} failed (${response.status}): ${redact(detail)}`,
    );
  }
  return { status: response.status, body, headers: response.headers };
}

export async function writeSample(network, name, payload) {
  const dir = path.join(repoRoot, "data", "networks", network);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, name);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return path.relative(repoRoot, filePath);
}

export function previewRows(rows, pick) {
  return rows.slice(0, 5).map(pick);
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
