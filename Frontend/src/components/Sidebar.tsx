import {
  LayoutDashboard,
  Users,
  History,
  ChartNoAxesCombined,
  Settings,
  BrainCircuit,
  ShieldAlert,
  Activity,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    path: "/customers",
    icon: Users,
  },
  {
    label: "Churn Prediction",
    path: "/predict",
    icon: Activity,
  },
  {
    label: "Prediction History",
    path: "/predictions",
    icon: History,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <BrainCircuit size={25} />
        </div>

        <div>
          <h2>ChurnIQ</h2>
          <span>Intelligence Platform</span>
        </div>
      </div>

      <div className="workspace-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="security-badge">
          <ShieldAlert size={20} />

          <div>
            <strong>AI-Powered Insights</strong>
            <span>Customer intelligence</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">CI</div>

          <div className="profile-info">
            <strong>Churn Intelligence</strong>
            <span>Admin Workspace</span>
          </div>
        </div>
      </div>
    </aside>
  );
}