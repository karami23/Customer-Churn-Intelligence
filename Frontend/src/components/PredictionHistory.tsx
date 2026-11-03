
import { useEffect, useState } from "react";
import {
  getPredictionHistory,
  type PredictionHistoryItem,
} from "../lib/api";

type RiskLevel = "" | "Low" | "Medium" | "High";
type PredictionType = "" | "Yes" | "No";

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("");
  const [prediction, setPrediction] = useState<PredictionType>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory(
    selectedRisk: RiskLevel = riskLevel,
    selectedPrediction: PredictionType = prediction
  ) {
    try {
      setLoading(true);
      setError(null);

      const data = await getPredictionHistory({
        risk_level: selectedRisk || undefined,
        prediction: selectedPrediction || undefined,
        skip: 0,
        limit: 100,
      });

      setPredictions(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load prediction history"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory(riskLevel, prediction);
  }, [riskLevel, prediction]);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function resetFilters() {
    setRiskLevel("");
    setPrediction("");
  }

  const hasActiveFilters = riskLevel !== "" || prediction !== "";

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Prediction History</h1>
          <p>Review and filter previously recorded customer churn predictions.</p>
        </div>

        <button
          className="prediction-submit"
          type="button"
          onClick={() => void loadHistory()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      <section className="overview-panel history-panel">
        <div className="prediction-section-heading">
          <span className="panel-label">RECORDS</span>
          <h2>Prediction Records</h2>
          <p>
            {predictions.length} matching prediction
            {predictions.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Filters */}
        <div
          className="history-filters"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "end",
            margin: "24px 0",
            padding: "20px",
            borderRadius: "12px",
            background: "rgba(148, 163, 184, 0.06)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="risk-filter">Risk Level</label>

            <select
              id="risk-filter"
              value={riskLevel}
              onChange={(event) =>
                setRiskLevel(event.target.value as RiskLevel)
              }
              style={{
                minWidth: "160px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #64748b",
                background: "var(--panel-bg, #ffffff)",
                color: "inherit",
              }}
            >
              <option value="">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="prediction-filter">Prediction</label>

            <select
              id="prediction-filter"
              value={prediction}
              onChange={(event) =>
                setPrediction(event.target.value as PredictionType)
              }
              style={{
                minWidth: "160px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #64748b",
                background: "var(--panel-bg, #ffffff)",
                color: "inherit",
              }}
            >
              <option value="">All Predictions</option>
              <option value="Yes">Churn</option>
              <option value="No">No Churn</option>
            </select>
          </div>

          <button
            className="prediction-submit"
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters || loading}
          >
            Reset Filters
          </button>
        </div>

        {loading ? (
          <p className="history-message">Loading prediction history...</p>
        ) : error ? (
          <div className="prediction-error" role="alert">
            <strong>Unable to load history</strong>
            <p>{error}</p>

            <button
              className="prediction-submit"
              type="button"
              onClick={() => void loadHistory()}
            >
              Try Again
            </button>
          </div>
        ) : predictions.length === 0 ? (
          <p className="history-message">
            {hasActiveFilters
              ? "No predictions match the selected filters. Try changing or resetting your filters."
              : "No predictions found. Run a prediction to create your first record."}
          </p>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Prediction</th>
                  <th>Churn Probability</th>
                  <th>Risk Level</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>
                {predictions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>
                      <span
                        className={`history-badge ${
                          item.prediction === "Yes"
                            ? "history-badge-danger"
                            : "history-badge-success"
                        }`}
                      >
                        {item.prediction === "Yes" ? "Churn" : "No Churn"}
                      </span>
                    </td>

                    <td>
                      {(item.churn_probability * 100).toFixed(2)}%
                    </td>

                    <td>
                      <span
                        className={`history-badge history-risk-${item.risk_level.toLowerCase()}`}
                      >
                        {item.risk_level}
                      </span>
                    </td>

                    <td>{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
