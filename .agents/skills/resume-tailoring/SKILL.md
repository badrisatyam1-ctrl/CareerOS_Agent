---
name: resume-tailoring
description: Creates role-specific resume variants by selecting and highlighting verified achievements from the evidence vault without ever inventing experience, metrics, or skills.
---

# Resume Tailoring Skill

## Purpose
Produce targeted, truthful resume variants for Badri Vishal Pandey tailored to specific job descriptions or internship roles. Selects and reorders verified experiences, skills, and project accomplishments from the evidence vault to emphasize role-relevant competencies while strictly preventing fabrication.

## Inputs
- `job_description`: Full text or URL of the target job/internship posting.
- `base_resume_data`: Verified candidate master profile from the evidence vault.
- `target_role_type`: Role category (e.g., Backend Engineering, Systems Programming, Full-Stack, ML/AI Engineering).
- `format_target`: Output format (`MARKDOWN`, `JSON_RESUME`, or `LATEX`).

## Operational Rules & Boundaries
1. **Zero fabrication (Hard Rule)**: Never invent job titles, employment dates, degrees, GPAs, achievements, metrics, company names, or skills. Every bullet point must derive from an evidence-backed record.
2. **No exaggerated metrics**: If a project metric lacks empirical proof (e.g., an unverified latency reduction or unmeasured throughput), describe the architectural change factually without fabricated percentage numbers.
3. **No secret or PII exposure in Git**: Tailored resumes containing private contact details (phone, full street address) must be stored in secure local storage or gitignored user directories, never committed to version control.
4. **Honest gap reporting**: Clearly list skills required by the job that are absent from the user's profile rather than attempting to sneak unsupported keywords into the resume.
5. **Human review required**: Generated resumes must be fully inspected by the user before submission.

## Execution Steps
1. **Job Requirement Extraction**:
   - Parse the job description to identify core required skills, preferred qualifications, tech stack, and responsibilities.
   - Categorize requirements into `Must-have` and `Nice-to-have`.
2. **Evidence Vault Alignment**:
   - Scan the user's verified experiences, projects (e.g., WaferOS, DevSync, portfolio projects), and competitive programming records.
   - Match verified items against the extracted requirements.
   - Identify candidate projects and experience bullets that demonstrate relevant mastery.
3. **Draft Tailoring**:
   - Order projects and experiences to emphasize top matching competencies.
   - Refine bullet points using action-verb + technical context + verified result framing.
   - Generate a concise skills section grouping only confirmed user skills relevant to the role.
4. **Provenance & Gap Analysis**:
   - Compile a side-by-side gap report showing:
     - Matched qualifications and the corresponding evidence source.
     - Missing qualifications (gaps) to prepare for interview discussions.
5. **Packaging**:
   - Output the structured resume draft with attached evidence provenance map.

## Outputs
- `TailoredResumeVariant`:
  - `id`: Unique variant identifier.
  - `target_job_id`: Reference to target job/posting.
  - `content`: Formatted resume text (Markdown / LaTeX).
  - `matched_skills`: Array of verified skills included in this variant.
  - `unmatched_skills`: Array of JD skills not present in user vault (skill gaps).
  - `evidence_provenance`: Map linking every bullet point to evidence vault item ID.
  - `status`: `DRAFT` | `REVIEWED` | `READY_FOR_EXPORT`.

## Approval Gates
- **User Review Gate**: The user must review and approve the tailored resume variant before export or attachment to any application.
- **Modification Guard**: Editing any factual claim triggers an evidence check against the vault.

## Failure Handling
- **Low Match Threshold (< 40%)**: If candidate qualifications have minimal overlap with essential job requirements, flag the role as a poor match and recommend upskilling before applying.
- **Unsupported Requirement**: If a user attempts to add a skill not present in the evidence vault, require addition of a verified project, course, or repository before incorporating it.
- **Formatting Errors**: Validate syntax of LaTeX/Markdown outputs before presenting to user.
