"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RefreshCw } from "lucide-react";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

const DEFAULT_SETTINGS: Record<string, { label: string; description: string; type: "text" | "textarea" | "select" | "number"; options?: { value: string; label: string }[] }> = {
  site_name: {
    label: "Site Name",
    description: "The name of your platform displayed across the site.",
    type: "text",
  },
  site_description: {
    label: "Site Description",
    description: "A brief description of your platform for SEO and meta tags.",
    type: "textarea",
  },
  contact_email: {
    label: "Contact Email",
    description: "Primary contact email address for support inquiries.",
    type: "text",
  },
  default_currency: {
    label: "Default Currency",
    description: "The default currency for course pricing.",
    type: "select",
    options: [
      { value: "ETB", label: "ETB - Ethiopian Birr (Default)" },
      { value: "USD", label: "USD - US Dollar" },
    ],
  },
  enrollment_approval: {
    label: "Enrollment Approval",
    description: "Whether enrollments require admin approval before activation.",
    type: "select",
    options: [
      { value: "auto", label: "Auto-approve" },
      { value: "manual", label: "Manual approval required" },
    ],
  },
  max_file_upload_mb: {
    label: "Max File Upload Size (MB)",
    description: "Maximum file upload size in megabytes.",
    type: "number",
  },
  maintenance_mode: {
    label: "Maintenance Mode",
    description: "Enable maintenance mode to temporarily disable the site for users.",
    type: "select",
    options: [
      { value: "off", label: "Off" },
      { value: "on", label: "On" },
    ],
  },
  allow_instructor_registration: {
    label: "Instructor Registration",
    description: "Allow users to register as instructors.",
    type: "select",
    options: [
      { value: "enabled", label: "Enabled" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  certificate_template: {
    label: "Default Certificate Template",
    description: "Default template style for certificates.",
    type: "select",
    options: [
      { value: "classic", label: "Classic" },
      { value: "modern", label: "Modern" },
      { value: "minimal", label: "Minimal" },
    ],
  },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savedSettings, setSavedSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const settingsMap: Record<string, string> = {};
        (data.settings || []).forEach((s: SiteSetting) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
        setSavedSettings(settingsMap);
      }
    } catch {
      // Failed to fetch settings
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSavedSettings({ ...settings });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      // Failed to save settings
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({ ...savedSettings });
    setSaveSuccess(false);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Site Settings
          </h1>
          <p className="text-text-tertiary mt-1">
            Configure your platform settings
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Site Settings
          </h1>
          <p className="text-text-tertiary mt-1">
            Configure your platform settings
          </p>
        </div>
        {hasChanges && (
          <Badge variant="warning" size="md">
            Unsaved Changes
          </Badge>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
          <p className="text-sm text-brand">
            Settings saved successfully.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-text-tertiary" />
              <h2 className="text-lg font-semibold text-text-primary">
                General Settings
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {Object.entries(DEFAULT_SETTINGS).map(([key, config]) => (
              <div key={key}>
                <div className="mb-1.5">
                  <p className="text-xs text-text-muted mt-0.5">
                    {config.description}
                  </p>
                </div>
                {config.type === "text" && (
                  <Input
                    label={config.label}
                    value={settings[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={`Enter ${config.label.toLowerCase()}`}
                  />
                )}
                {config.type === "number" && (
                  <Input
                    label={config.label}
                    type="number"
                    value={settings[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder="0"
                  />
                )}
                {config.type === "textarea" && (
                  <Textarea
                    label={config.label}
                    value={settings[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={`Enter ${config.label.toLowerCase()}`}
                    rows={3}
                  />
                )}
                {config.type === "select" && config.options && (
                  <Select
                    label={config.label}
                    options={config.options}
                    value={settings[key] || config.options[0]?.value || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={resetSettings}
                disabled={!hasChanges || saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={saveSettings}
                isLoading={saving}
                disabled={!hasChanges || saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
