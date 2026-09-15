import { test, expect } from '../../fixtures/test';

test.describe('Top-Level Page Navigation Flow', () => {
  test('Navigate through main nav: Home -> Projects -> About Us -> QA Pricing -> Contact Us', async ({
    page,
    homePage,
    projectsPage,
    aboutPage,
    qaPricingPage,
    contactPage,
  }) => {
    await test.step('starts on the homepage', async () => {
      await homePage.goto();
      // Relative-path assertions so this suite still passes when run against
      // a non-production BASE_URL (staging/preview), not just valtive.io.
      await expect(page).toHaveURL('/');
      await expect(homePage.heroHeadingPrimary).toBeVisible();
    });

    await test.step('Home -> Projects', async () => {
      await homePage.navProjectsLink.click();
      await expect(page).toHaveURL('/projects/');
      await expect(projectsPage.heading).toBeVisible();
    });

    await test.step('Projects -> About Us', async () => {
      await homePage.navAboutUsLink.click();
      await expect(page).toHaveURL('/about-valtive/');
      await expect(aboutPage.heading).toBeVisible();
    });

    await test.step('About Us -> QA Pricing', async () => {
      await homePage.navQaPricingLink.click();
      await expect(page).toHaveURL('/qa-pricing/');
      await expect(qaPricingPage.heading).toBeVisible();
    });

    await test.step('QA Pricing -> Contact Us', async () => {
      await homePage.navContactUsLink.click();
      await expect(page).toHaveURL('/contact-valtive/');
      await expect(contactPage.heading).toBeVisible();
    });

    await test.step('Contact Us -> Home', async () => {
      await homePage.navHomeLink.click();
      await expect(page).toHaveURL('/');
      await expect(homePage.heroHeadingPrimary).toBeVisible();
    });
  });
});
