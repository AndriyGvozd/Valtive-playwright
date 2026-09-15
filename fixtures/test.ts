import { test as base, expect } from '@playwright/test';
import { ContactPage } from '../pages/ContactPage';
import { HomePage } from '../pages/HomePage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { AboutPage } from '../pages/AboutPage';
import { QaPricingPage } from '../pages/QaPricingPage';
import { TermsOfServicePage } from '../pages/TermsOfServicePage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { CookiePolicyPage } from '../pages/CookiePolicyPage';
import { CalendlyBookingWidget } from '../pages/CalendlyBookingWidget';

type Fixtures = {
  contactPage: ContactPage;
  homePage: HomePage;
  projectsPage: ProjectsPage;
  aboutPage: AboutPage;
  qaPricingPage: QaPricingPage;
  termsOfServicePage: TermsOfServicePage;
  privacyPolicyPage: PrivacyPolicyPage;
  cookiePolicyPage: CookiePolicyPage;
  calendlyWidget: CalendlyBookingWidget;
};

export const test = base.extend<Fixtures>({
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  aboutPage: async ({ page }, use) => {
    await use(new AboutPage(page));
  },
  qaPricingPage: async ({ page }, use) => {
    await use(new QaPricingPage(page));
  },
  termsOfServicePage: async ({ page }, use) => {
    await use(new TermsOfServicePage(page));
  },
  privacyPolicyPage: async ({ page }, use) => {
    await use(new PrivacyPolicyPage(page));
  },
  cookiePolicyPage: async ({ page }, use) => {
    await use(new CookiePolicyPage(page));
  },
  calendlyWidget: async ({ page, contactPage }, use) => {
    await use(new CalendlyBookingWidget(contactPage.calendlyFrame, page));
  },
});

export { expect };
