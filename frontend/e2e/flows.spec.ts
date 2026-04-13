import { test, expect } from "@playwright/test";

async function dismissCookieIfPresent(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "Accept All" });
  try {
    await accept.waitFor({ state: "visible", timeout: 3000 });
    await accept.click();
  } catch {
    /* no banner */
  }
}

test.describe("Public flows", () => {
  test("help page documents current capabilities", async ({ page }) => {
    await page.goto("/help#capabilities");
    await expect(page.getByRole("heading", { name: /Current capabilities/i })).toBeVisible();
    await expect(page.getByText(/illustrative or incomplete/i)).toBeVisible();
  });

  test("billing URL leaves /billing (forwards toward settings)", async ({ page }) => {
    await page.goto("/billing");
    await expect(page).not.toHaveURL(/\/billing\/?$/);
    await expect(page).toHaveURL(/\/settings\?.*tab=billing|\/login/);
  });

  test("legal accept sends unauthenticated users to login", async ({ page }) => {
    await page.goto("/legal/accept");
    await expect(page).toHaveURL(/\/login/);
  });

  test("home links to capabilities from hero", async ({ page }) => {
    await page.goto("/");
    await dismissCookieIfPresent(page);
    await page.getByRole("link", { name: /what ships today/i }).click();
    await expect(page).toHaveURL(/\/help#capabilities/);
    await expect(page.getByRole("heading", { name: /Current capabilities/i })).toBeVisible();
  });
});

test.describe("Responsive viewports", () => {
  test("homepage renders at mobile width (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  test("homepage renders at tablet width (768px)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("homepage renders at desktop width (1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("dashboard redirects correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    // Should redirect to login when unauthenticated
    await expect(page).toHaveURL(/\/(\?.*)?$|\/login/, { timeout: 5000 });
  });
});
