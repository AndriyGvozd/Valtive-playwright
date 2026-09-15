import { Locator, Page } from '@playwright/test';

export class AboutPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/about-valtive/');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Our Story/i });
  }
}
