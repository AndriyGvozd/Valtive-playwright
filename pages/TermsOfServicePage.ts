import { Locator, Page } from '@playwright/test';

export class TermsOfServicePage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Terms of Service/i }).first();
  }
}
