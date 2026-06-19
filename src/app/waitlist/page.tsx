import { WaitlistForm } from "./_components/waitlist-form";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const { for: forParam = "" } = await searchParams;

  return <WaitlistForm forParam={forParam} />;
}
