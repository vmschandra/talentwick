// Client-side helper to trigger transactional emails via the /api/email route.
// Fire-and-forget — email failures never block the main operation.

export async function triggerEmail(
  idToken: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-critical — ignore failures
  }
}
