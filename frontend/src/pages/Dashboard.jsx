import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { Building2, DollarSign, Home, PercentCircle, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const PIE_COLORS = ["#6E56CF", "#F5B400", "#1E8E5A", "#5B6472"];

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, funnelRes, propsRes] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/reports/funnel"),
          api.get("/properties"),
        ]);
        setSummary(summaryRes.data.summary);
        setFunnel(funnelRes.data.funnel);
        setProperties(propsRes.data.properties.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const typeDistribution = React.useMemo(() => {
    const counts = {};
    properties.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties]);

  const barData = funnel.map((f) => ({
    stage: f.stage.replace(/_/g, " "),
    count: f.count,
  }));

  return (
    <Layout
      title={`Hello ${user?.name?.split(" ")[0] || ""}, Good Morning!`}
      subtitle="Here's what's happening with your business today."
      actions={
        <button className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors">
          <Download size={16} /> Export
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <StatCard
              label="Total Properties"
              value={summary?.totalProperties?.toLocaleString() ?? "0"}
              icon={Building2}
              trend={2.08}
              color="brand"
            />
            <StatCard
              label="Total Leads"
              value={summary?.totalLeads?.toLocaleString() ?? "0"}
              icon={Home}
              trend={-4.2}
              color="pink"
            />
            <StatCard
              label="Closed Won"
              value={summary?.closedWon?.toLocaleString() ?? "0"}
              icon={PercentCircle}
              trend={10.08}
              color="yellow"
            />
            <StatCard
              label="Revenue Closed"
              value={fmtCurrency(summary?.totalRevenue)}
              icon={DollarSign}
              trend={8.06}
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-line shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink">Lead Pipeline Overview</h3>
                <span className="text-xs text-slate bg-surface px-3 py-1.5 rounded-lg border border-line">
                  This Month
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#EEF0F3" />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: "#5B6472" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#5B6472" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #DCDFE5", fontSize: 12 }}
                    cursor={{ fill: "#EDE9FE55" }}
                  />
                  <Bar dataKey="count" fill="#6E56CF" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-line shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink">Property Mix</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DCDFE5", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {typeDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate capitalize">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-semibold text-ink">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-line shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink">Newly Added Properties</h3>
                <button className="text-xs text-brand font-semibold">See All</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate text-xs border-b border-line">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Locality</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p._id} className="border-b border-line last:border-0">
                      <td className="py-3 font-medium text-ink">{p.title}</td>
                      <td className="py-3 text-slate">{p.location?.locality}</td>
                      <td className="py-3 text-slate">{fmtCurrency(p.price?.amount)}</td>
                      <td className="py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-line shadow-card p-5">
              <h3 className="font-semibold text-ink mb-4">Attention Needed</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-ink">Overdue Follow-ups</p>
                    <p className="text-xs text-slate">Leads past next action date</p>
                  </div>
                  <span className="text-lg font-bold text-danger">{summary?.noActivityLeads ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-tint rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-ink">New Leads Today</p>
                    <p className="text-xs text-slate">Captured across all sources</p>
                  </div>
                  <span className="text-lg font-bold text-brand-dark">{summary?.newLeadsToday ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-ink">Available Inventory</p>
                    <p className="text-xs text-slate">Ready to be matched</p>
                  </div>
                  <span className="text-lg font-bold text-success">{summary?.activeProperties ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
