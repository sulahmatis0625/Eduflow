"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  User,
  Lock,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const MAX_PHOTO_BYTES = 600_000;

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isInstructor =
    session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setImage(session.user.image || "");
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setBio(data.bio || "");
          if (data.image) setImage(data.image);
        }
      } catch {
        // silently fail
      }
    }
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handlePhotoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage({
        type: "error",
        text: "Please choose an image file (JPG, PNG, or WebP).",
      });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setProfileMessage({
        type: "error",
        text: "Photo must be under 600KB. Try a smaller image.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImage(result);
      setProfileMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    if (isInstructor && !image.trim()) {
      setProfileMessage({
        type: "error",
        text: "Instructors must upload a profile photo.",
      });
      setProfileLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bio, image }),
      });

      if (res.ok) {
        const saved = await res.json();
        const savedImage =
          typeof saved.image === "string" ? saved.image : image;
        setImage(savedImage || "");
        setProfileMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
        // Refresh NextAuth session so the top-right avatar updates
        await update?.({
          name: saved.name || name,
          image: savedImage,
        });
      } else {
        const data = await res.json();
        setProfileMessage({
          type: "error",
          text: data.error || "Failed to update profile.",
        });
      }
    } catch {
      setProfileMessage({
        type: "error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordMessage({
          type: "success",
          text: "Password updated successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      } else {
        const data = await res.json();
        setPasswordMessage({
          type: "error",
          text: data.error || "Failed to update password.",
        });
      }
    } catch {
      setPasswordMessage({
        type: "error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex justify-center py-20 text-text-secondary text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center px-2">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-text-primary">
            Account Settings
          </h1>
          <p className="text-text-secondary mt-1">
            Manage your profile and account preferences
          </p>
        </div>

        <Card className="mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-text-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">
                Profile Information
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar
                  src={image || session.user.image}
                  name={name}
                  size="xl"
                />
                <div className="flex-1 w-full space-y-2">
                  <p className="text-sm font-medium text-text-secondary">
                    Profile photo
                    {isInstructor && (
                      <span className="text-brand ml-1">(required)</span>
                    )}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handlePhotoFile(e.target.files?.[0] || null)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {image ? "Change photo" : "Upload photo"}
                  </Button>
                  <p className="text-xs text-text-muted">
                    JPG, PNG, or WebP under 600KB.
                  </p>
                </div>
              </div>

              <Input
                label="Full Name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Textarea
                label="Bio"
                placeholder="Tell us a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />

              {profileMessage && (
                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    profileMessage.type === "success"
                      ? "bg-brand/10 text-brand"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  {profileMessage.text}
                </div>
              )}

              <Button type="submit" isLoading={profileLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mx-auto">
          <CardHeader>
            <button
              type="button"
              onClick={() => setShowPasswordForm((v) => !v)}
              className="w-full flex items-center justify-between gap-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-text-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">
                  Change Password
                </h2>
              </div>
              {showPasswordForm ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </button>
          </CardHeader>
          {showPasswordForm && (
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  error={
                    confirmPassword && newPassword !== confirmPassword
                      ? "Passwords do not match"
                      : undefined
                  }
                />

                {passwordMessage && (
                  <div
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                      passwordMessage.type === "success"
                        ? "bg-brand/10 text-brand"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    {passwordMessage.text}
                  </div>
                )}

                <Button type="submit" isLoading={passwordLoading}>
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
