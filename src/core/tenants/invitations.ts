export const invalidInvitationMessage =
  "Η πρόσκληση δεν βρέθηκε ή δεν είναι πλέον έγκυρη.";

function decodeSafely(value: string): string {
  let decoded = value.trim();

  for (let index = 0; index < 3; index += 1) {
    try {
      const nextValue = decodeURIComponent(decoded).trim();

      if (nextValue === decoded) {
        break;
      }

      decoded = nextValue;
    } catch {
      break;
    }
  }

  return decoded;
}

export function normalizeInvitationToken(value: FormDataEntryValue | string | null | undefined): string {
  const decodedValue = decodeSafely(String(value ?? ""));

  if (!decodedValue) {
    return "";
  }

  if (decodedValue.startsWith("token=")) {
    return normalizeInvitationToken(new URLSearchParams(decodedValue).get("token"));
  }

  if (
    decodedValue.startsWith("/") ||
    decodedValue.startsWith("http://") ||
    decodedValue.startsWith("https://")
  ) {
    try {
      const inviteUrl = new URL(decodedValue, "http://localhost");
      const token = inviteUrl.searchParams.get("token");

      return token ? normalizeInvitationToken(token) : "";
    } catch {
      return "";
    }
  }

  return decodedValue;
}

// UX-only route selection after accepting an invitation. Server actions and
// data access still need requireRole()/requireFeature() enforcement.
export function getDefaultRouteForRole(role: string | null | undefined): string {
  switch (role) {
    case "foreman":
      return "/daily-work";
    case "viewer":
      return "/projects";
    case "office":
      return "/payments";
    case "owner":
    case "admin":
    default:
      return "/dashboard";
  }
}
