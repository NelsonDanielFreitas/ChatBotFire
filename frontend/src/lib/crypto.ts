const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Must match the backend key
const KEY = "0123456789abcdef0123456789abcdef";

async function getKey(): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "raw",
    encoder.encode(KEY),
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encrypt(plainText: string): Promise<string> {
  const key = await getKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encoder.encode(plainText)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return arrayBufferToBase64(combined.buffer);
}

export async function decrypt(cipherText: string): Promise<string> {
  const key = await getKey();
  const combined = new Uint8Array(base64ToArrayBuffer(cipherText));
  const iv = combined.slice(0, 16);
  const data = combined.slice(16);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}
