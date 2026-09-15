import { test, expect } from '../../fixtures/test';

test.describe('Homepage Footer Navigation', () => {
  test('Footer legal links navigate to correct pages', async ({
    page,
    homePage,
    termsOfServicePage,
    privacyPolicyPage,
    cookiePolicyPage,
  }) => {
    await test.step('Terms of Service link navigates correctly', async () => {
      await homePage.goto();
      await homePage.footer.scrollIntoViewIfNeeded();
      await homePage.footerTermsOfServiceLink.click();
      await expect(page).toHaveURL(/terms-of-service-valtive/);
      await expect(termsOfServicePage.heading).toBeVisible();
    });

    await test.step('Privacy Policy link navigates correctly', async () => {
      await homePage.goto();
      await homePage.footer.scrollIntoViewIfNeeded();
      await homePage.footerPrivacyPolicyLink.click();
      await expect(page).toHaveURL(/privacy-policy-valtive/);
      await expect(privacyPolicyPage.heading).toBeVisible();
    });

    await test.step('Cookie Policy link navigates correctly', async () => {
      await homePage.goto();
      await homePage.footer.scrollIntoViewIfNeeded();
      await homePage.footerCookiePolicyLink.click();
      await expect(page).toHaveURL(/cookie-policy-valtive/);
      await expect(cookiePolicyPage.heading).toBeVisible();
    });
  });
});
