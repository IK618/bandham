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

  test("User edits profile, updates Weight Category, and views Trust Shield Hub", async ({ page }) => {
    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill("input[placeholder*='ananya@bandhan.local']", "ananya@bandhan.local");
    await page.fill("input[type='password']", "Ananya@12345");
    await page.click("button:has-text('Sign In Securely')");
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // 2. Open Edit Profile
    await page.goto(`${BASE_URL}/profile/edit`);
    await expect(page.locator("h1")).toContainText("Edit Matrimonial Profile");

    // 3. Verify Profile Picture Studio & Action Buttons
    await expect(page.locator("text=Profile Picture & Portrait")).toBeVisible();
    await expect(page.locator("button:has-text('Take Live Selfie')")).toBeVisible();
    await expect(page.locator("button:has-text('Upload from Gallery')")).toBeVisible();

    // 4. Verify 4-Pillar Trust Shield Hub
    await expect(page.locator("text=Trust Shield Verification Hub")).toBeVisible();
    await expect(page.locator("text=1. Government ID")).toBeVisible();
    await expect(page.locator("text=2. Selfie Liveness Check")).toBeVisible();

    // 5. Update Weight Category & Weight in kg
    const weightSelect = page.locator("#profileWeightCategory");
    await expect(weightSelect).toBeVisible();
    await weightSelect.selectOption("50 - 60 kg");

    const weightInput = page.locator("#profileWeightKg");
    await weightInput.fill("55");

    // 6. Save Profile
    await page.click("button:has-text('Save Profile Portfolio')");
    await expect(page.locator("text=successfully saved")).toBeVisible({ timeout: 10000 });
  });

  test("User filters candidates by Weight Category on Search Page", async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await expect(page.locator("h1")).toContainText("Search Matrimonial Profiles");

    // Select Weight Category filter
    const weightFilter = page.locator("#weightCategoryFilter");
    await expect(weightFilter).toBeVisible();
    await weightFilter.selectOption("50 - 60 kg");

    // Apply Filter
    await page.click("button:has-text('Apply Filters')");
    await expect(page).toHaveURL(/.*weight_category=50.*60/, { timeout: 8000 });

    // Verify filter summary badge and candidate cards
    await expect(page.locator("text=Weight: 50 - 60 kg")).toBeVisible();
    const candidateCards = page.locator("text=50 - 60 kg");
    await expect(candidateCards.first()).toBeVisible();
  });
});
