import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { getDashboardSummary } from "./lib/api";
import "./App.css";

interface DashboardSummary {
  total_predictions: number;
  predicted_churn: number;
  predicted_no_churn: number;
  predicted_churn_percentage: number;
  average_churn_probability: number;
}

export default function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = (await getDashboardSummary()) as DashboardSummary;

        if (isMounted) {
          setSummary(data);
          setApiError(null);
        }
      } catch (error) {
        console.error("Failed to load dashboard summary:", error);

        if (isMounted) {
          setApiError(
            "Unable to load dashboard statistics. Check that the FastAPI backend is running and the API endpoint is correct."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Total Predictions",
      value: summary?.total_predictions.toLocaleString() ?? "—",
      description: "All analyzed customers",
    },
    {
      label: "Predicted Churn",
      value: summary?.predicted_churn.toLocaleString() ?? "—",
      description: "Customers predicted to leave",
    },
    {
      label: "Retained Customers",
      value: summary?.predicted_no_churn.toLocaleString() ?? "—",
      description: "Customers predicted to stay",
    },
    {
      label: "Average Churn Probability",
      value:
        summary != null
          ? `${(summary.average_churn_probability * 100).toFixed(1)}%`
          : "—",
      description: "Average model probability",
    },
  ];

  const churnPercentage = Math.min(
    100,
    Math.max(0, summary?.predicted_churn_percentage ?? 0)
  );

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
            <h1>Dashboard Overview</h1>
            <p>Monitor customer churn and explore predictive insights.</p>
          </div>

          <div className="header-status">
            <span className="status-dot" />
            ML Platform
          </div>
        </header>

        <section className="welcome-panel">
          <div>
            <span className="panel-label">PREDICTIVE INTELLIGENCE</span>
            <h2>Understand your customers.</h2>
            <p>
              Turn customer data into actionable churn insights. Identify
              risk patterns and make data-driven decisions.
            </p>
          </div>
        </section>

        {apiError && (
          <div className="error-banner" role="alert">
            <strong>Connection error</strong>
            <p>{apiError}</p>
          </div>
        )}

        <section className="stats-grid" aria-label="Dashboard statistics">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span className="stat-label">{stat.label}</span>

              <strong className="stat-value">
                {loading ? "Loading..." : stat.value}
              </strong>

              <span className="stat-description">{stat.description}</span>
            </article>
          ))}
        </section>

        <section className="overview-panel">
          <div>
            <span className="panel-label">ANALYTICS</span>
            <h2>Prediction Overview</h2>
            <p>Distribution of the current prediction history.</p>
          </div>

          {loading ? (
            <p>Loading prediction statistics...</p>
          ) : summary ? (
            <>
              <div className="distribution-row">
                <span>Predicted churn</span>
                <strong>{churnPercentage.toFixed(1)}%</strong>
              </div>

              <div
                className="distribution-track"
                role="progressbar"
                aria-label="Predicted churn percentage"
                aria-valuenow={churnPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="distribution-fill"
                  style={{ width: `${churnPercentage}%` }}
                />
              </div>

              <p className="distribution-caption">
                {summary.predicted_churn.toLocaleString()} customers predicted
                to churn out of {summary.total_predictions.toLocaleString()}{" "}
                total predictions.
              </p>
            </>
          ) : (
            <p>Prediction statistics are currently unavailable.</p>
          )}
        </section>
      </main>
    </div>
  );
}