-- Issuer-initiated reminders from the invoice drawer (separate from Inngest cron types).
ALTER TYPE "ReminderType" ADD VALUE IF NOT EXISTS 'MANUAL';
