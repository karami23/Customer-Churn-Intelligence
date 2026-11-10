const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}


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

export interface CustomerCreateInput {
  name: string;
}

export type CustomerData = Omit<
  CustomerPredictionInput,
  "customer_code"
>;

export interface Customer {
  id: number;
  name: string | null;
  customer_code: string | null;
  customer_data: Partial<CustomerData>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerDetail extends Customer {
  prediction_count?: number;
}

export interface PredictionResult {
  id: number;
  customer_id: number | null;
  prediction: "Yes" | "No";
  churn_probability: number;
  risk_level: "Low" | "Medium" | "High";
  created_at: string;
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
  total: number;
  churn: number;
  non_churn: number;
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

export interface PredictionDetail extends PredictionHistoryItem {
  customer_data: Record<string, unknown>;
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
// Response Helpers
// ==========================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (typeof data === "string" && data.trim()) {
      message = data;
    } else if (data && typeof data === "object") {
      const errorData = data as {
        detail?: string | Array<{ msg?: string }>;
        message?: string;
      };

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        message = errorData.detail
          .map((item) => item.msg || "Invalid request")
          .join(", ");
      } else if (errorData.message) {
        message = errorData.message;
      }
    }

    throw new Error(message);
  }

  return data as T;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
}

function extractList<T>(
  response: T[] | Record<string, unknown>,
  resourceName: string
): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === "object") {
    const data = response as Record<string, unknown>;

    if (Array.isArray(data.items)) {
      return data.items as T[];
    }

    if (Array.isArray(data[resourceName])) {
      return data[resourceName] as T[];
    }
  }

  return [];
}

// ==========================================
// Dashboard
// ==========================================

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(
    "/api/v1/predictions/stats/summary"
  );
}

// ==========================================
// Predictions
// ==========================================

export async function predictCustomerChurn(
  customer: CustomerPredictionInput
): Promise<PredictionResult> {
  return apiRequest<PredictionResult>(
    "/api/v1/predictions/predict",
    {
      method: "POST",
      body: JSON.stringify(customer),
    }
  );
}

export async function getPredictionHistory(
  filters: PredictionHistoryFilters = {}
): Promise<PredictionHistoryItem[]> {
  const params = new URLSearchParams();

  if (filters.prediction) {
    params.set("prediction", filters.prediction);
  }

  if (filters.risk_level) {
    params.set("risk_level", filters.risk_level);
  }

  if (filters.skip !== undefined) {
    params.set("skip", String(filters.skip));
  }

  if (filters.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const endpoint = `/api/v1/predictions/${query ? `?${query}` : ""}`;

  const response = await apiRequest<
    PredictionHistoryItem[] | Record<string, unknown>
  >(endpoint);

  return extractList<PredictionHistoryItem>(response, "predictions");
}

export async function getPredictionById(
  predictionId: number
): Promise<PredictionDetail> {
  return apiRequest<PredictionDetail>(
    `/api/v1/predictions/${predictionId}`
  );
}

export async function deletePrediction(
  predictionId: number
): Promise<{ message: string; prediction_id: number }> {
  return apiRequest<{ message: string; prediction_id: number }>(
    `/api/v1/predictions/${predictionId}`,
    {
      method: "DELETE",
    }
  );
}

// ==========================================
// Prediction Statistics
// ==========================================

export async function getRiskDistribution(): Promise<
  RiskDistributionItem[]
> {
  const response = await apiRequest<
    RiskDistributionItem[] | Record<string, unknown>
  >("/api/v1/predictions/stats/risks");

  return extractList<RiskDistributionItem>(response, "risks");
}

export async function getPredictionTrend(
  days = 30
): Promise<PredictionTrendItem[]> {
  const params = new URLSearchParams({
    days: String(days),
  });

  const response = await apiRequest<
    PredictionTrendItem[] | Record<string, unknown>
  >(`/api/v1/predictions/stats/trend?${params.toString()}`);

  return extractList<PredictionTrendItem>(response, "trend");
}

// ==========================================
// Customers
// ==========================================

export async function getCustomers(
  filters: CustomerFilters = {}
): Promise<Customer[]> {
  const params = new URLSearchParams();

  if (filters.skip !== undefined) {
    params.set("skip", String(filters.skip));
  }

  if (filters.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const endpoint = `/api/v1/customers/${query ? `?${query}` : ""}`;

  const response = await apiRequest<
    Customer[] | Record<string, unknown>
  >(endpoint);

  return extractList<Customer>(response, "customers");
}

export async function createCustomer(
  customer: CustomerCreateInput
): Promise<Customer> {
  return apiRequest<Customer>(
    "/api/v1/customers/",
    {
      method: "POST",
      body: JSON.stringify(customer),
    }
  );
}

export async function getCustomerById(
  customerId: number
): Promise<CustomerDetail> {
  return apiRequest<CustomerDetail>(
    `/api/v1/customers/${customerId}`
  );
}

export async function getCustomerPredictions(
  customerId: number
): Promise<PredictionHistoryItem[]> {
  const response = await apiRequest<
    PredictionHistoryItem[] | Record<string, unknown>
  >(`/api/v1/customers/${customerId}/predictions`);

  return extractList<PredictionHistoryItem>(response, "predictions");
}

export async function deleteCustomer(
  customerId: number
): Promise<{ message: string; customer_id: number }> {
  return apiRequest<{ message: string; customer_id: number }>(
    `/api/v1/customers/${customerId}`,
    {
      method: "DELETE",
    }
  );
}

// ==========================================
// Health Check
// ==========================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}