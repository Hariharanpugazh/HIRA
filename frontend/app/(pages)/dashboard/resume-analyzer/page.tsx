import { ResumeAnalyzerInput } from "@/components/dashboard/ResumeAnalyzerInput";

export const metadata = {
  title: "Resume Analyzer | HIRA",
  description: "Analyze candidates by comparing resumes with job descriptions"
};

export default function ResumeAnalyzerPage() {
  return <ResumeAnalyzerInput />;
}
