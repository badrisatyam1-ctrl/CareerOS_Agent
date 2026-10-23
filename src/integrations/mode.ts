/**
 * CareerOS Integration Mode State Machine
 *
 * Defines a strict 5-level progression for each provider:
 *   DEMO → REAL_CONNECTED_READ_ONLY → REAL_DRAFT_ONLY → REAL_APPROVAL_REQUIRED → REAL_WRITE_ENABLED
 *
 * Mode is persisted per-provider in the ConnectedAccount table.
 * The UI prominently displays the active mode.
 * Transitions are explicit and logged.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type IntegrationMode =
  | "DEMO"
  | "REAL_CONNECTED_READ_ONLY"
  | "REAL_DRAFT_ONLY"
  | "REAL_APPROVAL_REQUIRED"
  | "REAL_WRITE_ENABLED";

export type ProviderName = "GITHUB" | "GMAIL" | "LINKEDIN";

export interface IntegrationState {
  provider: ProviderName;
  mode: IntegrationMode;
  connectionState: string;
  externalAccountId: string | null;
  grantedScopes: string[];
  lastSyncAt: string | null;
  lastErrorCategory: string | null;
}

/** Allowed transitions: each mode maps to the set of modes it can transition to */
const ALLOWED_TRANSITIONS: Record<IntegrationMode, IntegrationMode[]> = {
  DEMO: ["REAL_CONNECTED_READ_ONLY"],
  REAL_CONNECTED_READ_ONLY: ["REAL_DRAFT_ONLY", "DEMO"],
  REAL_DRAFT_ONLY: ["REAL_APPROVAL_REQUIRED", "REAL_CONNECTED_READ_ONLY", "DEMO"],
  REAL_APPROVAL_REQUIRED: ["REAL_WRITE_ENABLED", "REAL_DRAFT_ONLY", "DEMO"],
  REAL_WRITE_ENABLED: ["REAL_APPROVAL_REQUIRED", "DEMO"],
};

/**
 * Determine the effective integration mode for a provider.
 *
 * Priority:
 * 1. If `NEXT_PUBLIC_DEMO_MODE=true` AND no real account connected → DEMO
 * 2. If a ConnectedAccount exists with a valid connectionState → use its integrationMode field
 * 3. Fallback → DEMO
 */
export async function getIntegrationMode(provider: ProviderName): Promise<IntegrationState> {
  const isDemoForced = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  try {
    const account = await prisma.connectedAccount.findFirst({
      where: {
        provider,
        connectionState: { in: ["CONNECTED", "EXPIRED"] },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (account && account.connectionState === "CONNECTED") {
      // Real account is connected — derive mode from the integrationMode column
      const mode = (account.integrationMode as IntegrationMode) || "REAL_CONNECTED_READ_ONLY";

      return {
        provider,
        mode,
        connectionState: account.connectionState,
        externalAccountId: account.externalAccountId,
        grantedScopes: account.grantedScopes,
        lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
        lastErrorCategory: account.lastErrorCategory,
      };
    }
  } catch {
    // Prisma not available (e.g., during build) — fall through to DEMO
  }

  // No real account or forced demo
  return {
    provider,
    mode: "DEMO",
    connectionState: isDemoForced ? "DEMO_MOCK" : "NOT_CONNECTED",
    externalAccountId: null,
    grantedScopes: [],
    lastSyncAt: null,
    lastErrorCategory: null,
  };
}

/**
 * Retrieve integration states for all providers at once.
 */
export async function getAllIntegrationModes(): Promise<IntegrationState[]> {
  const providers: ProviderName[] = ["GITHUB", "GMAIL", "LINKEDIN"];
  return Promise.all(providers.map(getIntegrationMode));
}

/**
 * Transition a provider to a new integration mode.
 * Validates the transition is allowed and logs an audit event.
 */
export async function transitionIntegrationMode(
  userId: string,
  provider: ProviderName,
  targetMode: IntegrationMode
): Promise<IntegrationState> {
  const current = await getIntegrationMode(provider);

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[current.mode];
  if (!allowed.includes(targetMode)) {
    throw new Error(
      `Invalid transition: ${provider} cannot go from ${current.mode} to ${targetMode}. ` +
      `Allowed: [${allowed.join(", ")}]`
    );
  }

  // If transitioning to DEMO, we don't update the account — just return demo state
  if (targetMode === "DEMO") {
    logger.info("INTEGRATION_MODE", `${provider} transitioned to DEMO mode`, { provider, from: current.mode, to: targetMode });

    return {
      provider,
      mode: "DEMO",
      connectionState: "DEMO_MOCK",
      externalAccountId: current.externalAccountId,
      grantedScopes: [],
      lastSyncAt: null,
      lastErrorCategory: null,
    };
  }

  // Update the account's integrationMode in DB
  if (!current.externalAccountId) {
    throw new Error(`Cannot transition ${provider} to ${targetMode}: no connected account found.`);
  }

  await prisma.connectedAccount.updateMany({
    where: {
      provider,
      externalAccountId: current.externalAccountId,
    },
    data: {
      integrationMode: targetMode,
    },
  });

  // Audit log
  try {
    await prisma.auditEvent.create({
      data: {
        userId,
        actorType: "USER",
        moduleName: "INTEGRATION_MODE",
        actionName: "MODE_TRANSITION",
        targetResource: provider,
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({ from: current.mode, to: targetMode }),
      },
    });
  } catch {
    // Prisma audit fallback
  }

  logger.info("INTEGRATION_MODE", `${provider} transitioned: ${current.mode} → ${targetMode}`, {
    provider,
    from: current.mode,
    to: targetMode,
  });

  return {
    ...current,
    mode: targetMode,
  };
}

/**
 * Check if a write operation is allowed for the given provider.
 */
export function isWriteAllowed(mode: IntegrationMode): boolean {
  return mode === "REAL_APPROVAL_REQUIRED" || mode === "REAL_WRITE_ENABLED";
}

/**
 * Check if the provider should use the real adapter (any REAL_ mode).
 */
export function isRealMode(mode: IntegrationMode): boolean {
  return mode !== "DEMO";
}

/**
 * Human-readable label for UI display.
 */
export function getModeLabel(mode: IntegrationMode): string {
  const labels: Record<IntegrationMode, string> = {
    DEMO: "🧪 Demo Mode",
    REAL_CONNECTED_READ_ONLY: "👁 Read-Only (Real)",
    REAL_DRAFT_ONLY: "📝 Draft-Only (Real)",
    REAL_APPROVAL_REQUIRED: "🔐 Approval Required (Real)",
    REAL_WRITE_ENABLED: "✅ Write Enabled (Real)",
  };
  return labels[mode];
}

/**
 * CSS-friendly color class for UI badges.
 */
export function getModeColor(mode: IntegrationMode): string {
  const colors: Record<IntegrationMode, string> = {
    DEMO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    REAL_CONNECTED_READ_ONLY: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    REAL_DRAFT_ONLY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    REAL_APPROVAL_REQUIRED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    REAL_WRITE_ENABLED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return colors[mode];
}
