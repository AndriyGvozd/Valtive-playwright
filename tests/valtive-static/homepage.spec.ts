import { test, expect } from '../../fixtures/test';

test.describe('Homepage Hero and Navigation', () => {
  test('Homepage loads with expected hero content and navigation', async ({ page, homePage }) => {
    await homePage.goto();
    await expect(page).toHaveTitle(/Valtive/);
    await expect(homePage.heroHeadingPrimary).toBeVisible();
    await expect(homePage.heroHeadingSecondary).toBeVisible();

    await expect(homePage.navHomeLink).toBeVisible();
    await expect(homePage.navOurTestingServicesLink).toBeVisible();
    await expect(homePage.navProjectsLink).toBeVisible();
    await expect(homePage.navAboutUsLink).toBeVisible();
    await expect(homePage.navQaPricingLink).toBeVisible();
    await expect(homePage.navContactUsLink).toBeVisible();

    // Logo — checked by structure (nav link wrapping an image), not by a
    // hardcoded absolute href, so this still passes when BASE_URL points at
    // a non-production environment.
    await expect(homePage.logoLink).toBeVisible();
    await expect(homePage.logoLink.locator('img')).toBeVisible();

    await expect(homePage.getFreeQuoteCta).toBeVisible();
  });
});
