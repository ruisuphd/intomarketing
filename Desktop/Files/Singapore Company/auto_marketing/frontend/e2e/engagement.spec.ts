import { test, expect } from "@playwright/test";

test.describe("Engagement APIs — Auth Contracts", () => {
  test("health score requires auth", async ({ request }) => {
    const res = await request.get("http://localhost:8080/api/dashboard/health-score");
    expect(res.status()).toBe(401);
  });

  test("settings goals GET requires auth", async ({ request }) => {
    const res = await request.get("http://localhost:8080/api/settings/goals");
    expect(res.status()).toBe(401);
  });

  test("settings goals PUT requires auth", async ({ request }) => {
    const res = await request.put("http://localhost:8080/api/settings/goals", {
      data: { post_frequency: 20, lead_volume: 10, follower_growth: 50 },
    });
    expect(res.status()).toBe(401);
  });

  test("push subscribe requires auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/api/push/subscribe", {
      data: { endpoint: "https://push.example.com/sub", keys: { p256dh: "key", auth: "auth" } },
    });
    expect(res.status()).toBe(401);
  });

  test("content ideas GET requires auth", async ({ request }) => {
    const res = await request.get("http://localhost:8080/api/content-ideas");
    expect(res.status()).toBe(401);
  });

  test("content ideas POST requires auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/api/content-ideas", {
      data: { text: "Write about our new feature" },
    });
    expect(res.status()).toBe(401);
  });

  test("bulk approve requires auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/api/drafts/bulk-approve", {
      data: { draft_ids: ["fake-id"] },
    });
    expect(res.status()).toBe(401);
  });

  test("draft history requires auth", async ({ request }) => {
    const res = await request.get("http://localhost:8080/api/drafts/fake-id/history");
    expect(res.status()).toBe(401);
  });

  test("lead activities POST requires auth", async ({ request }) => {
    const res = await request.post("http://localhost:8080/api/leads/fake-id/activities", {
      data: { activity_type: "note_added", content: "Test note" },
    });
    expect(res.status()).toBe(401);
  });
});
