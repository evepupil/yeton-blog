import type {
  FriendLinkApplication,
  FriendLinkApplicationErrorCode,
  FriendLinkApplicationFailureCode,
} from "@/lib/friends/application";

export class FriendLinkClientError extends Error {
  readonly code: FriendLinkApplicationFailureCode;
  readonly retryable: boolean;

  constructor(code: FriendLinkApplicationFailureCode, retryable: boolean) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}

function isErrorCode(value: unknown): value is FriendLinkApplicationErrorCode {
  return (
    value === "INVALID_REQUEST" ||
    value === "ORIGIN_NOT_ALLOWED" ||
    value === "RATE_LIMITED" ||
    value === "SERVICE_UNAVAILABLE" ||
    value === "SUBMITTED" ||
    value === "UPSTREAM_ERROR"
  );
}

export async function submitFriendLink(
  application: FriendLinkApplication,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/submit-friend-link", {
      body: JSON.stringify(application),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    throw new FriendLinkClientError("SERVICE_UNAVAILABLE", true);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new FriendLinkClientError("SERVICE_UNAVAILABLE", true);
  }

  const code =
    payload && typeof payload === "object"
      ? Reflect.get(payload, "code")
      : undefined;
  const retryable =
    payload !== null && typeof payload === "object"
      ? Reflect.get(payload, "retryable") === true
      : false;
  if (response.ok && code === "SUBMITTED") return;

  throw new FriendLinkClientError(
    isErrorCode(code) && code !== "SUBMITTED" ? code : "SERVICE_UNAVAILABLE",
    retryable,
  );
}
