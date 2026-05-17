/**
 * Encryption Service - AES-GCM via Web Crypto API.
 * v2 payloads are portable: every encrypted record carries its own salt and IV.
 * Legacy payloads are still readable with the historical localStorage salt.
 */

const LEGACY_SALT_KEY = 'cwc_salt';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const CURRENT_VERSION = 2;

interface PortableEncryptedPayload {
  version: 2;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const keyCache = new Map<string, CryptoKey>();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array {
  return new Uint8Array(
    atob(input)
      .split('')
      .map((char) => char.charCodeAt(0))
  );
}

function getLegacySalt(): Uint8Array {
  if (typeof window === 'undefined') return new Uint8Array(SALT_LENGTH);

  const stored = window.localStorage.getItem(LEGACY_SALT_KEY);
  if (!stored) return new Uint8Array(SALT_LENGTH);

  try {
    return new Uint8Array(JSON.parse(stored));
  } catch {
    return new Uint8Array(SALT_LENGTH);
  }
}

function tryParsePortablePayload(input: string): PortableEncryptedPayload | null {
  try {
    const payload = JSON.parse(input) as Partial<PortableEncryptedPayload>;
    if (
      payload.version === CURRENT_VERSION &&
      payload.algorithm === 'AES-GCM' &&
      payload.kdf === 'PBKDF2-SHA256' &&
      typeof payload.salt === 'string' &&
      typeof payload.iv === 'string' &&
      typeof payload.ciphertext === 'string'
    ) {
      return payload as PortableEncryptedPayload;
    }
  } catch {
    return null;
  }

  return null;
}

async function deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const cacheKey = `${passcode}:${bytesToBase64(salt)}`;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, key);
  return key;
}

export function isPortableEncryptedData(encryptedData: string): boolean {
  return tryParsePortablePayload(encryptedData) !== null;
}

export async function encryptData(data: unknown, passcode: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passcode, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded
  );

  const payload: PortableEncryptedPayload = {
    version: CURRENT_VERSION,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };

  return JSON.stringify(payload);
}

export async function decryptData<T>(encryptedData: string, passcode: string): Promise<T> {
  const portablePayload = tryParsePortablePayload(encryptedData);

  if (portablePayload) {
    const key = await deriveKey(passcode, base64ToBytes(portablePayload.salt));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(portablePayload.iv) as BufferSource },
      key,
      base64ToBytes(portablePayload.ciphertext) as BufferSource
    );

    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  }

  const legacyCombined = base64ToBytes(encryptedData);
  const legacyIv = legacyCombined.slice(0, IV_LENGTH);
  const legacyCiphertext = legacyCombined.slice(IV_LENGTH);
  const legacyKey = await deriveKey(passcode, getLegacySalt());
  const legacyDecrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: legacyIv as BufferSource },
    legacyKey,
    legacyCiphertext as BufferSource
  );

  return JSON.parse(new TextDecoder().decode(legacyDecrypted)) as T;
}

export function isEncryptionAvailable(): boolean {
  const webCrypto =
    globalThis.crypto || (typeof window !== 'undefined' ? window.crypto : undefined);
  return typeof webCrypto !== 'undefined' && typeof webCrypto.subtle !== 'undefined';
}
