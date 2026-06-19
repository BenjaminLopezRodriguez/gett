export function isChatEnabled(): boolean {
  return Boolean(
    process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET,
  );
}

/** Placeholder — wire Chat SDK webhook when Slack credentials are configured. */
export async function handleChatWebhook(_payload: unknown): Promise<void> {
  if (!isChatEnabled()) {
    throw new Error("Chat integration not configured");
  }
  throw new Error("Chat webhook handler not implemented");
}
