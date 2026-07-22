import React from "react";

const STYLES = {
  // lead stages
  new: "bg-slate-100 text-slate-600",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-indigo-100 text-indigo-700",
  site_visit_scheduled: "bg-amber-100 text-amber-700",
  negotiating: "bg-purple-100 text-purple-700",
  closed_won: "bg-green-100 text-success",
  closed_lost: "bg-red-100 text-danger",
  // property statuses
  available: "bg-green-100 text-success",
  hold: "bg-amber-100 text-warning",
  booked: "bg-blue-100 text-blue-700",
  sold: "bg-slate-200 text-slate-700",
  rented: "bg-indigo-100 text-indigo-700",
  withdrawn: "bg-red-100 text-danger",
};

const LABELS = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit_scheduled: "Site Visit",
  negotiating: "Negotiating",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  available: "Available",
  hold: "Hold",
  booked: "Booked",
  sold: "Sold",
  rented: "Rented",
  withdrawn: "Withdrawn",
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STYLES[status] || "bg-slate-100 text-slate-600"}`}>
    {LABELS[status] || status}
  </span>
);

export default StatusBadge;
