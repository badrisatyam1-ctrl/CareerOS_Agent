import { ProviderCapabilityMatrix } from "./types";

export const PROVIDER_CAPABILITY_MATRICES: ProviderCapabilityMatrix[] = [
  {
    provider: "GITHUB",
    displayName: "GitHub App / Fine-Grained Token",
    authMethod: "FINE_GRAINED_TOKEN",
    capabilities: [
      {
        capabilityId: "gh_list_repos",
        name: "Read Repositories & Topics",
        description: "Discovers owned, forked, and watched repositories.",
        status: "supported",
        requiredScopes: ["repo:status", "read:user"],
        isWriteOperation: false,
      },
      {
        capabilityId: "gh_triage_issues",
        name: "Read & Triage Open Issues",
        description: "Evaluates public repository issues for skill match.",
        status: "supported",
        requiredScopes: ["public_repo"],
        isWriteOperation: false,
      },
      {
        capabilityId: "gh_open_pr",
        name: "Remote Branch Push & Open PR",
        description: "Creates pull request from tested local sandbox branch.",
        status: "requires approval/access",
        requiredScopes: ["repo"],
        isWriteOperation: true,
      },
    ],
  },
  {
    provider: "GMAIL",
    displayName: "Google OAuth (Gmail API)",
    authMethod: "OAUTH2",
    capabilities: [
      {
        capabilityId: "gmail_create_draft",
        name: "Create Email Drafts",
        description: "Prepares personalized 1-to-1 outreach in Drafts folder.",
        status: "supported",
        requiredScopes: ["https://www.googleapis.com/auth/gmail.compose"],
        isWriteOperation: false,
      },
      {
        capabilityId: "gmail_send_email",
        name: "Transmit Approved Email",
        description: "Sends email after explicit user review and content hash lock.",
        status: "requires approval/access",
        requiredScopes: ["https://www.googleapis.com/auth/gmail.send"],
        isWriteOperation: true,
      },
    ],
  },
  {
    provider: "LINKEDIN",
    displayName: "LinkedIn Official API",
    authMethod: "OAUTH2",
    capabilities: [
      {
        capabilityId: "li_create_draft",
        name: "Evidence-Backed Content Drafts",
        description: "Drafts technical reflections citing verified repository facts.",
        status: "supported",
        requiredScopes: [],
        isWriteOperation: false,
      },
      {
        capabilityId: "li_publish_post",
        name: "Official Member Social Publish",
        description: "Publishes approved posts via official Member Share API if permissions are granted; otherwise provides manual one-click copy handoff.",
        status: "manual fallback",
        requiredScopes: ["w_member_social"],
        isWriteOperation: true,
      },
      {
        capabilityId: "li_automated_messaging",
        name: "Automated Invitations / Messaging",
        description: "Browser automation, headless scraping, or DM bots are strictly prohibited. Manual handoff only.",
        status: "manual fallback",
        requiredScopes: [],
        isWriteOperation: false,
      },
    ],
  },
  {
    provider: "JOB_SEARCH",
    displayName: "Public ATS Feeds (Greenhouse, Lever, Ashby)",
    authMethod: "MOCK",
    capabilities: [
      {
        capabilityId: "jobs_search_feed",
        name: "Query Public ATS Boards",
        description: "Reads robots.txt-compliant public company internship openings without scraping.",
        status: "supported",
        requiredScopes: [],
        isWriteOperation: false,
      },
    ],
  },
  {
    provider: "AI_MODEL",
    displayName: "Provider-Neutral AI Model",
    authMethod: "API_KEY",
    capabilities: [
      {
        capabilityId: "ai_structured_generation",
        name: "Bounded Schema Generation",
        description: "Extracts job criteria and formats reviewable drafts within strict token budgets.",
        status: "supported",
        requiredScopes: [],
        isWriteOperation: false,
      },
    ],
  },
];
