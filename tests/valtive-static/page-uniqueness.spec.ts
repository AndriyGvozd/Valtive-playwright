import { test, expect } from '../../fixtures/test';

test.describe('Top-Level Page Titles and Headings', () => {
  test('Each top-level page has a unique title and heading', async ({
    page,
    projectsPage,
    aboutPage,
    qaPricingPage,
    contactPage,
  }) => {
    await test.step('Projects page', async () => {
      await projectsPage.goto();
      await expect(page).toHaveTitle(/Projects/);
      await expect(projectsPage.heading).toBeVisible();
    });

    await test.step('About page', async () => {
      await aboutPage.goto();
      await expect(page).toHaveTitle(/About/);
      await expect(aboutPage.heading).toBeVisible();
    });

    await test.step('QA Pricing page', async () => {
      await qaPricingPage.goto();
      await expect(page).toHaveTitle(/Pricing/);
      await expect(qaPricingPage.heading).toBeVisible();
    });

    await test.step('Contact page', async () => {
      await contactPage.goto();
      await expect(page).toHaveTitle(/Contact/);
      await expect(contactPage.heading).toBeVisible();
      await expect(contactPage.breadcrumbHomeLink).toBeVisible();
      await expect(contactPage.breadcrumbProjectsLink).toBeVisible();
    });
  });
});
