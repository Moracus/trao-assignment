import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
  filter,
  setFilter,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          activeFilter={filter}
          setActiveFilter={setFilter}
        />

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}