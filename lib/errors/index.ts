export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly safeMessage: string;

  constructor(code: string, safeMessage: string, status: number) {
    super(safeMessage);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.safeMessage = safeMessage;
  }
}

export class UnauthorizedError extends AppError {
  constructor(safeMessage = "Sign in to continue.") {
    super("UNAUTHORIZED", safeMessage, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(safeMessage = "You do not have access.") {
    super("FORBIDDEN", safeMessage, 403);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(safeMessage = "Check the form and try again.") {
    super("VALIDATION", safeMessage, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(safeMessage = "Page not found.") {
    super("NOT_FOUND", safeMessage, 404);
    this.name = "NotFoundError";
  }
}

export class StripeConnectionError extends AppError {
  constructor(safeMessage = "Stripe connection is unavailable.") {
    super("STRIPE_CONNECTION", safeMessage, 502);
    this.name = "StripeConnectionError";
  }
}

export class PaymentError extends AppError {
  constructor(safeMessage = "Payment could not be processed.") {
    super("PAYMENT", safeMessage, 502);
    this.name = "PaymentError";
  }
}

export class SubscriptionError extends AppError {
  constructor(safeMessage = "Subscription could not be updated.") {
    super("SUBSCRIPTION", safeMessage, 502);
    this.name = "SubscriptionError";
  }
}

export class PDFGenerationError extends AppError {
  constructor(safeMessage = "The PDF could not be generated.") {
    super("PDF", safeMessage, 500);
    this.name = "PDFGenerationError";
  }
}

export class RateLimitError extends AppError {
  constructor(safeMessage = "Too many requests. Try again later.") {
    super("RATE_LIMIT", safeMessage, 429);
    this.name = "RateLimitError";
  }
}

export function toPublicError(error: unknown): { status: number; message: string } {
  if (error instanceof AppError) {
    return { status: error.status, message: error.safeMessage };
  }
  return { status: 500, message: "Something went wrong. Try again." };
}
