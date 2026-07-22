import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Trophy } from "lucide-react";

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const Reports = () => {
  const [funnel, setFunnel] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [bySource, setBySource] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [f, l, r, s] = await Promise.all([
        api.get("/reports/funnel"),
        api.get("/reports/leaderboard"),
        api.get("/reports/revenue-forecast"),
        api.get("/reports/source-effectiveness"),
      ]);
      setFunnel(f.data.funnel);
      setLeaderboard(l.data.leaderboard);
      setForecast(r.data);
      setBySource(s.data.bySource);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Layout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reports & Analytics" subtitle="Conversion funnel, agent leaderboard, and revenue forecast.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-line shadow-card p-5">
          <p className="text-sm text-slate">Closed Revenue</p>
          <p className="text-2xl font-bold text-ink mt-1">{fmtCurrency(forecast?.closedRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-line shadow-card p-5">
          <p className="text-sm text-slate">Weighted Pipeline Value</p>
          <p className="text-2xl font-bold text-ink mt-1">{fmtCurrency(forecast?.weightedPipelineValue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-line shadow-card p-5">
          <p className="text-sm text-slate">Overall Win Rate</p>
          <p className="text-2xl font-bold text-ink mt-1">
            {funnel.length ? `${funnel.find((f) => f.stage === "closed_won")?.count || 0} won` : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-line shadow-card p-5">
          <h3 className="font-semibold text-ink mb-4">Sales Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel.map((f) => ({ stage: f.stage.replace(/_/g, " "), count: f.count }))}>
              <CartesianGrid vertical={false} stroke="#EEF0F3" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#5B6472" }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#5B6472" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DCDFE5", fontSize: 12 }} />
              <Bar dataKey="count" fill="#6E56CF" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-line shadow-card p-5">
          <h3 className="font-semibold text-ink mb-4">Source Effectiveness</h3>
          <div className="space-y-3">
            {bySource.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate w-32 truncate">{s.source?.replace(/_/g, " ")}</span>
                <div className="flex-1 mx-3 bg-surface rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-brand" style={{ width: `${Math.min(s.conversionRate, 100)}%` }} />
                </div>
                <span className="text-xs text-ink font-semibold w-16 text-right">{s.conversionRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-line shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-brand" />
          <h3 className="font-semibold text-ink">Agent Performance Leaderboard</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate text-xs border-b border-line">
              <th className="pb-2 font-medium">Agent</th>
              <th className="pb-2 font-medium">Leads Handled</th>
              <th className="pb-2 font-medium">Site Visits</th>
              <th className="pb-2 font-medium">Conversions</th>
              <th className="pb-2 font-medium">Conv. Rate</th>
              <th className="pb-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, i) => (
              <tr key={row.agentId} className="border-b border-line last:border-0">
                <td className="py-3 font-medium text-ink flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-tint text-brand-dark text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {row.name || "Unassigned"}
                </td>
                <td className="py-3 text-slate">{row.leadsHandled}</td>
                <td className="py-3 text-slate">{row.siteVisits}</td>
                <td className="py-3 text-slate">{row.conversions}</td>
                <td className="py-3 text-slate">{row.conversionRate}%</td>
                <td className="py-3 text-slate">{fmtCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Reports;
