import { Page, FrameLocator, Locator } from '@playwright/test';

export class ContactPage {
  /**
   * Single source of truth for contact-info copy asserted on below — kept as
   * named constants (not inline literals) so a real change to this content
   * fails with a clear, named diff instead of a bare string-mismatch inside
   * a locator call.
   */
  static readonly CONTACT_EMAIL = 'ceo@valtive.io';
  static readonly CONTACT_LOCATION = 'New Jersey, USA';

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
    return this.contactInfoAddress.getByText(ContactPage.CONTACT_EMAIL);
  }

  get contactInfoLocationText(): Locator {
    return this.contactInfoAddress.getByText(ContactPage.CONTACT_LOCATION);
  }

  get contactInfoLinkedInLink(): Locator {
    return this.contactInfoAddress.locator('a[href*="linkedin.com"]');
  }
}
