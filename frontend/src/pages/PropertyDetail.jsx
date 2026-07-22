import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import PropertyFormModal from "../components/PropertyFormModal";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, MapPin, BedDouble, Ruler, Compass, Sofa, Pencil, Trash2, ShieldOff } from "lucide-react";

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const STATUS_OPTIONS = ["available", "hold", "booked", "sold", "rented", "withdrawn"];

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(`/properties/${id}`);
    setProperty(data.property);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get(`/properties/${id}/matches`).then((res) => setMatches(res.data.matches));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (status) => {
    await api.patch(`/properties/${id}`, { status });
    load();
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Withdraw this listing? It will be marked as withdrawn but kept for records.")) return;
    await api.delete(`/properties/${id}`);
    load();
  };

  const handlePermanentDelete = async () => {
    if (!window.confirm("Permanently delete this property? This cannot be undone.")) return;
    await api.delete(`/properties/${id}/permanent`);
    navigate("/properties");
  };

  if (loading || !property) {
    return (
      <Layout title="Property Detail">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-tint border-t-brand rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={property.title}
      subtitle={`${property.location?.locality}, ${property.location?.city}`}
      actions={
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 bg-brand-tint text-brand-dark text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand hover:text-white transition-colors"
          >
            <Pencil size={15} /> Edit
          </button>
          {property.status !== "withdrawn" && (
            <button
              onClick={handleWithdraw}
              className="flex items-center gap-2 text-sm font-semibold text-warning border border-amber-200 bg-amber-50 px-4 py-2.5 rounded-xl hover:bg-amber-100"
            >
              <ShieldOff size={15} /> Withdraw
            </button>
          )}
          {user?.role === "admin" && (
            <button
              onClick={handlePermanentDelete}
              className="flex items-center gap-2 text-sm font-semibold text-danger border border-red-200 bg-red-50 px-4 py-2.5 rounded-xl hover:bg-red-100"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
            {(property.media?.photos?.length ? property.media.photos : [null, null]).map((src, i) => (
              <img
                key={i}
                src={src || "https://picsum.photos/seed/placeholder/640/420"}
                className={`w-full object-cover h-56 ${i === 0 ? "col-span-2 h-72" : ""}`}
                alt=""
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {property.config?.bhk && (
                <div className="flex items-center gap-2 text-slate">
                  <BedDouble size={16} className="text-brand" /> {property.config.bhk} BHK
                </div>
              )}
              <div className="flex items-center gap-2 text-slate">
                <Ruler size={16} className="text-brand" /> {property.config?.carpetAreaSqft} sqft
              </div>
              <div className="flex items-center gap-2 text-slate">
                <Compass size={16} className="text-brand" /> {property.config?.facing || "-"} Facing
              </div>
              <div className="flex items-center gap-2 text-slate capitalize">
                <Sofa size={16} className="text-brand" /> {property.config?.furnishing?.replace(/_/g, " ")}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">Pricing</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate text-xs">Price</p>
                <p className="font-bold text-ink">{fmtCurrency(property.price?.amount)}</p>
              </div>
              <div>
                <p className="text-slate text-xs">Price / sqft</p>
                <p className="font-bold text-ink">₹{property.price?.pricePerSqft?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate text-xs">Booking Amount</p>
                <p className="font-bold text-ink">{fmtCurrency(property.price?.bookingAmount)}</p>
              </div>
              <div>
                <p className="text-slate text-xs">Maintenance / mo</p>
                <p className="font-bold text-ink">{fmtCurrency(property.price?.maintenance)}</p>
              </div>
              <div>
                <p className="text-slate text-xs">Negotiable</p>
                <p className="font-bold text-ink">{property.price?.negotiable ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink mb-4">Matched Leads ({matches.length})</h3>
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.lead._id} className="flex items-center justify-between border border-line rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm text-ink">{m.lead.name}</p>
                    <p className="text-xs text-slate">{m.lead.phone}</p>
                  </div>
                  <span className="text-xs font-semibold bg-brand-tint text-brand-dark px-2.5 py-1 rounded-full">
                    Match {m.score}%
                  </span>
                </div>
              ))}
              {matches.length === 0 && <p className="text-sm text-slate">No matching leads yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <p className="text-sm text-slate mb-2">Current Status</p>
            <StatusBadge status={property.status} />
            <p className="text-xs font-semibold text-slate mt-4 mb-2 uppercase tracking-wide">Change Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={s === property.status}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    s === property.status
                      ? "bg-brand text-white border-brand"
                      : "border-line text-slate hover:border-brand hover:text-brand"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <p className="text-sm font-semibold text-ink mb-3">Location</p>
            <p className="text-sm text-slate flex items-center gap-2">
              <MapPin size={14} /> {property.location?.address}
            </p>
            <p className="text-sm text-slate mt-1">{property.location?.locality}, {property.location?.city}</p>
            <p className="text-sm text-slate">{property.location?.pincode}</p>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <p className="text-sm font-semibold text-ink mb-3">Listing Agent</p>
            <p className="text-sm text-ink font-medium">{property.listingAgentId?.name}</p>
            <p className="text-xs text-slate">{property.listingAgentId?.email}</p>
            <p className="text-xs text-slate">{property.listingAgentId?.phone}</p>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-card p-5">
            <p className="text-sm font-semibold text-ink mb-3">Ownership</p>
            <p className="text-sm text-slate">Owner: {property.ownership?.ownerName || "-"}</p>
            <p className="text-sm text-slate">RERA ID: {property.ownership?.reraId || "-"}</p>
          </div>
        </div>
      </div>
      {showEdit && (
        <PropertyFormModal
          property={property}
          onClose={() => setShowEdit(false)}
          onSaved={load}
        />
      )}
    </Layout>
  );
};

export default PropertyDetail;
