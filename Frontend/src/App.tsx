import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Settings from "./components/Settings";

import Analytics from "./components/Analytics";
import Customers from "./components/Customers";
import PredictionHistory from "./components/PredictionHistory";
import PredictionForm from "./components/PredictionForm";
import Sidebar from "./components/Sidebar";

import {
  getDashboardSummary,
  type DashboardSummary,
} from "./lib/api";

import "./App.css";

// ==========================================
// Dashboard Page
// ==========================================

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setApiError(null);

        const data = await getDashboardSummary();

        if (isMounted) {
          setSummary(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard summary:", error);

        if (isMounted) {
          setApiError(
            "Unable to load dashboard statistics. Please check that the backend is running."
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

  const totalPredictions = summary?.total_predictions ?? 0;
  const churnPredictions = summary?.churn_predictions ?? 0;
  const nonChurnPredictions = summary?.non_churn_predictions ?? 0;

  const churnPercentage =
    totalPredictions > 0
      ? (churnPredictions / totalPredictions) * 100
      : 0;

  const averageProbability =
    (summary?.average_churn_probability ?? 0) * 100;

  const stats = [
    {
      label: "Total Predictions",
      value: totalPredictions.toLocaleString(),
      description: "All analyzed customers",
    },
    {
      label: "Predicted Churn",
      value: churnPredictions.toLocaleString(),
      description: "Customers predicted to leave",
    },
    {
      label: "Retained Customers",
      value: nonChurnPredictions.toLocaleString(),
      description: "Customers predicted to stay",
    },
    {
      label: "Average Churn Probability",
      value: `${averageProbability.toFixed(1)}%`,
      description: "Average model probability",
    },
  ];

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Dashboard Overview</h1>
          <p>
            Monitor customer churn and explore predictive insights.
          </p>
        </div>

        <div className="header-status">
          <span className="status-dot" />
          ML Platform
        </div>
      </header>

      <section className="welcome-panel">
        <div>
          <span className="panel-label">
            PREDICTIVE INTELLIGENCE
          </span>

          <h2>Understand your customers.</h2>

          <p>
            Turn customer data into actionable churn insights.
            Identify risk patterns and make data-driven decisions.
          </p>
        </div>
      </section>

      {apiError && (
        <div className="error-banner" role="alert">
          <strong>Connection error</strong>
          <p>{apiError}</p>
        </div>
      )}

      <section
        className="stats-grid"
        aria-label="Dashboard statistics"
      >
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span className="stat-label">{stat.label}</span>

            <strong className="stat-value">
              {loading ? "Loading..." : apiError ? "—" : stat.value}
            </strong>

            <span className="stat-description">
              {stat.description}
            </span>
          </article>
        ))}
      </section>

      <section className="overview-panel">
        <div>
          <span className="panel-label">ANALYTICS</span>
          <h2>Prediction Overview</h2>
          <p>
            Distribution of the current prediction history.
          </p>
        </div>

        {loading ? (
          <p>Loading prediction statistics...</p>
        ) : apiError || !summary ? (
          <p>Prediction statistics are currently unavailable.</p>
        ) : (
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
                style={{
                  width: `${churnPercentage}%`,
                }}
              />
            </div>

            <p className="distribution-caption">
              {churnPredictions.toLocaleString()} customers predicted
              to churn out of{" "}
              {totalPredictions.toLocaleString()} total predictions.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

// ==========================================
// Settings Placeholder
// ==========================================

<Route
  path="/settings"
  element={<Settings />}
/>

// ==========================================
// Application Layout
// ==========================================

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <Routes>
        <Route path="/" element={<DashboardPage />} />

        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/predict"
          element={<PredictionForm />}
        />

        <Route
          path="/predictions"
          element={<PredictionHistory />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </div>
  );
}

// ==========================================
// Root Application
// ==========================================

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}