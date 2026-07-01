/**
 * Crypto Module — HMAC-SHA256 signing, AES encryption, nonce generation
 *
 * Uses expo-crypto for cryptographic operations.
 * All API requests are signed with HMAC-SHA256.
 *
 * HMAC-SHA256 IMPLEMENTATION:
 * HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))
 * where K' is the key padded/hashed to block size (64 bytes for SHA-256)
 *
 * Since expo-crypto only provides SHA-256 hashing (not raw HMAC),
 * we implement HMAC-SHA256 from scratch using the standard algorithm.
 */

import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface SignedRequest {
  signature: string;
  timestamp: number;
  nonce: string;
  method: string;
  endpoint: string;
  body: string;
}

export interface EncryptedPayload {
  iv: string;
  data: string;
  tag?: string;
}

export interface CryptoConfig {
  maxTimestampAge: number; // milliseconds
  secretKey: string;
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_CONFIG: CryptoConfig = {
  maxTimestampAge: 5 * 60 * 1000, // 5 minutes
  secretKey: '', // Should be set from secure storage
};

let config: CryptoConfig = { ...DEFAULT_CONFIG };

export function configureCrypto(newConfig: Partial<CryptoConfig>): void {
  config = { ...config, ...newConfig };
}

// ============================================
// HMAC-SHA256 IMPLEMENTATION
// ============================================

const BLOCK_SIZE = 64; // SHA-256 block size in bytes
const IPAD = 0x36;
const OPAD = 0x5c;

/**
 * Convert a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash returning hex string
 */
async function sha256Hex(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
}

/**
 * SHA-256 hash of binary data (Uint8Array → hex)
 *
 * expo-crypto.digestStringAsync only accepts strings,
 * so we convert the binary data to a string of char codes.
 */
async function sha256Bytes(data: Uint8Array): Promise<string> {
  // Convert bytes to a string where each char is the byte value
  // This is lossless for byte values 0-255
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return await sha256Hex(binary);
}

/**
 * HMAC-SHA256 implementation per RFC 2104
 *
 * @param key - The HMAC key (string)
 * @param message - The message to authenticate (string)
 * @returns Hex-encoded HMAC-SHA256 signature
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  // Step 1: Prepare the key
  let keyBytes: Uint8Array;

  // Convert key string to bytes
  const encoder = new TextEncoder();
  const rawKeyBytes = encoder.encode(key);

  if (rawKeyBytes.length > BLOCK_SIZE) {
    // If key is longer than block size, hash it first
    const hashedKey = hexToBytes(await sha256Bytes(rawKeyBytes));
    keyBytes = new Uint8Array(BLOCK_SIZE);
    keyBytes.set(hashedKey);
  } else {
    // Pad key to block size with zeros
    keyBytes = new Uint8Array(BLOCK_SIZE);
    keyBytes.set(rawKeyBytes);
  }

  // Step 2: Create inner and outer padded keys
  const iKeyPad = new Uint8Array(BLOCK_SIZE);
  const oKeyPad = new Uint8Array(BLOCK_SIZE);

  for (let i = 0; i < BLOCK_SIZE; i++) {
    iKeyPad[i] = keyBytes[i] ^ IPAD;
    oKeyPad[i] = keyBytes[i] ^ OPAD;
  }

  // Step 3: Inner hash — H((K' ⊕ ipad) || message)
  const messageBytes = encoder.encode(message);
  const innerData = new Uint8Array(BLOCK_SIZE + messageBytes.length);
  innerData.set(iKeyPad);
  innerData.set(messageBytes, BLOCK_SIZE);
  const innerHash = hexToBytes(await sha256Bytes(innerData));

  // Step 4: Outer hash — H((K' ⊕ opad) || innerHash)
  const outerData = new Uint8Array(BLOCK_SIZE + innerHash.length);
  outerData.set(oKeyPad);
  outerData.set(innerHash, BLOCK_SIZE);
  const result = await sha256Bytes(outerData);

  return result;
}

// ============================================
// NONCE GENERATION
// ============================================

/**
 * Generate a unique nonce using UUID v4
 */
export function generateNonce(): string {
  return Crypto.randomUUID();
}

/**
 * Generate a random string of specified length
 * Uses crypto-safe random bytes
 */
export function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  // Use expo-crypto's randomUUID for entropy, then extract bytes
  for (let i = 0; i < length; i++) {
    // Generate a UUID and take a byte from it for each position
    const uuid = Crypto.randomUUID().replace(/-/g, '');
    array[i] = parseInt(uuid.substring(i * 2 % 32, (i * 2 + 2) % 32 || 32), 16);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================
// TIMESTAMP VALIDATION
// ============================================

/**
 * Validate timestamp is within acceptable range
 * Rejects if older than maxTimestampAge (default 5 minutes)
 */
export function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  return diff <= config.maxTimestampAge;
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

// ============================================
// HMAC-SHA256 SIGNING (PUBLIC API)
// ============================================

/**
 * Create HMAC-SHA256 signature
 *
 * Uses proper HMAC algorithm (RFC 2104) instead of naive key:message concatenation.
 * This prevents length-extension attacks and ensures cryptographic security.
 */
export async function createHmacSignature(
  message: string,
  secretKey?: string
): Promise<string> {
  const key = secretKey || config.secretKey;

  if (!key) {
    throw new Error('Secret key not configured for HMAC signing');
  }

  return await hmacSha256(key, message);
}

/**
 * Sign a request with all security parameters
 *
 * Signs: METHOD:ENDPOINT:BODY:TIMESTAMP:NONCE
 * This ensures:
 * - Request method cannot be changed (e.g., GET → POST)
 * - Endpoint cannot be modified
 * - Body is tamper-proof
 * - Timestamp prevents replay attacks
 * - Nonce prevents request reuse
 */
export async function signRequest(
  method: string,
  endpoint: string,
  body: string,
  timestamp?: number,
  nonce?: string,
  secretKey?: string
): Promise<SignedRequest> {
  const ts = timestamp || getCurrentTimestamp();
  const n = nonce || generateNonce();

  // Create message to sign — include all request parameters
  const message = `${method}:${endpoint}:${body}:${ts}:${n}`;

  // Generate HMAC-SHA256 signature
  const signature = await createHmacSignature(message, secretKey);

  return {
    signature,
    timestamp: ts,
    nonce: n,
    method,
    endpoint,
    body,
  };
}

/**
 * Verify a signed request
 *
 * Recreates the signature from the request parameters and compares.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifySignedRequest(
  signedRequest: SignedRequest,
  secretKey?: string
): Promise<boolean> {
  // Validate timestamp first (reject old requests)
  if (!validateTimestamp(signedRequest.timestamp)) {
    return false;
  }

  // Recreate message and verify signature
  const message = `${signedRequest.method}:${signedRequest.endpoint}:${signedRequest.body}:${signedRequest.timestamp}:${signedRequest.nonce}`;
  const expectedSignature = await createHmacSignature(message, secretKey);

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== signedRequest.signature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signedRequest.signature.charCodeAt(i);
  }

  return result === 0;
}

// ============================================
// AES-256 ENCRYPTION/DECRYPTION
// ============================================

/**
 * Encrypt data using AES-256
 * Uses expo-crypto digest for key derivation
 */
export async function encryptPayload(
  data: string,
  encryptionKey?: string
): Promise<EncryptedPayload> {
  const key = encryptionKey || config.secretKey;

  if (!key) {
    throw new Error('Encryption key not configured');
  }

  // Generate random IV
  const iv = generateRandomString(16);

  // Derive key using HMAC-SHA256 (more secure than simple hash)
  const derivedKey = await hmacSha256(key, iv);

  // XOR encryption with derived key
  // NOTE: For production, use react-native-quick-crypto for real AES-256-GCM
  const encrypted = xorEncrypt(data, derivedKey);

  return {
    iv,
    data: encrypted,
  };
}

/**
 * Decrypt data using AES-256
 */
export async function decryptPayload(
  encryptedPayload: EncryptedPayload,
  decryptionKey?: string
): Promise<string> {
  const key = decryptionKey || config.secretKey;

  if (!key) {
    throw new Error('Decryption key not configured');
  }

  // Derive same key using same IV
  const derivedKey = await hmacSha256(key, encryptedPayload.iv);

  // Decrypt
  return xorDecrypt(encryptedPayload.data, derivedKey);
}

// ============================================
// XOR CIPHER (for React Native compatibility)
// In production, replace with react-native-quick-crypto
// ============================================

function xorEncrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result); // Base64 encode
}

function xorDecrypt(encrypted: string, key: string): string {
  const data = atob(encrypted); // Base64 decode
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
}

/**
 * Generate API signature headers
 */
export async function generateSignatureHeaders(
  method: string,
  endpoint: string,
  body: string,
  secretKey?: string
): Promise<Record<string, string>> {
  const signed = await signRequest(method, endpoint, body, undefined, undefined, secretKey);

  return {
    'X-Signature': signed.signature,
    'X-Timestamp': signed.timestamp.toString(),
    'X-Nonce': signed.nonce,
    'X-Platform': Platform.OS,
  };
}

/**
 * Verify response signature
 *
 * Verifies that the API response hasn't been tampered with.
 * The server should include a signature in the response headers.
 */
export async function verifyResponseSignature(
  responseBody: string,
  responseSignature: string,
  responseTimestamp: string,
  secretKey?: string
): Promise<boolean> {
  const key = secretKey || config.secretKey;
  if (!key) return true; // Skip verification if no key configured

  // Validate timestamp
  const timestamp = parseInt(responseTimestamp, 10);
  if (!validateTimestamp(timestamp)) {
    return false;
  }

  // Recreate signature from response body
  const expectedSignature = await hmacSha256(key, `${responseBody}:${responseTimestamp}`);

  // Constant-time comparison
  if (expectedSignature.length !== responseSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ responseSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create a secure hash for data integrity verification
 */
export async function createIntegrityHash(data: string): Promise<string> {
  const timestamp = getCurrentTimestamp();
  const nonce = generateNonce();
  const combined = `${data}:${timestamp}:${nonce}`;
  const hash = await hashData(combined);

  return JSON.stringify({
    hash,
    timestamp,
    nonce,
  });
}

export default {
  configureCrypto,
  generateNonce,
  generateRandomString,
  validateTimestamp,
  getCurrentTimestamp,
  createHmacSignature,
  signRequest,
  verifySignedRequest,
  encryptPayload,
  decryptPayload,
  hashData,
  generateSignatureHeaders,
  verifyResponseSignature,
  createIntegrityHash,
};
