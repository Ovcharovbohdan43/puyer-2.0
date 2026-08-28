import { describe, expect, it } from "vitest";

import { workspaceDisplayName } from "@/lib/identity/name";

describe("workspaceDisplayName", () => {
  it("uses a provided name, else the email local part", () => {
    expect(workspaceDisplayName("alex@puyer.org", "Alex")).toBe("Alex");
    expect(workspaceDisplayName("alex@puyer.org")).toBe("alex");
    expect(workspaceDisplayName("@puyer.org")).toBe("Workspace");
  });
});
