import Sidebar from "../components/Sidebar";
import { getDashboardSummary } from "../lib/api";
import "../App.css";

interface DashboardSummary {
  total_predictions: number;
  predicted_churn: number;
  predicted_no_churn: number;
  predicted_churn_percentage: number;
  average_churn_probability: number;
}

export default async function DashboardPage() {
  let summary: DashboardSummary | null = null;
  let apiError = false;

  try {
    summary = (await getDashboardSummary()) as DashboardSummary;
  } catch (error) {
    console.error("Failed to load dashboard summary:", error);
    apiError = true;
  }

  const stats = [
    {
      label: "Total Predictions",
      value: summary?.total_predictions ?? 0,
      description: "All analyzed customers",
    },
    {
      label: "Predicted Churn",
      value: summary?.predicted_churn ?? 0,
      description: "Customers predicted to leave",
    },
    {
      label: "Retained Customers",
      value: summary?.predicted_no_churn ?? 0,
      description: "Customers predicted to stay",
    },
    {
      label: "Average Churn Probability",
      value: `${(
        (summary?.average_churn_probability ?? 0) * 100
      ).toFixed(1)}%`,
      description: "Average model probability",
    },
  ];

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

        {apiError && (
          <div className="error-banner">
            Unable to load dashboard statistics. Check that FastAPI is running.
          </div>
        )}

        <section className="welcome-panel">
          <div>
            <span className="panel-label">PREDICTIVE INTELLIGENCE</span>
            <h2>Understand your customers.</h2>
            <p>
              Explore customer behavior, monitor churn risk, and make
              data-driven decisions using machine learning.
            </p>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span className="stat-label">{stat.label}</span>
              <strong className="stat-value">{stat.value}</strong>
              <span className="stat-description">{stat.description}</span>
            </article>
          ))}
        </section>

        {summary && (
          <section className="overview-panel">
            <div>
              <h2>Prediction Overview</h2>
              <p>Distribution of the current prediction history.</p>
            </div>

            <div className="distribution-row">
              <span>Predicted churn</span>
              <strong>{summary.predicted_churn}</strong>
            </div>

            <div className="distribution-track">
              <div
                className="distribution-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, summary.predicted_churn_percentage)
                  )}%`,
                }}
              />
            </div>

            <p className="distribution-caption">
              {summary.predicted_churn_percentage.toFixed(1)}% of predictions
              indicate potential churn.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}