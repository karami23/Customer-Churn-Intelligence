const API_BASE_URL = "http://127.0.0.1:8000";

export async function getDashboardSummary() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/stats/summary`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard statistics");
  }

  return response.json();
}

export interface CustomerPredictionInput {
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
}

export async function predictCustomerChurn(
  customer: CustomerPredictionInput
) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customer),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to predict customer churn");
  }

  return response.json();
}
export interface PredictionHistoryItem {
  id: number;
  prediction: "Yes" | "No";
  churn_probability: number;
  risk_level: string;
  created_at: string;
  customer_data?: Record<string, unknown>;
}

export async function getPredictionHistory(): Promise<PredictionHistoryItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch prediction history");
  }

  const data = await response.json();

  // پشتیبانی از پاسخ مستقیم آرایه‌ای یا پاسخ دارای فیلدهای داده
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.predictions)) {
    return data.predictions;
  }

  throw new Error("Unexpected prediction history response format");
}

export interface DashboardSummary {
  total_predictions: number;
  predicted_churn: number;
  predicted_no_churn: number;
  predicted_churn_percentage: number;
  average_churn_probability: number;
}

export interface RiskDistribution {
  Low: number;
  Medium: number;
  High: number;
}

export interface PredictionTrendItem {
  date: string;
  total_predictions: number;
  predicted_churn: number;
}

export interface PredictionTrend {
  period_days: number;
  data: PredictionTrendItem[];
}

export async function getRiskDistribution(): Promise<RiskDistribution> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/stats/risks`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch risk distribution");
  }

  return response.json();
}

export async function getPredictionTrend(
  days: number = 30
): Promise<PredictionTrend> {
  const safeDays = Math.min(365, Math.max(1, Math.floor(days)));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/stats/trend?days=${safeDays}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch prediction trend");
  }

  return response.json();
}
