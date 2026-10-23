/**
 * CareerOS Single-User Authorization Guard
 * CareerOS is designed specifically for Badri Vishal Pandey.
 * Server actions and private API routes must pass through these guards.
 */

export interface SessionUser {
  id: string;
  email: string;
  role: "OWNER";
  isDemo: boolean;
}

export const DEMO_USER: SessionUser = {
  id: "demo-user-badri",
  email: "badrivishal.pandey@example.com",
  role: "OWNER",
  isDemo: true,
};

export const REAL_DEV_USER: SessionUser = {
  id: "owner-badri-pandey",
  email: "badrivishal.pandey@gmail.com",
  role: "OWNER",
  isDemo: false,
};

/**
 * Asserts the caller is the authenticated owner.
 * If NEXT_PUBLIC_DEMO_MODE="true", returns DEMO_USER.
 * If NEXT_PUBLIC_DEMO_MODE="false" in development, returns REAL_DEV_USER (isDemo: false).
 * In production without DEMO_MODE, requires server session.
 */
export async function requireOwnerSession(): Promise<SessionUser> {
  const isDemoForced = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const isTest = process.env.NODE_ENV === "test";

  // In test environment or when demo mode is explicitly enabled, return DEMO_USER
  if (isDemoForced || isTest) {
    return DEMO_USER;
  }

  // When testing real accounts locally (NODE_ENV=development and DEMO_MODE=false)
  if (process.env.NODE_ENV === "development") {
    return REAL_DEV_USER;
  }

  // In production, verify JWT/Session cookie from Auth.js / NextAuth
  // Throws if unauthorized
  throw new Error("Unauthorized: Owner authentication required");
}

/**
 * Validates that an action-specific approval exists and is valid.
 */
export function validateApproval(
  storedContentHash: string,
  providedContentHash: string,
  expiresAt: Date
): { valid: boolean; reason?: string } {
  if (new Date() > expiresAt) {
    return { valid: false, reason: "Approval request has expired" };
  }

  if (storedContentHash !== providedContentHash) {
    return { valid: false, reason: "Content hash mismatch: content was modified after approval" };
  }

  return { valid: true };
}
