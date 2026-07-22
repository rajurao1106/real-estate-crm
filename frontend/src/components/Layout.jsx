import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const Layout = ({ title, subtitle, actions, children }) => {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className="px-4 md:px-8 py-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
