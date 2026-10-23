/**
 * CareerOS Provider Adapter Framework Types
 */

export type CapabilityStatus = "supported" | "requires approval/access" | "manual fallback";

export type ProviderErrorCode =
  | "EXPIRED_CREDENTIALS"
  | "REVOKED_ACCESS"
  | "INSUFFICIENT_PERMISSIONS"
  | "INVALID_CALLBACK_STATE"
  | "PROVIDER_OUTAGE"
  | "RATE_LIMITED"
  | "APPROVAL_MISMATCH"
  | "UNKNOWN_ERROR";

export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  provider: string;
  retryable: boolean;
  statusCode?: number;
}

export interface ProviderMeta {
  provider: string;
  requestId?: string;
  timestamp: string;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
  sourceUrl?: string;
}

export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: ProviderError;
  meta: ProviderMeta;
}

export interface ProviderCapability {
  capabilityId: string;
  name: string;
  description: string;
  status: CapabilityStatus;
  requiredScopes: string[];
  isWriteOperation: boolean;
}

export interface ProviderCapabilityMatrix {
  provider: "GITHUB" | "GMAIL" | "LINKEDIN" | "JOB_SEARCH" | "AI_MODEL";
  displayName: string;
  authMethod: "OAUTH2" | "API_KEY" | "FINE_GRAINED_TOKEN" | "MOCK";
  capabilities: ProviderCapability[];
}
