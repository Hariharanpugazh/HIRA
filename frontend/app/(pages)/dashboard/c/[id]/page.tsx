import { ChatRouteView } from "@/components/dashboard/ChatRouteView";

export default async function DashboardChatPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatRouteView chatId={id} />;
}


