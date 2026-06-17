# AGENTS.md — zero-beat-labs-demo

Static demo site for `demo.zerobeatlabs.org`. No build, no dependencies.

## Rules

- **`reconcile/compute.js` is the single source of truth for every number.**
  Do not hardcode results in `index.html`; the page must recount from rows.
- Keep all demo data **synthetic and labeled**. It must reproduce the kit
  baseline in the vault (`Clients/IT-ops-report-kit-template/dp-007-kit/
  06-Sample-Report.md`). If you change the data, update `TARGETS` and rerun
  `node reconcile/compute.test.mjs`.
- ES modules need an HTTP server locally (not `file://`):
  `python3 -m http.server 8766`.
- Never claim real client outcomes, revenue, or deployments.
