import { cron, eventType, staticSchema } from "inngest";

import { inngest } from "@/lib/jobs/client";
import { listOrganizationIdsForSnapshots, snapshotOrganizationMonth } from "@/lib/reports/load";

const reportSnapshot = eventType("puyer/report.snapshot", {
  schema: staticSchema<{ organizationId: string }>(),
});

export const reportsSweep = inngest.createFunction(
  {
    id: "puyer-reports-sweep",
    triggers: [cron("0 2 * * *")],
  },
  async ({ step }) => {
    const organizationIds = await step.run("list-organizations", async () => listOrganizationIdsForSnapshots());
    if (organizationIds.length === 0) {
      return { queued: 0 };
    }
    await step.sendEvent(
      "queue-snapshots",
      organizationIds.map((organizationId) => reportSnapshot.create({ organizationId })),
    );
    return { queued: organizationIds.length };
  },
);

export const reportSnapshotJob = inngest.createFunction(
  {
    id: "puyer-report-snapshot",
    triggers: [reportSnapshot],
    concurrency: { limit: 5 },
  },
  async ({ event, step }) => {
    const result = await step.run("write-snapshot", async () =>
      snapshotOrganizationMonth(event.data.organizationId),
    );
    return { result };
  },
);

export const reportFunctions = [reportsSweep, reportSnapshotJob];
