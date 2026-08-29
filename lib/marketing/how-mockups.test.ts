import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Goal: Landing product shots ship with the homepage.
 * Scenario: CI/local checkout includes How + tracking + reminders + clients + reports assets.
 * Input: filenames under public/landing.
 * Expected: listed image files exist.
 * Edge: rename/delete of a file fails this test before the homepage shows a broken image.
 */
describe("landing product mockups", () => {
  it("keeps How, payments, reminders, clients, and reports screenshots in public/landing", () => {
    const dir = join(process.cwd(), "public", "landing");
    for (const name of [
      "how-create.png",
      "how-send.png",
      "how-get-paid.png",
      "tracking-payments.jpg",
      "reminders-pro.jpg",
      "clients.png",
      "reports.png",
    ]) {
      expect(existsSync(join(dir, name)), name).toBe(true);
    }
  });
});
