# zero-beat-labs-demo

Interactive demos for ZeroBeatLabs, deployed at **`demo.zerobeatlabs.org`**.
Plain static HTML/CSS/JS — no build step, no dependencies.

## Live demo: `/reconcile`

`demo.zerobeatlabs.org/reconcile` — **"the honesty layer."** Edit sanitized
ticket and uptime exports and watch a leadership-ready report recount itself
from the rows in real time. A verification panel compares every live figure
against the kit's published baseline and turns **red the instant a total stops
reconciling**. This is the differentiator the main site claims in prose
("generic AI summaries are not enough when totals need to match"), shown
working instead of described.

All data is **synthetic** (fictional "Northstar Field Services") and labeled as
such in the UI. The numbers reproduce the verification targets in the vault kit
`Clients/IT-ops-report-kit-template/dp-007-kit/06-Sample-Report.md`.

### Files

| File | Role |
| --- | --- |
| `reconcile/index.html` | The demo page (UI + rendering, imports the core) |
| `reconcile/compute.js` | Pure reconciliation core + synthetic data + targets. **Single source of truth for every number.** |
| `reconcile/compute.test.mjs` | Node self-check: all 15 targets reconcile; tamper is flagged |
| `index.html` | Demo index / landing |
| `CNAME` | `demo.zerobeatlabs.org` |
| `.github/workflows/deploy.yml` | GitHub Pages deploy (static, no build) |

## Local development & verification

```sh
# Serve over HTTP (ES module imports do not work over file://)
python3 -m http.server 8766
# open http://localhost:8766/reconcile/

# Correctness self-check (no browser needed)
node reconcile/compute.test.mjs
```

**Verified locally 2026-06-17:** `compute.test.mjs` → `OK: 15/15 targets
reconcile; tamper correctly flagged`. In-browser: no console errors, all 15
figures reconcile on load, "Break a total" flips a closed ticket to open and
3 figures correctly drift red (closed/open counts + median resolution).

## Deployment — `demo.zerobeatlabs.org`

This subdomain is a **new property**, mirroring the per-property pattern in the
vault (`environment.yaml → web_properties`). Remaining steps are **admin-gated**
and need the `zerobeatlabs` GitHub login + Porkbun DNS (the `samjolley` account
is only a Write collaborator):

1. Create repo `zerobeatlabs/zero-beat-labs-demo`, push this to `main`.
2. **Settings → Pages → Source: GitHub Actions** (workflow deploys on push).
3. **Settings → Pages → Custom domain:** `demo.zerobeatlabs.org`
   (`CNAME` keeps it across deploys). Enable **Enforce HTTPS** once issued.
4. **Porkbun DNS:** add a `CNAME` for `demo` → `zerobeatlabs.github.io`
   (do not touch the apex `A` records or any MX/mail records).
5. Verify TLS + that `demo.zerobeatlabs.org/reconcile/` loads.

## Optional: lightweight embedded video (NOT yet generated)

If a hero loop helps, keep it small and local — do not generate it here yet:

- ~12–18s silent screen capture of editing a CSV cell → the report recounting
  → "Break a total" turning the verification panel red. Tools: ScreenToGif or
  OBS. Export to `reconcile/media/reconcile-loop.mp4` (H.264, <2 MB) + a poster
  `reconcile/media/reconcile-poster.png`.
- Embed as a muted, `loop` `autoplay` `playsinline` `<video>` with the poster,
  above the workbench. Keep the live interaction as the primary; the video is
  only a hook for visitors who do not interact.

## Resume state

Done: demo built, verified locally, git-committed. Next action is the
**admin-gated deploy** above (or hand off to Sam for the `zerobeatlabs` login +
Porkbun DNS). Pointer to this repo lives in the vault at
`30-Resources/Business/B-02-ZeroBeatLabs/Websites/Website Repositories.md`.
