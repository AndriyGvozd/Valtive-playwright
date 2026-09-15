import { test, expect } from '../../fixtures/test';

test.describe('Homepage Footer Content', () => {
  test('Footer links and content are present on homepage', async ({ homePage }) => {
    await homePage.goto();
    await homePage.footer.scrollIntoViewIfNeeded();
    await expect(homePage.footer).toBeVisible();

    await test.step('copyright notice is present', async () => {
      // Copyright year isn't hardcoded to a specific year — that would break
      // this test every January without the site actually changing.
      await expect(homePage.footer).toContainText(/© \d{4} Valtive OÜ/);
      await expect(homePage.footer).toContainText('All Rights Reserved');
    });

    await test.step('"Services" column links are correct', async () => {
      await expect(homePage.footerManualTestingLink).toBeVisible();
      await expect(homePage.footerManualTestingLink).toHaveAttribute('href', /\/manual-testing\/$/);
      await expect(homePage.footerAutomationTestingLink).toBeVisible();
      await expect(homePage.footerAutomationTestingLink).toHaveAttribute('href', /\/automation-testing-services\/$/);
      await expect(homePage.footerApiTestingLink).toBeVisible();
      await expect(homePage.footerApiTestingLink).toHaveAttribute('href', /\/api-testing-services\/$/);
      await expect(homePage.footerQaAuditLink).toBeVisible();
      await expect(homePage.footerQaAuditLink).toHaveAttribute('href', /\/quality-audit\/$/);
    });

    await test.step('"Resources" column links are correct', async () => {
      await expect(homePage.footerCaseStudiesLink).toBeVisible();
      await expect(homePage.footerCaseStudiesLink).toHaveAttribute('href', /\/projects\/$/);
      await expect(homePage.footerPricingLink).toBeVisible();
      await expect(homePage.footerPricingLink).toHaveAttribute('href', /\/qa-pricing\/$/);
    });

    await test.step('"Legal/Contact" column links are correct', async () => {
      await expect(homePage.footerTermsOfServiceLink).toBeVisible();
      await expect(homePage.footerTermsOfServiceLink).toHaveAttribute('href', /\/terms-of-service-valtive\/$/);
      await expect(homePage.footerPrivacyPolicyLink).toBeVisible();
      await expect(homePage.footerPrivacyPolicyLink).toHaveAttribute('href', /\/privacy-policy-valtive\/$/);
      await expect(homePage.footerCookiePolicyLink).toBeVisible();
      await expect(homePage.footerCookiePolicyLink).toHaveAttribute('href', /\/cookie-policy-valtive\/$/);

      await expect(homePage.footerEmailLink).toBeVisible();
      await expect(homePage.footerEmailLink).toHaveAttribute('href', 'mailto:ceo@valtive.io');
    });
  });
});
