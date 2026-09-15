# Valtive.io Static Site Smoke Test Plan

## Application Overview

This test plan covers fast, static smoke checks for the marketing site https://valtive.io. It focuses on page loads, top-level navigation, footer link presence, and basic visibility of key UI elements (logo, CTA button). The Calendly booking widget/iframe embedded on the Contact page (calendar, day/time selection, "Enter Details" form) is explicitly OUT OF SCOPE and must not be interacted with or explored — it is covered by a separate test plan. On the Contact page, only the top-level page heading and surrounding static content should be verified; do not click into or wait on the embedded booking iframe.

## Test Scenarios

### 1. Homepage and Global Elements

**Seed:** `tests/seed.spec.ts`

#### 1.1. Homepage loads with expected hero content and navigation

**File:** `tests/valtive-static/homepage.spec.ts`

**Steps:**
  1. Navigate to https://valtive.io
    - expect: Page loads successfully with title containing 'Valtive'
    - expect: Hero heading '+167 years of combined experience' is visible
    - expect: Hero heading 'Get a free trial! Test us by yourself' is visible
  2. Check the main navigation menu at the top of the page
    - expect: Nav links 'Home', 'Our Testing Services', 'Projects', 'About Us', 'QA Pricing', and 'Contact Us' are all visible in the navigation
  3. Check the logo image in the header
    - expect: The Valtive logo image is visible and links to https://valtive.io/
  4. Check the 'Get Free Quote' button in the header
    - expect: The 'Get Free Quote' button/element is visible on the page

#### 1.2. Footer links and content are present on homepage

**File:** `tests/valtive-static/footer.spec.ts`

**Steps:**
  1. Navigate to https://valtive.io and scroll to the footer
    - expect: Footer is visible with copyright text '© 2026 Valtive OÜ' and 'All Rights Reserved'
  2. Locate the 'Services' column in the footer
    - expect: Links 'Manual Testing', 'Automation Testing', 'API Testing', and 'QA Audit' are visible and point to /manual-testing/, /automation-testing-services/, /api-testing-services/, /quality-audit/ respectively
  3. Locate the 'Resources' column in the footer
    - expect: Links 'Case Studies' (-> /projects/) and 'Pricing' (-> /qa-pricing/) are visible
  4. Locate the 'Legal/Contact' column in the footer
    - expect: Links 'Terms of Service' (-> /terms-of-service-valtive/), 'Privacy Policy' (-> /privacy-policy-valtive/), and 'Cookie Policy' (-> /cookie-policy-valtive/) are visible
    - expect: The email link 'ceo@valtive.io' with mailto: href is visible

#### 1.3. Footer legal links navigate to correct pages

**File:** `tests/valtive-static/footer-links.spec.ts`

**Steps:**
  1. Navigate to https://valtive.io, scroll to footer, and click the 'Terms of Service' link
    - expect: Browser navigates to a URL containing 'terms-of-service-valtive'
    - expect: Page loads with a heading related to Terms of Service
  2. Navigate back to https://valtive.io, scroll to footer, and click the 'Privacy Policy' link
    - expect: Browser navigates to a URL containing 'privacy-policy-valtive'
    - expect: Page loads with a heading related to Privacy Policy
  3. Navigate back to https://valtive.io, scroll to footer, and click the 'Cookie Policy' link
    - expect: Browser navigates to a URL containing 'cookie-policy-valtive'
    - expect: Page loads with a heading related to Cookie Policy

### 2. Top-Level Page Navigation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Navigate through main nav: Home -> Projects -> About Us -> QA Pricing -> Contact Us

**File:** `tests/valtive-static/nav-flow.spec.ts`

**Steps:**
  1. Navigate to https://valtive.io (Home)
    - expect: URL is https://valtive.io/
    - expect: Hero heading '+167 years of combined experience' is visible
  2. Click the 'Projects' link in the main navigation
    - expect: URL changes to https://valtive.io/projects/
    - expect: A page heading related to 'Projects' is visible, distinct from the homepage heading
  3. Click the 'About Us' link in the main navigation
    - expect: URL changes to https://valtive.io/about-valtive/
    - expect: A page heading related to 'About' is visible
  4. Click the 'QA Pricing' link in the main navigation
    - expect: URL changes to https://valtive.io/qa-pricing/
    - expect: A page heading related to 'Pricing' is visible
  5. Click the 'Contact Us' link in the main navigation
    - expect: URL changes to https://valtive.io/contact-valtive/
    - expect: The page heading 'Contact Valtive' is visible
  6. Click the 'Home' link in the main navigation
    - expect: URL returns to https://valtive.io/
    - expect: Homepage hero content is visible again

#### 2.2. Each top-level page has a unique title and heading

**File:** `tests/valtive-static/page-uniqueness.spec.ts`

**Steps:**
  1. Navigate directly to https://valtive.io/projects/
    - expect: Page title contains 'Projects' or similar; a distinct top-level heading is visible on the page
  2. Navigate directly to https://valtive.io/about-valtive/
    - expect: Page title contains 'About' or similar; a distinct top-level heading is visible, different from the Projects page heading
  3. Navigate directly to https://valtive.io/qa-pricing/
    - expect: Page title contains 'Pricing' or similar; a distinct top-level heading is visible
  4. Navigate directly to https://valtive.io/contact-valtive/
    - expect: Page title contains 'Contact' and heading 'Contact Valtive' is visible; breadcrumb links 'Home' and 'Projects' are visible below the heading

### 3. Contact Page Static Content (excluding Calendly widget)

**Seed:** `tests/seed.spec.ts`

#### 3.1. Contact page renders static content without interacting with the booking widget

**File:** `tests/valtive-static/contact-static.spec.ts`

**Steps:**
  1. Navigate to https://valtive.io/contact-valtive/
    - expect: Page heading 'Contact Valtive' is visible
    - expect: URL is https://valtive.io/contact-valtive/
  2. Check the 'Get in Touch' section heading and intro paragraph near the top of the page
    - expect: Heading 'Get in Touch' is visible
    - expect: Introductory paragraph mentioning scheduling a call or dropping a message is visible
  3. Verify the embedded booking iframe container is present on the page WITHOUT clicking into it, selecting any date/time, or interacting with any 'Enter Details' form inside it
    - expect: An iframe element is present in the 'Get in Touch' section (existence/visibility only, no interaction)
  4. Check the sidebar 'Contact Information' panel
    - expect: Heading 'Contact Information' is visible
    - expect: Email 'ceo@valtive.io' text is visible
    - expect: Location text 'New Jersey, USA' is visible
    - expect: A LinkedIn link is visible
  5. Do NOT scroll into, click, or wait on any calendar day/time picker or 'Enter Details' form within the iframe
    - expect: Test completes quickly without waiting for or interacting with Calendly widget internals
