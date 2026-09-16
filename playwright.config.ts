import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Qase TMS reporter is opt-in: it only activates when QASE_MODE=testops and
 * QASE_TESTOPS_API_TOKEN are set (locally via .env, or as CI secrets) —
 * QASE_TESTOPS_PROJECT is also required by the reporter itself. This keeps
 * `npm test` usable without a Qase account.
 */
const qaseEnabled = process.env.QASE_MODE === 'testops' && !!process.env.QASE_TESTOPS_API_TOKEN;

const reporters: ReporterDescription[] = [['html'], ['list']];
if (qaseEnabled) {
  reporters.push(['playwright-qase-reporter']);
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /*
   * booking.spec.ts hits a real, live, third-party network endpoint
   * (Calendly) for each of its 40 slots; occasional transient timeouts
   * there are expected network flakiness, not code defects (verified by
   * re-running failed slots in isolation — they pass cleanly). Retries are
   * enabled everywhere, not just on CI, so this doesn't require a special
   * flag to get a clean local run. CI retries a bit more since it's often
   * running on noisier/shared infrastructure.
   */
  retries: process.env.CI ? 2 : 1,
  /*
   * Single worker everywhere: booking.spec.ts books real Calendly slots against
   * a shared live calendar, so it must never run concurrently (either as
   * multiple workers, or as multiple browser projects at once). Always run it
   * with `npx playwright test tests/valtive-static/booking.spec.ts --project=chromium`.
   */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: reporters,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. Overridable via
     * BASE_URL (env var or .env) to run against staging/preview without
     * touching source. */
    baseURL: process.env.BASE_URL ?? 'https://valtive.io',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /*
     * Pinned explicitly rather than left at the OS default: the Calendly
     * widget buckets its time slots into calendar days according to the
     * browser's timezone. Locally that defaulted to "Eastern European Time"
     * (matching this machine's OS zone); GitHub Actions runners default to
     * UTC instead. That mismatch made every single day in the calendar
     * report itself as having times available (a check apparently done
     * without full timezone-aware bucketing) while the detailed per-day
     * view — which IS timezone-aware — found zero times for every one of
     * them on CI, 100% reproducibly. Pinning this makes the test
     * environment's timezone consistent regardless of where it runs, which
     * is the actual fix (not a workaround for a code bug — there wasn't
     * one; the two environments were legitimately configured differently).
     * Matches the value Calendly's own API reports as this event type's
     * `availability_timezone`.
     */
    timezoneId: 'Europe/Berlin',
  },

  /* Chromium only: the booking flow books real, shared Calendly slots, so we
   * don't want it running redundantly across multiple browser engines. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
