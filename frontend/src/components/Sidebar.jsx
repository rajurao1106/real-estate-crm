import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Building2,
  UserCog,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/team", label: "Team", icon: UserCog, roles: ["admin", "manager"] },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-line">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-line">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white">
          <Home size={18} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg text-ink tracking-tight">EstateVista</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user?.role))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                  isActive
                    ? "bg-brand-tint text-brand-dark"
                    : "text-slate hover:bg-surface hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-brand" />
                  )}
                  <Icon size={18} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      <div className="p-3 border-t border-line">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate hover:bg-surface hover:text-danger transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
