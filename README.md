# Valtive Contact Form / Calendly Booking Automation

**📊 [View test run reports in Qase](https://app.qase.io/run/VP)** (sorted newest-first — the top entry is the latest run) — every run of this suite (local via `npm run test:qase`, or CI) uploads its results here automatically.

**⚙️ [View CI runs on GitHub Actions](https://github.com/AndriyGvozd/Valtive-playwright/actions/workflows/playwright.yml)** (also newest-first).

Playwright end-to-end test automation for [valtive.io](https://valtive.io): the embedded Calendly booking widget on the contact page, plus fast smoke coverage of the rest of the site's static pages and navigation.

## What this project does

- Drives the real Calendly widget on `/contact-valtive/` through its full booking flow — select a day, select a time, fill the "Enter Details" form, submit — across **40 distinct, independently-discovered time slots** (different days and, where needed, different months), and asserts the confirmation shows **"You are scheduled"** and **"A calendar invitation has been sent to your email address."** for each one.
- Covers the rest of the site (homepage, footer, Projects/About/QA Pricing pages, legal pages, contact page static content) with fast, independent smoke and navigation checks.
- Was built and iterated on using Playwright's own **[Test Agents](https://playwright.dev/docs/test-agents)** — see **Built with Playwright Test Agents** below for exactly how.
- Uploads every run's results automatically to **[Qase TMS](https://www.qase.io)**.
- Runs on CI via GitHub Actions on every push/PR.

## Structure

### Page Objects (`pages/`)

| File | Responsibility |
|---|---|
| `ContactPage.ts` | Contact page navigation, Calendly `<iframe>` locator, page heading/breadcrumbs, "Get in Touch" intro, "Contact Information" sidebar |
| `CalendlyBookingWidget.ts` | The embedded Calendly widget itself: discovering available slots across months (`getAvailableSlots`), booking one slot end-to-end (`bookSlot`), the booking-mock rationale (see below) |
| `HomePage.ts` | Homepage hero content, header navigation (all 6 links), footer (all columns/links), "Get Free Quote" CTA |
| `ProjectsPage.ts`, `AboutPage.ts`, `QaPricingPage.ts` | Headings for each top-level marketing page |
| `TermsOfServicePage.ts`, `PrivacyPolicyPage.ts`, `CookiePolicyPage.ts` | Headings for the legal pages linked from the footer |

Every locator used anywhere in the test suite lives in one of these classes — no `page.getByRole(...)`/`page.locator(...)` calls appear directly inside a `*.spec.ts` file.

### Fixtures (`fixtures/`)

- `test.ts` — extends Playwright's base `test` with one fixture per page object above (`contactPage`, `homePage`, `projectsPage`, `aboutPage`, `qaPricingPage`, `termsOfServicePage`, `privacyPolicyPage`, `cookiePolicyPage`, `calendlyWidget`), so every spec gets ready-to-use page objects via dependency injection instead of constructing them manually.
- `testData.ts` — `generateTestBooking()` generates unique, clearly test-labeled booking data (name/email/notes) per slot, using the RFC 2606 reserved `example.com` domain.

### Tests (`tests/valtive-static/`)

| File | Covers |
|---|---|
| `booking.spec.ts` | The core ТЗ requirement: discovers ≥40 available slots, then books each as its own independent test (day → time → form → submit → confirmation asserted) |
| `contact-page.smoke.spec.ts` | The contact page loads and the Calendly widget actually renders its calendar |
| `contact-static.spec.ts` | Contact page's static content (heading, intro, sidebar) without touching the Calendly widget |
| `homepage.spec.ts` | Homepage hero content, full header nav, logo, CTA |
| `footer.spec.ts` | Footer content and every link's `href` across all its columns |
| `footer-links.spec.ts` | Footer legal links (Terms/Privacy/Cookie) actually navigate to the right pages |
| `nav-flow.spec.ts` | Full header-nav walkthrough: Home → Projects → About → QA Pricing → Contact → Home |
| `page-uniqueness.spec.ts` | Each top-level page has its own distinct title/heading |

## Built with Playwright Test Agents

This suite doesn't just *use* Playwright — parts of it were built with Playwright's official **[Test Agents](https://playwright.dev/docs/test-agents)** (`.claude/agents/`, `.mcp.json`): three Claude subagents that drive a real browser via a dedicated MCP server rather than writing code from a static description.

- **`playwright-test-planner`** explored the live site and the Calendly widget in a real browser and produced test plans as markdown (`specs/`) — e.g. discovering real form-validation error copy, the widget's actual DOM structure, and confirming Calendly's booking-window limits, all before a line of test code was written.
- **`playwright-test-generator`** took plan items and generated the static-page spec files (`homepage.spec.ts`, `footer.spec.ts`, etc.) by actually clicking through the site and capturing real, working locators — not guessed ones.
- **`playwright-test-healer`** was used to run and diagnose failing specs directly against real browser state (DOM snapshots, network, console) when a test needed fixing.

Notably, using the planner's own live-browser tools is how the anti-bot limitation described below was actually diagnosed (inspecting the real `POST /api/booking/invitees` request/response), not guessed at.

## Running locally

```bash
npm ci
npx playwright install --with-deps chromium
```

Smoke test:

```bash
npm run test:smoke
```

Full suite, including the 40-slot booking run:

```bash
npm test
```

Just the booking suite (single worker; see below — this books zero real slots, but still drives the real Calendly UI, so it shouldn't run concurrently against the same live calendar):

```bash
npm run test:booking
```

View the HTML report:

```bash
npm run report
```

## Qase TMS integration

Test results upload automatically to **[Qase](https://www.qase.io)** — project `VP`, **[Test Runs](https://app.qase.io/run/VP)**. The `playwright-qase-reporter` is wired into `playwright.config.ts` but only activates when `QASE_MODE=testops` and `QASE_TESTOPS_API_TOKEN` are set, so `npm test` stays usable without a Qase account.

Local setup:

```bash
cp .env.example .env
# fill in QASE_TESTOPS_API_TOKEN and QASE_TESTOPS_PROJECT
npm run test:qase
```

In CI, set `QASE_TESTOPS_API_TOKEN` and `QASE_TESTOPS_PROJECT` as GitHub Actions repository secrets — `.github/workflows/playwright.yml` picks them up automatically.

## CI

`.github/workflows/playwright.yml` runs on push/PR to `main`/`master` and on manual dispatch: installs dependencies, runs the smoke test then the full suite (static site checks + the 40-slot booking test; single worker, chromium only), uploads the HTML report as a build artifact, and (when secrets are configured) pushes results to Qase.

## Why the booking confirmation is mocked

Calendly's live booking endpoint (`POST /api/booking/invitees`) rejects automated submissions outright with a device-fingerprint-based anti-bot check (Stytch `stytch_block_verdict`), returning:

> "This booking cannot be completed. For security reasons, we are not able to finalize this booking from your current session."

This happens regardless of headless vs. headed mode, or spoofing `navigator.webdriver`/user-agent — verified manually, same rejection with a different trace ID every time. It's an intentional protection on Calendly's side against exactly this kind of automated mass-booking, not a bug in this suite, and not something this suite tries to evade.

`CalendlyBookingWidget.installBookingMock()` intercepts only that one network call and returns a generic success response, then replaces the Calendly iframe body with a stub confirmation element carrying Calendly's real confirmation copy (`CalendlyBookingWidget.CONFIRMATION_HEADING` / `CONFIRMATION_BODY` — a single source of truth used both to render the stub and to assert on it). Reproducing Calendly's actual success screen would require reverse-engineering their private, minified frontend's internal Redux state shape — fragile, unstable across their deploys, and out of scope for this suite.

Everything up to and including the real "Schedule Event" click and its real outgoing request still exercises this app's own real page objects, real Calendly UI, and real slot/day/time discovery (`getAvailableSlots`, unaffected by the mock). Only the confirmation screen that Calendly itself refuses to render for a bot is stubbed. Net effect: the suite books **zero** real slots on the live, shared valtive.io calendar.

**Scope this implies, stated plainly:** the confirmation assertions in `booking.spec.ts` (`expect(calendlyWidget.confirmationHeading).toBeVisible()`, etc.) check that the stub this suite itself injected renders correctly — not that Calendly's real confirmation screen still shows that copy. A real change to Calendly's own confirmation UI would not be caught by these 40 tests. What they *do* verify, end-to-end and for real, is: the day/time picker renders and is navigable, the "Enter Details" form accepts input, "Schedule Event" fires the real `POST /api/booking/invitees` request, and that request is well-formed enough to reach the (mocked) endpoint. `booking.spec.ts`'s `test.describe` title says this explicitly so it isn't easy to miss on a first read of the file.

## Notes

- `booking.spec.ts` explicitly configures `test.describe.configure({ mode: 'serial' })`, rather than relying only on `playwright.config.ts`'s global `workers: 1`. Every slot test reads from a module-level `discoveredSlots` array populated once by `beforeAll`; serial mode keeps that safe even if the global worker count ever changes for unrelated reasons.
- Contact-info copy asserted on in `ContactPage.ts` (email, location) is defined as named static constants (`ContactPage.CONTACT_EMAIL`, `ContactPage.CONTACT_LOCATION`) rather than inline string literals in each locator, matching the pattern already used for the Calendly confirmation copy (`CalendlyBookingWidget.CONFIRMATION_HEADING`/`CONFIRMATION_BODY`) — a real content change fails with one named, obvious diff instead of a bare string mismatch buried in a locator call.
- Test bookings use `@example.com` emails (RFC 2606 reserved, non-deliverable) with a per-run unique local part, and clearly test-labeled names/notes — kept even though no real booking is created, in case the mock is ever removed once a non-production Calendly environment is available.
- `booking.spec.ts` hits a real, live, third-party network endpoint (Calendly) for each of its 40 slots; occasional transient timeouts there are network flakiness, not code defects — retries are enabled (`retries: 1` locally, `2` on CI) precisely to absorb this without manual re-runs.
