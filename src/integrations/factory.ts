/**
 * CareerOS Adapter Factory
 *
 * Selects the correct adapter (mock or real) based on the integration mode
 * stored for each provider. Never silently switches between demo and real mode.
 */

import { IGitHubAdapter, MockGitHubAdapter } from "./github";
import { RealGitHubAdapter } from "./github/real";
import { IGmailAdapter, MockGmailAdapter } from "./gmail";
import { RealGmailAdapter } from "./gmail/real";
import { ILinkedInAdapter, MockLinkedInAdapter } from "./linkedin";
import { getIntegrationMode, isRealMode, type ProviderName, type IntegrationMode } from "./mode";
import { getDecryptedAccessToken } from "@/lib/oauth";
import { logger } from "@/lib/logger";

export interface AdapterBundle {
  github: IGitHubAdapter;
  gmail: IGmailAdapter;
  linkedin: ILinkedInAdapter;
  modes: Record<ProviderName, IntegrationMode>;
}

/**
 * Creates the appropriate GitHub adapter based on the current integration mode.
 */
export async function createGitHubAdapter(): Promise<{ adapter: IGitHubAdapter; mode: IntegrationMode }> {
  const state = await getIntegrationMode("GITHUB");

  if (isRealMode(state.mode) && state.externalAccountId) {
    try {
      const token = await getDecryptedAccessToken("GITHUB", state.externalAccountId);
      if (token) {
        logger.info("ADAPTER_FACTORY", "Creating RealGitHubAdapter", {
          mode: state.mode,
          account: state.externalAccountId,
        });
        return { adapter: new RealGitHubAdapter(token, state.mode), mode: state.mode };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("ADAPTER_FACTORY", `Failed to create real GitHub adapter, falling back to mock: ${message}`);
    }
  }

  return { adapter: new MockGitHubAdapter(), mode: "DEMO" };
}

/**
 * Creates the appropriate Gmail adapter based on the current integration mode.
 */
export async function createGmailAdapter(): Promise<{ adapter: IGmailAdapter; mode: IntegrationMode }> {
  const state = await getIntegrationMode("GMAIL");

  if (isRealMode(state.mode) && state.externalAccountId) {
    try {
      const token = await getDecryptedAccessToken("GMAIL", state.externalAccountId);
      if (token) {
        logger.info("ADAPTER_FACTORY", "Creating RealGmailAdapter", {
          mode: state.mode,
          account: state.externalAccountId,
        });
        return { adapter: new RealGmailAdapter(token, state.mode), mode: state.mode };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("ADAPTER_FACTORY", `Failed to create real Gmail adapter, falling back to mock: ${message}`);
    }
  }

  return { adapter: new MockGmailAdapter(), mode: "DEMO" };
}

/**
 * Creates the LinkedIn adapter. Always returns mock since LinkedIn uses manual handoff.
 */
export async function createLinkedInAdapter(): Promise<{ adapter: ILinkedInAdapter; mode: IntegrationMode }> {
  const state = await getIntegrationMode("LINKEDIN");
  // LinkedIn is always manual handoff per policy — no real adapter
  return { adapter: new MockLinkedInAdapter(), mode: state.mode };
}

/**
 * Creates all adapters at once with their current modes.
 */
export async function createAllAdapters(): Promise<AdapterBundle> {
  const [gh, gm, li] = await Promise.all([
    createGitHubAdapter(),
    createGmailAdapter(),
    createLinkedInAdapter(),
  ]);

  return {
    github: gh.adapter,
    gmail: gm.adapter,
    linkedin: li.adapter,
    modes: {
      GITHUB: gh.mode,
      GMAIL: gm.mode,
      LINKEDIN: li.mode,
    },
  };
}
