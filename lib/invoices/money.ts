const QUANTITY_SCALE = 4n;
const QUANTITY_FACTOR = 10n ** QUANTITY_SCALE;

function pow10(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error("Invalid denominator");
  }
  const negative = numerator < 0n;
  const abs = negative ? -numerator : numerator;
  const rounded = (abs + denominator / 2n) / denominator;
  return negative ? -rounded : rounded;
}

/** Parse a decimal string to integer minor units for the currency exponent. */
export function parseMajorToMinor(input: string, exponent: number): bigint {
  const trimmed = input.trim().replace(/,/g, "");
  if (trimmed === "" || trimmed === "-" || trimmed === ".") {
    return 0n;
  }
  if (!/^-?\d*(\.\d*)?$/.test(trimmed)) {
    throw new Error("Invalid amount");
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw, fractionRaw = ""] = unsigned.split(".");
  const whole = wholeRaw === "" ? "0" : wholeRaw;
  const fraction = (fractionRaw + "0".repeat(exponent)).slice(0, exponent);
  const minor = BigInt(whole) * pow10(exponent) + (exponent === 0 ? 0n : BigInt(fraction || "0"));
  return negative ? -minor : minor;
}

export function parseQuantity(input: string): bigint {
  return parseMajorToMinor(input, Number(QUANTITY_SCALE));
}

export function formatMinor(minor: bigint, exponent: number): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  if (exponent === 0) {
    return `${negative ? "-" : ""}${abs.toString()}`;
  }
  const factor = pow10(exponent);
  const whole = abs / factor;
  const fraction = (abs % factor).toString().padStart(exponent, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

export function formatMoney(minor: bigint, symbol: string, exponent: number): string {
  const formatted = formatMinor(minor, exponent);
  const [whole, fraction] = formatted.replace("-", "").split(".");
  const withGroups = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = formatted.startsWith("-") ? "-" : "";
  if (exponent === 0) {
    return `${sign}${symbol}${withGroups}`;
  }
  return `${sign}${symbol}${withGroups}.${fraction}`;
}

/** qty (4 dp) × unit price (currency exponent), rounded half-up to currency exponent. */
export function lineAmountMinor(quantityInput: string, unitPriceInput: string, exponent: number): bigint {
  const qty = parseQuantity(quantityInput);
  const unit = parseMajorToMinor(unitPriceInput, exponent);
  return roundHalfUp(qty * unit, QUANTITY_FACTOR);
}
