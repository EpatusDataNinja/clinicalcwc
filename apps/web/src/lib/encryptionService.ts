/**
 * Encryption Service — AES-GCM via Web Crypto API
 * Encrypts/decrypts data before local storage.
 * Key is derived from a user passcode using PBKDF2.
 */

const SALT_KEY = 'cwc_salt';
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

function getOrCreateSalt(): Uint8Array {
  if (typeof window === 'undefined') return new Uint8Array(16);
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
}

const keyCache = new Map<string, CryptoKey>();

async function deriveKey(passcode: string): Promise<CryptoKey> {
  if (keyCache.has(passcode)) {
    return keyCache.get(passcode)!;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const salt = getOrCreateSalt() as BufferSource;
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(passcode, key);
  return key;
}

export async function encryptData(data: unknown, passcode: string): Promise<string> {
  const key = await deriveKey(passcode);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const encoded = encoder.encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData<T>(encryptedBase64: string, passcode: string): Promise<T> {
  const key = await deriveKey(passcode);
  const combined = new Uint8Array(
    atob(encryptedBase64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  const iv = combined.slice(0, IV_LENGTH) as BufferSource;
  const data = combined.slice(IV_LENGTH) as BufferSource;

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted)) as T;
}

export function isEncryptionAvailable(): boolean {
  return typeof window !== 'undefined' && typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}
