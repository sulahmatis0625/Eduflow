"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, ExternalLink, Eye, Loader2 } from "lucide-react";

interface CertificateActionsProps {
  certificateId: string;
}

const linkBtn =
  "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/30";

export function CertificateActions({ certificateId }: CertificateActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const idPath = encodeURIComponent(certificateId);

  const handleDownload = async () => {
    setError("");
    setDownloading(true);
    try {
      const res = await fetch(`/api/certificates/${idPath}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ||
        `EduFlow-Certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-1">
      <div className="flex gap-2">
        <Link
          href={`/certificates/view/${idPath}`}
          className={cn(
            linkBtn,
            "flex-1 bg-transparent border border-white/[0.10] text-white hover:border-brand/40 hover:text-brand"
          )}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          View
        </Link>
        <Link
          href={`/certificates/verify/${idPath}`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            linkBtn,
            "flex-1 bg-transparent border border-white/[0.10] text-white hover:border-brand/40 hover:text-brand"
          )}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          Verify
        </Link>
      </div>
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-1.5" />
        )}
        Download PDF
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
