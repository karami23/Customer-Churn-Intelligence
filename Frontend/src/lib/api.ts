
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ==========================================
// Types
// ==========================================

export interface CustomerPredictionInput {
  customer_code?: string | null;
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

export interface CustomerCreateInput extends CustomerPredictionInput {
  customer_code: string | null;
}

export type CustomerData = Omit<
  CustomerPredictionInput,
  "customer_code"
>;

export interface Customer {
  id: number;
  customer_code: string | null;
  customer_data: CustomerData;
  created_at?: string;
}

export interface CustomerDetail extends Customer {
  prediction_count?: number;
}

export interface PredictionResult {
  id?: number;
  customer_id?: number | null;
  prediction: "Yes" | "No";
  churn_probability: number;
  risk_level: "Low" | "Medium" | "High";
  created_at?: string;
}

export interface DashboardSummary {
  total_predictions: number;
  churn_predictions: number;
  non_churn_predictions: number;
  average_churn_probability: number;
}

export interface RiskDistributionItem {
  risk_level: "Low" | "Medium" | "High";
  count: number;
}

export interface PredictionTrendItem {
  date: string;
  total_predictions: number;
  churn_predictions: number;
}

export interface PredictionHistoryItem {
  id: number;
  customer_id?: number | null;
  prediction: "Yes" | "No";
  churn_probability: number;
  risk_level: "Low" | "Medium" | "High";
  created_at: string;
  customer_data?: Record<string, unknown>;
}

export interface PredictionHistoryFilters {
  prediction?: "Yes" | "No";
  risk_level?: "Low" | "Medium" | "High";
  skip?: number;
  limit?: number;
}

export interface CustomerFilters {
  skip?: number;
  limit?: number;
}

// ==========================================
// API Helper
// ==========================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function extractList<T>(data: unknown, resourceName: string): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (typeof data === "object" && data !== null) {
    const responseData = data as Record<string, unknown>;

    if (Array.isArray(responseData.items)) {
      return responseData.items as T[];
    }

    if (Array.isArray(responseData[resourceName])) {
      return responseData[resourceName] as T[];
    }
  }

  throw new Error(`Unexpected ${resourceName} response format`);
}

// ==========================================
// Dashboard Summary
// ==========================================

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/stats/summary`,
    { cache: "no-store" }
  );

  return handleResponse<DashboardSummary>(response);
}

// ==========================================
// Customer Prediction
// ==========================================

export async function predictCustomerChurn(
  customer: CustomerPredictionInput
): Promise<PredictionResult> {
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

  return handleResponse<PredictionResult>(response);
}

// ==========================================
// Prediction History
// ==========================================

export async function getPredictionHistory(
  filters: PredictionHistoryFilters = {}
): Promise<PredictionHistoryItem[]> {
  const params = new URLSearchParams();

  params.set("skip", String(filters.skip ?? 0));
  params.set("limit", String(filters.limit ?? 100));

  if (filters.prediction) {
    params.set("prediction", filters.prediction);
  }

  if (filters.risk_level) {
    params.set("risk_level", filters.risk_level);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/?${params.toString()}`,
    { cache: "no-store" }
  );

  const data = await handleResponse<unknown>(response);

  return extractList<PredictionHistoryItem>(data, "predictions");
}

// ==========================================
// Get Prediction Details
// ==========================================

export async function getPredictionById(
  predictionId: number
): Promise<PredictionHistoryItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/${predictionId}`,
    { cache: "no-store" }
  );

  return handleResponse<PredictionHistoryItem>(response);
}

// ==========================================
// Delete Prediction
// ==========================================

export async function deletePrediction(
  predictionId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/${predictionId}`,
    { method: "DELETE" }
  );

  await handleResponse<void>(response);
}

// ==========================================
// Risk Distribution
// ==========================================

export async function getRiskDistribution(): Promise<
  RiskDistributionItem[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/stats/risks`,
    { cache: "no-store" }
  );

  return handleResponse<RiskDistributionItem[]>(response);
}

// ==========================================
// Prediction Trend
// ==========================================

export async function getPredictionTrend(
  days: number = 30
): Promise<PredictionTrendItem[]> {
  const safeDays = Math.min(365, Math.max(1, Math.floor(days)));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/predictions/stats/trend?days=${safeDays}`,
    { cache: "no-store" }
  );

  return handleResponse<PredictionTrendItem[]>(response);
}

// ==========================================
// Customers - Get All
// ==========================================

export async function getCustomers(
  filters: CustomerFilters = {}
): Promise<Customer[]> {
  const params = new URLSearchParams();

  params.set("skip", String(filters.skip ?? 0));
  params.set("limit", String(filters.limit ?? 100));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/customers/?${params.toString()}`,
    { cache: "no-store" }
  );

  const data = await handleResponse<unknown>(response);

  return extractList<Customer>(data, "customers");
}

// ==========================================
// Customers - Create
// ==========================================

export async function createCustomer(
  customer: CustomerCreateInput
): Promise<Customer> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customers/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customer),
    }
  );

  return handleResponse<Customer>(response);
}

// ==========================================
// Customers - Get Details
// ==========================================

export async function getCustomerById(
  customerId: number
): Promise<CustomerDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customers/${customerId}`,
    { cache: "no-store" }
  );

  return handleResponse<CustomerDetail>(response);
}

// ==========================================
// Customers - Get Prediction History
// ==========================================

export async function getCustomerPredictions(
  customerId: number
): Promise<PredictionHistoryItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customers/${customerId}/predictions`,
    { cache: "no-store" }
  );

  const data = await handleResponse<unknown>(response);

  return extractList<PredictionHistoryItem>(data, "predictions");
}

// ==========================================
// Customers - Delete
// ==========================================

export async function deleteCustomer(
  customerId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customers/${customerId}`,
    { method: "DELETE" }
  );

  await handleResponse<void>(response);
}

// ==========================================
// API Health Check
// ==========================================

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function checkApiHealth(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  });

  return response.ok;
}
