# CareerOS — Network Page Comprehensive Audit & Real Data Migration Plan

**Date:** 2026-10-22  
**Target Route:** [`/network`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/app/network/page.tsx)  
**Status:** Audit Complete — Ready for Migration

---

## 1. Executive Summary

CareerOS is built to manage Badri Vishal Pandey's career operations with verifiable evidence and strict adherence to platform policies. However, the current `/network` page is populated entirely with **in-memory demo records using fabricated profile URLs (`demo-*`)**, lacks database persistence, lacks real search/filtering, and provides no interface for Badri to add, manage, and track real professional contacts.

This audit provides observed defects, root-cause analyses, security/compliance classifications, and a step-by-step migration plan to transform `/network` into a production-grade relationship manager.

---

## 2. Confirmed Defects & Observed Issues

### Defect 1: Hardcoded Demo/Fake People with Mock URLs
- **Severity:** 🔴 **CRITICAL**
- **Observed Behavior:** The page displays 4 hardcoded individuals:
  1. Rohit Kumar (Staff Systems Engineer @ Cloudflare, `https://www.linkedin.com/in/demo-rohit-kumar`)
  2. Priya Sengupta (Senior ML Systems Engineer @ Qualcomm AI Research, `https://www.linkedin.com/in/demo-priya-sengupta`)
  3. Ananya Sharma (University Talent Lead - APAC @ Stripe, `https://www.linkedin.com/in/demo-ananya-sharma`)
  4. Viktor Lindqvist (Open-Source Maintainer, `https://github.com/demo-viktor-ml`)
- **Impact:** Direct violation of `AGENTS.md` Rule 1 ("No fabrication. Never invent ... contacts") and user non-negotiable instruction ("Never fabricate real people, companies, connection counts..."). Clicking "Open Profile" leads to dummy 404 links.
- **Component / File:** [`src/modules/networking/service.ts:14-110`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/modules/networking/service.ts#L14-L110)
- **Root Cause:** In-memory array initialized with mock personas.
- **Recommended Fix:** Remove fake demo contacts. Connect the page to the PostgreSQL database via Prisma `NetworkLead` model. Populate real contacts (e.g., maintainers of open-source projects Badri studies/uses, real campus recruiters, user-entered relationships).

---

### Defect 2: Ephemeral State — All Changes Lost on Page Refresh
- **Severity:** 🔴 **CRITICAL**
- **Observed Behavior:** Clicking "Confirm Contacted" or "Do Not Contact" (ban icon) updates the UI temporarily. Upon page refresh or navigating to another page, all changes are wiped out and the 4 demo leads return to their initial state.
- **Component / File:** [`src/app/network/page.tsx:20-26`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/app/network/page.tsx#L20-L26) & [`src/modules/networking/service.ts:12-13`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/modules/networking/service.ts#L12-L13)
- **Root Cause:** `const service = new CareerNetworkingService()` is instantiated inside the React component. It holds `private leads: NetworkLeadItem[]` in memory. `markAsContacted` only mutates `this.leads` locally without writing to the `NetworkLead` database table.
- **Recommended Fix:** Implement `/api/network` API endpoints (GET, POST, PATCH, DELETE) backed by Prisma `NetworkLead` and `AuditEvent`. Persist contact status, notes, follow-up dates, and DNC flags in Postgres.

---

### Defect 3: No Search Bar or Multi-Dimensional Filtering
- **Severity:** 🟠 **HIGH**
- **Observed Behavior:** The only filtering mechanism is 4 category tabs (`ALL`, `ENGINEER_MAINTAINER`, `ALUMNI`, `RECRUITER_TALENT`). There is no search box for contact name, company, technical domain, or keyword.
- **Component / File:** [`src/app/network/page.tsx:76-101`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/app/network/page.tsx#L76-L101)
- **Root Cause:** Missing search input state and filter predicate.
- **Recommended Fix:** Add a responsive search input with debounced query filtering across `fullName`, `company`, `roleTitle`, `domainFocus`, and `relevanceRationale`. Add filters for relationship status (`All`, `Identified`, `Drafted`, `Contacted`, `Do Not Contact`).

---

### Defect 4: Missing "Add Contact" & Notes Management Workflow
- **Severity:** 🟠 **HIGH**
- **Observed Behavior:** There is no UI to add a new contact, edit personal notes, or set follow-up dates.
- **Component / File:** [`src/app/network/page.tsx`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/app/network/page.tsx)
- **Root Cause:** The page was conceived as a read-only viewer for pre-canned leads.
- **Recommended Fix:** Add an "Add Contact" modal allowing Badri to input:
  - Full Name, Role Title, Company/Organization
  - Category (Engineer/Maintainer, Alumni/Mentor, Recruiter/Talent, Hiring Manager)
  - Public Profile URL (LinkedIn, GitHub, or Personal Site)
  - Provenance Source (e.g. GitHub repo, talk, conference, mutual alumni)
  - Technical Domain Focus (e.g., Computer Vision, Distributed Systems, Edge ML)
  - Personal Notes & Follow-up Date
  - Auto-generate compliant LinkedIn connection note (<300 chars) tailored to Badri's verified background (GCET ECE 2028, WaferOS, LeetCode 184+).

---

### Defect 5: Hardcoded User Identifier ('demo-user-badri')
- **Severity:** 🟡 **MEDIUM**
- **Observed Behavior:** Actions call `service.markAsContacted("demo-user-badri", leadId)` which attempts to create an `AuditEvent` with foreign key `userId: "demo-user-badri"`. If this ID does not match the seeded `UserProfile` in Postgres, the Prisma call silently catches or throws a foreign key constraint violation.
- **Component / File:** [`src/app/network/page.tsx:38,44`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/app/network/page.tsx#L38)
- **Root Cause:** Hardcoded mock user ID string instead of resolving the actual user ID from the database session.
- **Recommended Fix:** Fetch the primary `UserProfile.id` (e.g. `badri.pandey.demo@example.com` or authenticated session ID) dynamically.

---

### Defect 6: Inaccurate Anti-Spam Telemetry Counters
- **Severity:** 🟡 **MEDIUM**
- **Observed Behavior:** The anti-spam pill shows `Daily Cap: 1/5 Prepared` because lead Ananya is hardcoded with `connectionState: "DRAFTED"`. The 60-day dedup is displayed as a static pill rather than reflecting actual database audit events.
- **Component / File:** [`src/modules/networking/service.ts:177-197`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/modules/networking/service.ts#L177-L197)
- **Root Cause:** Telemetry is computed from the hardcoded in-memory array.
- **Recommended Fix:** Compute telemetry from the `NetworkLead` and `OutreachDraft` database records.

---

### Defect 7: Missing Empty and Loading States
- **Severity:** 🟡 **MEDIUM**
- **Observed Behavior:** If `leads` is empty (or when filtering produces zero matches), the page renders a blank space with no empty-state illustration, helpful message, or call-to-action button to reset filters or add a contact.
- **Component / File:** [`src/app/network/page.tsx:104-271`](file:///c:/Users/badri/Desktop/CareerOS_Aget/src/app/network/page.tsx#L104-L271)
- **Root Cause:** No conditional render for `filteredLeads.length === 0`.
- **Recommended Fix:** Add an accessible, well-styled empty state component with "Clear Filters" or "Add First Contact" action.

---

## 3. Data Source Classification (Per Phase 3 Requirements)

| Integration / Source | Classification | Current State | Target State |
|---|---|---|---|
| **PostgreSQL (`NetworkLead` table)** | `USER_ENTERED` / `LIVE_CONNECTED` | Table exists in schema, contains 0 rows | Primary store for real contacts, notes, and relationship state |
| **GitHub Public Contributors** | `LIVE_CONNECTED` (when token present) / `TEMPORARILY_UNAVAILABLE` | Tested with mocks & live routes | Discover genuine maintainers/authors from repos Badri stars/studies |
| **Gmail Outreach Drafts** | `LIVE_CONNECTED` (when token present) / `NOT_CONNECTED` | Draft-only tested | Cross-reference contacts with outreach drafts |
| **LinkedIn Discovery & Messaging** | `UNSUPPORTED` / `MANUAL_HANDOFF` | No official private search API | **Strict Manual Handoff Only** — user pastes profile URL, drafts copy to clipboard |
| **Hardcoded Demo Leads** | **DEMO_MOCK (Prohibited in Prod)** | 4 fake records in service.ts | **DELETE COMPLETELY** |

---

## 4. Feature Status Matrix

| Feature | Status | Notes |
|---|---|---|
| **View Leads List** | Partially Works | Renders 4 demo leads with fake URLs |
| **Category Filter** | Works | In-memory filter on category string |
| **Search by Name/Role/Company** | ❌ Does Not Work | Not implemented |
| **Filter by Domain/Status** | ❌ Does Not Work | Not implemented |
| **Add New Contact** | ❌ Does Not Work | No UI or endpoint exists |
| **Copy Connection Note** | Works | Copies note to clipboard with 3s feedback |
| **Open Verified Profile** | ❌ Broken | URLs are dummy `demo-*` links |
| **Confirm Contacted** | Partially Works | Updates state in-memory only; wiped on refresh |
| **Do Not Contact (DNC)** | Partially Works | Updates state in-memory only; wiped on refresh |
| **Anti-Spam Telemetry** | Partially Works | Fixed calculation on mock array |
| **Relationship Notes & Follow-up** | ❌ Does Not Work | Not implemented |
| **Mobile Layout** | Partially Works | Functional, but button cluster wraps awkwardly |

---

## 5. Migration Plan (Phases 2–8)

1. **Step 1: Database Migration & Seed Verification**
   - Confirm Prisma schema has all required fields on `NetworkLead` (or add role title, category, company, connection note, notes, follow-up date).
   - Create real seed contacts based on Badri's actual ecosystem (e.g. PyTorch ecosystem maintainers, verified university mentors, recruiter contacts).
2. **Step 2: API Endpoints**
   - Create `/api/network` route supporting `GET`, `POST`, `PATCH`, and `DELETE`.
   - Implement Zod schema validation for all incoming contact data.
3. **Step 3: Service Refactoring**
   - Update `CareerNetworkingService` to read/write from Prisma database with fallback for test mocks.
   - Remove all fake `demo-` profile URLs.
4. **Step 4: Network Page UI Modernization**
   - Add Search input with instant filtering.
   - Add Domain and Status filters.
   - Add "Add Contact" modal with evidence-backed note generation.
   - Add Contact details/edit modal for notes and follow-up tracking.
   - Implement loading skeletons and responsive empty states.
5. **Step 5: Testing & Verification**
   - Write comprehensive unit & integration tests covering search, filters, CRUD, duplicate prevention, and anti-spam gates.
   - Verify in browser at desktop and mobile widths.
