import React from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TopBar = ({ title, subtitle, actions }) => {
  const { user } = useAuth();
  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 h-16">
        <div className="hidden md:flex items-center gap-2 bg-surface border border-line rounded-xl px-3 py-2 w-72">
          <Search size={16} className="text-slate" />
          <input
            placeholder="Search leads, properties..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate"
          />
        </div>

        <div className="flex-1 md:hidden">
          <p className="font-bold text-ink">{title}</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:bg-surface">
            <Bell size={18} />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-brand" />
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-line">
            <div className="w-9 h-9 rounded-full bg-brand-tint text-brand-dark font-semibold flex items-center justify-center text-sm">
              {initials}
            </div>
            <div className="hidden lg:block leading-tight">
              <p className="text-sm font-semibold text-ink">{user?.name}</p>
              <p className="text-xs text-slate capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={16} className="text-slate hidden lg:block" />
          </div>
        </div>
      </div>

      {(title || actions) && (
        <div className="flex items-center justify-between px-4 md:px-8 pb-4 pt-2">
          <div>
            {title && <h1 className="text-xl md:text-2xl font-bold text-ink">{title}</h1>}
            {subtitle && <p className="text-sm text-slate mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
    </header>
  );
};

export default TopBar;
