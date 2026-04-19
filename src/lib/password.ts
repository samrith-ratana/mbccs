const DEFAULT_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const SALT_LENGTH = 16;

function resolveIterations() {
  const raw = process.env.AUTH_PBKDF2_ITERATIONS;
  const parsed = raw ? Number(raw) : DEFAULT_ITERATIONS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ITERATIONS;
}

function toBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const iterations = resolveIterations();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await deriveKey(password, salt, iterations);
  return `pbkdf2$${iterations}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("pbkdf2$")) {
    const [, iterationsRaw, saltRaw, hashRaw] = storedHash.split("$");
    const iterations = Number(iterationsRaw);
    if (!iterations || !saltRaw || !hashRaw) return false;
    const salt = fromBase64(saltRaw);
    const expected = fromBase64(hashRaw);
    const derived = await deriveKey(password, salt, iterations);
    return timingSafeEqual(derived, expected);
  }

  if (storedHash.startsWith("$2")) {
    try {
      const { compare } = await import("bcryptjs");
      return await compare(password, storedHash);
    } catch {
      return false;
    }
  }

  return false;
}