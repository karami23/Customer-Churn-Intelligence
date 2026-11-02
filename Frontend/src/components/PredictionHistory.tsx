
import { useEffect, useState } from "react";
import {
  getPredictionHistory,
  type PredictionHistoryItem,
} from "../lib/api";

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);

      const data = await getPredictionHistory();
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
    void loadHistory();
  }, []);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Prediction History</h1>
          <p>Review previously recorded customer churn predictions.</p>
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
          <h2>All Predictions</h2>
          <p>
            {predictions.length} prediction
            {predictions.length === 1 ? "" : "s"} recorded
          </p>
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
            No predictions found. Run a prediction to create your first record.
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
