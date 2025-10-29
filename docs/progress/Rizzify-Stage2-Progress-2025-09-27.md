# Stage 2 Progress 2025-09-28

## Completed
- Normalised MSW handlers to absolute https://api.rizzify.local/... routes so the colon in /uploads:init and /uploads:probe stays literal.
- Hardened /uploads:init and /uploads:probe: defensive JSON parsing plus Zod safeParse, returning ErrorResponse 400s on invalid payloads instead of throwing.
- Added /generation/start mock to validate upload session/idempotency, seed a task record, and drive /tasks/{id} polling through STATUS_STEPS.
- Verified /tasks/{id}, /tasks/{id}/results, /photos/*, /feedback, /payments/session, /admin/* responses continue to match the Stage-2 contract.
- Dev Harness flow unchanged: latest task ID still persisted for results/feedback, toggles (stateTabs, queueMock, paymentMock) remain effective.
- **[FIXED]** Results page loading issue: Unified all MSW handlers to use complete URLs (https://api.rizzify.local/...) instead of wildcards for consistent matching.
- **[FIXED]** MSW configuration issue: Removed explicit serviceWorker.url config that was causing "shortcuts" property error in MSW v2.11.3.

## Outstanding
- Admin dashboards still show static snapshots; wiring to getAdmin* endpoints remains TODO.
- npm run lint / npm run build still blocked by the missing Next binary (same blocker as Stage 1).

## Verification
- Manual pass: /start -> /gen-image -> /results -> /feedback now receives MSW responses end to end; /generation/start returns 200 and four polling cycles produce results.
- Error drills: invalid probe payload, duplicate idempotency key, and missing upload session all emit structured ErrorResponse payloads without hitting 500.
- **[VERIFIED]** Results page now loads successfully after generation completion.

