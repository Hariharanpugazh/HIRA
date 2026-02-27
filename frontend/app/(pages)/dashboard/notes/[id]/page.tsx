import { NoteRouteView } from "@/components/dashboard/NoteRouteView";

export default async function DashboardNoteRoutePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteRouteView noteId={id} />;
}


