import { Locator, Page } from '@playwright/test';

/**
 * Page object for the homepage, plus the global header/footer chrome shared
 * across top-level pages (header navigation, footer) — every locator used by
 * a test lives here, none inline in the specs themselves.
 */
export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  // ---- Header / navigation --------------------------------------------

  /** The header navigation menu (as opposed to the sidebar nav on some pages). */
  get nav(): Locator {
    return this.page.locator('nav').last();
  }

  get logoLink(): Locator {
    return this.nav.getByRole('link').filter({ has: this.page.locator('img') }).first();
  }

  get navHomeLink(): Locator {
    return this.nav.getByRole('link', { name: 'Home' });
  }

  get navOurTestingServicesLink(): Locator {
    return this.nav.getByRole('link', { name: 'Our Testing Services' });
  }

  get navProjectsLink(): Locator {
    return this.nav.getByRole('link', { name: 'Projects' });
  }

  get navAboutUsLink(): Locator {
    return this.nav.getByRole('link', { name: 'About Us' });
  }

  get navQaPricingLink(): Locator {
    return this.nav.getByRole('link', { name: 'QA Pricing' });
  }

  get navContactUsLink(): Locator {
    return this.nav.getByRole('link', { name: 'Contact Us' });
  }

  /**
   * Renders as a plain clickable div, not a real link/button role. Scoped to
   * the header nav (not the whole page) so this doesn't turn into a
   * strict-mode violation if a second "Get Free Quote" CTA is ever added
   * elsewhere on the page.
   */
  get getFreeQuoteCta(): Locator {
    return this.nav.getByText('Get Free Quote');
  }

  // ---- Hero section ------------------------------------------------------

  // Partial, case-insensitive matches rather than the full marketing
  // sentence: this is homepage hero copy, which marketing can reword at any
  // time without the underlying claim (years of experience / free trial
  // offer) changing — a full-sentence match would break on a single wording
  // tweak that isn't actually a regression.
  get heroHeadingPrimary(): Locator {
    return this.page.getByRole('heading', { name: /years of combined experience/i }).first();
  }

  get heroHeadingSecondary(): Locator {
    return this.page.getByRole('heading', { name: /free trial/i }).first();
  }

  // ---- Footer --------------------------------------------------------------

  get footer(): Locator {
    return this.page.locator('footer');
  }

  get footerManualTestingLink(): Locator {
    return this.footer.getByRole('link', { name: 'Manual Testing' });
  }

  get footerAutomationTestingLink(): Locator {
    return this.footer.getByRole('link', { name: 'Automation Testing' });
  }

  get footerApiTestingLink(): Locator {
    return this.footer.getByRole('link', { name: 'API Testing' });
  }

  get footerQaAuditLink(): Locator {
    return this.footer.getByRole('link', { name: 'QA Audit' });
  }

  get footerCaseStudiesLink(): Locator {
    return this.footer.getByRole('link', { name: 'Case Studies' });
  }

  get footerPricingLink(): Locator {
    return this.footer.getByRole('link', { name: 'Pricing' });
  }

  get footerTermsOfServiceLink(): Locator {
    return this.footer.getByRole('link', { name: 'Terms of Service' });
  }

  get footerPrivacyPolicyLink(): Locator {
    return this.footer.getByRole('link', { name: 'Privacy Policy' });
  }

  get footerCookiePolicyLink(): Locator {
    return this.footer.getByRole('link', { name: 'Cookie Policy' });
  }

  get footerEmailLink(): Locator {
    return this.footer.getByRole('link', { name: 'ceo@valtive.io' });
  }
}
