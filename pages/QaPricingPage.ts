import { Locator, Page } from '@playwright/test';

export class QaPricingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/qa-pricing/');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /QA Pricing/i });
  }
}
