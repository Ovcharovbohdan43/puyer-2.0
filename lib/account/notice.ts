import { helpCenterUrl } from "@/lib/help/ack";
import { helpInboxAddress } from "@/lib/help/from";

export function deletionAckText(input: { name: string; requestId: string }): string {
  return [
    `Hi ${input.name},`,
    "We received your request to delete your Puyer account.",
    `Reference: ${input.requestId}`,
    "This is a request, not an instant deletion. We review it and then close the account. You can cancel it from Settings until it is processed.",
    `Questions: ${helpInboxAddress()}`,
    helpCenterUrl(),
  ].join("\n");
}

export function deletionInboxText(input: {
  email: string;
  name: string;
  requestId: string;
  reason: string;
  organizationName: string;
}): string {
  return [
    `Account deletion request ${input.requestId}`,
    `User: ${input.name} <${input.email}>`,
    `Workspace: ${input.organizationName}`,
    `Reason: ${input.reason}`,
  ].join("\n");
}
