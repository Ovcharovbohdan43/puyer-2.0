export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour < 12) {
    return "morning";
  }
  if (hour < 17) {
    return "afternoon";
  }
  return "evening";
}

export function displayFirstName(name: string | null | undefined, email: string, fallback: string): string {
  const fromName = name?.trim().split(/\s+/)[0];
  if (fromName) {
    return fromName;
  }
  const local = email.split("@")[0]?.trim();
  return local || fallback;
}

export function splitMoneyDisplay(value: string): { major: string; cents: string } {
  const match = value.match(/^(.*\.)(\d+)$/);
  if (!match) {
    return { major: value, cents: "" };
  }
  return { major: match[1], cents: match[2] };
}
