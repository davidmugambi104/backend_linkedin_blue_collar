# Blue-Collar Marketplace Dispute Playbook (Employer ↔ Worker)

This playbook is designed for a two-sided paid marketplace where both employers and workers pay platform service fees.

## 1) System Architecture Context

- **Actors**
  - Employer
  - Worker
  - Platform Support
  - Trust & Safety
  - Finance/Billing
  - External Payment Processor
- **Core Artifacts**
  - Job posting and version history
  - Offer acceptance logs
  - Milestones and acceptance criteria
  - Messages and attachments
  - Check-in and completion evidence
  - Payment and payout ledger
  - Fee invoices (both employer and worker side)
  - Identity verification records
- **Dispute Principle**
  - Separate issues into tracks:
    - Technical/quality
    - Commercial/payment
    - Conduct/safety/compliance

## 2) Full Dispute Taxonomy

### A. Onboarding & Identity Disputes
- Employer verification failed
- Worker KYC mismatch
- Duplicate accounts
- Account takeover and payout account changes

### B. Listing & Hiring Disputes
- Misleading job details
- Hidden requirements after posting
- Compensation mismatch
- Offer acceptance disagreement
- Unpaid trial work allegations

### C. Scope & Delivery Disputes
- Scope creep without change order
- Ambiguous deliverable acceptance
- Disputed completion evidence
- Defect claims and remediation windows

### D. Schedule & Attendance Disputes
- No-shows
- Repeated lateness
- Site access denial by employer
- Weather and force majeure delays

### E. Quality & Safety Disputes
- Poor workmanship
- Unsafe site conditions
- Worker safety violations
- Incident liability disagreement

### F. Payment, Fees & Refund Disputes
- Milestone approved but unpaid
- Employer deduction without basis
- Overtime disagreement
- Worker fee deduction complaint
- Employer commission complaint
- Bilateral fee fairness complaint
- Refund and cancellation fee disagreements

### G. Fraud, Security & Evidence Disputes
- Chargebacks after service completion
- Unauthorized transactions
- Fake credentials
- Off-platform communication conflicts
- Deleted or altered evidence claims

### H. Reviews, Conduct & Fairness Disputes
- Retaliatory reviews
- Coerced ratings
- Harassment/abuse in messaging
- Discrimination allegations

### I. Compliance, Legal & Settlement Disputes
- Permit/regulatory stoppages
- Tax invoice or withholding disputes
- No arbitration clause handling
- Mediation failure and litigation preparation
- Settlement drafting and breach

## 3) Standard Resolution Pipeline

1. **Intake**: classify dispute type + severity + financial exposure.
2. **Stabilize**: protect safety, preserve evidence, avoid irreversible actions.
3. **Evidence Freeze**: lock records (messages, milestones, invoices, logs).
4. **Parallel Track Review**:
   - Quality/technical reviewer
   - Payment/finance reviewer
   - Safety/compliance reviewer
5. **Interim Decision**:
   - Undisputed amounts paid
   - Disputed amounts held
   - Corrective action deadlines
6. **Escalation**:
   - Mediation path
   - Formal legal route if unresolved
7. **Closure**:
   - Settlement record
   - Risk score updates
   - Repeat-offender controls

## 4) Decision Controls for Two-Sided Paid Model

- Never conflate **service quality dispute** with **platform fee charge correctness**.
- Provide independent fee ledger for:
  - Employer charges
  - Worker deductions
- If feature/service delivery failed (platform fault), issue **service credit** or fee refund.
- If job execution failed (party fault), resolve via milestone evidence first.

## 5) Risk Controls

- Progressive restrictions for repeated dispute patterns.
- Mandatory escrow for high-risk employers.
- Enhanced vetting for high-risk workers.
- Automated alerts for dispute clusters by account, category, and geography.

## 6) Training Usage

Use `faq_data.csv` dispute entries to teach:
- Correct categorization
- Neutral, policy-grounded language
- Next-step procedural responses
- Evidence-first reasoning

For model behavior, enforce:
- No legal conclusions without evidence
- No biased language
- Always provide next action + required documents
