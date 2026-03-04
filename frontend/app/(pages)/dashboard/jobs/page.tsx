import { JobsHistory } from "@/components/dashboard/JobsHistory";

export const metadata = {
  title: "Jobs History | HIRA",
  description: "View all screening jobs and their results",
};

export default function JobsPage() {
  return <JobsHistory />;
}
