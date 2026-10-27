import {
  LayoutDashboard,
  Users,
  History,
  ChartNoAxesCombined,
  Settings,
  BrainCircuit,
  ShieldAlert,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Customers", icon: Users },
  { label: "Prediction History", icon: History },
  { label: "Analytics", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
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
        {menuItems.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            className={`nav-item ${index === 0 ? "active" : ""}`}
            type="button"
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
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
