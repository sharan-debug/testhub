# Improvements

All items from this file have been incorporated into the V1 implementation plan.

See:
- `docs/V1_SCOPE_MATRIX.md` — what is built in V1 vs later
- `docs/CURRENT_STATE.md` — implementation sequence
- `docs/DATA_MODEL.md` — updated feature model (notes field, attachments)

## Pre-deployment security gate

Before going live, confirm with the security/platform team that sending internal test data to the AI endpoint is covered by the company's data handling policy.

"API is accessible from our VPN" does not automatically mean "company data is approved to be sent to that model."

## Deferred

- Fix agent key issue in Docker container (known issue, deferred)
- Push to personal git — remove Anthropic key first
