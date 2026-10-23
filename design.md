# CareerOS — Product and UI Design Specification

## 1. Design intent

Build a calm, professional operations workspace that makes the next useful action obvious. The interface should feel like a trustworthy personal workbench—not a chat window with a large number of untraceable AI-generated buttons. Prefer clarity, source provenance, compact evidence, and explicit action states over decorative dashboards.

## 2. Visual system

Use a light-first, responsive design with a restrained technical look.

### Color tokens

- Page background: `#F7F8FA`
- Card/surface: `#FFFFFF`
- Primary text: `#111827`
- Secondary text: `#6B7280`
- Border: `#E5E7EB`
- Primary action: `#2563EB`
- Primary hover: `#1D4ED8`
- Success: `#15803D`
- Warning: `#B45309`
- Danger: `#B91C1C`
- Informational accent: `#6D28D9`
- Muted surface: `#F3F4F6`

Color must not be the only means of conveying state. Add labels and icons where appropriate. Verify contrast against WCAG AA for normal text and interactive states.

### Typography and spacing

- Use a modern, highly legible sans-serif available through the chosen framework (for example, Geist or a system sans stack).
- Page title: 24–30 px desktop, scaled down responsively; section title: 16–20 px; body: 14–16 px; dense table metadata: never below 12–13 px unless unavoidable.
- Use a consistent 4/8 px spacing rhythm, 12–16 px card padding, and consistent corner radii (10–14 px).
- Use subtle borders and restrained shadows; avoid excessive gradients, glassmorphism, oversized hero artwork, and animated effects that compete with information.

## 3. Application shell and navigation

### Desktop

- Left sidebar with CareerOS wordmark and: Overview, LinkedIn Studio, Network, Jobs, Email Outreach, GitHub Lab, Contributions/PRs, Interview Prep, Activity Log, Settings.
- Main header with current page title, global search/command access where implemented, integration-health indicator, notifications, and profile menu.
- A persistent, clearly visible environment banner for Demo, Staging, or Live.
- Show a pause-all status control in the operational header/settings. Enabling it requires confirmation and immediately blocks protected external actions.

### Mobile/tablet

- Collapse sidebar into an accessible drawer/bottom navigation appropriate to viewport.
- Tables should degrade to cards or allow horizontal scrolling with visible column priority; forms should be single-column.
- Keep primary approval and pause controls accessible without relying on hover.

## 4. Overview dashboard

Use a short greeting and date-aware summary, followed by a concise next-action panel. Avoid unsupported “productivity scores.”

Suggested sections:

1. **Needs your review:** queued email drafts, LinkedIn post drafts, contribution diffs, unresolved profile conflicts, and approval requests.
2. **Opportunity snapshot:** qualified new jobs, high-fit issues, and pending application stages; every metric links to the underlying records.
3. **Pipeline:** job application stage counts with last-update timestamps.
4. **GitHub contribution pipeline:** candidate → investigating → patch ready → tests run → approval needed → PR opened → merged/closed, with accurate status.
5. **Recent activity:** time-ordered actions with source and actor (user/agent/system), result, and retry or inspect link.
6. **Weekly review:** wins, blocked work, upcoming tasks, quality signals, and suggested priorities.

Use zero-state guidance when no accounts/data exist. Seed content must be marked `DEMO` and never mixed invisibly with live records.

## 5. Page specifications

### LinkedIn Studio

- Draft list with topic, target audience, evidence chips, draft status, created date, and duplicate-theme warning.
- Editor pane with post text, character count where relevant, source evidence, tone choice, CTA, and preview.
- Actions: Save draft, Regenerate selected section, Compare versions, Approve for manual handoff, or Publish via an authorized adapter when available.
- Show a clear message when permitted LinkedIn API publishing is unavailable; never simulate a successful publish.

### Network

- Recommendation cards/rows with name, public role/company, source link, relevance rationale, field alignment, and suggested next action.
- Expose source date and uncertainty. Do not infer private facts.
- Connection note/message appears in an editable draft panel. The action is manual handoff unless permitted API access supports the exact operation.

### Jobs

- Filters for role family, location/work mode, recency, minimum fit, eligibility, company, and stage.
- Listing detail should show source URL, found/last-checked dates, role summary, match score components, hard blockers, skill gaps, and next action.
- Distinct actions: Save, Dismiss, Tailor resume, Prepare application, Prepare outreach draft, Mark applied. Do not imply that “Prepare” submits an application.
- Use stale/expired/suspicious badges and avoid presenting unsupported facts as definitive.

### Email Outreach

- Pipeline: Research → Draft → Review → Approved → Sent → Reply/Follow-up/Closed.
- Preview includes recipient and provenance, job link, subject, body, selected resume filename, deduplication result, and planned follow-up rule.
- Send button is disabled until all checks pass and a user completes an action-specific confirmation. The confirmation dialog should summarize the exact recipient, attachment, and content hash/version.
- Show provider result and message ID only after a confirmed response; show retry-safe error states otherwise.

### GitHub Lab

- Repository list with owner/name, language, stars/forks when available, source, last update, and whether owned/forked/watched.
- Issue explorer with labels, open/closed state, recent activity, contribution guide, fit rationale, potential blockers, and canonical link.
- Explain any “trending” ranking using visible criteria and time window.
- Never execute repository code from the browsing UI. Selecting an issue starts a separate contribution workbench.

### Contributions / PRs

- Stepper: Inspect → Plan → Patch → Test → Review diff → Approve → Push/Open PR → Track.
- Display repository, issue, base/head branch, changed-file list, diff, exact test commands/results, warnings, and expected behavior.
- Approval invalidates if the diff, target repo, branch, PR title, or PR body changes materially.
- No merge button in the autonomous workflow.

### Interview Prep

- Job-linked skill matrix: Required, Preferred, Demonstrated, Partially demonstrated, Missing/unknown.
- Practice sessions with question, answer notes, self-rating, evidence/story source, and next practice suggestion.
- Track completed learning, not a fabricated proficiency percentage.

### Activity Log

- Filter by module, action type, status, time range, source, and user/agent/system actor.
- Show a redacted event summary, target, timestamps, and request/run ID.
- Never show secrets, full resume text, OAuth tokens, or unnecessary email body content.

### Settings

- Career preferences and role priorities.
- Verified profile facts and unresolved conflicts.
- Integration connection state and scopes/capabilities.
- Email limits, follow-up policy, and do-not-contact list.
- Scheduling/time zone, notifications, retention, export/deletion, and pause-all.
- Resume manager with private storage notice and base/version separation.

## 6. Shared component requirements

- `StatusBadge`: clear text plus semantic color; statuses include Demo, Draft, Needs review, Approved, Sent, Published, PR opened, Merged, Failed, Blocked, Stale.
- `SourceEvidence`: source name/link, observation timestamp, verification state, and expandable evidence.
- `MatchBreakdown`: transparent scoring factors and hard blockers; do not display score as certainty.
- `ApprovalDialog`: exact target/content summary, change hash/version, consequence, and explicit confirm/cancel.
- `PauseAllControl`: always reports current state and its effect on scheduled/manual protected actions.
- `EmptyState`, `LoadingState`, `ErrorState`: include helpful retry/setup next steps; do not silently hide provider errors.
- `IntegrationCard`: provider, connected/disconnected/error state, authorized capabilities, last successful sync, and disconnect/reconnect controls.

## 7. Interaction rules

- Destructive or externally visible actions are never the primary default when drafting is possible.
- Disable controls with a clear reason and a link to resolve the blocker.
- Preserve user edits when regeneration occurs; provide compare/revert rather than overwrite silently.
- Use optimistic UI only for reversible local drafts. Remote actions need a confirmed provider result.
- No toast alone for durable actions; update the record status and activity log.
- Avoid auto-opening or submitting third-party forms. Manual handoff should open the relevant official page without attempting to act as the user.

## 8. Accessibility and responsive behavior

- Semantic headings and landmarks, keyboard navigation, visible focus indicators, descriptive labels, screen-reader announcements for state changes, accessible dialog focus management, and reduced-motion support.
- Maintain readable contrast, do not use color alone, and ensure tables/forms work at narrow widths.
- Avoid time-limited approval dialogs and prevent accidental double submissions.

## 9. Content tone

Professional, specific, concise, and evidence-backed. LinkedIn drafts should show learning, engineering decisions, measured results, trade-offs, and next steps. Avoid generic “hustle” language, exaggerated claims, fake personal anecdotes, fabricated engagement, and repeated templates. The UI must distinguish AI-generated suggestions from user-confirmed text.
