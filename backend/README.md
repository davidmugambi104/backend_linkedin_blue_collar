# backend_linkedin_blue_collar
# source venv311/bin/activate

## Enterprise hardening defaults

The backend now enforces safer data integrity defaults aimed at production readiness.

- Hard deletes are blocked by default for protected core tables.
- Deletion endpoints now use non-destructive behavior:
	- users -> deactivate (`is_active=False`)
	- jobs -> cancel (`status=CANCELLED`)
	- applications -> withdraw (`status=WITHDRAWN`)
	- skills -> deprecate (`category=deprecated`)
	- reviews -> redact comment (`[redacted]`)
- SQLite foreign key enforcement is enabled via `PRAGMA foreign_keys=ON` on each connection.

### Environment flags

- `DB_ENFORCE_SOFT_DELETE` (default: `true`)
- `ALLOW_HARD_DELETE` (default: `false`)
- `PROTECTED_DELETE_TABLES` (comma-separated table names)
- `DB_POOL_RECYCLE_SECONDS` (default: `1800`)

If your operations team requires permanent deletion for compliance workflows, create explicit admin-only tooling and temporarily set `ALLOW_HARD_DELETE=true` only for controlled jobs.

## Additional enterprise security hardening

- JWT revocation is now durable (Redis-backed cache with token expiry TTL), not process-memory only.
- Auth routes use stricter request parsing and improved login throttling keys (`ip + email`).
- Login success/failure writes to `login_logs` for incident tracking.
- Security middleware adds:
	- `X-Request-ID` propagation
	- hardening headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, optional HSTS)
	- `Cache-Control: no-store` on `/api/auth/*`
	- graceful `413 Payload too large` handling
- Audit logs are immutable at ORM level (update/delete blocked for `audit_logs`).

### New security-related config

- `RATELIMIT_STORAGE_URI` (Redis recommended, defaults to Redis local URI fallback)
- `MAX_CONTENT_LENGTH` (default: 2MB)

### Admin safety controls

- `ALLOW_DESTRUCTIVE_OPERATIONS` (default: `false`) gates admin destructive routes.
- `REQUIRE_ADMIN_CONFIRMATION` (default: `true`) requires confirmation header for high-risk admin actions.
- `ADMIN_ACTION_CONFIRMATION_TOKEN` (optional) token expected in `X-Admin-Confirm` header.
- `ADMIN_APPROVAL_POLICY_OVERRIDES` (JSON string) overrides action role policy.
- `ADMIN_APPROVAL_PERMISSION_OVERRIDES` (JSON string) overrides action permission policy.
- `ADMIN_APPROVAL_RATE_LIMIT` (default: `30 per minute`) for approval creation.
- `ADMIN_APPROVAL_REVIEW_RATE_LIMIT` (default: `20 per minute`) for approval read/review endpoints.
- `ADMIN_IDEMPOTENCY_ENABLED` (default: `true`) enforces idempotency headers on critical admin mutations.
- `ADMIN_IDEMPOTENCY_TTL_SECONDS` (default: `3600`) retention for idempotency records.
- `AUDIT_LOG_MAX_PAGE_SIZE` (default: `200`) caps paginated audit reads.
- `AUDIT_LOG_MAX_EXPORT_ROWS` (default: `5000`) caps CSV audit export rows.

Audit export now supports optional sensitive fields via `include_sensitive=true`, restricted to super-admin role.

### Two-person approval workflow (critical admin actions)

When `TWO_PERSON_APPROVAL_ENABLED=true`, high-risk admin actions require an approval ticket.

1. Request approval: `POST /api/admin/approvals/request`
2. Review queue: `GET /api/admin/approvals/pending`
3. My requests: `GET /api/admin/approvals/mine`
4. Approve by a different admin: `POST /api/admin/approvals/<approval_id>/approve`
5. Execute protected action with `X-Approval-ID: <approval_id>` header
6. Cancel pending request: `POST /api/admin/approvals/<approval_id>/cancel`

Protected actions include:

- `DELETE /api/admin/users/<user_id>` (`action=delete_user`, payload `{ "user_id": <id> }`)
- `POST /api/admin/users/bulk-delete` (`action=bulk_delete_users`, payload `{ "user_ids": [...] }`)

Approver cannot execute the same approved action; approvals are single-use and become `consumed` on execution.

Approval policy is role-scoped:

- Request: `super_admin` or `ops_admin`
- Approve/Reject: `super_admin`
- Execute approved action: `super_admin` or `ops_admin`

If role policy fails, the API returns `403` with required role metadata.

Approval actions are also permission-scoped (`users:suspend` for current protected delete actions). Role and permission checks are both enforced.

Example role override:

`ADMIN_APPROVAL_POLICY_OVERRIDES={"delete_user":{"request_roles":["super_admin"],"approve_roles":["super_admin"],"execute_roles":["super_admin"]}}`

Example permission override:

`ADMIN_APPROVAL_PERMISSION_OVERRIDES={"bulk_delete_users":{"request_permission":"admin:edit","approve_permission":"admin:edit","execute_permission":"admin:edit"}}`

When Redis is unavailable, in-memory cache fallback now enforces TTL semantics for approval tickets and token revocations.

### Tamper-evident audit export

`GET /api/admin/audit-log?format=csv` now returns:

- `X-Audit-Content-SHA256`: SHA-256 hash of exported bytes
- `X-Audit-Signature`: HMAC-SHA256 signature (key: `AUDIT_EXPORT_SIGNING_KEY` or `SECRET_KEY` fallback)

Signed JSON export is also supported:

- `GET /api/admin/audit-log?format=json&download=true`

This returns the same tamper-evident headers as CSV.

Export download (`csv` or `json&download=true`) requires `audit:export` permission.

### Idempotency and SIEM event correlation

Critical admin mutation routes require `Idempotency-Key` (or `X-Idempotency-Key`) when idempotency is enabled.

- Duplicate completed requests return cached success payload with `idempotent_replay=true`.
- Duplicate in-progress requests return a conflict-style error.

Sensitive operation responses include `security_event_id` for SIEM correlation.
Audit export download responses include `X-Security-Event-ID` header.

Current routes with idempotency + security event metadata include:

- user actions: ban, unban, delete, bulk-delete, bulk-verify
- approvals: request, approve, reject, cancel
- moderation: job moderate/feature/unfeature
- verification review
- platform settings update

Mandatory action reasons:

- Sensitive admin actions require a reason when `ADMIN_REASON_ENFORCEMENT_ENABLED=true`.
- Minimum reason length is controlled by `ADMIN_REASON_MIN_LENGTH` (default `8`).
- Required actions are controlled by `ADMIN_REASON_REQUIRED_ACTIONS` (comma-separated list or `*`).
- Reason can be supplied via:
	- request JSON body `reason`
	- query parameter `reason` (for export/download style GET operations)
	- header `X-Action-Reason`

Mandatory change tickets:

- Sensitive admin actions can require a change ticket when `ADMIN_CHANGE_TICKET_ENFORCEMENT_ENABLED=true`.
- Minimum ticket length is controlled by `ADMIN_CHANGE_TICKET_MIN_LENGTH` (default `3`).
- Required actions are controlled by `ADMIN_CHANGE_TICKET_REQUIRED_ACTIONS` (comma-separated list or `*`).
- Change ticket can be supplied via:
	- request JSON body `change_ticket` (or `ticket`)
	- query parameter `change_ticket` (or `ticket`)
	- header `X-Change-Ticket`

Approval lifecycle governance:

- Approval workflow endpoints now follow governance enforcement:
	- `POST /api/admin/approvals/request`
	- `POST /api/admin/approvals/<approval_id>/approve`
	- `POST /api/admin/approvals/<approval_id>/reject`
	- `POST /api/admin/approvals/<approval_id>/cancel`
- These actions are included in default required lists for reason and change-ticket enforcement.
- Approval audit entries include normalized event types:
	- `admin.approval.request`
	- `admin.approval.approve`
	- `admin.approval.reject`
	- `admin.approval.cancel`

### Governance policy snapshots

Use signed policy snapshots to prove active governance controls at a point in time.

- `GET /api/admin/governance/policy-snapshot`
	- Returns current policy snapshot + `snapshot_hash` + `snapshot_signature`.
	- By default (`record=true`), records a historical snapshot in immutable audit logs.
	- Response headers include `X-Policy-Snapshot-Hash` and `X-Policy-Snapshot-Signature`.

- `GET /api/admin/governance/policy-snapshots`
	- Returns historical recorded snapshots from audit trail.
	- Query params:
		- `page`, `limit`
		- `include_snapshot=true` (super-admin only) to include full snapshot payloads.

Operational settings:

- `GOVERNANCE_SNAPSHOT_RATE_LIMIT` (default `30 per minute`)
- `GOVERNANCE_SNAPSHOT_HISTORY_MAX_PAGE_SIZE` (default `200`)

Governance compliance report endpoint:

- `GET /api/admin/governance/compliance/report`
- Runs continuous governance checks and returns `overall_status` (`healthy`, `degraded`, `critical`).
- Checks include:
	- approval request coverage for all approval-policy actions
	- reason-policy and change-ticket policy coverage on governance-critical actions
	- default secret detection
	- destructive operation posture
	- DB integrity guard posture
- Query param:
	- `include_details=true` (full details; super-admin receives full details)
- Emits audited SIEM event type: `admin.governance.compliance.report`.
- Rate limit controlled by `GOVERNANCE_COMPLIANCE_RATE_LIMIT` (default `30 per minute`).

### Signed incident timeline export

Use `GET /api/admin/governance/incident-timeline/export` to export a signed incident bundle containing:

- security-tagged events
- approval lifecycle events
- governance policy snapshot events

Query params:

- `since_hours` (bounded by `SECURITY_EVENTS_MAX_SINCE_HOURS`)
- `limit` (bounded by `INCIDENT_TIMELINE_EXPORT_MAX_ROWS`)
- `include_sensitive=true` (super-admin only)

Governance requirements:

- Requires `audit:export` permission.
- Uses mandatory reason and change-ticket policy when enabled.

Response integrity headers:

- `X-Audit-Content-SHA256`
- `X-Audit-Signature`
- `X-Security-Event-ID`

Operational settings:

- `INCIDENT_TIMELINE_EXPORT_RATE_LIMIT` (default `20 per minute`)
- `INCIDENT_TIMELINE_EXPORT_MAX_ROWS` (default `5000`)

Incident timeline verification endpoint:

- `POST /api/admin/governance/incident-timeline/verify`
- Body: raw incident timeline JSON bundle bytes.
- Required integrity inputs:
	- `X-Audit-Content-SHA256`
	- `X-Audit-Signature`
	- (alternatively via query params `content_sha256` and `signature`)
- Optional query param:
	- `check_db=true` to validate bundle event references against current audit DB rows.

Verification response includes:

- cryptographic validation (`digest_valid`, `signature_valid`)
- structural validation (`event_type_valid`, `count_matches`)
- optional DB consistency report (`db_check`)

Additional settings:

- `INCIDENT_TIMELINE_VERIFY_RATE_LIMIT` (default `30 per minute`)
- `INCIDENT_TIMELINE_VERIFY_MAX_EVENTS` (default `500`)

Each returns a normalized `event_type` such as:

- `admin.user.ban`
- `admin.job.moderate`
- `admin.verification.review`
- `admin.settings.update`

### Security event stream endpoint

Use `GET /api/admin/security/events` for SOC/SIEM ingestion of security-tagged events.

Supported query params:

- `limit` (default `50`, max `200`)
- `since_hours` (default `24`, max from `SECURITY_EVENTS_MAX_SINCE_HOURS`, default `720`)
- `action` (exact audit action match)
- `event_type` (exact security event type)
- `cursor` (signed continuation token for incremental pull)
- `include_sensitive=true` (super-admin only; includes IP and user-agent)

Behavior notes:

- Results are ordered by `(timestamp asc, id asc)` for stable incremental ingestion.
- When `has_more=true`, use `next_cursor` on the next request and keep filters unchanged.
- Cursor tokens are HMAC-signed and expire based on `SECURITY_EVENTS_CURSOR_TTL_SECONDS` (default 24h).
- Responses include `X-Security-Feed-Signature` (HMAC over canonical JSON body) for transport integrity verification.

Operational controls:

- Feed endpoint throttling is configured by `SECURITY_EVENTS_RATE_LIMIT` (default `60 per minute`).
- Maximum lookback window is configured by `SECURITY_EVENTS_MAX_SINCE_HOURS`.

### Audit integrity verification

Audit entries are now tamper-evident using a hash-chain stamp stored in `new_values._integrity`:

- `algo`: `hmac-sha256`
- `prev_hash`: previous entry hash in chronological order
- `hash`: current entry hash over canonical audit content + previous hash

Use `GET /api/admin/security/events/verify` to validate chain integrity over a bounded window.

Supported query params:

- `since_hours` (bounded by `SECURITY_EVENTS_MAX_SINCE_HOURS`)
- `limit` (default `1000`, max `5000`)
- `include_samples=true` (include expected/stored hash details in mismatches)

Response includes:

- `valid` (overall integrity state)
- `verified_entries`
- `mismatch_count` and bounded `mismatches`
- `last_verified_hash`

### Signed database backups

`POST /api/admin/system/database/backup` now creates:

- SQLite backup file (for SQLite deployments)
- signed manifest file at `<backup>.manifest.json`

Manifest fields include `backup_sha256`, `backup_size_bytes`, `created_at`, and `signature` (HMAC over canonical manifest payload).

Use `GET /api/admin/system/database/backup/verify?backup_file=<filename>` to verify:

- manifest signature validity
- backup file checksum match
- backup file size match

Operational settings:

- `DB_BACKUP_DIR` (backup storage directory)
- `DB_BACKUP_RATE_LIMIT` (default `5 per hour`)
- `DB_BACKUP_VERIFY_RATE_LIMIT` (default `30 per minute`)

Backup catalog endpoint:

- `GET /api/admin/system/database/backups`
- Lists recent backup files with:
	- manifest presence and trust (`manifest_trusted`)
	- manifest metadata (`manifest_backup_sha256`, `manifest_created_at`)
	- latest verification summary from audit trail (`latest_verification`)
- Query params:
	- `limit` (default `50`, max `200`)
	- `include_runtime_checks=true` to compute live checksum and compare with manifest
- Rate limit controlled by `DB_BACKUP_CATALOG_RATE_LIMIT` (default `60 per minute`)

Retention policy enforcement:

- Retention policy is enforced using:
	- `DB_BACKUP_RETENTION_DAYS` (default `30`)
	- `DB_BACKUP_MAX_FILES` (default `100`)
- Backups can be protected from pruning via hold flags stored in `DB_BACKUP_HOLDS_FILE` (default `backup_holds.json`).
- Catalog responses include `is_held`, `hold`, `prune_eligible`, and `prune_reasons`.

Hold management endpoint:

- `POST /api/admin/system/database/backups/hold`
- Body:
	- `backup_file` (required)
	- `hold` (`true` to set hold, `false` to release; default `true`)
	- `reason` (optional)

Controlled prune endpoint:

- `POST /api/admin/system/database/backups/prune`
- Requires admin confirmation token (`X-Admin-Confirm`) when confirmation is enabled.
- Requires two-person approval and idempotency key when those controls are enabled.
- Body:
	- `dry_run` (default `true`)
- Returns candidate list with reasons (`age`, `count`) and deletion outcomes.
- Rate limit controlled by `DB_BACKUP_PRUNE_RATE_LIMIT` (default `10 per hour`).