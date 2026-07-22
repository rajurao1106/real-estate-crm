import React, { useEffect, useState } from "react";
import { X, Phone, Mail, MapPin, Sparkles, Clock, Pencil, Trash2, UserCog } from "lucide-react";
import api from "../api/axios";
import StatusBadge from "./StatusBadge";
import LeadFormModal from "./LeadFormModal";
import { useAuth } from "../context/AuthContext";

const STAGE_OPTIONS = [
  "new",
  "contacted",
  "qualified",
  "site_visit_scheduled",
  "negotiating",
  "closed_won",
  "closed_lost",
];

const LeadDrawer = ({ leadId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [lead, setLead] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState("activity");
  const [note, setNote] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  const load = async () => {
    const { data } = await api.get(`/leads/${leadId}`);
    setLead(data.lead);
    setTimeline(data.timeline);
  };

  useEffect(() => {
    if (leadId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const loadMatches = async () => {
    const { data } = await api.get(`/leads/${leadId}/matches`);
    setMatches(data.matches);
  };

  useEffect(() => {
    if (canManage) {
      api.get("/users").then((res) => setTeamMembers(res.data.users.filter((u) => u.status === "active")));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const handleReassign = async (ownerId) => {
    if (!ownerId) return;
    try {
      await api.post(`/leads/${leadId}/reassign`, { ownerId });
      await load();
      onUpdated?.();
    } catch (err) {
      alert(err.response?.data?.message || "Could not reassign lead");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/leads/${leadId}`);
      onUpdated?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete lead");
    }
  };

  const handleStageChange = async (stage) => {
    let lostReason = "";
    if (stage === "closed_lost") {
      lostReason = window.prompt("Reason for losing this lead?") || "Not specified";
    }
    const terminal = stage === "closed_won" || stage === "closed_lost";
    let followUp = nextFollowUpAt;
    if (!terminal && !followUp) {
      followUp = window.prompt("Next follow-up date/time (YYYY-MM-DD)?", "");
      if (!followUp) return;
    }
    try {
      setSaving(true);
      await api.patch(`/leads/${leadId}/stage`, { stage, nextFollowUpAt: followUp, lostReason });
      await load();
      onUpdated?.();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update stage");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    await api.post(`/leads/${leadId}/followups`, { type: "note", outcome: note, completedAt: new Date() });
    setNote("");
    load();
  };

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-semibold text-lg text-ink">Lead Details</h2>
          <div className="flex items-center gap-3">
            {lead && (
              <>
                <button onClick={() => setShowEdit(true)} className="text-slate hover:text-brand" title="Edit lead">
                  <Pencil size={17} />
                </button>
                {canManage && (
                  <button onClick={handleDelete} className="text-slate hover:text-danger" title="Delete lead">
                    <Trash2 size={17} />
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} className="text-slate hover:text-ink">
              <X size={20} />
            </button>
          </div>
        </div>

        {!lead ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink">{lead.name}</h3>
                <StatusBadge status={lead.stage} />
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate">
                <p className="flex items-center gap-2">
                  <Phone size={14} /> {lead.phone}
                </p>
                {lead.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} /> {lead.email}
                  </p>
                )}
                {lead.requirement?.preferredLocalities?.length > 0 && (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} /> {lead.requirement.preferredLocalities.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-xl p-4 text-sm">
              <p className="font-semibold text-ink mb-2 flex items-center gap-2">
                <UserCog size={15} /> Owner
              </p>
              {canManage ? (
                <select
                  value={lead.ownerId?._id || lead.ownerId || ""}
                  onChange={(e) => handleReassign(e.target.value)}
                  className="input py-2"
                >
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-ink">{lead.ownerId?.name || "Unassigned"}</p>
              )}
            </div>

            <div className="bg-surface rounded-xl p-4 text-sm">
              <p className="font-semibold text-ink mb-2">Requirement</p>
              <div className="grid grid-cols-2 gap-2 text-slate">
                <p>
                  Type: <span className="text-ink capitalize">{lead.requirement?.propertyType}</span>
                </p>
                <p>
                  BHK: <span className="text-ink">{lead.requirement?.bhk ?? "-"}</span>
                </p>
                <p>
                  Budget:{" "}
                  <span className="text-ink">
                    ₹{(lead.requirement?.budgetMin || 0).toLocaleString()} - ₹
                    {(lead.requirement?.budgetMax || 0).toLocaleString()}
                  </span>
                </p>
                <p>
                  Source: <span className="text-ink capitalize">{lead.source?.replace(/_/g, " ")}</span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate mb-2 uppercase tracking-wide">Move Stage</p>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={saving || s === lead.stage}
                    onClick={() => handleStageChange(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      s === lead.stage
                        ? "bg-brand text-white border-brand"
                        : "border-line text-slate hover:border-brand hover:text-brand"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 border-b border-line text-sm font-medium">
              <button
                onClick={() => setTab("activity")}
                className={`pb-2 ${tab === "activity" ? "text-brand border-b-2 border-brand" : "text-slate"}`}
              >
                Activity
              </button>
              <button
                onClick={() => {
                  setTab("matches");
                  loadMatches();
                }}
                className={`pb-2 flex items-center gap-1 ${
                  tab === "matches" ? "text-brand border-b-2 border-brand" : "text-slate"
                }`}
              >
                <Sparkles size={14} /> Matches
              </button>
            </div>

            {tab === "activity" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Log a call, note, or update..."
                    className="flex-1 px-3 py-2 rounded-xl border border-line text-sm outline-none focus:border-brand"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark"
                  >
                    Log
                  </button>
                </div>
                <div className="space-y-3">
                  {timeline.map((t) => (
                    <div key={t._id} className="flex gap-3 text-sm">
                      <div className="w-7 h-7 rounded-full bg-brand-tint flex items-center justify-center text-brand-dark shrink-0">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-ink">{t.outcome || t.type}</p>
                        <p className="text-xs text-slate">{new Date(t.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && <p className="text-sm text-slate">No activity logged yet.</p>}
                </div>
              </div>
            )}

            {tab === "matches" && (
              <div className="space-y-3">
                {matches.length === 0 && <p className="text-sm text-slate">No matching properties found yet.</p>}
                {matches.map((m) => (
                  <div key={m.property._id} className="border border-line rounded-xl p-3 flex gap-3">
                    <img
                      src={m.property.media?.photos?.[0]}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{m.property.title}</p>
                      <p className="text-xs text-slate">{m.property.location?.locality}</p>
                      <p className="text-xs font-semibold text-brand-dark mt-1">
                        ₹{m.property.price?.amount?.toLocaleString()} · Match {m.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {showEdit && lead && (
        <LeadFormModal
          lead={lead}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            load();
            onUpdated?.();
          }}
        />
      )}
    </div>
  );
};

export default LeadDrawer;
