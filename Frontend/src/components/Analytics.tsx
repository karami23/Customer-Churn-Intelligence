
import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getRiskDistribution,
  getPredictionTrend,
  type DashboardSummary,
  type RiskDistribution,
  type PredictionTrend,
} from "../lib/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};

export default function Analytics() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [risks, setRisks] = useState<RiskDistribution | null>(null);
  const [trend, setTrend] = useState<PredictionTrend | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics(selectedDays: number) {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, riskData, trendData] = await Promise.all([
        getDashboardSummary(),
        getRiskDistribution(),
        getPredictionTrend(selectedDays),
      ]);

      setSummary(summaryData);
      setRisks(riskData);
      setTrend(trendData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics(days);
  }, [days]);

  const riskData = risks
    ? [
        { name: "Low", value: risks.Low },
        { name: "Medium", value: risks.Medium },
        { name: "High", value: risks.High },
      ]
    : [];

  if (loading && !summary) {
    return (
      <main className="main-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
            <h1>Analytics</h1>
            <p>Understand customer churn patterns and prediction trends.</p>
          </div>
        </header>
        <section className="overview-panel">
          <p>Loading analytics...</p>
        </section>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main className="main-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
            <h1>Analytics</h1>
            <p>Understand customer churn patterns and prediction trends.</p>
          </div>
        </header>
        <section className="overview-panel">
          <div className="prediction-error" role="alert">
            <strong>Unable to load analytics</strong>
            <p>{error}</p>
            <button
              className="prediction-submit"
              type="button"
              onClick={() => void loadAnalytics(days)}
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="main-content analytics-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Analytics</h1>
          <p>Understand customer churn patterns and prediction trends.</p>
        </div>

        <button
          className="prediction-submit"
          type="button"
          onClick={() => void loadAnalytics(days)}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="prediction-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="analytics-stats">
        <article className="analytics-stat-card">
          <span>Total Predictions</span>
          <strong>{summary?.total_predictions ?? 0}</strong>
          <small>All recorded predictions</small>
        </article>

        <article className="analytics-stat-card">
          <span>Predicted Churn</span>
          <strong>{summary?.predicted_churn ?? 0}</strong>
          <small>
            {summary?.predicted_churn_percentage ?? 0}% of predictions
          </small>
        </article>

        <article className="analytics-stat-card">
          <span>No Churn</span>
          <strong>{summary?.predicted_no_churn ?? 0}</strong>
          <small>Predicted to stay</small>
        </article>

        <article className="analytics-stat-card">
          <span>Average Churn Probability</span>
          <strong>
            {((summary?.average_churn_probability ?? 0) * 100).toFixed(1)}%
          </strong>
          <small>Average model probability</small>
        </article>
      </section>

      <section className="analytics-charts">
        <article className="overview-panel analytics-chart-panel">
          <div className="analytics-panel-heading">
            <div>
              <span className="panel-label">RISK DISTRIBUTION</span>
              <h2>Customer Risk Levels</h2>
            </div>
          </div>

          {riskData.every((item) => item.value === 0) ? (
            <p className="history-message">No risk data available yet.</p>
          ) : (
            <div className="analytics-pie-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {riskData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={RISK_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="overview-panel analytics-chart-panel">
          <div className="analytics-panel-heading analytics-trend-heading">
            <div>
              <span className="panel-label">PREDICTION ACTIVITY</span>
              <h2>Prediction Trend</h2>
            </div>

            <select
              className="analytics-days-select"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Select trend period"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>

          {!trend || trend.data.length === 0 ? (
            <p className="history-message">No trend data available for this period.</p>
          ) : (
            <div className="analytics-line-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={trend.data}
                  margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_predictions"
                    name="Total Predictions"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_churn"
                    name="Predicted Churn"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
