"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  User,
  LogOut,
  Camera,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";

export function AdminHeader() {
  const { data: session, update } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Populate form on modal open
  const openEditModal = async () => {
    setDropdownOpen(false);
    setError(null);
    setSuccess(null);
    setShowPasswordFields(false);
    setCurrentPassword("");
    setNewPassword("");

    setName(session?.user?.name || "");
    setImage(session?.user?.image || "");

    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setBio(data.bio || "");
        setImage(data.image || "");
      }
    } catch {
      // Keep session fallback
    }

    setModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 600000) {
      setError("Image must be under 600 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update Profile Info
      const profileRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          image: image || undefined,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.error || "Failed to update profile");
      }

      // 2. Optional Password Update
      if (showPasswordFields && (currentPassword || newPassword)) {
        if (!currentPassword || !newPassword) {
          throw new Error("Both current and new passwords are required");
        }
        if (newPassword.length < 6) {
          throw new Error("New password must be at least 6 characters");
        }

        const passRes = await fetch("/api/user/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const passData = await passRes.json();
        if (!passRes.ok) {
          throw new Error(passData.error || "Failed to update password");
        }
        setCurrentPassword("");
        setNewPassword("");
        setShowPasswordFields(false);
      }

      // 3. Update session
      await update({ name: name.trim(), image });

      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const userName = session?.user?.name || "Administrator";
  const userEmail = session?.user?.email || "admin@eduflow.com";
  const userImage = session?.user?.image || "";

  return (
    <>
      <header className="h-16 border-b border-white/[0.06] bg-surface-0/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Section indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium font-mono">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>ADMINISTRATOR BACKOFFICE</span>
          </div>
        </div>

        {/* Right: Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all duration-200"
          >
            <Avatar
              src={userImage}
              name={userName}
              size="sm"
              className="ring-2 ring-purple-500/30"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-text-primary leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-purple-400 font-mono tracking-wider uppercase">
                Admin
              </span>
            </div>
            <ChevronDown
              className={"h-4 w-4 text-text-tertiary transition-transform duration-200 " + (dropdownOpen ? "rotate-180 text-purple-400" : "")}
            />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-surface-1/95 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Avatar src={userImage} name={userName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={openEditModal}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors text-left"
                >
                  <User className="h-4 w-4 text-purple-400" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="border-t border-white/[0.06] p-1 mt-1">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Admin Profile Settings"
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex items-center gap-4 pb-2 border-b border-white/[0.06]">
            <Avatar src={image} name={name || "Admin"} size="lg" />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2 text-purple-400" />
                Change Photo
              </Button>
              <p className="text-[11px] text-text-muted mt-1">
                Max 600 KB (JPEG, PNG, WebP)
              </p>
            </div>
          </div>

          {/* Full Name */}
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
          />

          {/* Email (Readonly) */}
          <Input
            label="Email Address"
            value={userEmail}
            disabled
            placeholder="admin@eduflow.com"
          />

          {/* Bio */}
          <Textarea
            label="Bio / Notes"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief bio or administrator notes..."
            rows={2}
          />

          {/* Password toggle */}
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>
                {showPasswordFields
                  ? "Cancel Password Change"
                  : "Change Password"}
              </span>
            </button>

            {showPasswordFields && (
              <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
