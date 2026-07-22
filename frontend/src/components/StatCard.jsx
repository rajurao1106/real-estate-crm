import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const colorMap = {
  brand: "bg-brand-tint text-brand-dark",
  pink: "bg-pink-100 text-pink-600",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-success",
};

const StatCard = ({ label, value, icon: Icon, trend, trendLabel = "vs last month", color = "brand" }) => {
  const positive = trend >= 0;
  return (
    <div className="bg-white rounded-2xl border border-line shadow-card p-5 flex-1 min-w-[210px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium">
          <span className={`flex items-center gap-0.5 ${positive ? "text-success" : "text-danger"}`}>
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
          <span className="text-slate">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
