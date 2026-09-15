import { test, expect } from '../../fixtures/test';

test('contact page exposes the Calendly booking widget', async ({ contactPage, calendlyWidget }) => {
  await contactPage.goto();

  await expect(contactPage.heading).toBeVisible();
  // Assert the calendar actually rendered, not just that the iframe body
  // exists — an iframe body is visible even when Calendly fails to load
  // (e.g. shows its own error state), so a body-only check wouldn't catch
  // that.
  await expect(calendlyWidget.selectADayHeading).toBeVisible({ timeout: 20000 });
});
