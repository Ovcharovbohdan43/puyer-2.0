import { serve } from "inngest/next";

import { inngest } from "@/lib/jobs/client";
import { reminderFunctions, reportFunctions } from "@/lib/jobs/functions";

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...reminderFunctions, ...reportFunctions],
});
