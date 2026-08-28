import { cron, eventType, staticSchema } from "inngest";

import { inngest } from "@/lib/jobs/client";
import { deliverDueReminder } from "@/lib/reminders/send";
import { listDueReminders } from "@/lib/reminders/sweep";
import type { ReminderKind } from "@/lib/reminders/evaluate";

const reminderSend = eventType("puyer/reminder.send", {
  schema: staticSchema<{ invoiceId: string; type: ReminderKind; scheduledDate: string }>(),
});

export const remindersSweep = inngest.createFunction(
  {
    id: "puyer-reminders-sweep",
    triggers: [cron("*/15 * * * *")],
  },
  async ({ step }) => {
    const due = await step.run("find-due-reminders", async () => listDueReminders());
    if (due.length === 0) {
      return { queued: 0 };
    }
    await step.sendEvent(
      "queue-reminders",
      due.map((item) => reminderSend.create(item)),
    );
    return { queued: due.length };
  },
);

export const reminderSendJob = inngest.createFunction(
  {
    id: "puyer-reminder-send",
    triggers: [reminderSend],
    concurrency: { limit: 5 },
  },
  async ({ event, step }) => {
    const result = await step.run("deliver-reminder", async () =>
      deliverDueReminder({
        invoiceId: event.data.invoiceId,
        type: event.data.type,
        scheduledDate: event.data.scheduledDate,
      }),
    );
    return { result };
  },
);

export const reminderFunctions = [remindersSweep, reminderSendJob];

export { reportFunctions } from "@/lib/jobs/reports";
