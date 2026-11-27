/**
 * Demo-only credential hashing via Web Crypto PBKDF2-SHA-256.
 * This does NOT make browser/localStorage auth production-secure.
 */
import type { PasswordRecord } from "./types";

const ITERATIONS = 100_000;
const KEY_BITS = 256;

function bufferToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  // Return a TypedArray view — Node/WebCrypto reject a detached/shared ArrayBuffer.
  return bytes;
}

async function deriveBits(
  password: string,
  saltHex: string,
  iterations: number,
) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBuffer(saltHex),
      iterations,
    },
    keyMaterial,
    KEY_BITS,
  );
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bufferToHex(saltBytes.buffer);
  const derived = await deriveBits(password, salt, ITERATIONS);
  return {
    algo: "PBKDF2-SHA-256",
    iterations: ITERATIONS,
    salt,
    hash: bufferToHex(derived),
  };
}

/** Deterministic hash for the seeded Super Admin (tests + first boot). */
export async function hashPasswordWithSalt(
  password: string,
  saltHex: string,
  iterations = ITERATIONS,
): Promise<PasswordRecord> {
  const derived = await deriveBits(password, saltHex, iterations);
  return {
    algo: "PBKDF2-SHA-256",
    iterations,
    salt: saltHex,
    hash: bufferToHex(derived),
  };
}

export async function verifyPassword(
  password: string,
  record: PasswordRecord,
): Promise<boolean> {
  if (record.algo !== "PBKDF2-SHA-256") return false;
  const derived = await deriveBits(
    password,
    record.salt,
    record.iterations || ITERATIONS,
  );
  const candidate = bufferToHex(derived);
  if (candidate.length !== record.hash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    mismatch |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Seed salt for admin@yaglob.com — fixed so tests can assert login without re-seeding race. */
export const DEMO_ADMIN_SALT = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
export const DEMO_ADMIN_PASSWORD = "Test@123";
export const DEMO_ADMIN_EMAIL = "admin@yaglob.com";
