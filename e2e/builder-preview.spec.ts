import { expect, test } from "@playwright/test";

test("long address wraps in the builder preview and keeps the invoice number", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/#builder");
  await page.locator("#invoice-business-name").fill("Acme Corp Design");
  await page.locator("#builder textarea").first().fill(`авра${"а".repeat(220)}`);

  const paper = page.locator("#builder article.invoice-paper");
  await expect(paper.getByText("#INV-2026-001")).toBeVisible();
  const box = await paper.boundingBox();
  expect(box?.width ?? 9999).toBeLessThanOrEqual(760);
});

test("download with a missing client name highlights the field", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/#builder");
  await page.getByPlaceholder("Client Name").fill("");
  await page.getByRole("button", { name: "Download PDF" }).click();
  await expect(page.getByText("Enter a client name.")).toBeVisible();
  await expect(page.locator("[data-invalid='true']").first()).toBeVisible();
});
