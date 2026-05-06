import { expect, test } from "@playwright/test";

test("marketing home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toBeVisible();
});

test.describe("full workspace (opt-in)", () => {
  test.skip(!process.env.E2E_FULL, "Set E2E_FULL=1 to run against a configured authenticated environment");

  test("integrations route responds", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.locator("body")).toBeVisible();
  });
});
