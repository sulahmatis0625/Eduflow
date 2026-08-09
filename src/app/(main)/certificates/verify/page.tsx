"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

export default function CertificateVerifyLookupPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = id.trim();
    if (!trimmed) {
      setError("Enter a certificate ID");
      return;
    }
    setError("");
    router.push(`/certificates/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 mb-4">
          <ShieldCheck className="h-8 w-8 text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Verify a certificate
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Enter the certificate ID to confirm it was issued by EduFlow.
        </p>
        <form onSubmit={onSubmit} className="space-y-3 text-left">
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. EF-XXXX-XXXX"
            className="font-mono"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            Verify
          </Button>
        </form>
      </div>
    </div>
  );
}
