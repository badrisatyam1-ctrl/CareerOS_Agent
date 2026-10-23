---
name: job-discovery
description: Discovers, scores, and tracks relevant job and internship listings from legitimate public sources, evaluating qualification alignment, requirements, and deadlines without automated scraping.
---

# Job Discovery Skill

## Purpose
Search, filter, and score software engineering internships and junior developer opportunities for Badri Vishal Pandey from legitimate career portals and job boards (e.g., official ATS boards like Greenhouse, Lever, Ashby, and company career pages). Ranks listings based on verified skill alignment, graduation criteria, and work authorization.

## Inputs
- `target_roles`: Array of role titles (e.g., Software Engineer Intern, Backend Engineer, Junior Systems Engineer).
- `locations`: Preferred locations or remote preferences (e.g., Remote, Bengaluru, India).
- `sources`: Array of approved discovery endpoints (e.g., public ATS feeds, official company job boards, public GitHub job repositories).
- `confirmed_graduation_year`: Verified graduation year from User Profile (2027 or confirmed update).
- `skills_filter`: Set of confirmed skills from the evidence vault.

## Operational Rules & Boundaries
1. **No unauthorized scraping**: Use public APIs, RSS feeds, or robots.txt-compliant public job feeds only. Never bypass CAPTCHAs, use headless browser hacks, or scrape authenticated job portals.
2. **Strict eligibility check**: Enforce graduation date and eligibility filters before recommending an internship or new-grad listing. Listings requiring graduation earlier than the user's verified date must be tagged as ineligible.
3. **No fabricated details**: Do not invent job requirements, application deadlines, compensation ranges, or contact emails.
4. **Transparent scoring**: Every recommendation must provide an explainable score breakdown with source URL and timestamp.
5. **No auto-applying**: CareerOS never submits job applications automatically. Applications require manual review and submission by the user.

## Execution Steps
1. **Query & Ingest**:
   - Query approved public job feeds and ATS endpoints for relevant keywords.
   - Extract structured metadata: company, title, location, employment type, source URL, description, posting date.
2. **Eligibility & Deduplication**:
   - Check posting against existing tracked jobs using URL canonicalization and (company + title) deduplication.
   - Filter out expired postings or those past application deadlines.
   - Verify minimum qualifications against user's confirmed profile (e.g., graduation year criteria).
3. **Rubric-Based Scoring**:
   - Compute fit score (0-100) based on:
     - Core language / tech stack overlap (e.g., TypeScript, Python, Go, C++, PostgreSQL).
     - Domain alignment (backend, distributed systems, developer tools).
     - Health / credibility of source listing.
     - Freshness (penalty for postings > 30 days old).
4. **Recommendation Packaging**:
   - Format listing with summary of key requirements, matched skills, missing skills (skill gap), and direct application URL.
   - Record candidate in database with status `DISCOVERED`.

## Outputs
- `JobRecommendation`:
  - `id`: Unique identifier.
  - `company_name`: Company offering the role.
  - `role_title`: Job/internship title.
  - `location`: Location / remote status.
  - `source_url`: Canonical URL to official job posting.
  - `posted_date`: Posting timestamp.
  - `fit_score`: Numeric score (0–100).
  - `matched_skills`: Skills matched with user vault.
  - `missing_skills`: Detected gaps or unfamiliar requirements.
  - `eligibility_status`: `ELIGIBLE` | `UNVERIFIED_REQUIREMENTS` | `INELIGIBLE`.
  - `status`: `DISCOVERED` | `SHORTLISTED` | `APPLIED` | `ARCHIVED`.

## Approval Gates
- **User Shortlisting**: User marks discovered jobs as `SHORTLISTED` to trigger resume tailoring and application tracking.
- **Application Status Logging**: Status updates (e.g., moving to `APPLIED` or `INTERVIEWING`) are recorded only upon explicit user confirmation.

## Failure Handling
- **Dead Link / 404**: Mark posting as `EXPIRED` immediately and remove from active recommendations.
- **Ambiguous Eligibility**: If graduation year requirement is not explicitly stated in the job text, set `eligibility_status` to `UNVERIFIED_REQUIREMENTS` and flag for user review.
- **Rate Limiting**: Back off exponentially if an ATS feed or API responds with HTTP 429 or transient 5xx errors.
