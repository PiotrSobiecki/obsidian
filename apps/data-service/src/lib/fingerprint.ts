import { createHash } from "node:crypto";

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeFingerprint(
  title: string,
  venueId: string | null,
  startsAt: Date
): Promise<string> {
  const dateBucket = startsAt.toISOString().slice(0, 16);
  const raw = `${normalizeTitle(title)}|${venueId ?? "unknown"}|${dateBucket}`;
  return sha256Hex(raw);
}

// Sync version for Node.js seed scripts
export function computeFingerprintSync(
  title: string,
  venueId: string | null,
  startsAt: Date
): string {
  const dateBucket = startsAt.toISOString().slice(0, 16);
  const raw = `${normalizeTitle(title)}|${venueId ?? "unknown"}|${dateBucket}`;
  return createHash("sha256").update(raw).digest("hex");
}
