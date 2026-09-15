import { test, expect } from '../../fixtures/test';

test.describe('Contact Page Static Content (excluding Calendly widget)', () => {
  test('Contact page renders static content without interacting with the booking widget', async ({
    page,
    contactPage,
  }) => {
    await contactPage.goto();
    await expect(contactPage.heading).toBeVisible();
    await expect(page).toHaveURL('/contact-valtive/');

    await expect(contactPage.getInTouchHeading).toBeVisible();
    await expect(contactPage.introText).toBeVisible();

    // Verify the embedded booking iframe container is present WITHOUT
    // clicking into it, selecting any date/time, or interacting with the
    // 'Enter Details' form inside it — existence/visibility only.
    await expect(contactPage.calendlyIframeElement).toBeVisible();

    await expect(contactPage.contactInfoHeading).toBeVisible();
    await expect(contactPage.contactInfoEmailText).toBeVisible();
    await expect(contactPage.contactInfoLocationText).toBeVisible();
    await expect(contactPage.contactInfoLinkedInLink).toBeVisible();
  });
});
