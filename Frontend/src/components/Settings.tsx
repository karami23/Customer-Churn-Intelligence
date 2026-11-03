import { useEffect, useState } from "react";
import {
  checkApiHealth,
  getApiBaseUrl,
} from "../lib/api";

type ApiStatus = "checking" | "connected" | "disconnected" | "idle";

export default function Settings() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [checking, setChecking] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    const savedPreference = localStorage.getItem("compactMode");
    setCompactMode(savedPreference === "true");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("compact-ui", compactMode);

    return () => {
      document.body.classList.remove("compact-ui");
    };
  }, [compactMode]);

  async function testConnection() {
    try {
      setChecking(true);
      setApiStatus("checking");

      const isHealthy = await checkApiHealth();

      setApiStatus(isHealthy ? "connected" : "disconnected");
      setLastChecked(new Date().toLocaleString());
    } catch (error) {
      console.error("API health check failed:", error);
      setApiStatus("disconnected");
      setLastChecked(new Date().toLocaleString());
    } finally {
      setChecking(false);
    }
  }

  function handleCompactModeChange(enabled: boolean) {
    setCompactMode(enabled);
    localStorage.setItem("compactMode", String(enabled));
  }

  const statusText: Record<ApiStatus, string> = {
    checking: "Checking connection...",
    connected: "Connected",
    disconnected: "Connection failed",
    idle: "Not checked yet",
  };

  return (
    <main className="main-content settings-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Settings</h1>
          <p>
            Manage application preferences and monitor service connectivity.
          </p>
        </div>

        <div className="header-status">
          <span className="status-dot" />
          ML Platform
        </div>
      </header>

      <section className="overview-panel settings-panel">
        <div className="settings-section-heading">
          <span className="panel-label">PREFERENCES</span>
          <h2>Appearance</h2>
          <p>Customize how the dashboard is displayed.</p>
        </div>

        <div className="settings-option">
          <div className="settings-option-info">
            <strong>Compact interface</strong>
            <p>
              Reduce spacing in dashboard sections and tables to display
              more information at once.
            </p>
          </div>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={compactMode}
              onChange={(event) =>
                handleCompactModeChange(event.target.checked)
              }
            />
            <span className="settings-switch-slider" />
          </label>
        </div>
      </section>

      <section className="overview-panel settings-panel">
        <div className="settings-section-heading">
          <span className="panel-label">SYSTEM STATUS</span>
          <h2>Backend Connection</h2>
          <p>
            Check whether the FastAPI service is reachable.
          </p>
        </div>

        <div className="settings-api-card">
          <div className="settings-api-info">
            <span className="settings-api-label">API BASE URL</span>
            <strong>{getApiBaseUrl()}</strong>
          </div>

          <div className="settings-api-status">
            <span
              className={`settings-status-indicator status-${apiStatus}`}
            />
            <span>{statusText[apiStatus]}</span>
          </div>
        </div>

        {lastChecked && (
          <p className="settings-last-checked">
            Last checked: {lastChecked}
          </p>
        )}

        <button
          type="button"
          className="prediction-submit settings-check-button"
          onClick={() => void testConnection()}
          disabled={checking}
        >
          {checking ? "Checking..." : "Test Connection"}
        </button>
      </section>

      <section className="overview-panel settings-panel">
        <div className="settings-section-heading">
          <span className="panel-label">ABOUT</span>
          <h2>Customer Churn Intelligence</h2>
          <p>
            An end-to-end customer churn prediction and analytics platform.
          </p>
        </div>

        <div className="settings-info-grid">
          <div className="settings-info-item">
            <span>Frontend</span>
            <strong>React + TypeScript + Vite</strong>
          </div>

          <div className="settings-info-item">
            <span>Backend</span>
            <strong>Python + FastAPI</strong>
          </div>

          <div className="settings-info-item">
            <span>Machine Learning</span>
            <strong>Scikit-learn</strong>
          </div>

          <div className="settings-info-item">
            <span>Database</span>
            <strong>PostgreSQL</strong>
          </div>

          <div className="settings-info-item">
            <span>API Architecture</span>
            <strong>REST API</strong>
          </div>

          <div className="settings-info-item">
            <span>Application Version</span>
            <strong>1.0.0</strong>
          </div>
        </div>
      </section>
    </main>
  );
}