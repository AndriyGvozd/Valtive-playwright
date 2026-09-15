const RUN_ID = Date.now().toString(36);

export interface TestBooking {
  firstName: string;
  lastName: string;
  email: string;
  notes: string;
}

/**
 * Generates clearly test-labeled, unique booking data for one Calendly slot.
 * Note: Calendly rejects "+" in emails and unusual TLDs (e.g. ".test") as
 * invalid, so we use example.com (RFC 2606 reserved, non-deliverable) with
 * a unique local part instead.
 */
export function generateTestBooking(index: number): TestBooking {
  return {
    firstName: 'Playwright',
    lastName: `QA-Test-${index}`,
    email: `playwright-qa-test-${RUN_ID}-${index}@example.com`,
    notes: `Automated Playwright test booking (run ${RUN_ID}, #${index}). Safe to ignore.`,
  };
}
