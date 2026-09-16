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
// availability check enforced in beforeAll always requires the full
// REQUIRED_SLOTS.
const SLOTS_TO_BOOK = Number(process.env.BOOKING_SLOTS_COUNT) || REQUIRED_SLOTS;

let discoveredSlots: Slot[] = [];

test.describe('Calendly slot booking', () => {
  test.beforeAll(async ({ browser }) => {
    // Discovering 40 slots means visiting every available day individually,
    // and CalendlyBookingWidget.waitForCalendarReady() is called once per
    // visit (up to ~16.5s each on CI's much slower rendering — see its own
    // comment for why). With several days typically needed to accumulate 40
    // slots, that adds up well past even a generous single-call budget.
    // Sized for the realistic worst case of this multiplying across ~8
    // day-visits on a slow runner.
    test.setTimeout(180_000);

    const page = await browser.newPage();
    try {
      const contactPage = new ContactPage(page);
      await contactPage.goto();

      const widget = new CalendlyBookingWidget(contactPage.calendlyFrame, page);
      discoveredSlots = await widget.getAvailableSlots(REQUIRED_SLOTS);

      // Asserted here rather than as its own separate test: a standalone
      // assertion test that only ever runs this one check reports as a
      // confusing, unexplained "(0ms)" failure disconnected from the real
      // beforeAll work that produced it. Asserting inside the hook instead
      // fails every dependent test with one clear, single root-cause
      // message pointing straight at this line.
      expect(
        discoveredSlots.length,
        `Calendly must expose at least ${REQUIRED_SLOTS} available slots to book, found ${discoveredSlots.length}`
      ).toBeGreaterThanOrEqual(REQUIRED_SLOTS);
    } finally {
      // Must run even if getAvailableSlots() throws (e.g. the site is down) —
      // otherwise this page/context leaks for the rest of the worker's run.
      await page.close();
    }
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
