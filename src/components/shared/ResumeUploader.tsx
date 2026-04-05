"use client";

import { useState, useRef } from "react";
import { uploadResume } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { siteConfig } from "@/config/site";

interface ResumeUploaderProps {
  uid: string;
  currentUrl?: string;
  currentFileName?: string;
  onUploaded: (url: string, fileName: string) => void;
}

export default function ResumeUploader({ uid, currentUrl, currentFileName, onUploaded }: ResumeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!siteConfig.allowedResumeTypes.includes(file.type)) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > siteConfig.maxResumeSize) {
      toast.error("File must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadResume(uid, file);
      onUploaded(url, file.name);
      toast.success("Resume uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
      {currentUrl ? (
        <div className="flex items-center gap-3 rounded-md border p-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm truncate">{currentFileName || "Resume"}</span>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full">
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Resume (PDF, max 5MB)
        </Button>
      )}
    </div>
  );
}
