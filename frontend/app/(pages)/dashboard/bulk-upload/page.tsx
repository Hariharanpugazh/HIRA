import { BulkUploadAnalyzer } from "@/components/dashboard/BulkUploadAnalyzer";

export const metadata = {
  title: "Bulk Upload Analyzer | HIRA",
  description: "Analyze multiple candidates by uploading CSV or XLSX files"
};

export default function BulkUploadPage() {
  return <BulkUploadAnalyzer />;
}
