import { useEffect, useState, type FormEvent } from "react";
import {
  createCustomer,
  getCustomers,
  predictCustomerChurn,
  type Customer,
  type CustomerPredictionInput,
} from "../lib/api";

interface PredictionResult {
  id: number;
  customer_id: number | null;
  prediction: "Yes" | "No";
  churn_probability: number;
  risk_level: "Low" | "Medium" | "High";
  created_at?: string;
}

const initialForm: CustomerPredictionInput = {
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

const selectFields = [
  { name: "gender", label: "Gender", options: ["Female", "Male"] },
  { name: "Partner", label: "Has Partner", options: ["Yes", "No"] },
  { name: "Dependents", label: "Has Dependents", options: ["Yes", "No"] },
  { name: "PhoneService", label: "Phone Service", options: ["Yes", "No"] },
  {
    name: "MultipleLines",
    label: "Multiple Lines",
    options: ["Yes", "No", "No phone service"],
  },
  {
    name: "InternetService",
    label: "Internet Service",
    options: ["DSL", "Fiber optic", "No"],
  },
  {
    name: "OnlineSecurity",
    label: "Online Security",
    options: ["Yes", "No", "No internet service"],
  },
  {
    name: "OnlineBackup",
    label: "Online Backup",
    options: ["Yes", "No", "No internet service"],
  },
  {
    name: "DeviceProtection",
    label: "Device Protection",
    options: ["Yes", "No", "No internet service"],
  },
  {
    name: "TechSupport",
    label: "Tech Support",
    options: ["Yes", "No", "No internet service"],
  },
  {
    name: "StreamingTV",
    label: "Streaming TV",
    options: ["Yes", "No", "No internet service"],
  },
  {
    name: "StreamingMovies",
    label: "Streaming Movies",
    options: ["Yes", "No", "No internet service"],
  },
  {
    name: "Contract",
    label: "Contract Type",
    options: ["Month-to-month", "One year", "Two year"],
  },
  {
    name: "PaperlessBilling",
    label: "Paperless Billing",
    options: ["Yes", "No"],
  },
  {
    name: "PaymentMethod",
    label: "Payment Method",
    options: [
      "Electronic check",
      "Mailed check",
      "Bank transfer (automatic)",
      "Credit card (automatic)",
    ],
  },
] as const;

export default function PredictionForm() {
  const [form, setForm] = useState<CustomerPredictionInput>(initialForm);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("new");
  const [customerName, setCustomerName] = useState("");

  // Keeps a newly created customer's code if prediction fails.
  const [pendingCustomerCode, setPendingCustomerCode] = useState("");
  const [pendingCustomerName, setPendingCustomerName] = useState("");

  const [tenureInput, setTenureInput] = useState(String(initialForm.tenure));
  const [monthlyChargesInput, setMonthlyChargesInput] = useState(
    String(initialForm.MonthlyCharges)
  );
  const [totalChargesInput, setTotalChargesInput] = useState(
    String(initialForm.TotalCharges)
  );

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [linkedCustomerName, setLinkedCustomerName] = useState("");
  const [linkedCustomerCode, setLinkedCustomerCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        setCustomersError(null);

        const data = await getCustomers({ skip: 0, limit: 100 });
        setCustomers(data);
      } catch (err) {
        setCustomersError(
          err instanceof Error
            ? err.message
            : "Could not load existing customers."
        );
      } finally {
        setCustomersLoading(false);
      }
    }

    void loadCustomers();
  }, []);

  function updateField(
    name: keyof CustomerPredictionInput,
    value: string | number
  ) {
    setForm((current) => ({ ...current, [name]: value }));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const tenure = Number(tenureInput);
    const monthlyCharges = Number(monthlyChargesInput);
    const totalCharges = Number(totalChargesInput);

    if (
      tenureInput.trim() === "" ||
      monthlyChargesInput.trim() === "" ||
      totalChargesInput.trim() === "" ||
      !Number.isFinite(tenure) ||
      !Number.isFinite(monthlyCharges) ||
      !Number.isFinite(totalCharges) ||
      tenure < 0 ||
      tenure > 72 ||
      monthlyCharges < 0 ||
      totalCharges < 0
    ) {
      setError(
        "Please enter valid, non-negative numbers in all numeric fields. Tenure must be between 0 and 72 months."
      );
      return;
    }

    let customerCode = "";
    let customerRecord: Customer | undefined;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      if (selectedCustomerId === "new") {
        const trimmedName = customerName.trim();

        if (!trimmedName) {
          setError("Please enter the customer's name.");
          setLoading(false);
          return;
        }

        // Reuse the customer created by a previous failed prediction attempt.
        if (
          pendingCustomerCode &&
          pendingCustomerName === trimmedName
        ) {
          customerCode = pendingCustomerCode;
          customerRecord = customers.find(
            (customer) => customer.customer_code === customerCode
          );
        } else {
          customerRecord = await createCustomer({ name: trimmedName });

          if (!customerRecord.customer_code) {
            throw new Error(
              "Customer was created, but the API did not return a customer code."
            );
          }

          customerCode = customerRecord.customer_code;

          setPendingCustomerCode(customerCode);
          setPendingCustomerName(trimmedName);

          setCustomers((current) => [
            customerRecord!,
            ...current.filter(
              (item) => item.id !== customerRecord!.id
            ),
          ]);
        }
      } else {
        customerRecord = customers.find(
          (customer) => String(customer.id) === selectedCustomerId
        );

        if (!customerRecord?.customer_code) {
          throw new Error(
            "The selected customer could not be found. Please refresh the customer list."
          );
        }

        customerCode = customerRecord.customer_code;
      }

      const payload: CustomerPredictionInput = {
        ...form,
        customer_code: customerCode,
        tenure,
        MonthlyCharges: monthlyCharges,
        TotalCharges: totalCharges,
      };

      const data = await predictCustomerChurn(payload);

      setResult(data as PredictionResult);
      setLinkedCustomerName(customerRecord?.name || customerName.trim());
      setLinkedCustomerCode(customerCode);

      if (customerRecord) {
        setSelectedCustomerId(String(customerRecord.id));
      }

      setPendingCustomerCode("");
      setPendingCustomerName("");
    } catch (err) {
      console.error("Prediction request failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Prediction failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNewPrediction() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <span className="eyebrow">CUSTOMER INTELLIGENCE</span>
          <h1>Churn Prediction</h1>
          <p>
            Enter customer information to estimate the likelihood of churn.
          </p>
        </div>

        <div className="header-status">
          <span className="status-dot" />
          ML Platform
        </div>
      </header>

      {!result && (
        <section className="overview-panel prediction-panel">
          <div className="prediction-section-heading">
            <span className="panel-label">CUSTOMER PROFILE</span>
            <h2>Customer Information</h2>
            <p>
              Select an existing customer or create a new profile before
              running a prediction.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="prediction-form-grid">
              <label className="prediction-field">
                <span>Customer Profile</span>
                <select
                  value={selectedCustomerId}
                  onChange={(event) => {
                    setSelectedCustomerId(event.target.value);
                    setError(null);
                    setResult(null);
                  }}
                >
                  <option value="new">+ Create New Customer</option>

                  {customers.map((customer) => (
                    <option key={customer.id} value={String(customer.id)}>
                      {customer.name || "Unnamed Customer"} —{" "}
                      {customer.customer_code}
                    </option>
                  ))}
                </select>
              </label>

              {selectedCustomerId === "new" ? (
                <label className="prediction-field">
                  <span>Customer Name *</span>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={customerName}
                    maxLength={150}
                    required
                    onChange={(event) => {
                      setCustomerName(event.target.value);
                      setError(null);
                    }}
                  />
                </label>
              ) : (
                <div className="prediction-field">
                  <span>Selected Customer</span>
                  <div className="history-message">
                    {customers.find(
                      (customer) =>
                        String(customer.id) === selectedCustomerId
                    )?.customer_code || "Customer selected"}
                  </div>
                </div>
              )}

              {customersLoading && (
                <p className="history-message">
                  Loading existing customers...
                </p>
              )}

              {customersError && (
                <p className="history-message">
                  Existing customers could not be loaded. You can still create
                  a new customer.
                </p>
              )}

              {selectFields.map((field) => (
                <label className="prediction-field" key={field.name}>
                  <span>{field.label}</span>
                  <select
                    value={String(form[field.name])}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              <label className="prediction-field">
                <span>Senior Citizen</span>
                <select
                  value={form.SeniorCitizen}
                  onChange={(event) =>
                    updateField("SeniorCitizen", Number(event.target.value))
                  }
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </label>

              <label className="prediction-field">
                <span>Tenure (months)</span>
                <input
                  type="number"
                  min={0}
                  max={72}
                  required
                  value={tenureInput}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setTenureInput(event.target.value)}
                />
              </label>

              <label className="prediction-field">
                <span>Monthly Charges ($)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={monthlyChargesInput}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) =>
                    setMonthlyChargesInput(event.target.value)
                  }
                />
              </label>

              <label className="prediction-field">
                <span>Total Charges ($)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={totalChargesInput}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setTotalChargesInput(event.target.value)}
                />
              </label>
            </div>

            {error && (
              <div className="prediction-error" role="alert">
                <strong>Prediction failed</strong>
                <p>{error}</p>
              </div>
            )}

            <button
              className="prediction-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Analyzing customer..." : "Predict Customer Churn"}
            </button>
          </form>
        </section>
      )}

      {result && (
        <section
          className="overview-panel prediction-result"
          aria-live="polite"
        >
          <span className="panel-label">MODEL RESULT</span>
          <h2>Prediction Results</h2>

          <p className="history-message">
            Customer: <strong>{linkedCustomerName || "Customer"}</strong>
            {" · "}
            Code: <strong>{linkedCustomerCode}</strong>
          </p>

          <div className="prediction-result-grid">
            <article className="prediction-result-card">
              <span>Prediction</span>
              <strong>
                {result.prediction === "Yes" ? "Churn" : "No Churn"}
              </strong>
            </article>

            <article className="prediction-result-card">
              <span>Churn Probability</span>
              <strong>
                {(result.churn_probability * 100).toFixed(2)}%
              </strong>

              <div
                className="distribution-track"
                role="progressbar"
                aria-label="Churn probability"
                aria-valuenow={Math.min(
                  100,
                  Math.max(0, result.churn_probability * 100)
                )}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="distribution-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, result.churn_probability * 100)
                    )}%`,
                  }}
                />
              </div>
            </article>

            <article className="prediction-result-card">
              <span>Risk Level</span>
              <strong>{result.risk_level}</strong>
            </article>
          </div>

          <p className="history-message">
            Prediction ID: #{result.id}
            {result.customer_id
              ? ` · Linked Customer ID: #${result.customer_id}`
              : " · Warning: this prediction is not linked to a customer."}
          </p>

          <button
            className="prediction-submit"
            type="button"
            onClick={handleNewPrediction}
          >
            New Prediction
          </button>
        </section>
      )}
    </main>
  );
}