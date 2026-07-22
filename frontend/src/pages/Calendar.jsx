import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import api from "../api/axios";
import { CalendarClock, Phone } from "lucide-react";

const Calendar = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/leads");
      setLeads(data.leads.filter((l) => l.nextFollowUpAt));
      setLoading(false);
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const sorted = [...leads].sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt));
    const groups = {};
    sorted.forEach((l) => {
      const key = new Date(l.nextFollowUpAt).toDateString();
      groups[key] = groups[key] || [];
      groups[key].push(l);
    });
    return groups;
  }, [leads]);

  return (
    <Layout title="Calendar" subtitle="Upcoming follow-ups and site visits across your pipeline.">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-line p-10 text-center text-slate">
          No scheduled follow-ups. Every lead in the pipeline is either closed or unscheduled.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => {
            const isOverdue = new Date(date) < new Date(new Date().toDateString());
            return (
              <div key={date} className="bg-white rounded-2xl border border-line shadow-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarClock size={18} className={isOverdue ? "text-danger" : "text-brand"} />
                  <h3 className={`font-semibold ${isOverdue ? "text-danger" : "text-ink"}`}>
                    {date} {isOverdue && "· Overdue"}
                  </h3>
                </div>
                <div className="space-y-2">
                  {items.map((lead) => (
                    <div
                      key={lead._id}
                      className="flex items-center justify-between p-3 bg-surface rounded-xl border border-line"
                    >
                      <div>
                        <p className="font-medium text-sm text-ink">{lead.name}</p>
                        <p className="text-xs text-slate flex items-center gap-1">
                          <Phone size={11} /> {lead.phone} · {lead.ownerId?.name || "Unassigned"}
                        </p>
                      </div>
                      <StatusBadge status={lead.stage} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Calendar;
