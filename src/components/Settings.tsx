import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { clearUserHistory } from "../lib/pdfUtils";
import type { User } from "../lib/supabase";
import { useSubscription } from "../contexts/SubscriptionContext";

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

interface UserPreferences {
  autoSave: boolean;
  pdfRetentionDays: number;
}

export function Settings({ user, onLogout }: SettingsProps) {
  const { userPlan, totalUsage, maxUsage, setIsUpgradeOpen } =
    useSubscription();

  const [preferences, setPreferences] = useState<UserPreferences>({
    autoSave: true,
    pdfRetentionDays: 30,
  });
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [user.id]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setPreferences({
          autoSave: data.auto_save,
          pdfRetentionDays: data.pdf_retention_days,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const updatePreferences = async (
    newPreferences: Partial<UserPreferences>,
  ) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        auto_save: updatedPreferences.autoSave,
        pdf_retention_days: updatedPreferences.pdfRetentionDays,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleClearHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all your history? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsClearingHistory(true);
    try {
      await clearUserHistory(user.id);
      alert("History cleared successfully");
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Failed to clear history. Please try again.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Settings</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-save Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Auto-save Settings</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Enable Auto-save</Label>
                <p className="text-sm text-gray-500">
                  Automatically save your learning sessions as PDFs
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={preferences.autoSave}
                onCheckedChange={(checked) =>
                  updatePreferences({ autoSave: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="retention-days">PDF Retention Period</Label>
                <p className="text-sm text-gray-500">
                  Number of days to keep auto-saved PDFs
                </p>
              </div>
              <select
                id="retention-days"
                value={preferences.pdfRetentionDays}
                onChange={(e) =>
                  updatePreferences({
                    pdfRetentionDays: Number(e.target.value),
                  })
                }
                className="border rounded-md px-3 py-2"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>

          {/* History Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">History Management</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Clear History</Label>
                <p className="text-sm text-gray-500">
                  Delete all your learning history and saved PDFs
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleClearHistory}
                disabled={isClearingHistory}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isClearingHistory ? "Clearing..." : "Clear History"}
              </Button>
            </div>
          </div>

          {/* Account & Subscription Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email</Label>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>

            {/* Subscription Plan Info */}
            <h3 className="text-lg font-semibold mt-6">Subscription</h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  <strong>Current Plan:</strong>{" "}
                  <span className="capitalize">{userPlan}</span>
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Usage:</strong> {totalUsage} /
                  {maxUsage[userPlan] === Infinity ? "∞" : maxUsage[userPlan]}{" "}
                  total uses
                </p>
              </div>
              <Button
                onClick={() => setIsUpgradeOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
