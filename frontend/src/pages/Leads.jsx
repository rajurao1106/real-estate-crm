import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import LeadDrawer from "../components/LeadDrawer";
import LeadFormModal from "../components/LeadFormModal";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Plus, LayoutGrid, Rows3, Phone, Pencil, Trash2 } from "lucide-react";

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "site_visit_scheduled", label: "Site Visit" },
  { key: "negotiating", label: "Negotiating" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

const Leads = () => {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [leads, setLeads] = useState([]);
  const [view, setView] = useState("kanban");
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dragStage, setDragStage] = useState(null);

  const handleDelete = async (lead, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/leads/${lead._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete lead");
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leads", { params: { source: sourceFilter || undefined, search: search || undefined } });
      setLeads(data.leads);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  const grouped = useMemo(() => {
    const g = {};
    STAGES.forEach((s) => (g[s.key] = []));
    leads.forEach((l) => {
      if (g[l.stage]) g[l.stage].push(l);
    });
    return g;
  }, [leads]);

  const handleDrop = async (stage) => {
    if (!dragStage || dragStage.stage === stage) return;
    const terminal = stage === "closed_won" || stage === "closed_lost";
    let nextFollowUpAt;
    let lostReason = "";
    if (stage === "closed_lost") {
      lostReason = window.prompt("Reason for losing this lead?") || "Not specified";
    }
    if (!terminal) {
      nextFollowUpAt = window.prompt("Next follow-up date (YYYY-MM-DD)?", "");
      if (!nextFollowUpAt) return;
    }
    try {
      await api.patch(`/leads/${dragStage._id}/stage`, { stage, nextFollowUpAt, lostReason });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not move lead");
    }
  };

  return (
    <Layout
      title="Leads"
      subtitle="Every lead, one pipeline — captured, tracked, and converted."
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark"
        >
          <Plus size={16} /> Add Lead
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search name or phone..."
          className="input max-w-xs"
        />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="input max-w-[180px]">
          <option value="">All Sources</option>
          <option value="magicbricks">MagicBricks</option>
          <option value="99acres">99acres</option>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="walk_in">Walk-in</option>
          <option value="manual">Manual</option>
        </select>

        <div className="ml-auto flex items-center bg-white border border-line rounded-xl p-1">
          <button
            onClick={() => setView("kanban")}
            className={`p-2 rounded-lg ${view === "kanban" ? "bg-brand-tint text-brand-dark" : "text-slate"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded-lg ${view === "table" ? "bg-brand-tint text-brand-dark" : "text-slate"}`}
          >
            <Rows3 size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.key)}
              className="bg-white rounded-2xl border border-line w-72 shrink-0 flex flex-col max-h-[calc(100vh-260px)]"
            >
              <div className="p-3 border-b border-line flex items-center justify-between">
                <p className="font-semibold text-sm text-ink">{stage.label}</p>
                <span className="text-xs bg-surface text-slate px-2 py-0.5 rounded-full">
                  {grouped[stage.key]?.length || 0}
                </span>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {grouped[stage.key]?.map((lead) => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={() => setDragStage(lead)}
                    onClick={() => setActiveLead(lead._id)}
                    className="bg-surface hover:bg-brand-tint/50 border border-line rounded-xl p-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-ink">{lead.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditLead(lead);
                          }}
                          className="text-slate hover:text-brand p-0.5"
                        >
                          <Pencil size={13} />
                        </button>
                        {canManage && (
                          <button onClick={(e) => handleDelete(lead, e)} className="text-slate hover:text-danger p-0.5">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate flex items-center gap-1 mt-1">
                      <Phone size={11} /> {lead.phone}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] uppercase tracking-wide text-slate">
                        {lead.source?.replace(/_/g, " ")}
                      </span>
                      {lead.ownerId?.name && (
                        <span className="text-[10px] font-medium text-brand-dark bg-brand-tint px-2 py-0.5 rounded-full">
                          {lead.ownerId.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {grouped[stage.key]?.length === 0 && (
                  <p className="text-xs text-slate text-center py-6">No leads</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-line shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-slate text-xs border-b border-line bg-surface">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Source</th>
                <th className="p-4 font-medium">Stage</th>
                <th className="p-4 font-medium">Owner</th>
                <th className="p-4 font-medium">Next Follow-up</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead._id}
                  onClick={() => setActiveLead(lead._id)}
                  className="border-b border-line last:border-0 hover:bg-surface cursor-pointer"
                >
                  <td className="p-4 font-medium text-ink">{lead.name}</td>
                  <td className="p-4 text-slate">{lead.phone}</td>
                  <td className="p-4 text-slate capitalize">{lead.source?.replace(/_/g, " ")}</td>
                  <td className="p-4">
                    <StatusBadge status={lead.stage} />
                  </td>
                  <td className="p-4 text-slate">{lead.ownerId?.name || "-"}</td>
                  <td className="p-4 text-slate">
                    {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditLead(lead);
                        }}
                        className="text-slate hover:text-brand"
                      >
                        <Pencil size={15} />
                      </button>
                      {canManage && (
                        <button onClick={(e) => handleDelete(lead, e)} className="text-slate hover:text-danger">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeLead && (
        <LeadDrawer leadId={activeLead} onClose={() => setActiveLead(null)} onUpdated={load} />
      )}
      {showAdd && <LeadFormModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {editLead && (
        <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} onSaved={load} />
      )}
    </Layout>
  );
};

export default Leads;
