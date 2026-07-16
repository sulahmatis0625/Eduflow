"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  UserCog,
  Eye,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  xp: number;
  level: number;
  createdAt: string;
  _count: { enrollments: number; courses: number };
}

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "STUDENT", label: "Student" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "ADMIN", label: "Admin" },
];

const roleChangeOptions = [
  { value: "STUDENT", label: "Student" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "ADMIN", label: "Admin" },
];

const roleBadgeVariant = (role: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    ADMIN: "danger",
    INSTRUCTOR: "purple",
    STUDENT: "info",
  };
  return map[role] || "default";
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("STUDENT");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Failed to fetch users
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isActive: !isActive } : u
          )
        );
      }
    } catch {
      // Failed to toggle active
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async () => {
    if (!selectedUser) return;
    setActionLoading(selectedUser.id);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, role: newRole } : u
          )
        );
        setRoleModalOpen(false);
        setSelectedUser(null);
      }
    } catch {
      // Failed to change role
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          User Management
        </h1>
        <p className="text-text-tertiary mt-1">
          Manage user accounts, roles, and access
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            All Users ({users.length})
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No users found"
              description="No users match your current filters."
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
                      Role
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Level / XP
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Joined
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.image}
                            name={user.name}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={roleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={user.isActive ? "success" : "danger"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-secondary">
                          <span className="font-medium">Lv.{user.level}</span>
                          <span className="text-text-muted ml-1">
                            ({user.xp} XP)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.isActive ? "danger" : "success"}
                            onClick={() => toggleActive(user.id, user.isActive)}
                            isLoading={actionLoading === user.id}
                            disabled={actionLoading === user.id}
                          >
                            {user.isActive ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Shield className="h-3.5 w-3.5 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setRoleModalOpen(true);
                            }}
                          >
                            <UserCog className="h-3.5 w-3.5 mr-1" />
                            Role
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

      {/* User Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedUser(null);
        }}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedUser.image}
                name={selectedUser.name}
                size="xl"
              />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedUser.name || "Unnamed"}
                </h3>
                <p className="text-sm text-text-tertiary">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={roleBadgeVariant(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                  <Badge
                    variant={selectedUser.isActive ? "success" : "danger"}
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
              <div>
                <p className="text-xs text-text-muted">
                  Level
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {selectedUser.level}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  XP
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {selectedUser.xp}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Enrollments
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {selectedUser._count.enrollments}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Courses Created
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {selectedUser._count.courses}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-text-muted">
                Joined
              </p>
              <p className="text-sm text-text-primary">
                {formatDate(selectedUser.createdAt)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false);
          setSelectedUser(null);
        }}
        title="Change User Role"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Change role for{" "}
              <span className="font-semibold">
                {selectedUser.name || selectedUser.email}
              </span>
            </p>
            <Select
              label="New Role"
              options={roleChangeOptions}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRoleModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={changeRole}
                isLoading={actionLoading === selectedUser.id}
                disabled={actionLoading === selectedUser.id}
              >
                Save Role
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
