import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import api from "../api/axios";

// Handles both "create" and "edit" flows for a property listing.
// Pass `property` (full object) to switch into edit mode with all fields pre-filled.
const PropertyFormModal = ({ property, onClose, onSaved }) => {
  const isEdit = Boolean(property);
  const [form, setForm] = useState({
    title: property?.title || "",
    type: property?.type || "residential",
    subType: property?.subType || "Apartment",
    bhk: property?.config?.bhk ?? "",
    carpetAreaSqft: property?.config?.carpetAreaSqft || "",
    builtUpAreaSqft: property?.config?.builtUpAreaSqft || "",
    floor: property?.config?.floor || "",
    facing: property?.config?.facing || "",
    furnishing: property?.config?.furnishing || "unfurnished",
    price: property?.price?.amount || "",
    pricePerSqft: property?.price?.pricePerSqft || "",
    bookingAmount: property?.price?.bookingAmount || "",
    maintenance: property?.price?.maintenance || "",
    negotiable: property?.price?.negotiable || false,
    address: property?.location?.address || "",
    locality: property?.location?.locality || "",
    city: property?.location?.city || "Bengaluru",
    pincode: property?.location?.pincode || "",
    status: property?.status || "available",
    ownerName: property?.ownership?.ownerName || "",
    reraId: property?.ownership?.reraId || "",
  });
  const [photos, setPhotos] = useState(property?.media?.photos || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const addPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotos((p) => [...p, newPhotoUrl.trim()]);
    setNewPhotoUrl("");
  };

  const removePhoto = (url) => setPhotos((p) => p.filter((u) => u !== url));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      title: form.title,
      type: form.type,
      subType: form.subType,
      status: form.status,
      config: {
        bhk: form.bhk ? Number(form.bhk) : null,
        carpetAreaSqft: Number(form.carpetAreaSqft) || 0,
        builtUpAreaSqft: Number(form.builtUpAreaSqft) || 0,
        floor: form.floor,
        facing: form.facing,
        furnishing: form.furnishing,
      },
      price: {
        amount: Number(form.price) || 0,
        pricePerSqft: Number(form.pricePerSqft) || 0,
        bookingAmount: Number(form.bookingAmount) || 0,
        maintenance: Number(form.maintenance) || 0,
        negotiable: Boolean(form.negotiable),
      },
      location: {
        address: form.address,
        locality: form.locality,
        city: form.city,
        pincode: form.pincode,
      },
      ownership: {
        ownerName: form.ownerName,
        reraId: form.reraId,
      },
      media: {
        photos: photos.length ? photos : [`https://picsum.photos/seed/${Date.now()}/640/420`],
      },
    };

    try {
      if (isEdit) {
        await api.patch(`/properties/${property._id}`, payload);
      } else {
        await api.post("/properties", payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${isEdit ? "update" : "create"} property`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-semibold text-lg text-ink">{isEdit ? "Edit Property" : "Add Property"}</h2>
          <button onClick={onClose} className="text-slate hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 text-danger text-sm border border-red-100">{error}</div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Basics</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-ink mb-1 block">Listing Title</label>
                <input required value={form.title} onChange={update("title")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Type</label>
                <select value={form.type} onChange={update("type")} className="input">
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="plot">Plot</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Sub-type</label>
                <input value={form.subType} onChange={update("subType")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Status</label>
                <select value={form.status} onChange={update("status")} className="input">
                  <option value="available">Available</option>
                  <option value="hold">Hold</option>
                  <option value="booked">Booked</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Configuration</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">BHK</label>
                <input type="number" value={form.bhk} onChange={update("bhk")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Carpet (sqft)</label>
                <input type="number" value={form.carpetAreaSqft} onChange={update("carpetAreaSqft")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Built-up (sqft)</label>
                <input type="number" value={form.builtUpAreaSqft} onChange={update("builtUpAreaSqft")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Floor</label>
                <input value={form.floor} onChange={update("floor")} className="input" placeholder="e.g. 4 of 15" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Facing</label>
                <input value={form.facing} onChange={update("facing")} className="input" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-ink mb-1 block">Furnishing</label>
                <select value={form.furnishing} onChange={update("furnishing")} className="input">
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi-furnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Pricing</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Price (₹)</label>
                <input required type="number" value={form.price} onChange={update("price")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Price / sqft</label>
                <input type="number" value={form.pricePerSqft} onChange={update("pricePerSqft")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Booking Amt (₹)</label>
                <input type="number" value={form.bookingAmount} onChange={update("bookingAmount")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Maintenance /mo</label>
                <input type="number" value={form.maintenance} onChange={update("maintenance")} className="input" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate mt-2">
              <input type="checkbox" checked={form.negotiable} onChange={update("negotiable")} className="accent-brand rounded" />
              Price is negotiable
            </label>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-ink mb-1 block">Address</label>
                <input value={form.address} onChange={update("address")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Locality</label>
                <input required value={form.locality} onChange={update("locality")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">City</label>
                <input required value={form.city} onChange={update("city")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Pincode</label>
                <input value={form.pincode} onChange={update("pincode")} className="input" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Ownership</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Owner Name</label>
                <input value={form.ownerName} onChange={update("ownerName")} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">RERA ID</label>
                <input value={form.reraId} onChange={update("reraId")} className="input" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Photos</p>
            <div className="flex gap-2 mb-3">
              <input
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Paste an image URL..."
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addPhoto}
                className="px-3.5 py-2.5 bg-brand-tint text-brand-dark rounded-xl hover:bg-brand hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="w-full h-16 object-cover rounded-lg border border-line" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Property"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyFormModal;
