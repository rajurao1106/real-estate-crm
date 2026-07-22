import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import PropertyFormModal from "../components/PropertyFormModal";
import api from "../api/axios";
import { Plus, BedDouble, Ruler, MapPin, Pencil } from "lucide-react";

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editProperty, setEditProperty] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/properties", {
        params: { type: type || undefined, status: status || undefined, search: search || undefined },
      });
      setProperties(data.properties);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status]);

  return (
    <Layout
      title="Properties"
      subtitle="Your full inventory — residential, commercial, and plots."
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark"
        >
          <Plus size={16} /> Add Property
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-5 bg-white p-3 rounded-2xl border border-line">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by title or locality..."
          className="input max-w-xs"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="input max-w-[160px]">
          <option value="">Property Type</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="plot">Plot</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-[160px]">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="hold">Hold</option>
          <option value="booked">Booked</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
        <button onClick={load} className="bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark">
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/properties/${p._id}`)}
              className="bg-white rounded-2xl border border-line shadow-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="relative h-40">
                <img src={p.media?.photos?.[0]} alt={p.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <StatusBadge status={p.status} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditProperty(p);
                  }}
                  className="absolute top-2 left-2 bg-white/90 hover:bg-white text-slate hover:text-brand rounded-full p-1.5 shadow-sm"
                  title="Quick edit"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink truncate">{p.title}</h3>
                <p className="text-xs text-slate flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {p.location?.locality}, {p.location?.city}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate">
                  {p.config?.bhk && (
                    <span className="flex items-center gap-1">
                      <BedDouble size={13} /> {p.config.bhk} BHK
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Ruler size={13} /> {p.config?.carpetAreaSqft} sqft
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-bold text-brand-dark">{fmtCurrency(p.price?.amount)}</p>
                  <span className="text-xs text-brand font-semibold">View →</span>
                </div>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <p className="text-sm text-slate col-span-full text-center py-16">No properties match your filters.</p>
          )}
        </div>
      )}

      {showAdd && <PropertyFormModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {editProperty && (
        <PropertyFormModal property={editProperty} onClose={() => setEditProperty(null)} onSaved={load} />
      )}
    </Layout>
  );
};

export default Properties;
