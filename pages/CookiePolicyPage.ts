import { Locator, Page } from '@playwright/test';

export class CookiePolicyPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Cookie Policy/i }).first();
  }
}
