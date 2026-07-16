"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Award, Search, Trash2, ExternalLink, Eye } from "lucide-react";

interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateId: string;
  grade: number;
  issuedAt: string;
  templateStyle: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  course: { id: string; title: string };
}

const gradeVariant = (grade: number) => {
  if (grade >= 90) return "success";
  if (grade >= 80) return "info";
  if (grade >= 70) return "warning";
  return "danger";
};

const gradeLabel = (grade: number) => {
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
};

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/certificates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch {
      // Failed to fetch certificates
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const revokeCertificate = async (certId: string) => {
    if (!confirm("Are you sure you want to revoke this certificate? This action cannot be undone.")) {
      return;
    }
    setActionLoading(certId);
    try {
      const res = await fetch(`/api/admin/certificates/${certId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCertificates((prev) => prev.filter((c) => c.id !== certId));
        if (detailsOpen && selectedCert?.id === certId) {
          setDetailsOpen(false);
          setSelectedCert(null);
        }
      }
    } catch {
      // Failed to revoke certificate
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Certificate Management
        </h1>
        <p className="text-text-tertiary mt-1">
          View and manage issued certificates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gold/10 p-3 rounded-xl">
              <Award className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-xs text-text-muted">
                Total Issued
              </p>
              <p className="text-xl font-bold text-text-primary">
                {certificates.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-brand/10 p-3 rounded-xl">
              <Award className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted">
                Avg. Grade
              </p>
              <p className="text-xl font-bold text-text-primary">
                {certificates.length > 0
                  ? (
                      certificates.reduce((sum, c) => sum + c.grade, 0) /
                      certificates.length
                    ).toFixed(1)
                  : "N/A"}
                %
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-brand/10 p-3 rounded-xl">
              <Award className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted">
                Distinction (90%+)
              </p>
              <p className="text-xl font-bold text-text-primary">
                {certificates.filter((c) => c.grade >= 90).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search by student name, email, or certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            Issued Certificates
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : certificates.length === 0 ? (
            <EmptyState
              icon={<Award className="h-12 w-12" />}
              title="No certificates found"
              description="No certificates have been issued yet, or none match your search."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Student
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Course
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Certificate ID
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Grade
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Issued
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={cert.user.image}
                            name={cert.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {cert.user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {cert.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {cert.course.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-text-secondary">
                          {cert.certificateId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={gradeVariant(cert.grade) as "success" | "warning" | "danger" | "info"}
                        >
                          {cert.grade}% ({gradeLabel(cert.grade)})
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDate(cert.issuedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCert(cert);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              window.open(
                                `/certificates/${cert.certificateId}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => revokeCertificate(cert.id)}
                            isLoading={actionLoading === cert.id}
                            disabled={actionLoading === cert.id}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedCert(null);
        }}
        title="Certificate Details"
        size="md"
      >
        {selectedCert && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedCert.user.image}
                name={selectedCert.user.name}
                size="lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedCert.user.name || "Unnamed"}
                </h3>
                <p className="text-sm text-text-tertiary">
                  {selectedCert.user.email}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
              <div>
                <p className="text-xs text-text-muted">
                  Course
                </p>
                <p className="text-sm font-medium text-text-primary mt-1">
                  {selectedCert.course.title}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Grade
                </p>
                <p className="text-sm font-medium text-text-primary mt-1">
                  {selectedCert.grade}% ({gradeLabel(selectedCert.grade)})
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Certificate ID
                </p>
                <p className="text-sm font-mono text-text-primary mt-1">
                  {selectedCert.certificateId}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Issued Date
                </p>
                <p className="text-sm text-text-primary mt-1">
                  {formatDate(selectedCert.issuedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Template
                </p>
                <p className="text-sm text-text-primary mt-1 capitalize">
                  {selectedCert.templateStyle}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `/certificates/${selectedCert.certificateId}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
              <Button
                variant="danger"
                onClick={() => revokeCertificate(selectedCert.id)}
                isLoading={actionLoading === selectedCert.id}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
