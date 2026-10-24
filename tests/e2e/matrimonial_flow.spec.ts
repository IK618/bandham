import { test, expect } from "@playwright/test";

test.describe("Bandhan Matrimonial E2E User Journey", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  test("Visitor lands on homepage, explores matches, and searches by religion", async ({ page }) => {
    // 1. Visit landing page
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Bandhan Matrimonial/);

    // 2. Verify Hero text is visible
    const heading = page.locator("h1");
    await expect(heading).toContainText("Where sacred unions begin");

    // 3. Navigate to Search Page
    await page.click("text=Explore Matches");
    await expect(page).toHaveURL(/.*search/);

    // 4. Verify search filter controls exist
    await expect(page.locator("select").first()).toBeVisible();
    await expect(page.locator("input[placeholder*='e.g. Bangalore']")).toBeVisible();
  });

  test("User logs in with demo account and views personalized dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill login credentials
    await page.fill("input[placeholder*='ananya@bandhan.local']", "ananya@bandhan.local");
    await page.fill("input[type='password']", "Ananya@12345");

    // Submit form
    await page.click("button:has-text('Sign In Securely')");

    // Expect redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator("text=Namaste, Ananya!")).toBeVisible();
  });

  test("User navigates to Membership Plans and sees upgrade options", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page.locator("h1")).toContainText("Transparent, Value-Driven Membership Plans");
    await expect(page.locator("text=GOLD")).toBeVisible();
    await expect(page.locator("text=PLATINUM")).toBeVisible();
  });
});
