export function workspaceDisplayName(email: string, name?: string | null): string {
  const fromName = name?.trim();
  if (fromName) {
    return fromName.slice(0, 80);
  }
  const local = email.split("@")[0]?.trim();
  return (local || "Workspace").slice(0, 80);
}
