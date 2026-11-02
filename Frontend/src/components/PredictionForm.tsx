
import { useState, type FormEvent } from "react";
import {
  predictCustomerChurn,
  type CustomerPredictionInput,
} from "../lib/api";

interface PredictionResult {
  prediction: "Yes" | "No";
  churn_probability: number;
  risk_level: string;
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

  // رشته‌ها اجازه می‌دهند ورودی عددی موقتاً خالی باشد.
  const [tenureInput, setTenureInput] = useState(String(initialForm.tenure));
  const [monthlyChargesInput, setMonthlyChargesInput] = useState(
    String(initialForm.MonthlyCharges)
  );
  const [totalChargesInput, setTotalChargesInput] = useState(
    String(initialForm.TotalCharges)
  );

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Please enter valid, non-negative numbers in all numeric fields. Tenure must be between 0 and 72 months.");
      return;
    }

    const customer: CustomerPredictionInput = {
      ...form,
      tenure,
      MonthlyCharges: monthlyCharges,
      TotalCharges: totalCharges,
    };

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = (await predictCustomerChurn(customer)) as PredictionResult;
      setResult(data);
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
            <p>Complete the fields below to run a prediction.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="prediction-form-grid">
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
