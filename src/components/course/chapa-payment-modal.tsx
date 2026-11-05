"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Smartphone,
  Building2,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Zap,
  Globe,
} from "lucide-react";

interface ChapaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  price: number;
  formattedPrice?: string;
}

export function ChapaPaymentModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  price,
  formattedPrice,
}: ChapaPaymentModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMode, setPaymentMode] = useState<"dev_mode" | "real_chapa">("dev_mode");
  const [selectedMethod, setSelectedMethod] = useState<"telebirr" | "cbe" | "card">("telebirr");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const displayPrice = formattedPrice || `${price.toLocaleString()} ETB`;

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/chapa/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          paymentMethod: selectedMethod,
          preferRealGateway: paymentMode === "real_chapa",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      // If hosted checkout URL is returned from real Chapa API
      if (data.checkoutUrl) {
        toast("info", "Redirecting to official Chapa Checkout...");
        window.location.href = data.checkoutUrl;
        return;
      }

      // If simulated dev mode
      setSuccess(true);
      toast(
        "success",
        `Payment of ${displayPrice} completed via ${
          selectedMethod === "cbe" ? "CBE Birr" : "Telebirr"
        }!`
      );
      setTimeout(() => {
        onClose();
        router.push(`/dashboard/courses?payment=success&courseId=${courseId}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      toast("error", err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enroll with Chapa (Ethiopian Payments)">
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium">
          <button
            type="button"
            onClick={() => setPaymentMode("dev_mode")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              paymentMode === "dev_mode"
                ? "bg-brand text-black font-semibold shadow-sm"
                : "text-text-secondary hover:text-white"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Dev Mode Simulator
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("real_chapa")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              paymentMode === "real_chapa"
                ? "bg-purple-600 text-white font-semibold shadow-sm"
                : "text-text-secondary hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Real Chapa Gateway
          </button>
        </div>

        {/* Course Summary Card */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-mono">
              Course Details
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.06] text-text-secondary">
              {paymentMode === "dev_mode" ? "Instant Sandbox" : "Hosted Checkout"}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-text-primary line-clamp-1">{courseTitle}</h4>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] mt-2">
            <span className="text-xs text-text-secondary">Total Due:</span>
            <span className="text-base font-bold text-brand font-mono">{displayPrice}</span>
          </div>
        </div>

        {/* Payment Methods (Active for Dev Mode or displayed as options) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary block">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Telebirr */}
            <button
              type="button"
              onClick={() => setSelectedMethod("telebirr")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                selectedMethod === "telebirr"
                  ? "border-emerald-500/50 bg-emerald-500/15 ring-1 ring-emerald-500/30"
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                {selectedMethod === "telebirr" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Telebirr</p>
                <p className="text-[9px] text-text-tertiary">Ethio Telecom</p>
              </div>
            </button>

            {/* CBE Birr */}
            <button
              type="button"
              onClick={() => setSelectedMethod("cbe")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                selectedMethod === "cbe"
                  ? "border-purple-500/50 bg-purple-500/15 ring-1 ring-purple-500/30"
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                {selectedMethod === "cbe" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">CBE Birr</p>
                <p className="text-[9px] text-text-tertiary">Commercial Bank</p>
              </div>
            </button>

            {/* Cards */}
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                selectedMethod === "card"
                  ? "border-blue-500/50 bg-blue-500/15 ring-1 ring-blue-500/30"
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                {selectedMethod === "card" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Card / Visa</p>
                <p className="text-[9px] text-text-tertiary">Domestic & Intl</p>
              </div>
            </button>
          </div>
        </div>

        {/* Explanatory Info Box */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-text-secondary">
          <ShieldCheck className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
          {paymentMode === "dev_mode" ? (
            <span>
              <strong>Dev Mode Active:</strong> Simulates an instant test payment without leaving
              the page. Records real transaction & enrollment in database.
            </span>
          ) : (
            <span>
              <strong>Real Gateway Active:</strong> Calls Chapa API and redirects you to the
              official <code>checkout.chapa.co</code> sandbox page.
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Button
            size="lg"
            className="w-full flex items-center justify-center gap-2 shadow-lg"
            onClick={handlePayment}
            isLoading={loading}
            disabled={success}
          >
            {success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Payment Approved! Unlocking...
              </>
            ) : paymentMode === "real_chapa" ? (
              <>
                <ExternalLink className="h-4 w-4" />
                Proceed to Chapa Hosted Checkout ({displayPrice})
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Simulate {displayPrice} Payment ({selectedMethod === "cbe" ? "CBE Birr" : "Telebirr"})
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
