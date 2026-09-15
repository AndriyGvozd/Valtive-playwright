import { Page, FrameLocator, Locator } from '@playwright/test';

export class ContactPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/contact-valtive/');
  }

  get calendlyFrame(): FrameLocator {
    return this.page.frameLocator('iframe[src*="calendly.com"]');
  }

  get calendlyIframeElement(): Locator {
    return this.page.locator('iframe[src*="calendly.com"]');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Contact Valtive', level: 1 });
  }

  get breadcrumbHomeLink(): Locator {
    return this.page.getByRole('link', { name: 'Home' }).first();
  }

  get breadcrumbProjectsLink(): Locator {
    return this.page.getByRole('link', { name: 'Projects' }).first();
  }

  get getInTouchHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Get in Touch' });
  }

  /**
   * Partial, case-insensitive match rather than the full marketing sentence
   * (which also uses a curly apostrophe — an easy, meaningless source of
   * mismatch on its own): this only needs to confirm the intro blurb is
   * still there, not police its exact wording.
   */
  get introText(): Locator {
    return this.page.getByText(/love to hear from you/i);
  }

  // ---- 'Contact Information' sidebar --------------------------------------

  private get contactInfoAddress(): Locator {
    return this.page.locator('address');
  }

  get contactInfoHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Contact Information' });
  }

  /** Plain text here (not a link) — the mailto: link lives only in the page footer. */
  get contactInfoEmailText(): Locator {
    return this.contactInfoAddress.getByText('ceo@valtive.io');
  }

  get contactInfoLocationText(): Locator {
    return this.contactInfoAddress.getByText('New Jersey, USA');
  }

  get contactInfoLinkedInLink(): Locator {
    return this.contactInfoAddress.locator('a[href*="linkedin.com"]');
  }
}
