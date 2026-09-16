import { FrameLocator, Locator, Page, expect } from '@playwright/test';

export interface Slot {
  /** How many "Go to next month" clicks are needed from the initial view to reach this slot's month. */
  monthOffset: number;
  /** Accessible day button name, e.g. "Monday, September 14 - Times available" */
  dayButtonName: string;
  /** Human-readable date label, e.g. "September 14, 2026" */
  dateLabel: string;
  /**
   * The time button's `data-start-time` value, e.g. "21:00" — always 24h
   * format regardless of how the button's *visible* text is rendered.
   * Deliberately not the visible label: Calendly renders time buttons in
   * either 24h ("21:00") or 12h-with-am/pm ("9:30am") depending on locale,
   * and this was observed to differ even between two page loads in the same
   * CI run, not just between machines — matching on the visible text
   * (including via an exact-match click later) is unreliable, while this
   * attribute is stable and always in one format.
   */
  time: string;
}

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  notes?: string;
}

// Selects time-slot buttons by their stable `data-container`/`data-start-time`
// attributes rather than by visible text or accessible name — Calendly
// renders the same button's text in either 24h ("21:00") or 12h-with-am/pm
// ("9:30am") format depending on locale, and this was observed to differ
// unpredictably even between page loads within the same CI run. The
// `data-start-time` attribute is always 24h, regardless of display format.
const TIME_BUTTON_SELECTOR = 'button[data-container="time-button"]';
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

  /**
   * Forces the widget's time display to 24h notation via its own "Time
   * zone" panel (a `Time format` radio group with "am/pm"/"24h" options).
   * This widget defaults to either notation depending on locale — observed
   * to default to 24h locally but 12h-with-am/pm on CI — and every part of
   * this page object depends on a single, predictable notation (the
   * `data-start-time` attribute this relies on elsewhere is unaffected by
   * notation, but reasoning about times consistently is much simpler pinned
   * to one format).
   *
   * Clicked via the real DOM `.click()` method (through `evaluate`) rather
   * than Playwright's simulated pointer click: this widget renders inside
   * an <iframe> on a page with its own sticky navbar, and when Playwright
   * scrolls the target into view it can land under that navbar — which is
   * outside the iframe entirely but visually overlaps it, so Playwright's
   * actionability check reports the navbar as "intercepting pointer
   * events" and retries forever (confirmed both by an explicit timeout
   * error locally and, before that timeout was added, by this silently
   * consuming an entire 300s hook budget with no error on CI). A native
   * `.click()` call doesn't do hit-testing against overlapping elements, so
   * it isn't affected by an overlay that's outside this iframe's own
   * document and wouldn't actually block a real click on the target itself.
   */
  async ensure24HourTimeFormat(): Promise<void> {
    const timeZoneButton = this.frame.getByRole('button', { name: /Time zone/ });
    await timeZoneButton.waitFor({ timeout: 10000 });
    await timeZoneButton.evaluate((el: HTMLElement) => el.click());

    const option24h = this.frame.locator('input[name="time_notation"][value="24h"]');
    await option24h.waitFor({ timeout: 10000, state: 'attached' });
    await option24h.evaluate((el: HTMLInputElement) => el.click());

    await this.page.keyboard.press('Escape');
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
   * slightly later via an async fetch/render pass, with no DOM signal (no
   * spinner, no `aria-busy`) marking when that finishes — confirmed by
   * inspecting the widget directly. In the absence of such a signal, this
   * uses `expect.poll` (Playwright's own polling primitive) to wait until
   * the "Times available" count has read the same value on three
   * consecutive polls a fixed interval apart, rather than a single
   * `waitForTimeout` sleep-and-hope for an arbitrary duration.
   *
   * The interval is set explicitly (rather than left at `expect.poll`'s
   * default, which starts at 100ms) because a fast enough cadence can
   * observe "0 available" as stable purely by coincidence, well before the
   * real fetch/render has even started — this was verified to happen with
   * the default schedule. Spacing reads further apart makes that false
   * positive far less likely without guessing a total wait duration: the
   * loop still exits the instant real stability is observed, rather than
   * always waiting out a fixed window.
   */
  async waitForCalendarReady(): Promise<void> {
    await this.selectADayHeading.waitFor({ timeout: 20000 });
    await this.frame.getByRole('status').filter({ hasText: 'is now displayed' }).waitFor({ timeout: 15000 });

    const availableDayButtons = this.frame.getByRole('button', { name: AVAILABLE_DAY_RE });
    let previousCount = -1;
    let stableStreak = 0;

    await expect
      .poll(
        async () => {
          const currentCount = await availableDayButtons.count();
          stableStreak = currentCount === previousCount ? stableStreak + 1 : 0;
          previousCount = currentCount;
          return stableStreak;
        },
        { timeout: 25000, intervals: [800] }
      )
      .toBeGreaterThanOrEqual(2);
  }

  /**
   * Reads available days across month(s), advancing via "Go to next month" until
   * `count` slots are collected or no more months are available. Each returned
   * slot records `monthOffset` so bookSlot() can navigate back to the right month
   * after a fresh page load.
   */
  async getAvailableSlots(count: number): Promise<Slot[]> {
    const diag = !!process.env.CI;
    const t0 = Date.now();
    const log = (msg: string) => {
      if (diag) console.log(`[DIAG +${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
    };

    await this.waitForCalendarReady();
    log('waitForCalendarReady (initial) done');
    await this.ensure24HourTimeFormat();
    log('ensure24HourTimeFormat done');
    const slots: Slot[] = [];
    const visitedDays = new Set<string>();
    let monthOffset = 0;

    while (slots.length < count) {
      const availableDayButtons = this.frame.getByRole('button', { name: AVAILABLE_DAY_RE });
      const dayCount = await availableDayButtons.count();
      log(`month offset ${monthOffset}: dayCount=${dayCount}, slots so far=${slots.length}`);

      for (let i = 0; i < dayCount && slots.length < count; i++) {
        const dayButton = availableDayButtons.nth(i);
        const dayButtonName = (await dayButton.getAttribute('aria-label')) ?? (await dayButton.textContent()) ?? '';
        if (visitedDays.has(dayButtonName)) continue;
        visitedDays.add(dayButtonName);

        const dayStart = Date.now();
        await dayButton.click();
        await this.frame.getByRole('heading', { name: 'Select a Time' }).waitFor({ timeout: 10000 });

        const dateLabel =
          (await this.frame.locator('text=/^[A-Z][a-z]+ \\d{1,2}, \\d{4}$/').first().textContent()) ?? '';
        const timeButtons = this.frame.locator(TIME_BUTTON_SELECTOR);
        // The calendar's day list is a snapshot from one earlier fetch; this
        // is a real, live, shared production calendar, so by the time we
        // actually open a day another visitor may have already taken every
        // slot on it in the meantime. Treat "no time buttons ever appeared
        // for this day" as that legitimate, occasional case and move on to
        // the next day, rather than letting the whole discovery run fail
        // because one specific day lost its availability out from under us.
        const hasTimes = await timeButtons
          .first()
          .waitFor({ timeout: 15000 })
          .then(() => true)
          .catch(() => false);
        log(`day "${dayButtonName}": hasTimes=${hasTimes} after ${((Date.now() - dayStart) / 1000).toFixed(1)}s`);
        if (!hasTimes) {
          await this.frame.getByRole('button', { name: 'Go to previous page' }).click();
          await this.waitForCalendarReady();
          continue;
        }
        const timeCount = await timeButtons.count();

        for (let t = 0; t < timeCount && slots.length < count; t++) {
          const time = (await timeButtons.nth(t).getAttribute('data-start-time')) ?? '';
          slots.push({ monthOffset, dayButtonName, dateLabel: dateLabel.trim(), time });
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

    log(`done: ${slots.length} slots collected`);
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
    // Each call to bookSlot() follows a fresh contactPage.goto(), so the
    // time-format notation needs re-forcing here too (see
    // ensure24HourTimeFormat's doc comment) — it isn't carried over from
    // getAvailableSlots()'s earlier call on a since-discarded page instance.
    await this.waitForCalendarReady();
    await this.ensure24HourTimeFormat();
    await this.navigateToMonth(slot.monthOffset);

    await this.frame.getByRole('button', { name: slot.dayButtonName }).click();
    await this.frame.getByRole('heading', { name: 'Select a Time' }).waitFor({ timeout: 10000 });

    // Clicked by the stable data-start-time attribute rather than the
    // visible label — see Slot.time's doc comment for why matching on
    // rendered text (e.g. via an exact accessible-name match) is unreliable
    // here.
    await this.frame.locator(`${TIME_BUTTON_SELECTOR}[data-start-time="${slot.time}"]`).click();
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
