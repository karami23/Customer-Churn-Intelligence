import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  getDashboardSummary,
  getRiskDistribution,
  getPredictionHistory,
  type DashboardSummary,
  type RiskDistributionItem,
  type PredictionHistoryItem,
} from "../lib/api";

// ==========================================
// Constants
// ==========================================

const COLORS = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};

const cardStyle: React.CSSProperties = {
  background: "var(--card-bg, #ffffff)",
  border: "1px solid var(--border-color, #e5e7eb)",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  minWidth: 0,
  boxSizing: "border-box",
};

const titleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--muted-text, #64748b)",
  marginBottom: "12px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "var(--text-color, #0f172a)",
};

const chartTitleStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 600,
  color: "var(--text-color, #0f172a)",
  margin: 0,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "var(--card-bg, #ffffff)",
  color: "var(--text-color, #334155)",
  borderRadius: "8px",
  padding: "9px 14px",
  cursor: "pointer",
  fontWeight: 500,
};

const selectStyle: React.CSSProperties = {
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "var(--card-bg, #ffffff)",
  color: "var(--text-color, #334155)",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
  minWidth: "145px",
};

// ==========================================
// Analytics Component
// ==========================================

export default function Analytics() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [risks, setRisks] = useState<RiskDistributionItem[]>([]);

  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);

  const [days, setDays] = useState(30);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================
  // Load Analytics Data
  // ==========================================

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, riskData, historyData] = await Promise.all([
        getDashboardSummary(),
        getRiskDistribution(),
        getPredictionHistory({
          skip: 0,
          limit: 100,
        }),
      ]);

      setSummary(summaryData);

      setRisks(riskData);

      setHistory(Array.isArray(historyData) ? historyData : []);

      console.log("Analytics history:", historyData);
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  // ==========================================
  // Summary Calculations
  // ==========================================

  const totalPredictions = summary?.total_predictions ?? 0;

  const churnPredictions = summary?.churn_predictions ?? 0;

  const nonChurnPredictions = summary?.non_churn_predictions ?? 0;

  const churnPercentage =
    totalPredictions > 0
      ? (churnPredictions / totalPredictions) * 100
      : 0;

  const averageProbability =
    (summary?.average_churn_probability ?? 0) * 100;

  // ==========================================
  // Risk Distribution Data
  // ==========================================

  const riskData = (["Low", "Medium", "High"] as const).map((level) => ({
    name: level,
    value: Number(
      risks.find((item) => item.risk_level === level)?.count ?? 0
    ),
    fill: COLORS[level],
  }));

  // ==========================================
  // Prediction Trend Data
  // Build chart directly from prediction history
  // ==========================================

  const chartData = useMemo(() => {
    const dateMap = new Map<
      string,
      {
        date: string;
        total_predictions: number;
        churn_predictions: number;
      }
    >();

    const today = new Date();

    // Create one entry for every day in selected period.
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);

      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() - i);

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      dateMap.set(dateKey, {
        date: dateKey,
        total_predictions: 0,
        churn_predictions: 0,
      });
    }

    // Add actual prediction records.
    history.forEach((item) => {
      const createdAt = new Date(item.created_at);

      if (Number.isNaN(createdAt.getTime())) {
        return;
      }

      const dateKey = [
        createdAt.getFullYear(),
        String(createdAt.getMonth() + 1).padStart(2, "0"),
        String(createdAt.getDate()).padStart(2, "0"),
      ].join("-");

      const dayData = dateMap.get(dateKey);

      if (!dayData) {
        return;
      }

      dayData.total_predictions += 1;

      if (item.prediction === "Yes") {
        dayData.churn_predictions += 1;
      }
    });

    return Array.from(dateMap.values());
  }, [history, days]);

  // ==========================================
  // Loading State
  // ==========================================

  if (loading && !summary) {
    return (
      <main className="main-content analytics-page">
        <div className="analytics-loading">
          Loading analytics...
        </div>
      </main>
    );
  }

  // ==========================================
  // Error State
  // ==========================================

  if (error && !summary) {
    return (
      <main className="main-content analytics-page">
        <div style={{ ...cardStyle, color: "#dc2626" }}>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadAnalytics()}
            style={buttonStyle}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================

  return (
    <main className="main-content analytics-page">

      {/* Page Header */}

      <header className="analytics-header">
        <div>
          <h1>Analytics Overview</h1>

          <p>
            Monitor customer churn predictions and risk distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* Error Message */}

      {error && (
        <div
          style={{
            ...cardStyle,
            color: "#dc2626",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Summary Cards */}

      <section className="analytics-summary-grid">

        <div style={cardStyle}>
          <p style={titleStyle}>Total Predictions</p>

          <p style={valueStyle}>
            {totalPredictions.toLocaleString()}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={titleStyle}>Predicted Churn</p>

          <p style={{ ...valueStyle, color: "#ef4444" }}>
            {churnPredictions.toLocaleString()}
          </p>

          <small style={{ color: "var(--muted-text, #64748b)" }}>
            {churnPercentage.toFixed(1)}% of all predictions
          </small>
        </div>

        <div style={cardStyle}>
          <p style={titleStyle}>Predicted No Churn</p>

          <p style={{ ...valueStyle, color: "#22c55e" }}>
            {nonChurnPredictions.toLocaleString()}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={titleStyle}>Average Churn Probability</p>

          <p style={valueStyle}>
            {averageProbability.toFixed(1)}%
          </p>
        </div>

      </section>

      {/* Charts */}

      <section className="analytics-charts-grid">

        {/* Risk Distribution */}

        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>
            Risk Distribution
          </h3>

          {riskData.every((item) => item.value === 0) ? (
            <EmptyState message="No risk data available yet." />
          ) : (
            <div className="analytics-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius="72%"
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {riskData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Prediction Trend */}

        <div style={cardStyle}>

          <div className="analytics-trend-header">
            <h3 style={chartTitleStyle}>
              Prediction Trend
            </h3>

            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              style={selectStyle}
              aria-label="Select trend period"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>

          {history.length === 0 ? (
            <EmptyState message="No prediction history available yet." />
          ) : (
            <div className="analytics-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 15,
                    right: 20,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    minTickGap={20}
                    tickFormatter={(value: string) => {
                      const date = new Date(`${value}T12:00:00`);

                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    domain={[0, "auto"]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />

                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(`${value}T12:00:00`);

                      return date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="total_predictions"
                    name="Total Predictions"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="churn_predictions"
                    name="Churn Predictions"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                    connectNulls
                  />

                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>

      </section>

    </main>
  );
}

// ==========================================
// Empty State
// ==========================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="analytics-empty-state">
      {message}
    </div>
  );
}