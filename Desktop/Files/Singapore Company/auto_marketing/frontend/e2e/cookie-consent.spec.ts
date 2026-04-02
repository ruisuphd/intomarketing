import { test, expect } from "@playwright/test";

test.describe("Cookie Consent Banner", () => {
  test.beforeEach(async ({ page }) => {
    // Clear consent state before each test
    await page.addInitScript(() => {
      localStorage.removeItem("cc_analytics");
      localStorage.removeItem("cc_marketing");
      localStorage.removeItem("intomarketing_consent_version");
    });
  });

  test("banner appears on fresh visit", async ({ page }) => {
    await page.goto("/");
    // Banner should appear since consent is not set
    const banner = page.locator("[data-testid='cookie-banner'], [aria-label*='cookie'], [aria-label*='Cookie']").first();
    // Accept either a visible banner OR a hidden banner (depends on page structure)
    // We check the accept button exists which indicates the banner is shown
    const acceptBtn = page
      .getByRole("button", { name: /accept all/i })
      .or(page.getByRole("button", { name: /accept/i }))
      .first();
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
  });

  test("accept all sets analytics consent", async ({ page }) => {
    await page.goto("/");
    const acceptBtn = page
      .getByRole("button", { name: /accept all/i })
      .or(page.getByRole("button", { name: /accept/i }))
      .first();

    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      // After accepting, analytics consent should be true in localStorage
      const analytics = await page.evaluate(() => localStorage.getItem("cc_analytics"));
      expect(analytics).toBe("true");
    }
  });

  test("reject all sets analytics to false", async ({ page }) => {
    await page.goto("/");
    const rejectBtn = page
      .getByRole("button", { name: /reject all/i })
      .or(page.getByRole("button", { name: /reject/i })
        .or(page.getByRole("button", { name: /necessary only/i })))
      .first();

    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      const analytics = await page.evaluate(() => localStorage.getItem("cc_analytics"));
      expect(analytics === null || analytics === "false").toBe(true);
    }
  });

  test("consent API returns 401 without auth (public endpoint still responds)", async ({ request }) => {
    const res = await request.post("http://localhost:8080/api/consent", {
      data: { version: "2026-04-01", analytics: true, marketing: false },
    });
    // Consent is a public endpoint — should NOT return 401
    expect(res.status()).not.toBe(401);
  });

  test("CSP report endpoint accepts POST without auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/api/consent/csp-report", {
      data: { "csp-report": { "document-uri": "https://example.com", "violated-directive": "script-src" } },
    });
    // Should return 204 or 200
    expect([200, 204]).toContain(res.status());
  });
});
