import { describe, expect, it } from "vitest";

import { toPublicError, UnauthorizedError, ValidationError } from "@/lib/errors";

describe("toPublicError", () => {
  it("returns the safe message and status for AppError", () => {
    expect(toPublicError(new ValidationError("Enter a valid email address."))).toEqual({
      status: 400,
      message: "Enter a valid email address.",
    });
    expect(toPublicError(new UnauthorizedError())).toEqual({
      status: 401,
      message: "Sign in to continue.",
    });
  });

  it("hides unexpected errors behind a generic message", () => {
    expect(toPublicError(new Error("ECONNREFUSED postgres://secret"))).toEqual({
      status: 500,
      message: "Something went wrong. Try again.",
    });
  });
});
