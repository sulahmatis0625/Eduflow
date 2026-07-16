"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

interface Payment {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  transactionId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  course: { id: string; title: string };
}

interface RevenueStats {
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  refundedAmount: number;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    COMPLETED: "success",
    PENDING: "warning",
    FAILED: "danger",
    REFUNDED: "purple",
  };
  return map[status] || "default";
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    refundedAmount: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      // Failed to fetch payments
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const refundPayment = async (paymentId: string) => {
    setActionLoading(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, status: "REFUNDED" } : p
          )
        );
      }
    } catch {
      // Failed to refund
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-brand/10",
      iconColor: "text-brand",
    },
    {
      label: "Completed",
      value: stats.completedPayments.toString(),
      icon: TrendingUp,
      color: "bg-brand/10",
      iconColor: "text-brand",
    },
    {
      label: "Pending",
      value: stats.pendingPayments.toString(),
      icon: ArrowUpRight,
      color: "bg-gold/10",
      iconColor: "text-gold",
    },
    {
      label: "Refunded",
      value: formatPrice(stats.refundedAmount),
      icon: RefreshCw,
      color: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Payment Management
        </h1>
        <p className="text-text-tertiary mt-1">
          Track revenue, payments, and refunds
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-text-primary">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-full sm:w-64">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            All Payments ({payments.length})
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-12 w-12" />}
              title="No payments found"
              description="No payments match your current filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      User
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Course
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Amount
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Method
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Date
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={payment.user.image}
                            name={payment.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {payment.user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {payment.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {payment.course.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-text-primary">
                          {formatPrice(payment.amount, payment.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {payment.method || "N/A"}
                        </span>
                        {payment.transactionId && (
                          <p className="text-xs text-text-muted font-mono mt-0.5">
                            {payment.transactionId.slice(0, 12)}...
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDate(payment.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refundPayment(payment.id)}
                            isLoading={actionLoading === payment.id}
                            disabled={actionLoading === payment.id}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            Refund
                          </Button>
                        )}
                        {payment.status === "REFUNDED" && (
                          <span className="text-xs text-text-muted">Refunded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
