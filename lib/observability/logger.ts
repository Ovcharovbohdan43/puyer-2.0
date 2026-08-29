const SECRET_KEYS = /token|secret|authorization|password|cookie|signature|apikey|api_key|iban|swift|bic|bankiban|bankaccount/i;
const SECRET_VALUES = /^(?:sk|pk|rk|whsec)_[A-Za-z0-9]+|^Bearer\s+/i;

function redactString(value: string): string {
  if (SECRET_VALUES.test(value)) {
    return "[redacted]";
  }
  return value;
}

function redact(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      if (SECRET_KEYS.test(key)) {
        return [key, "[redacted]"] as const;
      }
      return [key, redact(nested)] as const;
    });
    return Object.fromEntries(entries);
  }
  return value;
}

type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, fields?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(fields ? { fields: redact(fields) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export const logger = {
  info: (message: string, fields?: Record<string, unknown>) => write("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write("error", message, fields),
};
