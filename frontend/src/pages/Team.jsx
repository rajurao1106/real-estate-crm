import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Plus, X, Mail, Phone, Pencil, UserX, UserCheck } from "lucide-react";

const ROLE_STYLES = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  agent: "bg-green-100 text-success",
  telecaller: "bg-amber-100 text-warning",
};

const AddUserForm = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "agent" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/users", form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-semibold text-lg text-ink">Add Team Member</h2>
          <button onClick={onClose} className="text-slate hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="px-4 py-2.5 rounded-xl bg-red-50 text-danger text-sm">{error}</div>}
          <input required placeholder="Full name" value={form.name} onChange={update("name")} className="input" />
          <input required type="email" placeholder="Email" value={form.email} onChange={update("email")} className="input" />
          <input required placeholder="Phone" value={form.phone} onChange={update("phone")} className="input" />
          <input
            required
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={update("password")}
            className="input"
          />
          <select value={form.role} onChange={update("role")} className="input">
            <option value="agent">Agent</option>
            <option value="telecaller">Telecaller</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Full profile + role edit for an existing team member (Admin only).
const EditUserForm = ({ member, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/users/${member._id}`, { name: form.name, email: form.email, phone: form.phone });
      await api.patch(`/users/${member._id}/role`, { role: form.role });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-semibold text-lg text-ink">Edit Team Member</h2>
          <button onClick={onClose} className="text-slate hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="px-4 py-2.5 rounded-xl bg-red-50 text-danger text-sm">{error}</div>}
          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Full Name</label>
            <input required value={form.name} onChange={update("name")} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Email</label>
            <input required type="email" value={form.email} onChange={update("email")} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Phone</label>
            <input required value={form.phone} onChange={update("phone")} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Role</label>
            <select value={form.role} onChange={update("role")} className="input">
              <option value="agent">Agent</option>
              <option value="telecaller">Telecaller</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Team = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/users");
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (member) => {
    if (member.status === "active") {
      if (!window.confirm(`Deactivate ${member.name}? They will lose access immediately.`)) return;
      try {
        await api.delete(`/users/${member._id}`);
      } catch (err) {
        alert(err.response?.data?.message || "Could not deactivate user");
        return;
      }
    } else {
      await api.patch(`/users/${member._id}/role`, { status: "active" });
    }
    load();
  };

  return (
    <Layout
      title="Team"
      subtitle="Manage agents, managers, and telecallers."
      actions={
        user?.role === "admin" && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark"
          >
            <Plus size={16} /> Add Member
          </button>
        )
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => (
            <div key={u._id} className="bg-white rounded-2xl border border-line shadow-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-tint text-brand-dark font-semibold flex items-center justify-center shrink-0">
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{u.name}</p>
                    <span className={`badge ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                  </div>
                </div>
                {user?.role === "admin" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditMember(u)}
                      className="text-slate hover:text-brand p-1"
                      title="Edit member"
                    >
                      <Pencil size={15} />
                    </button>
                    {String(u._id) !== String(user._id) && (
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`p-1 ${u.status === "active" ? "text-slate hover:text-danger" : "text-slate hover:text-success"}`}
                        title={u.status === "active" ? "Deactivate" : "Reactivate"}
                      >
                        {u.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate">
                <p className="flex items-center gap-2">
                  <Mail size={14} /> {u.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} /> {u.phone}
                </p>
              </div>
              <div className="mt-3">
                <span
                  className={`badge ${
                    u.status === "active" ? "bg-green-100 text-success" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddUserForm onClose={() => setShowAdd(false)} onCreated={load} />}
      {editMember && <EditUserForm member={editMember} onClose={() => setEditMember(null)} onSaved={load} />}
    </Layout>
  );
};

export default Team;
