import { Locator, Page } from '@playwright/test';

export class PrivacyPolicyPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Privacy Policy/i }).first();
  }
}
