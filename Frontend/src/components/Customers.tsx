import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerPredictions,
  getCustomers,
  type Customer,
  type CustomerCreateInput,
  type CustomerData,
  type CustomerDetail,
  type PredictionHistoryItem,
} from "../lib/api";

const PAGE_SIZE = 10;

const EMPTY_CUSTOMER: CustomerCreateInput = {
  customer_code: "",
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "Yes",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "DSL",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 70,
  TotalCharges: 840,
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getRiskClass(risk: string) {
  return `risk-badge risk-${risk.toLowerCase()}`;
}

function getPredictionClass(prediction: string) {
  return prediction === "Yes"
    ? "prediction-badge prediction-churn"
    : "prediction-badge prediction-retained";
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] =
    useState<CustomerCreateInput>(EMPTY_CUSTOMER);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [customerPredictions, setCustomerPredictions] =
    useState<PredictionHistoryItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getCustomers({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE + 1,
      });

      setHasNextPage(data.length > PAGE_SIZE);
      setCustomers(data.slice(0, PAGE_SIZE));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      customer.customer_code?.toLowerCase().includes(query)
    );
  }, [customers, search]);

  function updateField<K extends keyof CustomerCreateInput>(
    field: K,
    value: CustomerCreateInput[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateCustomer(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setFormError(null);

      const payload: CustomerCreateInput = {
        ...formData,
        customer_code: formData.customer_code?.trim() || null,
      };

      await createCustomer(payload);

      setShowCreateModal(false);
      setFormData(EMPTY_CUSTOMER);
      setPage(0);

      if (page === 0) {
        await loadCustomers();
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create customer."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleViewDetails(customerId: number) {
    try {
      setSelectedCustomer(null);
      setCustomerPredictions([]);
      setDetailsError(null);
      setDetailsLoading(true);

      const [customer, predictions] = await Promise.all([
        getCustomerById(customerId),
        getCustomerPredictions(customerId),
      ]);

      setSelectedCustomer(customer);
      setCustomerPredictions(predictions);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Failed to load customer details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleDeleteCustomer(customer: Customer) {
    const confirmed = window.confirm(
      `Delete customer ${customer.customer_code}?\n\nTheir prediction records will be preserved, but will no longer be linked to this customer.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(customer.id);
      setActionError(null);

      await deleteCustomer(customer.id);

      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
      }

      if (customers.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await loadCustomers();
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to delete customer."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function closeCreateModal() {
    if (creating) return;

    setShowCreateModal(false);
    setFormData(EMPTY_CUSTOMER);
    setFormError(null);
  }

  function renderInput(
    label: string,
    field: keyof CustomerCreateInput,
    type: "text" | "number" = "text",
    options?: string[]
  ) {
    const value = formData[field];

    return (
      <div className="customer-form-field" key={String(field)}>
        <label htmlFor={`customer-${String(field)}`}>{label}</label>

        {options ? (
          <select
            id={`customer-${String(field)}`}
            value={String(value)}
            onChange={(event) =>
              updateField(
                field,
                event.target.value as CustomerCreateInput[typeof field]
              )
            }
          >
            {options.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`customer-${String(field)}`}
            type={type}
            value={String(value ?? "")}
            min={type === "number" ? 0 : undefined}
            onChange={(event) => {
              const nextValue =
                type === "number"
                  ? Number(event.target.value)
                  : event.target.value;

              updateField(
                field,
                nextValue as CustomerCreateInput[typeof field]
              );
            }}
          />
        )}
      </div>
    );
  }

  return (
    <main className="main-content customers-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Customers</h1>
          <p>
            Manage customer profiles and explore their churn prediction
            history.
          </p>
        </div>

        <button
          className="prediction-submit"
          type="button"
          onClick={() => setShowCreateModal(true)}
        >
          + Add Customer
        </button>
      </header>

      {actionError && (
        <div className="error-banner">{actionError}</div>
      )}

      <section className="overview-panel customers-panel">
        <div className="customers-toolbar">
          <div>
            <span className="panel-label">CUSTOMER DATABASE</span>
            <h2>Customer Directory</h2>
            <p>
              {customers.length} customers on this page
            </p>
          </div>

          <div className="customers-search">
            <input
              type="search"
              placeholder="Search customer code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search customers by customer code"
            />

            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadCustomers()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="customers-state">Loading customers...</div>
        ) : error ? (
          <div className="customers-state customers-error">
            <p>{error}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadCustomers()}
            >
              Try Again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="customers-state">
            {search
              ? "No customers match your search."
              : "No customers found. Add your first customer to get started."}
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table customers-table">
              <thead>
                <tr>
                  <th>Customer Code</th>
                  <th>Contract</th>
                  <th>Tenure</th>
                  <th>Monthly Charges</th>
                  <th>Internet Service</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => {
                  const data = customer.customer_data;

                  return (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.customer_code || "—"}</strong>
                      </td>
                      <td>{data?.Contract || "—"}</td>
                      <td>{data?.tenure ?? "—"} months</td>
                      <td>{formatCurrency(data?.MonthlyCharges)}</td>
                      <td>{data?.InternetService || "—"}</td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>
                        <div className="customer-actions">
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() =>
                              void handleViewDetails(customer.id)
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="table-action-button danger-action"
                            disabled={deletingId === customer.id}
                            onClick={() =>
                              void handleDeleteCustomer(customer)
                            }
                          >
                            {deletingId === customer.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div
          className="customer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <section
            className="customer-modal customer-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-customer-title"
          >
            <div className="customer-modal-header">
              <div>
                <span className="panel-label">NEW CUSTOMER</span>
                <h2 id="create-customer-title">Add Customer</h2>
                <p>Enter the customer's subscription information.</p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeCreateModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="customer-form-grid">
                {renderInput("Customer Code", "customer_code")}

                {renderInput("Gender", "gender", "text", [
                  "Female",
                  "Male",
                ])}

                {renderInput("Senior Citizen", "SeniorCitizen", "number", [
                  "0",
                  "1",
                ])}

                {renderInput("Partner", "Partner", "text", ["Yes", "No"])}
                {renderInput("Dependents", "Dependents", "text", [
                  "Yes",
                  "No",
                ])}

                {renderInput("Tenure (months)", "tenure", "number")}

                {renderInput("Phone Service", "PhoneService", "text", [
                  "Yes",
                  "No",
                ])}

                {renderInput("Multiple Lines", "MultipleLines", "text", [
                  "No",
                  "Yes",
                  "No phone service",
                ])}

                {renderInput("Internet Service", "InternetService", "text", [
                  "DSL",
                  "Fiber optic",
                  "No",
                ])}

                {renderInput("Online Security", "OnlineSecurity", "text", [
                  "Yes",
                  "No",
                  "No internet service",
                ])}

                {renderInput("Online Backup", "OnlineBackup", "text", [
                  "Yes",
                  "No",
                  "No internet service",
                ])}

                {renderInput(
                  "Device Protection",
                  "DeviceProtection",
                  "text",
                  ["Yes", "No", "No internet service"]
                )}

                {renderInput("Tech Support", "TechSupport", "text", [
                  "Yes",
                  "No",
                  "No internet service",
                ])}

                {renderInput("Streaming TV", "StreamingTV", "text", [
                  "Yes",
                  "No",
                  "No internet service",
                ])}

                {renderInput("Streaming Movies", "StreamingMovies", "text", [
                  "Yes",
                  "No",
                  "No internet service",
                ])}

                {renderInput("Contract", "Contract", "text", [
                  "Month-to-month",
                  "One year",
                  "Two year",
                ])}

                {renderInput(
                  "Paperless Billing",
                  "PaperlessBilling",
                  "text",
                  ["Yes", "No"]
                )}

                {renderInput("Payment Method", "PaymentMethod", "text", [
                  "Electronic check",
                  "Mailed check",
                  "Bank transfer (automatic)",
                  "Credit card (automatic)",
                ])}

                {renderInput("Monthly Charges", "MonthlyCharges", "number")}
                {renderInput("Total Charges", "TotalCharges", "number")}
              </div>

              {formError && (
                <div className="error-banner customer-form-error">
                  {formError}
                </div>
              )}

              <div className="customer-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateModal}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="prediction-submit"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Customer Details Modal */}
      {(detailsLoading || selectedCustomer || detailsError) && (
        <div
          className="customer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !detailsLoading) {
              setSelectedCustomer(null);
              setDetailsError(null);
            }
          }}
        >
          <section
            className="customer-modal customer-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-details-title"
          >
            <div className="customer-modal-header">
              <div>
                <span className="panel-label">CUSTOMER PROFILE</span>
                <h2 id="customer-details-title">
                  {selectedCustomer?.customer_code || "Customer Details"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setDetailsError(null);
                }}
                disabled={detailsLoading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="customers-state">
                Loading customer details...
              </div>
            ) : detailsError ? (
              <div className="customers-state customers-error">
                {detailsError}
              </div>
            ) : selectedCustomer ? (
              <>
                <div className="customer-detail-summary">
                  <div>
                    <span>Customer ID</span>
                    <strong>#{selectedCustomer.id}</strong>
                  </div>

                  <div>
                    <span>Prediction Records</span>
                    <strong>{selectedCustomer.prediction_count ?? 0}</strong>
                  </div>

                  <div>
                    <span>Tenure</span>
                    <strong>
                      {selectedCustomer.customer_data?.tenure ?? "—"} months
                    </strong>
                  </div>
                </div>

                <h3 className="customer-subheading">
                  Subscription Information
                </h3>

                <div className="customer-detail-grid">
                  {Object.entries(
                    selectedCustomer.customer_data as CustomerData
                  ).map(([key, value]) => (
                    <div className="customer-detail-item" key={key}>
                      <span>{key}</span>
                      <strong>{String(value)}</strong>
                    </div>
                  ))}
                </div>

                <h3 className="customer-subheading">
                  Prediction History
                </h3>

                {customerPredictions.length === 0 ? (
                  <p className="customer-muted">
                    No prediction records found for this customer.
                  </p>
                ) : (
                  <div className="history-table-wrapper">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Prediction</th>
                          <th>Probability</th>
                          <th>Risk</th>
                          <th>Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {customerPredictions.map((item) => (
                          <tr key={item.id}>
                            <td>#{item.id}</td>
                            <td>
                              <span className={getPredictionClass(item.prediction)}>
                                {item.prediction === "Yes"
                                  ? "Churn"
                                  : "No Churn"}
                              </span>
                            </td>
                            <td>
                              {(item.churn_probability * 100).toFixed(1)}%
                            </td>
                            <td>
                              <span className={getRiskClass(item.risk_level)}>
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
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}