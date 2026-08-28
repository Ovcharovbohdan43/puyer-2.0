-- Phase 9 load-conscious indexes. Partial indexes match reminder sweep and pending invites.

CREATE INDEX IF NOT EXISTS invoice_open_due_date_idx
  ON public."Invoice" ("dueDate")
  WHERE status NOT IN ('PAID', 'CANCELED', 'DRAFT');

CREATE INDEX IF NOT EXISTS notification_user_org_created_idx
  ON public."Notification" ("userId", "organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS organization_invite_pending_org_email_idx
  ON public."OrganizationInvite" ("organizationId", "email")
  WHERE status = 'PENDING';
