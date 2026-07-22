import React, { useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

const SOURCES = ["manual", "walk_in", "referral", "website", "magicbricks", "99acres", "housing_com", "facebook_ads"];

// Handles both "create" and "edit" flows for a lead.
// Pass `lead` (the full lead object) to switch into edit mode.
const LeadFormModal = ({ lead, onClose, onSaved }) => {
  const isEdit = Boolean(lead);
  const [form, setForm] = useState({
    name: lead?.name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    source: lead?.source || "manual",
    propertyType: lead?.requirement?.propertyType || "residential",
    budgetMin: lead?.requirement?.budgetMin || "",
    budgetMax: lead?.requirement?.budgetMax || "",
    bhk: lead?.requirement?.bhk || "",
    locality: lead?.requirement?.preferredLocalities?.[0] || "",
    notes: lead?.notes || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      source: form.source,
      notes: form.notes,
      requirement: {
        propertyType: form.propertyType,
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
        bhk: form.bhk ? Number(form.bhk) : null,
        preferredLocalities: form.locality ? [form.locality] : [],
      },
    };
    try {
      if (isEdit) {
        await api.patch(`/leads/${lead._id}`, payload);
      } else {
        await api.post("/leads", payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${isEdit ? "update" : "create"} lead`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-semibold text-lg text-ink">{isEdit ? "Edit Lead" : "Add New Lead"}</h2>
          <button onClick={onClose} className="text-slate hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 text-danger text-sm border border-red-100">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-ink mb-1 block">Full Name</label>
              <input required value={form.name} onChange={update("name")} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">Phone</label>
              <input required value={form.phone} onChange={update("phone")} className="input" disabled={isEdit} />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={update("email")} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">Source</label>
              <select value={form.source} onChange={update("source")} className="input">
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">Property Type</label>
              <select value={form.propertyType} onChange={update("propertyType")} className="input">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="plot">Plot</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">BHK</label>
              <input type="number" value={form.bhk} onChange={update("bhk")} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">Budget Min (₹)</label>
              <input type="number" value={form.budgetMin} onChange={update("budgetMin")} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">Budget Max (₹)</label>
              <input type="number" value={form.budgetMax} onChange={update("budgetMax")} className="input" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-ink mb-1 block">Preferred Locality</label>
              <input value={form.locality} onChange={update("locality")} className="input" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-ink mb-1 block">Notes</label>
              <textarea rows={3} value={form.notes} onChange={update("notes")} className="input" />
            </div>
          </div>
          {isEdit && <p className="text-xs text-slate">Phone number can't be changed — it's used to de-duplicate leads.</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Lead"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
