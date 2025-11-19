# Archived/Removed Files (Cleanup Record)

Date: 2025-11-08

The following non-runtime markdowns and example files are slated for removal to declutter the repository root. Runtime code and build flow are unaffected.

If you prefer not to delete, move them into `docs/archive/`.

## Example files (remove or move)
- backend-api-example.js
- supabase-edge-function-example.ts (example only; real Edge functions live under `supabase/functions/`)

## Root markdowns (moved to docs/archive/)
- AFTER_RATING_SUBMISSION.md
- ANALYTICS_DASHBOARD_COMPLETE.md
- BULK_OPERATIONS_COMPLETE.md
- CLEANUP_SUMMARY.md
- COMPLETE_ORDER_WORKFLOW.md
- CUSTOMER_PAGE_DESIGN.md
- DASHBOARD_ENHANCEMENT_SUMMARY.md
- DATA_EXPORT_FIX.md
- DESIGN_COMPARISON.md
- DESIGN_SYSTEM_IMPLEMENTATION.md
- EDGE_FUNCTIONS_GUIDE.md
- ERROR_RESOLUTION_COMPLETE.md
- EXPORT_ERRORS_ALL_FIXED.md
- FINAL_EXPORT_FIX.md
- IMPLEMENTATION_COMPLETE.md
- IMPLEMENTATION_GUIDE.md
- IMPORT_ERROR_FIXED.md
- LIGHT_MODE_FIX_SUMMARY.md
- LINT_ERRORS_FIXED.md
- MANAGERS_IMPLEMENTATION.md
- MIGRATION_UPDATE.md
- MULTITENANCY.md
- PAYMENT_EXPORT_FIX.md
- PERFORMANCE_OPTIMIZATION.md
- PHASE_1_COMPLETE.md
- PHASE_2_BILLING_COMPLETE.md
- PHASE_2_COMPLETE.md
- PHASE_2_PROGRESS_REPORT.md
- PRODUCTION_DEPLOYMENT.md
- QUICK_ACTIONS_UPDATE.md
- QUICK_FIX_GUIDE.md
- QUICK_START_SUBSCRIPTION.md
- REALTIME_RATINGS_GUIDE.md
- RECURSION_FIX_COMPLETE.md
- RESTAURANT_FORM_IMPLEMENTATION.md
- RLS_POLICY_FIX.md
- SESSION_BASED_ORDERING.md
- SESSION_IMPLEMENTATION_GUIDE.md
- STAFF_VIEW_FIX_SUMMARY.md
- SUBSCRIPTIONS_IMPLEMENTATION.md
- SUPERADMIN_COMPLETE_FUNCTIONALITY.md
- SUPERADMIN_COMPONENTS_GUIDE.md
- SUPERADMIN_DELIVERY_SUMMARY.md
- SUPERADMIN_EXPANSION_COMPLETE.md
- SUPERADMIN_IMPLEMENTATION_SUMMARY.md
- SUPERADMIN_MODULE_DESIGN.md
- TECHNICAL_ANALYSIS_REPORT.md
- TOAST_JSX_FIX.md
- TRIAL_EXPIRATION_GUIDE.md
- UNIFIED_RESTAURANTS_SUBSCRIPTIONS.md
- UNIFIED_SUBSCRIPTION_GUIDE.md
- UNIFIED_SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md
- USERS_SCHEMA_FIX.md

## Retained at root
- README.md
- SECURITY.md

## Rationale
1. None of these files are imported by runtime modules under `src/`.
2. They represent historical progress, design notes, or interim fixes now encoded directly in the codebase.
3. Removing them reduces cognitive load and root clutter.

## Next Steps
All unwanted markdowns were moved to `docs/archive/` to preserve history.

If you decide to fully delete them later:
```
git rm -r docs/archive
git commit -m "chore: purge archived docs"
```


