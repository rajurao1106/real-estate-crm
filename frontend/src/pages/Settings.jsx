import React, { useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Save, KeyRound } from "lucide-react";

const STAGES = [
  { name: "New", sla: "Assign within 15 min" },
  { name: "Contacted", sla: "First outreach within 1 hour" },
  { name: "Qualified", sla: "Trigger property matching" },
  { name: "Site Visit Scheduled", sla: "Confirm 24h before visit" },
  { name: "Negotiating", sla: "Escalate to manager after 3 days" },
  { name: "Closed – Won", sla: "Trigger invoicing workflow" },
  { name: "Closed – Lost", sla: "Mandatory lost-reason capture" },
];

const ProfileForm = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch("/users/me", { name, avatarUrl });
      setUser(data.user);
      localStorage.setItem("ev_user", JSON.stringify(data.user));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {message && <div className="px-3 py-2 rounded-xl bg-green-50 text-success text-sm">{message}</div>}
      {error && <div className="px-3 py-2 rounded-xl bg-red-50 text-danger text-sm">{error}</div>}
      <div>
        <label className="text-sm font-medium text-ink mb-1 block">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </div>
      <div>
        <label className="text-sm font-medium text-ink mb-1 block">Avatar URL</label>
        <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="input" placeholder="https://..." />
      </div>
      <p className="text-xs text-slate">
        Email: <span className="text-ink font-medium">{user?.email}</span> · Role:{" "}
        <span className="text-ink font-medium capitalize">{user?.role}</span>
      </p>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
      >
        <Save size={15} /> {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
};

const PasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/users/me/password", { currentPassword, newPassword });
      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {message && <div className="px-3 py-2 rounded-xl bg-green-50 text-success text-sm">{message}</div>}
      {error && <div className="px-3 py-2 rounded-xl bg-red-50 text-danger text-sm">{error}</div>}
      <div>
        <label className="text-sm font-medium text-ink mb-1 block">Current Password</label>
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink mb-1 block">New Password</label>
        <input
          required
          type="password"
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink mb-1 block">Confirm New Password</label>
        <input
          required
          type="password"
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-ink hover:bg-black text-white font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
      >
        <KeyRound size={15} /> {saving ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
};

const Settings = () => {
  return (
    <Layout title="Settings" subtitle="Your account, pipeline configuration, and SLA rules.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">My Account</h3>
            <ProfileForm />
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">Change Password</h3>
            <PasswordForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">Pipeline Stages & SLA Rules</h3>
            <div className="space-y-3">
              {STAGES.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 bg-surface rounded-xl">
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-slate">{s.sla}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate mt-4">
              Stage and SLA configuration is editable by Admin users only, per the RBAC policy in the PRD.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">Integrations (Phase 2)</h3>
            <div className="space-y-2 text-sm text-slate">
              <p>• MagicBricks / 99acres / Housing.com portal sync</p>
              <p>• Facebook & Instagram Lead Ads webhook</p>
              <p>• WhatsApp Business API for templated outreach</p>
              <p>• SMS / OTP verification</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
