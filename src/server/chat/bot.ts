export function isChatEnabled(): boolean {
  return Boolean(
    process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET,
  );
}

/** No-op until Slack credentials are configured and the handler is wired. */
export async function handleChatWebhook(_payload: unknown): Promise<void> {
  if (!isChatEnabled()) return;
  // TODO: wire Slack SDK handler when SLACK_BOT_TOKEN + SLACK_SIGNING_SECRET are set
}
