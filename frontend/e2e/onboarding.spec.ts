import { test, expect } from "@playwright/test";

test.describe("Onboarding page", () => {
  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("IntoMarketing").first()).toBeVisible();
  });
});

test.describe("Onboarding API contracts", () => {
  test("scrape-website requires auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/onboarding/scrape-website", {
      data: { website_url: "https://example.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("save-step requires auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/onboarding/save-step", {
      data: { step: 1, form_data: { company_name: "Test" } },
    });
    expect(res.status()).toBe(401);
  });

  test("step-state requires auth", async ({ request }) => {
    const res = await request.get("http://localhost:8080/onboarding/step-state");
    expect(res.status()).toBe(401);
  });
});
