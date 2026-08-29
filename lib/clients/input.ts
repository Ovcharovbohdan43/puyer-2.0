import { ValidationError } from "@/lib/errors";
import { isValidEmail } from "@/lib/invoices/validate";

const PHONE_MAX = 40;

export type ClientCreateInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export function parseClientCreate(body: {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
}): ClientCreateInput {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!name) {
    throw new ValidationError("Enter a client name.");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Enter a valid client email so reminders can be sent.");
  }
  if (phone.length > PHONE_MAX) {
    throw new ValidationError("Enter a shorter phone number.");
  }
  return { name, email, phone, address };
}
