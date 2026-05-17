import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  encryptData,
  decryptData,
  isPortableEncryptedData,
  isEncryptionAvailable,
} from './encryptionService';

describe('EncryptionService (v2 Portable Payloads)', () => {
  const passcode = 'physician-secret-passcode-2024';
  const sensitiveData = {
    patientAlias: 'P. Amara',
    diagnosis: 'NSTEMI',
    plan: 'IV Heparin',
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function buildLegacyPayload(data: unknown, salt = new Uint8Array(16)): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
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
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      encoder.encode(JSON.stringify(data))
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  it('should verify that Web Crypto is available', () => {
    expect(isEncryptionAvailable()).toBe(true);
  });

  it('should encrypt data into a valid JSON portable payload', async () => {
    const encrypted = await encryptData(sensitiveData, passcode);

    expect(typeof encrypted).toBe('string');
    expect(isPortableEncryptedData(encrypted)).toBe(true);

    const payload = JSON.parse(encrypted);
    expect(payload.version).toBe(2);
    expect(payload.algorithm).toBe('AES-GCM');
    expect(payload.kdf).toBe('PBKDF2-SHA256');
    expect(payload.iterations).toBe(100000);
  });

  it('should successfully decrypt a v2 payload with the correct passcode', async () => {
    const encrypted = await encryptData(sensitiveData, passcode);
    const decrypted = await decryptData<typeof sensitiveData>(encrypted, passcode);

    expect(decrypted).toEqual(sensitiveData);
    expect(decrypted.patientAlias).toBe('P. Amara');
  });

  it('should throw an error if decrypting with the wrong passcode', async () => {
    const encrypted = await encryptData(sensitiveData, passcode);
    const wrongPasscode = 'wrong-password';

    await expect(decryptData(encrypted, wrongPasscode)).rejects.toThrow();
  });

  it('should generate unique IVs and Salts for identical data inputs', async () => {
    const enc1 = await encryptData(sensitiveData, passcode);
    const enc2 = await encryptData(sensitiveData, passcode);

    expect(enc1).not.toBe(enc2); // Ciphertext, Salt, and IV should all differ
  });

  it('should reject malformed portable payload markers', () => {
    expect(isPortableEncryptedData('not-json')).toBe(false);
    expect(isPortableEncryptedData(JSON.stringify({ version: 2 }))).toBe(false);
    expect(
      isPortableEncryptedData(
        JSON.stringify({
          version: 1,
          algorithm: 'AES-GCM',
          kdf: 'PBKDF2-SHA256',
          salt: 'x',
          iv: 'y',
          ciphertext: 'z',
        })
      )
    ).toBe(false);
  });

  it('should decrypt legacy local records that used the historical salt fallback', async () => {
    const legacyPayload = await buildLegacyPayload(sensitiveData);

    const decrypted = await decryptData<typeof sensitiveData>(legacyPayload, passcode);

    expect(decrypted).toEqual(sensitiveData);
  });

  it('should tolerate a malformed legacy salt value and use the zero-salt fallback', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => 'not-json'),
      },
    });
    const legacyPayload = await buildLegacyPayload(sensitiveData);

    const decrypted = await decryptData<typeof sensitiveData>(legacyPayload, passcode);

    expect(decrypted.patientAlias).toBe('P. Amara');
  });
});
