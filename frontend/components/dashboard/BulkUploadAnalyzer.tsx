"use client";

import { useState } from "react";
import { Upload, AlertCircle, CheckCircle2, File, Zap, Shield, Info } from "lucide-react";

interface FileValidationError {
  type: "format" | "size" | "content";
  message: string;
}

export function BulkUploadAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FileValidationError[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

  const validateFile = (selectedFile: File): FileValidationError[] => {
    const validationErrors: FileValidationError[] = [];

    // Check file extension
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      validationErrors.push({
        type: "format",
        message: `Invalid file format. Supported formats: ${ALLOWED_EXTENSIONS.join(", ")}`
      });
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      validationErrors.push({
        type: "size",
        message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit. Current size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`
      });
    }

    return validationErrors;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationErrors = validateFile(selectedFile);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      setFile(selectedFile);
      
      // Read and preview first few lines
      const reader = new FileReader();
      reader.onload = (event) => {
        const lines = (event.target?.result as string).split("\n").slice(0, 5);
        setPreview(lines);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const input = e.currentTarget.querySelector("input[type='file']") as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      input.files = dataTransfer.files;
      
      const validationErrors = validateFile(droppedFile);
      setErrors(validationErrors);

      if (validationErrors.length === 0) {
        setFile(droppedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          const lines = (event.target?.result as string).split("\n").slice(0, 5);
          setPreview(lines);
        };
        reader.readAsText(droppedFile);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setErrors([{ type: "content", message: "Please select a file to analyze" }]);
      return;
    }

    setIsAnalyzing(true);
    try {
      // TODO: Connect to your backend API for bulk analysis
      const formData = new FormData();
      formData.append("file", file);
      console.log("Analyzing bulk file:", file.name);
      alert("Bulk analysis feature coming soon!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setErrors([]);
    setPreview([]);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--cn-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--cn-border)] bg-[var(--cn-surface)] px-6 py-4">
        <h1 className="text-2xl font-bold text-[var(--cn-text)]">Bulk Upload Analyzer</h1>
        <p className="mt-1 text-sm text-[var(--cn-muted)]">
          Analyze multiple candidates at once by uploading CSV or XLSX files
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Section - Upload */}
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)]">
                <span className="text-sm font-bold text-[var(--cn-text)]">A</span>
              </div>
              <h2 className="text-lg font-semibold text-[var(--cn-text)]">Upload File</h2>
            </div>

            {/* Main Upload Area */}
            <div className="rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] overflow-hidden">
              <div className="p-8">
                {file ? (
                  <div className="space-y-6">
                    {/* File Info Card */}
                    <div className="flex items-center gap-4 rounded-xl bg-[var(--cn-surface-2)] p-5 border border-[var(--cn-border)]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--cn-surface-3)]">
                        <File className="h-6 w-6 text-[var(--cn-accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-[var(--cn-text)]">{file.name}</p>
                        <p className="text-xs text-[var(--cn-muted)] mt-0.5">
                          {(file.size / 1024).toFixed(2)} KB • Ready to analyze
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                    </div>

                    {/* Preview Section */}
                    {preview.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-[var(--cn-muted)]" />
                          <p className="text-sm font-semibold text-[var(--cn-text)]">File Preview</p>
                        </div>
                        <div className="rounded-lg bg-[var(--cn-surface-3)] border border-[var(--cn-border)] p-4 max-h-48 overflow-y-auto">
                          {preview.map((line, idx) => (
                            <p key={idx} className="truncate text-xs text-[var(--cn-muted)] font-mono mb-1">
                              {line || "(empty line)"}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-[var(--cn-border)]">
                      <button
                        onClick={handleClear}
                        className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-[var(--cn-text)] bg-[var(--cn-surface-2)] hover:bg-[var(--cn-hover)] transition border border-[var(--cn-border)]"
                      >
                        Change File
                      </button>
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--cn-accent)] px-4 py-3 font-semibold text-[var(--cn-accent-fg)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap className="h-5 w-5" />
                        {isAnalyzing ? "Analyzing..." : "Analyze Candidates"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="block cursor-pointer group"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[var(--cn-border)] px-8 py-16 transition group-hover:bg-[var(--cn-hover)] group-hover:border-[var(--cn-accent)]">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--cn-surface-2)] group-hover:bg-[var(--cn-surface-3)] transition">
                        <Upload className="h-8 w-8 text-[var(--cn-accent)]" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[var(--cn-text)]">
                          Drag and drop your file here
                        </p>
                        <p className="text-sm text-[var(--cn-muted)] mt-1">
                          or click to browse from your computer
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs text-[var(--cn-muted)] bg-[var(--cn-surface-2)] px-3 py-1.5 rounded-lg">
                        <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                        CSV, XLSX, XLS • Max 10 MB
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="border-t border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-4 space-y-2">
                  {errors.map((error, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
                      <p className="text-sm text-red-200">{error.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid Layout for Tips */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Format Tips */}
            <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                <File className="h-4 w-4 text-[var(--cn-accent)]" />
                File Format
              </h4>
              <ul className="space-y-2.5">
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    <strong>Column A:</strong> Candidate Resume
                  </span>
                </li>
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    <strong>Column B:</strong> Job Description
                  </span>
                </li>
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    Include headers in row 1
                  </span>
                </li>
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    Use UTF-8 encoding
                  </span>
                </li>
              </ul>
            </div>

            {/* Size Limits */}
            <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                <Shield className="h-4 w-4 text-[var(--cn-accent)]" />
                File Limits
              </h4>
              <ul className="space-y-2.5">
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    <strong>Max Size:</strong> 10 MB
                  </span>
                </li>
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    <strong>Max Rows:</strong> 1,000 items
                  </span>
                </li>
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    <strong>Formats:</strong> CSV, XLSX, XLS
                  </span>
                </li>
                <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                  <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                  <span>
                    One pair per row
                  </span>
                </li>
              </ul>
            </div>

            {/* Example Format */}
            <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                <Info className="h-4 w-4 text-[var(--cn-accent)]" />
                Example Format
              </h4>
              <div className="space-y-1.5 text-xs font-mono bg-[var(--cn-surface-2)] rounded-lg p-3">
                <p className="text-[var(--cn-text)] font-semibold">Resume | Job Description</p>
                <p className="border-t border-[var(--cn-border)] pt-1.5 text-[var(--cn-muted)]">
                  John's... | Senior...
                </p>
                <p className="text-[var(--cn-muted)]">
                  Jane's... | Manager...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
