# CareerOS — Public Profile Audit

**Audit date:** 2026-10-22  
**Auditor:** Phase 0 automated inspection  
**Status:** Draft — requires user confirmation of flagged items

## 1. Sources inspected

| Source | URL | Accessible? | Method |
|---|---|---|---|
| Portfolio | https://portfolio-bjzy.vercel.app/ | ✅ Yes | HTTP fetch |
| Portfolio /projects | https://portfolio-bjzy.vercel.app/projects | ✅ Yes | HTTP fetch |
| Portfolio /about | https://portfolio-bjzy.vercel.app/about | ✅ Yes | HTTP fetch |
| GitHub profile | https://github.com/badrisatyam1-ctrl | ✅ Yes | HTTP + API |
| GitHub repos API | api.github.com/users/badrisatyam1-ctrl/repos | ✅ Yes | REST API |
| LinkedIn | https://www.linkedin.com/in/badri-vishal-pandey-0a7913324 | ❌ 999 | Blocked by LinkedIn (expected) |
| LeetCode | https://leetcode.com/u/Badri1888/ | ❌ 403 | Blocked (no public API used) |
| Resume PDF | Supplied in conversation | ✅ Yes | Resume-reported data |

> [!NOTE]
> LinkedIn returned HTTP 999 (bot detection). LeetCode returned HTTP 403. These are expected behaviors. Facts from these platforms are sourced indirectly from the portfolio (which fetches and displays LeetCode data) and from LinkedIn URLs embedded in the portfolio. No private data was inferred from inaccessible pages.

## 2. Verified identity facts

| Claim | Source | Verification status |
|---|---|---|
| Name: Badri Vishal Pandey | Portfolio meta, GitHub profile, Resume | ✅ Consistent across all sources |
| Education: B.Tech ECE, GCET, Greater Noida | Portfolio ("Identity Node"), GitHub bio, Resume | ✅ Consistent across all sources |
| Location: Greater Noida, India | Portfolio header | ✅ Portfolio-confirmed |
| Email: badrisatyam1@gmail.com | Portfolio mailto link | ✅ Publicly listed on portfolio |
| GitHub username: badrisatyam1-ctrl | Portfolio link, GitHub profile | ✅ Confirmed |
| LinkedIn: badri-vishal-pandey-0a7913324 | Portfolio link | ✅ URL confirmed (page not crawlable) |
| LeetCode: Badri1888 | Portfolio link | ✅ URL confirmed (page not crawlable) |
| Portfolio URL: portfolio-bjzy.vercel.app | Direct access | ✅ Live and serving |

## 3. GitHub profile analysis

### 3.1 Profile metadata (from GitHub HTML + API)

- **Display name:** Badri Vishal Pandey
- **Bio:** "B.Tech in ECE @ GCET | AI/ML • LeetCode • IoT • Embedded Systems | Building Real-World Tech Projects"
- **GitHub user ID:** 240858953
- **Account type:** Public user, not an organization
- **Public repos visible:** 7+ (2 owned, 5+ forks)

### 3.2 Owned repositories

| Repository | Language | Stars | Created | Last pushed | Description |
|---|---|---|---|---|---|
| `wafer-defect-classification` | Python | 5 | 2026-02-07 | 2026-10-19 | No description set (portfolio says: semiconductor wafer defect classification) |
| `confirmtkt-clone` | TypeScript | 0 | 2026-07-28 | 2026-10-19 | No description set (portfolio says: travel booking platform) |
| `badrisatyam1-ctrl` | Markdown | — | — | — | Profile README repo |

### 3.3 Forked repositories (contribution signal)

| Fork | Upstream project | Language | License | Activity on fork |
|---|---|---|---|---|
| `sarvam-ai-cookbook` | Sarvam AI | Jupyter Notebook | Apache-2.0 | Pushed 2026-10-06 |
| `open-source-starter-lab` | p-r-e-m-i-u-m | TypeScript | MIT | Pushed 2026-10-01 |
| `mne-python` | MNE-Tools | Python | BSD-3 | Pushed 2026-09-30 |
| `openlake` | — | — | Apache-2.0 | Created 2026-09-29, no changes observed |
| `VoiceStudio` | — | — | AGPL-3.0 | Created 2026-09-29, no changes observed |
| `organic-os` | — | — | MIT | Created 2026-09-27 |

> [!IMPORTANT]
> **Open-source contribution claims need verification.** The resume mentions contributions to `future-agi` and `open-source-starter-lab`. Neither `future-agi` appears in the public repos list. The `open-source-starter-lab` is forked but no merged PRs are confirmed from this audit. **Actual PR URLs and merge status must be verified from GitHub before using contribution counts in posts or applications.**

### 3.4 GitHub gaps and observations

- **No repository descriptions** on the two owned repos. This hurts discoverability and professional presentation.
- **No topics/tags** set on any repo.
- **No license** on either owned repo (`wafer-defect-classification`, `confirmtkt-clone`).
- **No README** inspection was done for content quality (out of scope for Phase 0 HTML audit).
- **Stars:** Only `wafer-defect-classification` has stars (5). All other repos have 0.
- **No open issues or PRs** on owned repos.
- The `future-agi` repository referenced in the resume is **not visible** in the public repos list. It may be private, deleted, renamed, or under a different account. **User must clarify.**

## 4. Portfolio analysis

### 4.1 Structure and content

The portfolio is a Next.js application deployed on Vercel, using a dark theme with a "workspace/terminal" aesthetic.

**Pages:**
- `/` — Overview with identity card, core modules, quick access
- `/projects` — 4 project case studies
- `/arsenal` — Skills/tools (not crawled in detail)
- `/notes` — Blog/notes (not crawled in detail)
- `/about` — System analytics, skills matrix, LeetCode stats, GitHub repos, certifications, hackathons
- `/terminal` — Interactive terminal (not crawled)
- `/resume.pdf` — Downloadable resume (publicly accessible)

### 4.2 Projects listed on portfolio

| # | Project name | Tech stack shown | GitHub link present? |
|---|---|---|---|
| 01 | Semiconductor Wafer Defect Classification System | Python, TensorFlow, scikit-learn, NumPy, Pandas, Matplotlib, OpenCV | ✅ Links to `wafer-defect-classification` repo |
| 02 | Smart Helmet | (Not detailed in crawled HTML) | ❓ Not confirmed |
| 03 | Drone System (Developing Phase) | (Not detailed) | ❓ Not confirmed |
| 04 | ConfirmTkt Clone (TravelBooking) | (Described as production-ready travel booking) | ✅ Links to `confirmtkt-clone` repo |

### 4.3 Skills matrix from portfolio /about page

**Languages:** Python (90%), C/C++ (85%)  
**AI & Data:** TensorFlow (78%), scikit-learn (82%), Deep Learning (75%), Pandas (85%), NumPy (88%)  
**Embedded:** Arduino (88%), ESP32 (82%), Sensors (85%), Microprocessors (78%), Circuit Design (75%)  
**Problem Solving:** Data Structures (82%), Algorithms (80%)

> [!WARNING]
> The percentage-based skill ratings on the portfolio are **self-assessed and not externally verified**. CareerOS should treat these as resume-reported claims, not as proof of proficiency. The percentages are not backed by any standardized benchmark shown on the site.

### 4.4 LeetCode statistics (shown on portfolio /about)

- **Problems solved:** 87 total (47 Easy, 37 Medium, 3 Hard)
- **Streak:** 107 days
- **Global rank:** ~1,726,435

> [!NOTE]
> These stats appear to be fetched live by the portfolio from the LeetCode API. The "LeetCode Solved" header card shows "0" (likely a rendering/hydration issue on server-side fetch), while the detailed breakdown shows 87 total. The 107-day streak is notable for content creation.

### 4.5 Certifications (from portfolio /about)

| Certification | Issuer | Verification link |
|---|---|---|
| ChatGPT for SEO and Content | Great Learning Academy | Links to LinkedIn certifications section |
| Introduction to Generative AI Studio | Google Cloud | Links to LinkedIn certifications section |
| Trust and Security with Google Cloud | Google Cloud | Links to LinkedIn certifications section |
| Google Cloud Professional Cloud Architect | Google Cloud | Links to LinkedIn certifications section |
| Skills Boost Arcade Trivia | Google Cloud | Links to LinkedIn certifications section |

> [!NOTE]
> All certification "verify" links point to the LinkedIn certifications section (`/details/certifications/`), not to individual credential URLs. Independent verification links (Credly, Google Cloud Skills Boost, etc.) are not present on the portfolio. These should be treated as **resume-reported** until direct credential URLs are added to the evidence vault.

### 4.6 Hackathons (from portfolio /about)

| Event | Result | Team |
|---|---|---|
| Voyager Blitz HackIndia Spark-4 | **Finalist** | — |
| HackDays GCET | Participant | Team Tensor1888 |

## 5. LinkedIn analysis

LinkedIn profile page returned HTTP 999 (standard bot-detection). The following facts are derived **only from the LinkedIn URL structure and references from the portfolio/resume**:

- **Profile URL:** https://www.linkedin.com/in/badri-vishal-pandey-0a7913324
- **Education dates (previously reported):** 2024–2028 — **conflicts with resume (expected graduation 2027)**
- **Profile exists:** Confirmed (referenced and linked from portfolio)

**LinkedIn is NOT crawlable and we do NOT attempt to scrape it.** Any LinkedIn data used in CareerOS must come from the user's own input or permitted official APIs.

## 6. Consistency issues and conflicts

### 🔴 BLOCKING: Graduation date discrepancy

| Source | Graduation date |
|---|---|
| Resume PDF | Expected 2027 |
| LinkedIn (previously reported) | 2024–2028 |
| Portfolio | Not stated explicitly |

**Impact:** This discrepancy blocks outbound job applications and recruiter outreach that mention eligibility or graduation timing. The user **must confirm the correct date** and update all sources accordingly.

### 🟡 Notable gaps

| Gap | Impact | Recommendation |
|---|---|---|
| No repo descriptions on owned GitHub repos | Hurts discoverability, looks unprofessional to recruiters | Add descriptions and topics |
| No license on owned repos | Unclear reuse terms, blocks some contribution workflows | Add MIT or Apache-2.0 |
| `future-agi` repo not found publicly | Cannot verify open-source contribution claim from resume | User must provide PR URLs |
| Portfolio OG URL mismatch: `og:url` is `https://badrivishalpandey.me` but actual URL is `portfolio-bjzy.vercel.app` | SEO/sharing inconsistency | Update OG tags or configure custom domain |
| Certification links all go to LinkedIn section page, not individual credentials | Cannot independently verify | Add direct credential URLs |
| Smart Helmet and Drone projects have no GitHub repos linked | Cannot verify project claims | Create public repos or clarify status |
| LeetCode "total solved" header card shows 0 (hydration issue) | Misrepresents achievement to first-time visitors | Fix client-side rendering |
| Resume is publicly downloadable at `/resume.pdf` | Privacy risk — anyone can download the full resume | Consider adding access control or removing from public path |
| No Twitter/X or other social links | Missing networking channel | Add if relevant |
| PyTorch listed on resume but not on portfolio skills matrix | Inconsistent skill representation | Add to portfolio or clarify |

### 🟢 Consistent facts

- Name, education institution, location, GitHub username, LinkedIn URL, and email are consistent across all inspectable sources.
- The WaferOS project links from portfolio to GitHub repo correctly.
- The ConfirmTkt project links from portfolio to GitHub repo correctly.
- GitHub bio matches portfolio description (AI/ML, ECE, IoT, Embedded Systems).

## 7. Resume-reported claims requiring evidence

These claims from the resume/profile defaults should be treated as **resume-reported** until linked to reproducible evidence:

| Claim | Evidence status |
|---|---|
| WaferOS: 93.51% macro-F1 across 8 wafer classes | ⚠️ Resume-reported. No evaluation artifact found in public repo. |
| WaferOS: ~12ms per wafer inference | ⚠️ Resume-reported. No benchmark artifact found. |
| Open-source contributions to `future-agi` | ⚠️ Resume-reported. Repo not found in public profile. |
| Open-source contributions to `open-source-starter-lab` | ⚠️ Resume-reported. Fork exists but no merged PRs confirmed. |
| Skills: PyTorch, FastAPI, Redis, Docker, FreeRTOS, I2C/SPI | ⚠️ Resume-reported. Not all demonstrated in public repos. |
| SENTINEL drone project | ⚠️ Resume-reported. Portfolio lists "Drone System (Developing Phase)" but no repo linked. |
| Smart Helmet project | ⚠️ Resume-reported. Listed on portfolio but no repo linked. |

## 8. Recommendations for evidence vault

Before CareerOS drafts posts, tailors resumes, or sends outreach:

1. **Resolve graduation date** — blocking for applications.
2. **Add repo descriptions, topics, and licenses** to owned GitHub repos.
3. **Provide PR URLs** for `future-agi` and `open-source-starter-lab` contributions.
4. **Add evaluation notebooks/scripts** to `wafer-defect-classification` repo to substantiate the 93.51% F1 claim.
5. **Create public repos** (or link existing ones) for Smart Helmet and SENTINEL/drone projects.
6. **Add individual credential URLs** for Google Cloud certifications.
7. **Fix portfolio OG URL** to match actual deployment URL.
8. **Consider privacy** of publicly downloadable resume at `/resume.pdf`.
