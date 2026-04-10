import bcrypt from 'bcryptjs';

/** bcrypt cost factor; stored hashes look like `$2b$12$...` */
export const FARMER_BCRYPT_COST = 12;

const LEGACY_SHA256_HEX = /^[a-f0-9]{64}$/i;

/** Normalize bcryptjs `$2a$` output to `$2b$` (same crypt format, matches common DB examples). */
function toBcrypt2bPrefix(hash: string): string {
  if (hash.startsWith('$2a$')) return `$2b$${hash.slice(4)}`;
  return hash;
}

/**
 * Hash farmer password for storage (bcrypt, cost 12, `$2b$` prefix).
 */
export function hashFarmerPassword(plain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plain, FARMER_BCRYPT_COST, (err, hash) => {
      if (err) reject(err);
      else resolve(toBcrypt2bPrefix(hash));
    });
  });
}

async function sha256Hex(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify login against stored value: bcrypt (`$2a$` / `$2b$` / `$2y$`), legacy SHA-256 hex, or legacy plaintext.
 */
export async function verifyFarmerPassword(
  plain: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!plain || !stored) return false;
  if (stored.startsWith('$2')) {
    return bcrypt.compareSync(plain, stored);
  }
  if (LEGACY_SHA256_HEX.test(stored)) {
    const hex = await sha256Hex(plain);
    return hex.toLowerCase() === stored.toLowerCase();
  }
  return plain === stored;
}
