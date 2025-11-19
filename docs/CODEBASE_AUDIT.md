# Codebase Audit Report

Date: 2025-11-12
Scope: Full repository at `/Users/prashanth/Downloads/Praahis`

## Summary

- Total files scanned (excluding .git and node_modules): 482
- Exact duplicate contents found: 30+ pairs (see highlights below)
- Build artifacts committed: `dist/` contains many duplicates of `public/` and `src/assets/` files
- Potential version confusion: multiple files with the same basename across feature folders (admin/manager/superadmin)
- Database migration conflict: duplicate numeric prefix `21_` in `database/`
- Old-version indicators: files with `*_FIXED.sql`, and `docs/.../archive` present (OK), but ensure only the intended versions are referenced

## High‑impact findings

### 1) Dist folder committed (should be ignored)
Duplicated assets between `dist/` and `public/` or `src/assets/`:

- dist/assets/hero-*.mp4 == src/assets/marketing/hero.mp4
- dist/monochrome.svg == public/monochrome.svg
- dist/logo.svg == public/logo.svg
- dist/vite.svg == public/vite.svg
- Many JPEG/MP4 pairs under `dist/assets` matching `src/assets/marketing/*`

Recommendation:
- Add `dist/` to `.gitignore` and remove it from version control. Rebuild locally or in CI on demand.

### 2) Duplicate components/pages (exact content duplicates)
Identical files in different locations suggest duplication and potential drift:

- src/pages/superadmin/AuditLogs.jsx == src/pages/superadmin/AuditLogsPage.jsx
- src/pages/superadmin/SuperAdminDashboard.jsx == src/pages/superadmin/Dashboard.jsx
- src/pages/superadmin/managers/ManagersList.jsx == src/pages/superadmin/managers/ManagersListPage.jsx
- src/pages/superadmin/DataExport.jsx == src/pages/superadmin/DataExportPage.jsx
- src/pages/superadmin/subscriptions/SubscriptionsList.jsx == src/pages/superadmin/subscriptions/SubscriptionsListPage.jsx
- src/pages/superadmin/restaurants/RestaurantForm.jsx == src/pages/superadmin/restaurants/RestaurantFormPage.jsx
- src/pages/superadmin/RestaurantDetail.jsx == src/pages/superadmin/restaurants/RestaurantDetailPage.jsx
- src/pages/superadmin/settings/SystemSettings.jsx == src/pages/superadmin/settings/SystemSettingsPage.jsx
- src/pages/superadmin/BackupManagement.jsx == src/pages/superadmin/BackupManagementPage.jsx
- src/pages/superadmin/Analytics.jsx == src/pages/superadmin/AnalyticsPage.jsx
- src/pages/admin/Dashboard.jsx == src/pages/manager/ManagerDashboard.jsx
- src/pages/admin/ReportsPage.jsx == src/pages/manager/ReportsPage.jsx
- src/pages/admin/QRCodesManagement.jsx == src/pages/manager/QRCodesManagementPage.jsx
- src/pages/admin/Links.jsx == src/pages/manager/LinksPage.jsx
- src/pages/admin/ActivityLogs.jsx == src/pages/manager/ActivityLogsPage.jsx
- src/pages/admin/Analytics.jsx == src/pages/manager/AnalyticsPage.jsx
- src/pages/admin/PaymentsTracking.jsx == src/pages/manager/PaymentsTrackingPage.jsx

Recommendation:
- Consolidate duplicate files into a single shared component/page per feature. Export role-specific wrappers only if routing requires different paths.
- Keep only one of the pair (e.g., prefer `*Page.jsx` or the non-Page variant consistently) to avoid confusion.

### 3) Database migration conflict
- Duplicate numeric prefix `21_` detected:
  - `database/21_notifications_seed.sql`
  - `database/21_storage_buckets.sql`

Risks:
- Tooling that orders migrations lexicographically by numeric prefix will have nondeterministic or conflicting application order.

Recommendation:
- Choose one canonical order and renumber one of the files to a free, higher number (e.g., `28_storage_buckets.sql`) while verifying no applied migrations depend on the old number.
- If production has already applied both, create a new forward migration to reconcile, do not renumber retroactively.

## Other observations

- Multiple `README.md` files (7) across folders. This is fine but ensure content is scoped and not contradictory.
- Old-version hints are confined to docs/archive and one SQL `*_FIXED.sql` file:
  - `database/70_unified_login_rls_FIXED.sql` appears to be the intended fixed version. Confirm that any unfixed variant is removed or archived.

## Proposed cleanup plan (non-destructive)

1) Version control hygiene
- Add `.gitignore` entries for `dist/`, local environment artifacts, and OS files.
- Remove `dist/` from the repository history in a follow-up (git rm -r --cached dist) after adding .gitignore.

2) Pages/components deduplication
- Pick a consistent naming convention (`*Page.jsx` or not). Remove true duplicates and keep only one import path.
- Where admin/manager/superadmin variants are identical, extract a shared implementation under `src/pages/shared/` and have thin role wrappers that pass role-specific props only when needed.

3) Database migrations
- If migrations are not yet applied in production, rename one `21_*.sql` to an unused higher number and update any orchestrations.
- If already applied, leave numbers as-is; add a new migration to reconcile schema/state and document the anomaly in `database/README.md`.

## Appendices

### A. Basename duplicates (top examples)
- README.md (7 occurrences)
- index.js (5), events.js (5), index.ts (3)
- Repeated page names: ReportsPage.jsx, Dashboard.jsx, Analytics.jsx, AnalyticsPage.jsx, etc.

### B. Exact duplicate hashes (sample)
- ef829f3...243db5d: dist/assets/hero-*.mp4 == src/assets/marketing/hero.mp4
- 8cdc023...c5f274e: dist/monochrome.svg == public/monochrome.svg
- 4c362e7...f810b23: dist/logo.svg == public/logo.svg
- 01ba471...aca546b: dist/vite.svg == public/vite.svg
- decc7a6...d90d070c: SystemSettings vs SystemSettingsPage
- 352983f...94d86d5f: admin/Analytics.jsx vs manager/AnalyticsPage.jsx

(Full list available via the checksum scan; rerun the audit script below.)

### C. Reproduce this audit locally
Run from the repo root:

```sh
# Count files
find . -type f -not -path '*/.git/*' -not -path '*/node_modules/*' | wc -l

# Duplicate content groups
find . -type f -not -path '*/.git/*' -not -path '*/node_modules/*' -print0 \
  | xargs -0 shasum -a 256 \
  | awk '{a[$1]=a[$1] "\n" $2; c[$1]++} END{for (h in c) if (c[h]>1){print "HASH " h " COUNT " c[h] a[h] "\n----"}}'

# Basename duplicates (top 100)
find . -type f -not -path '*/.git/*' -not -path '*/node_modules/*' \
  | sed 's#.*/##' | sort | uniq -c | awk '$1>1{print}' | sort -nr | head -n 100

# Duplicate migration numbers
ls -1 database | sed -n 's/^\([0-9][0-9]*\)_.*\.sql$/\1/p' | sort | uniq -c | awk '$1>1{print}'
```

---

If you'd like, I can proceed to implement the non-destructive cleanup (add `.gitignore`, draft component consolidation PR plan, and propose the migration renumbering patch behind a flag).
