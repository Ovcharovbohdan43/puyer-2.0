import { expect, test } from "@playwright/test";

test.describe("signup → invoice → share → pay surfaces", () => {
  test("landing, magic-link start, public invoice, and pay API", async ({ page, request }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Login" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Invoice" }).first()).toBeVisible();
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
    await page.goto("/");

    await page.getByRole("button", { name: "Login" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to Puyer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(page.getByRole("img", { name: /invoice being paid/i })).toBeVisible();

    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/pricing/);

    await page.goto("/help");
    await expect(page.getByRole("heading", { name: "Help Center" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send request" })).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/team");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);

    const missingInvoice = await page.goto("/invoice/not-a-public-id");
    expect(missingInvoice?.status()).toBe(404);
    await expect(page.locator("body")).not.toContainText("organizationId");

    const pay = await request.post("/api/public/invoices/not-a-public-id/pay");
    expect(pay.status()).toBe(404);
    const payload = await pay.text();
    expect(payload).not.toContain("organizationId");
    expect(payload).not.toContain("userId");
    expect(payload).not.toContain("stripeAccount");
  });

  test("legal pages and cookie window", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("dialog", { name: "Cookies on Puyer" })).toBeVisible();
    await page.getByRole("button", { name: "Accept all" }).click();
    await expect(page.getByRole("dialog", { name: "Cookies on Puyer" })).toHaveCount(0);

    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.locator("body")).toContainText("does not hold");

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();

    await page.goto("/cookies");
    await expect(page.getByRole("heading", { name: "Cookie Policy" })).toBeVisible();
    await page.getByRole("button", { name: "Cookie settings" }).first().click();
    await expect(page.getByRole("dialog", { name: "Cookies on Puyer" })).toBeVisible();
  });

  test("live public invoice pay button when E2E_PUBLIC_INVOICE_ID is set", async ({ page }) => {
    const publicId = process.env.E2E_PUBLIC_INVOICE_ID;
    test.skip(!publicId, "Set E2E_PUBLIC_INVOICE_ID to exercise a real test-mode invoice.");
    await page.goto(`/invoice/${publicId}`);
    await expect(page.getByText("Pay Invoice").or(page.getByText("already paid", { exact: false }))).toBeVisible();
  });

  test("public payer portal contrast in dark theme", async ({ page }) => {
    const publicId = process.env.E2E_PUBLIC_INVOICE_ID;
    test.skip(!publicId, "Set E2E_PUBLIC_INVOICE_ID to exercise a real test-mode invoice.");
    await page.addInitScript(() => {
      localStorage.setItem("puyer-theme", "dark");
    });
    await page.goto(`/invoice/${publicId}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({ path: "test-results/payer-dark.png", fullPage: true });
    const contrast = await page.evaluate(() => {
      const title = document.querySelector("h1");
      const card = document.querySelector("article");
      if (!title || !card) {
        return { ok: false, reason: "missing nodes" };
      }
      const parse = (value: string) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) {
          return null;
        }
        return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
      };
      const titleColor = parse(getComputedStyle(title).color);
      const cardBg = parse(getComputedStyle(card).backgroundColor);
      const amountEl = Array.from(document.querySelectorAll("aside p")).find(
        (node) => Number.parseFloat(getComputedStyle(node).fontSize) >= 32,
      );
      const amountColor = amountEl ? parse(getComputedStyle(amountEl).color) : titleColor;
      if (!titleColor || !cardBg || !amountColor) {
        return {
          ok: false,
          reason: "unparsed",
          title: getComputedStyle(title).color,
          card: getComputedStyle(card).backgroundColor,
        };
      }
      const sum = (c: { r: number; g: number; b: number }) => c.r + c.g + c.b;
      return {
        ok: sum(titleColor) > 400 && sum(cardBg) < 180 && sum(amountColor) > 400,
        titleColor,
        cardBg,
        amountColor,
      };
    });
    expect(contrast.ok, JSON.stringify(contrast)).toBe(true);
  });
});
