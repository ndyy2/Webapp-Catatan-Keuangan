import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Enkripsi AES-256-GCM untuk rahasia user (kunci Groq). Master key dari
// BETTER_AUTH_SECRET (di-hash SHA-256 jadi 32 byte). Format: iv:authTag:ct (hex).
function kunciMaster(): Buffer {
  const s = process.env.BETTER_AUTH_SECRET ?? "";
  if (!s) throw new Error("BETTER_AUTH_SECRET kosong");
  return createHash("sha256").update(s).digest();
}

export function enkripsi(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kunciMaster(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${ct.toString("hex")}`;
}

export function dekripsi(paket: string): string {
  const [ivHex, tagHex, ctHex] = paket.split(":");
  if (!ivHex || !tagHex || !ctHex) throw new Error("Format rahasia rusak");
  const decipher = createDecipheriv("aes-256-gcm", kunciMaster(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ctHex, "hex")), decipher.final()]).toString("utf8");
}

// Tampilan mask untuk UI (tak pernah kirim kunci asli ke client).
export function maskKunci(plain: string): string {
  if (plain.length <= 8) return "••••••••";
  return `${plain.slice(0, 4)}••••••••${plain.slice(-4)}`;
}
