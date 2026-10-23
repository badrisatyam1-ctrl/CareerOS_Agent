---
name: linkedin-content
description: Drafts evidence-backed professional LinkedIn posts highlighting verified projects, open-source work, and technical learnings. Prepares content for user review and manual posting or permitted official API publishing.
---

# LinkedIn Content Drafting Skill

## Purpose
Draft high-signal, authentic LinkedIn posts that showcase verified technical achievements, open-source progress, and engineering insights for Badri Vishal Pandey. Every post must link to verifiable evidence in the profile or project repository and maintain a genuine, professional tone.

## Inputs
- `topic`: Primary focus area (e.g., project milestone, open-source PR, technical deep-dive, learning reflection).
- `evidence_refs`: Array of verified source references from the evidence vault (e.g., repository URLs, commit hashes, live project links, documentation sections).
- `target_audience`: Audience type (peers, open-source maintainers, hiring managers, tech community).
- `draft_format`: Format style (standard post, project breakdown, lesson learned, technical mini-essay).

## Operational Rules & Boundaries
1. **Evidence before claims**: Every material claim, metric, or technical accomplishment must cite an evidence vault record or public repository artifact. Never invent benchmark scores, production metrics, or usage stats.
2. **No automated posting without explicit approval**: Default to `DRAFT` status. No content is published automatically.
3. **No platform bypass**: Never scrape LinkedIn, automate user interactions (likes, comments, connections), or use unofficial private APIs.
4. **Authentic voice**: Maintain a humble, technical, and constructive voice. Do not write exaggerated promotional copy, engagement-bait hooks, or artificial AI-evasion phrases.
5. **Manual handoff fallback**: If official member publishing API tokens are unavailable or unapproved, format the post for one-click manual copy-paste into LinkedIn.

## Execution Steps
1. **Evidence Verification**:
   - Inspect the provided `evidence_refs`.
   - Confirm that each referenced project, repository, or achievement exists in the evidence vault.
   - If an unverified claim is detected, prompt the user for evidence or omit the claim.
2. **Draft Generation**:
   - Structure the post:
     - Clear context/problem statement.
     - Specific technical implementation or challenge overcome.
     - Concrete learning or outcome with source link.
     - Discussion prompt or question for engagement.
   - Include relevant hashtags (max 3-5 focused tags).
   - Ensure post length is scannable and accessible.
3. **Provenance Annotation**:
   - Attach a metadata block mapping each statement to its source artifact.
4. **Review & Approval Packaging**:
   - Save the draft to the database/workspace in `DRAFT` state.
   - Present preview and provenance to the user for explicit review.

## Outputs
- `LinkedInDraft`:
  - `id`: Unique identifier.
  - `title`: Internal working title.
  - `content`: Formatted markdown / plaintext for LinkedIn.
  - `evidence_sources`: List of validated source URLs / evidence IDs.
  - `tags`: Selected hashtags.
  - `status`: `DRAFT` | `APPROVED` | `PUBLISHED_MANUAL` | `PUBLISHED_API`.
  - `approval_hash`: SHA-256 hash of content when approved.

## Approval Gates
- **Mandatory Approval**: User must explicitly approve the post content before status changes to `APPROVED`.
- Any subsequent edit to the content invalidates prior approval and resets status to `DRAFT`.
- Publishing via official API requires secondary action-specific confirmation.

## Failure Handling
- **Missing Evidence**: If a requested topic has no supporting evidence in the vault, refuse to draft fabricated claims and request source links or artifacts.
- **API Token Expiration / Revocation**: If official LinkedIn API publish fails, preserve the approved draft and provide a direct link to `https://www.linkedin.com/feed/` with manual copy option.
- **Policy Violation Flag**: If content inadvertently includes sensitive credentials, private repos, or non-public personal information, abort draft generation immediately.
