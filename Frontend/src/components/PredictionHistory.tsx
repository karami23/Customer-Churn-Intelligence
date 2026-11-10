import { useEffect, useState } from "react";
import {
  deletePrediction,
  getPredictionById,
  getPredictionHistory,
  type PredictionDetail,
  type PredictionHistoryItem,
} from "../lib/api";

type RiskLevel = "" | "Low" | "Medium" | "High";
type PredictionType = "" | "Yes" | "No";

const PAGE_SIZE = 10;

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("");
  const [prediction, setPrediction] = useState<PredictionType>("");
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPrediction, setSelectedPrediction] =
    useState<PredictionDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadHistory(
    selectedRisk: RiskLevel = riskLevel,
    selectedPrediction: PredictionType = prediction,
    selectedPage: number = page
  ) {
    try {
      setLoading(true);
      setError(null);

      const data = await getPredictionHistory({
        risk_level: selectedRisk || undefined,
        prediction: selectedPrediction || undefined,
        skip: selectedPage * PAGE_SIZE,
        limit: PAGE_SIZE + 1,
      });

      setHasNextPage(data.length > PAGE_SIZE);
      setPredictions(data.slice(0, PAGE_SIZE));
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
    void loadHistory(riskLevel, prediction, page);
  }, [riskLevel, prediction, page]);

  function formatDate(value: string) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  }

  function resetFilters() {
    setRiskLevel("");
    setPrediction("");
    setPage(0);
  }

  async function handleViewDetails(id: number) {
    try {
      setSelectedPrediction(null);
      setDetailsError(null);
      setDetailsLoading(true);

      const data = await getPredictionById(id);
      setSelectedPrediction(data);
    } catch (err) {
      setDetailsError(
        err instanceof Error ? err.message : "Failed to load prediction details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      `Delete prediction #${id}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError(null);

      await deletePrediction(id);

      if (selectedPrediction?.id === id) {
        setSelectedPrediction(null);
      }

      if (predictions.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await loadHistory(riskLevel, prediction, page);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete prediction."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const hasActiveFilters = riskLevel !== "" || prediction !== "";

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Prediction History</h1>
          <p>
            Review and filter previously recorded customer churn predictions.
          </p>
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
            {predictions.length} prediction
            {predictions.length === 1 ? "" : "s"} on this page
          </p>
        </div>

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
              onChange={(event) => {
                setRiskLevel(event.target.value as RiskLevel);
                setPage(0);
              }}
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
              onChange={(event) => {
                setPrediction(event.target.value as PredictionType);
                setPage(0);
              }}
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

        {error && (
          <div className="prediction-error" role="alert">
            <strong>Request failed</strong>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <p className="history-message">Loading prediction history...</p>
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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {predictions.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>

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

                    <td>
                      <div className="customer-actions">
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() => void handleViewDetails(item.id)}
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          className="table-action-button danger-action"
                          disabled={deletingId === item.id}
                          onClick={() => void handleDelete(item.id)}
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="customers-pagination">
          <button
            type="button"
            className="secondary-button"
            disabled={page === 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>

          <span>Page {page + 1}</span>

          <button
            type="button"
            className="secondary-button"
            disabled={!hasNextPage || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {(detailsLoading || selectedPrediction || detailsError) && (
        <div
          className="customer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !detailsLoading) {
              setSelectedPrediction(null);
              setDetailsError(null);
            }
          }}
        >
          <section
            className="customer-modal customer-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prediction-details-title"
          >
            <div className="customer-modal-header">
              <div>
                <span className="panel-label">PREDICTION DETAILS</span>
                <h2 id="prediction-details-title">
                  {selectedPrediction
                    ? `Prediction #${selectedPrediction.id}`
                    : "Prediction Details"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() => {
                  setSelectedPrediction(null);
                  setDetailsError(null);
                }}
                disabled={detailsLoading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <p className="history-message">Loading prediction details...</p>
            ) : detailsError ? (
              <div className="prediction-error" role="alert">
                {detailsError}
              </div>
            ) : selectedPrediction ? (
              <>
                <div className="customer-detail-summary">
                  <div>
                    <span>Prediction</span>
                    <strong>
                      {selectedPrediction.prediction === "Yes"
                        ? "Churn"
                        : "No Churn"}
                    </strong>
                  </div>

                  <div>
                    <span>Churn Probability</span>
                    <strong>
                      {(selectedPrediction.churn_probability * 100).toFixed(2)}%
                    </strong>
                  </div>

                  <div>
                    <span>Risk Level</span>
                    <strong>{selectedPrediction.risk_level}</strong>
                  </div>

                  <div>
                    <span>Customer ID</span>
                    <strong>
                      {selectedPrediction.customer_id
                        ? `#${selectedPrediction.customer_id}`
                        : "Not linked"}
                    </strong>
                  </div>
                </div>

                <h3 className="customer-subheading">Customer Information</h3>

                <div className="customer-detail-grid">
                  {Object.entries(selectedPrediction.customer_data ?? {}).map(
                    ([key, value]) => (
                      <div className="customer-detail-item" key={key}>
                        <span>{key}</span>
                        <strong>{String(value ?? "—")}</strong>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}