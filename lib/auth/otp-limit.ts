import { allowAttempt, allowInProcess } from "@/lib/rate-limit/memory";

export const OTP_WINDOW_MS = 15 * 60 * 1000;
export const OTP_MAX_PER_WINDOW = 5;

export function normalizeOtpEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function allowOtpAttempt(
  hits: Map<string, number[]>,
  email: string,
  now = Date.now(),
  windowMs = OTP_WINDOW_MS,
  max = OTP_MAX_PER_WINDOW,
): boolean {
  return allowAttempt(hits, normalizeOtpEmail(email), now, windowMs, max);
}

export function allowOtpInProcess(email: string, now = Date.now()): boolean {
  return allowInProcess("otp", normalizeOtpEmail(email), OTP_WINDOW_MS, OTP_MAX_PER_WINDOW, now);
}
