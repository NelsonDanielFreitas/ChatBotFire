import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// In production, this should be in environment variables
const ENCRYPTION_KEY =
  process.env.CHAT_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // 32 chars

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Combine IV and encrypted data
  const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);
  return combined.toString("base64");
}

export function decrypt(data) {
  try {
    const combined = Buffer.from(data, "base64");
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "utf8"),
      iv
    );
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt message");
  }
}
