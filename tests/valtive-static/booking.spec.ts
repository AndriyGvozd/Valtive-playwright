import { test, expect } from '../../fixtures/test';
import { ContactPage } from '../../pages/ContactPage';
import { CalendlyBookingWidget, Slot } from '../../pages/CalendlyBookingWidget';
import { generateTestBooking } from '../../fixtures/testData';

// Business requirement: at least 40 distinct bookable slots. This is
// intentionally separate from SLOTS_TO_BOOK below — an env override for
// local iteration must never silently relax what CI enforces.
const REQUIRED_SLOTS = 40;

// Overridable via BOOKING_SLOTS_COUNT for local smoke-verification runs
// (booking is against a real, live, shared Calendly calendar). Only affects
// how many of the discovered slots get individually booked below; the
// availability check above always requires the full REQUIRED_SLOTS.
const SLOTS_TO_BOOK = Number(process.env.BOOKING_SLOTS_COUNT) || REQUIRED_SLOTS;

let discoveredSlots: Slot[] = [];

test.describe('Calendly slot booking', () => {
  test.beforeAll(async ({ browser }) => {
    // Discovering 40 slots means real calendar navigation (clicking through
    // days/months) — this reliably takes longer than the default 30s hook
    // timeout on CI's slower/colder runners (it fit locally, but failed
    // there with "beforeAll hook timeout of 30000ms exceeded" even after
    // retries, since a too-short timeout isn't something a retry fixes).
    test.setTimeout(90_000);

    const page = await browser.newPage();
    try {
      const contactPage = new ContactPage(page);
      await contactPage.goto();

      const widget = new CalendlyBookingWidget(contactPage.calendlyFrame, page);
      discoveredSlots = await widget.getAvailableSlots(REQUIRED_SLOTS);
    } finally {
      // Must run even if getAvailableSlots() throws (e.g. the site is down) —
      // otherwise this page/context leaks for the rest of the worker's run.
      await page.close();
    }
  });

  test(`exposes at least ${REQUIRED_SLOTS} available time slots`, () => {
    expect(discoveredSlots.length, 'Calendly must expose at least 40 available slots to book').toBeGreaterThanOrEqual(
      REQUIRED_SLOTS
    );
  });

  // Each slot is its own independent test (not one loop inside a single
  // test): a failure on one slot no longer aborts the remaining ones, CI
  // retries only the slot that actually failed instead of re-running all 40
  // from scratch, and the suite can be parallelized (fullyParallel is
  // already enabled in playwright.config.ts).
  for (let i = 0; i < SLOTS_TO_BOOK; i++) {
    const slotIndex = i;

    // Deliberately excludes SLOTS_TO_BOOK from the title: a local override
    // (BOOKING_SLOTS_COUNT) would otherwise change "slot #1"'s full test
    // name between environments (e.g. "#1/3" locally vs "#1/40" on CI),
    // making it look like a different test in Qase/CI history instead of
    // the same test's flakiness trend over time.
    test(`books distinct slot #${slotIndex + 1}`, async ({ contactPage, calendlyWidget }) => {
      test.skip(discoveredSlots.length <= slotIndex, 'Fewer available slots were discovered than expected');
      const slot = discoveredSlots[slotIndex];
      test.info().annotations.push({ type: 'slot', description: `${slot.dateLabel} ${slot.time}` });

      await contactPage.goto();

      // Calendly rejects automated booking submissions with an anti-bot check
      // on its own server; see CalendlyBookingWidget.installBookingMock() for
      // the full rationale. This mock keeps the entire real UI flow
      // (day/time selection, form fill, submit) intact and means this test
      // books zero real slots on the live, shared valtive.io calendar.
      await calendlyWidget.installBookingMock();

      await calendlyWidget.bookSlot(slot, generateTestBooking(slotIndex + 1));

      await expect(calendlyWidget.confirmationHeading).toBeVisible({ timeout: 20000 });
      await expect(calendlyWidget.confirmationBody).toBeVisible();
    });
  }
});
