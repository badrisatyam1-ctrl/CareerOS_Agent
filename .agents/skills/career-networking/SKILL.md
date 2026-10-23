---
name: career-networking
description: Recommends targeted networking contacts and drafts personalized, professional outreach messages for mentors, engineers, and recruiters from verified public sources. Enforces one-to-one outreach and anti-spam limits.
---

# Career Networking Skill

## Purpose
Facilitate high-integrity, personalized professional relationship building for Badri Vishal Pandey. Identifies relevant engineering leaders, open-source maintainers, and university alumni from legitimate public sources, and drafts concise, value-oriented outreach messages.

## Inputs
- `target_domain`: Engineering domain or technology stack (e.g., distributed systems, ML infrastructure, backend systems).
- `target_role`: Role type (e.g., Senior Software Engineer, Engineering Manager, Open Source Maintainer, Technical Recruiter).
- `contact_context`: Contextual hook (e.g., shared repository discussion, recent blog post, company hiring announcement, mutual open-source interest).
- `outreach_channel`: Delivery channel (`EMAIL` via Gmail API draft or `MANUAL_LINKEDIN_MESSAGE`).
- `intent`: Objective (informational interview, contribution feedback, role inquiry).

## Operational Rules & Boundaries
1. **No spam or automated bulk outreach**: Only one-to-one, tailored messages. Maximum 5 outreach drafts prepared per day; weekly outreach ceiling enforced.
2. **No automated messaging via browser scripts**: LinkedIn connection notes or messages must never be automated via browser extensions or bot routines. Manual copy-paste handoff is mandatory.
3. **No email sending without explicit approval**: Email outreach is prepared exclusively as a Gmail draft. No email is transmitted without user inspection and explicit send authorization.
4. **Verified contact info only**: Never guess or synthesize email addresses. Only use publicly published addresses from author profiles, commit metadata, or verified company contact pages.
5. **Honor opt-out & do-not-contact**: Check the exclusion list before drafting. Never reach out to an individual or company flagged as `DO_NOT_CONTACT` or previously unresponsive after follow-up limits.

## Execution Steps
1. **Contact Identification & Verification**:
   - Verify that the contact's public profile matches the user's career interests.
   - Record the exact provenance of the contact info (e.g., public GitHub profile, personal website, verified directory).
   - Check deduplication table to ensure no prior contact within 60 days.
2. **Context & Value Alignment**:
   - Match user's verified projects/skills (from evidence vault) with the recipient's public work or open-source repositories.
   - Establish a specific, non-generic reason for connecting.
3. **Draft Composition**:
   - Write a concise (under 120 words), respectful message.
   - Include:
     - Clear subject line (for email).
     - Genuine connection context.
     - Brief reference to verified user work (with link).
     - Low-friction ask (e.g., 10-minute async question or feedback on an issue).
4. **Draft Registration & Gate**:
   - Store draft as `PENDING_REVIEW` in the database.
   - If channel is Gmail, prepare a draft via Gmail API with `draft_only` mode.
   - If channel is LinkedIn, provide a ready-to-copy text snippet with a direct link to the recipient's public profile.

## Outputs
- `OutreachDraft`:
  - `id`: Unique identifier.
  - `recipient_name`: Full name of contact.
  - `recipient_org`: Company or organization.
  - `channel`: `GMAIL_DRAFT` | `LINKEDIN_MANUAL`.
  - `provenance_url`: Source URL where contact was legitimately identified.
  - `subject`: Email subject line (if applicable).
  - `body`: Tailored message text.
  - `status`: `DRAFT` | `APPROVED` | `SENT` | `MANUAL_COMPLETED`.
  - `dedup_key`: Hash of recipient identifier to prevent duplicates.

## Approval Gates
- **Draft Inspection Gate**: Every message draft must be reviewed by the user.
- **Send Gate**: Sending an email or recording a sent outreach requires an explicit, separate confirmation with a content hash check.
- **Follow-up Gate**: Maximum 1 polite follow-up after at least 7 days; requires independent approval.

## Failure Handling
- **Deduplication Conflict**: If recipient was contacted recently, abort drafting and display existing thread history.
- **Unverified Address**: If an email cannot be verified from public sources, forbid drafting an email and switch to manual LinkedIn connection suggestion.
- **Quota Exceeded**: If daily/weekly outreach limits are reached, queue recommendations for the next cycle without drafting.
