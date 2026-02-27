import { ChannelPageView } from "@/components/dashboard/ChannelPageView";

export default async function DashboardChannelPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChannelPageView channelId={id} />;
}


