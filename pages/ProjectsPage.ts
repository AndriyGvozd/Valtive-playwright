import { Locator, Page } from '@playwright/test';

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/projects/');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Projects', level: 1 });
  }
}
