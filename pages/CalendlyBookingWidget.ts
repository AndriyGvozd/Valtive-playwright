import { FrameLocator, Locator, Page } from '@playwright/test';

export interface Slot {
  /** How many "Go to next month" clicks are needed from the initial view to reach this slot's month. */
  monthOffset: number;
  /** Accessible day button name, e.g. "Monday, September 14 - Times available" */
  dayButtonName: string;
  /** Human-readable date label, e.g. "September 14, 2026" */
  dateLabel: string;
  /** Time label, e.g. "21:00" */
  time: string;
}

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  notes?: string;
}

const TIME_BUTTON_RE = /^\d{1,2}:\d{2}$/;
const AVAILABLE_DAY_RE = /Times available$/;
const BOOKING_ENDPOINT = '**/api/booking/invitees';

/**
 * Page object for the embedded Calendly booking widget (iframe).
 */
export class CalendlyBookingWidget {
  /**
   * Single source of truth for the mocked confirmation copy — used both to
   * render the stub in injectMockConfirmation() and to assert on it in
   * tests via confirmationHeading/confirmationBody, so the two can't drift
   * out of sync the way two independently hardcoded copies of the same
   * string could.
   */
  static readonly CONFIRMATION_HEADING = 'You are scheduled';
  static readonly CONFIRMATION_BODY = 'A calendar invitation has been sent to your email address.';

  private bookingMockInstalled = false;

  constructor(private readonly frame: FrameLocator, private readonly page: Page) {}

  /** The "Select a Day" heading shown once the calendar view has rendered. */
  get selectADayHeading(): Locator {
    return this.frame.getByRole('heading', { name: 'Select a Day' });
  }

  get confirmationHeading(): Locator {
    return this.frame.getByText(CalendlyBookingWidget.CONFIRMATION_HEADING, { exact: false });
  }

  get confirmationBody(): Locator {
    return this.frame.getByText(CalendlyBookingWidget.CONFIRMATION_BODY, { exact: false });
  }

  /**
   * Calendly's live booking endpoint (`POST /api/booking/invitees`) rejects
   * automated submissions outright with a device-fingerprint-based anti-bot
   * check ("This booking cannot be completed... For security reasons...",
   * backed by Stytch's `stytch_block_verdict`), regardless of headless vs.
   * headed mode or spoofing `navigator.webdriver`/user-agent (verified
   * manually — same rejection, different trace ID, every time). Fully
   * reproducing Calendly's success response would require reverse-engineering
   * their private, minified frontend's internal Redux state shape, which is
   * unstable across their deploys and not something this suite should be
   * built around.
   *
   * Instead, this mocks only the final network call with a generic success
   * response, then replaces the Calendly iframe body with an explicit,
   * clearly-labelled stub confirmation containing Calendly's real
   * confirmation copy. Everything up to and including the real "Schedule
   * Event" click and its real outgoing request still exercises this app's
   * real page objects and real Calendly UI — only the confirmation screen
   * that Calendly itself refuses to render for a bot is stubbed. This also
   * means the suite books zero real slots on the shared, live valtive.io
   * calendar.
   */
  async installBookingMock(): Promise<void> {
    if (this.bookingMockInstalled) return;
    this.bookingMockInstalled = true;

    await this.page.route(BOOKING_ENDPOINT, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ mocked: true }),
      });
    });
  }

  /**
   * Replaces the iframe body with a stub confirmation screen carrying
   * Calendly's real confirmation copy. See {@link installBookingMock} for why
   * this is necessary instead of asserting on Calendly's own rendered UI.
   */
  private async injectMockConfirmation(): Promise<void> {
    await this.frame.locator('body').evaluate(
      (body, { heading, text }) => {
        body.innerHTML = '';
        const container = document.createElement('div');
        container.setAttribute('data-testid', 'mock-booking-confirmation');
        container.innerHTML = `<h1>${heading}</h1><p>${text}</p>`;
        body.appendChild(container);
      },
      { heading: CalendlyBookingWidget.CONFIRMATION_HEADING, text: CalendlyBookingWidget.CONFIRMATION_BODY }
    );
  }

  /**
   * Waits for the "Select a Day" calendar to render. Day availability is
   * fetched asynchronously *after* the month status announcement: every day
   * cell renders immediately as "No times available" and the real
   * availability data (which flips some cells to "Times available") arrives
   * slightly later via an async fetch. This polls the "Times available"
   * count until it has been stable across two consecutive reads, rather than
   * guessing a fixed delay is long enough (a plain `waitForTimeout` was
   * flaky under slower network conditions and wasteful under fast ones).
   *
   * A single stable reading isn't enough on its own, since "0 available
   * days" is itself a valid stable-looking transient state while data is
   * still loading — requiring two consecutive equal, non-transient reads a
   * short interval apart filters that out in practice.
   */
  async waitForCalendarReady(): Promise<void> {
    await this.selectADayHeading.waitFor({ timeout: 20000 });
    await this.frame.getByRole('status').filter({ hasText: 'is now displayed' }).waitFor({ timeout: 15000 });

    const availableDayButtons = this.frame.getByRole('button', { name: AVAILABLE_DAY_RE });

    // The availability fetch hasn't necessarily started yet the instant the
    // month status announces — a "0 available" reading taken immediately
    // here is not real data, it's the pre-fetch placeholder state, and would
    // otherwise look falsely "stable" against itself on the very first poll.
    // This short, fixed head start only delays the first *measurement*; the
    // actual "is it done loading" decision below is still adaptive, not a
    // blind sleep-and-hope for the whole wait.
    await this.page.waitForTimeout(1000);

    const deadline = Date.now() + 9000;
    let previousCount = await availableDayButtons.count();

    while (Date.now() < deadline) {
      await this.page.waitForTimeout(300);
      const currentCount = await availableDayButtons.count();
      if (currentCount === previousCount) return;
      previousCount = currentCount;
    }
  }

  /**
   * Reads available days across month(s), advancing via "Go to next month" until
   * `count` slots are collected or no more months are available. Each returned
   * slot records `monthOffset` so bookSlot() can navigate back to the right month
   * after a fresh page load.
   */
  async getAvailableSlots(count: number): Promise<Slot[]> {
    await this.waitForCalendarReady();
    const slots: Slot[] = [];
    const visitedDays = new Set<string>();
    let monthOffset = 0;

    while (slots.length < count) {
      const availableDayButtons = this.frame.getByRole('button', { name: AVAILABLE_DAY_RE });
      const dayCount = await availableDayButtons.count();

      for (let i = 0; i < dayCount && slots.length < count; i++) {
        const dayButton = availableDayButtons.nth(i);
        const dayButtonName = (await dayButton.getAttribute('aria-label')) ?? (await dayButton.textContent()) ?? '';
        if (visitedDays.has(dayButtonName)) continue;
        visitedDays.add(dayButtonName);

        await dayButton.click();
        await this.frame.getByRole('heading', { name: 'Select a Time' }).waitFor({ timeout: 10000 });

        const dateLabel =
          (await this.frame.locator('text=/^[A-Z][a-z]+ \\d{1,2}, \\d{4}$/').first().textContent()) ?? '';
        const timeButtons = this.frame.getByRole('button', { name: TIME_BUTTON_RE });
        const timeCount = await timeButtons.count();

        for (let t = 0; t < timeCount && slots.length < count; t++) {
          const time = (await timeButtons.nth(t).textContent()) ?? '';
          slots.push({ monthOffset, dayButtonName, dateLabel: dateLabel.trim(), time: time.trim() });
        }

        await this.frame.getByRole('button', { name: 'Go to previous page' }).click();
        await this.waitForCalendarReady();
      }

      if (slots.length >= count) break;

      // Distinguish "button doesn't exist / is disabled" (legitimate end of
      // pagination) from a real error reading its state — the previous
      // `.catch(() => false)` treated both the same way, silently returning
      // fewer slots than actually available with no diagnostic if
      // `isEnabled()` ever failed for an unrelated reason (e.g. a detached
      // node during a re-render).
      const nextMonthButton = this.frame.getByRole('button', { name: 'Go to next month' });
      if ((await nextMonthButton.count()) === 0 || !(await nextMonthButton.isEnabled())) break;

      await nextMonthButton.click();
      await this.waitForCalendarReady();
      monthOffset++;
    }

    return slots;
  }

  /** Clicks "Go to next month" `offset` times from the currently visible "Select a Day" view. */
  private async navigateToMonth(offset: number): Promise<void> {
    await this.waitForCalendarReady();
    for (let i = 0; i < offset; i++) {
      await this.frame.getByRole('button', { name: 'Go to next month' }).click();
      await this.waitForCalendarReady();
    }
  }

  /**
   * Books one slot: navigates to the slot's month, opens its day, selects the
   * time, fills the "Enter Details" form and submits. Assumes the contact page
   * has just been (re)loaded, i.e. the calendar's "Select a Day" view for the
   * initial month is currently visible.
   */
  async bookSlot(slot: Slot, details: BookingDetails): Promise<void> {
    await this.navigateToMonth(slot.monthOffset);

    await this.frame.getByRole('button', { name: slot.dayButtonName }).click();
    await this.frame.getByRole('heading', { name: 'Select a Time' }).waitFor({ timeout: 10000 });

    await this.frame.getByRole('button', { name: slot.time, exact: true }).click();
    await this.frame.getByRole('button', { name: /^Next/ }).click();

    await this.frame.getByRole('heading', { name: 'Enter Details' }).waitFor({ timeout: 10000 });
    await this.frame.getByRole('textbox', { name: 'First name *' }).fill(details.firstName);
    await this.frame.getByRole('textbox', { name: 'Last name *' }).fill(details.lastName);
    await this.frame.getByRole('textbox', { name: 'Email *' }).fill(details.email);
    if (details.notes) {
      await this.frame
        .getByRole('textbox', { name: 'Please share anything that will help prepare for our meeting.' })
        .fill(details.notes);
    }

    await this.frame.getByRole('button', { name: 'Schedule Event' }).click();

    // Fail loudly, not silently, if the mocked booking request never fires or
    // doesn't come back with the mocked success status — e.g. if Calendly
    // changes this endpoint's URL, installBookingMock()'s route pattern would
    // stop matching, the real (rejecting) endpoint would be hit instead, and
    // swallowing that here would let this test keep "passing" off a stub
    // confirmation while silently no longer verifying the real request path.
    const bookingResponse = await this.page.waitForResponse(
      (response) => response.url().includes('/api/booking/invitees') && response.request().method() === 'POST',
      { timeout: 15000 }
    );
    if (bookingResponse.status() !== 201) {
      throw new Error(
        `Expected the mocked booking request to resolve with status 201, got ${bookingResponse.status()}. ` +
          'installBookingMock() may no longer be intercepting the real Calendly endpoint.'
      );
    }
    await this.injectMockConfirmation();
  }
}
