# Customer Churn Intelligence

An end-to-end Customer Churn Prediction and Analytics Platform built to help businesses identify customers at risk of leaving, understand churn patterns, and make data-driven retention decisions.

Customer Churn Intelligence combines Machine Learning, a RESTful API, relational database management, and an interactive web dashboard into a unified application. It enables users to submit customer information, predict churn probability, assess customer risk levels, and explore historical prediction data through analytical dashboards.

## Overview

Customer churn is one of the key challenges businesses face when maintaining long-term customer relationships. Identifying customers who are likely to discontinue a service allows organizations to take proactive retention measures and make more informed business decisions.

This project provides a practical solution through a Machine Learning-powered platform that:

- Predicts whether a customer is likely to churn.
- Calculates the probability of customer churn.
- Categorizes customers into Low, Medium, and High risk levels.
- Stores prediction results and customer information.
- Provides historical prediction records and analytical insights.
- Visualizes churn trends, prediction distributions, and business metrics.

The application is designed with a modular architecture, separating the frontend, backend, machine learning logic, and database responsibilities.

## Key Features

### Machine Learning-Based Churn Prediction

- Predicts customer churn using a trained classification model.
- Generates churn probabilities for individual customers.
- Assigns risk levels based on prediction probability.
- Supports customer data validation before prediction.
- Integrates the trained model into the backend prediction workflow.

### Customer Management

- Create and manage customer records.
- Automatically generate unique customer codes.
- Search and retrieve customers.
- View individual customer details.
- Access customer-specific prediction history.
- Preserve historical predictions when a customer record is deleted.

### Prediction Management

- Submit customer information for churn prediction.
- Associate predictions with existing customers through customer codes.
- Automatically create customer records when an unknown customer code is submitted.
- Store prediction results and customer input data.
- Retrieve prediction history and individual prediction details.
- Filter predictions by churn outcome and risk level.
- Delete individual prediction records.

### Analytics Dashboard

The application provides analytical endpoints and dashboard visualizations for understanding customer churn behavior.

Available analytics include:

- Total number of predictions.
- Churn and non-churn prediction counts.
- Average churn probability.
- Customer risk-level distribution.
- Historical prediction trends.
- Daily churn and non-churn statistics.

### Interactive Web Interface

The frontend provides dedicated pages for managing and analyzing churn predictions:

- **Dashboard:** Overview of important prediction metrics and business insights.
- **Customers:** Customer management, search, details, and prediction history.
- **Predict:** Interactive form for submitting customer information and generating predictions.
- **Predictions:** Historical prediction records and filtering.
- **Analytics:** Visual representation of churn trends and risk distribution.
- **Settings:** Application settings interface.

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- CSS
- REST API Integration

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Uvicorn

### Machine Learning & Data Processing

- Python
- Pandas
- NumPy
- Scikit-learn
- Matplotlib
- Classification Models
- Model Serialization with Joblib

### Database & Infrastructure

- PostgreSQL
- SQLAlchemy ORM
- Alembic
- Docker
- Docker Compose

### Testing & Development

- Pytest
- HTTPX
- FastAPI TestClient
- SQLite for isolated API tests
- Git & GitHub

## Machine Learning Workflow

The churn prediction component follows a structured Machine Learning workflow:

1. **Data Preparation:** Customer records are prepared and transformed into a suitable format for model training.
2. **Feature Engineering:** Numerical and categorical features are processed using appropriate preprocessing techniques.
3. **Model Training:** Classification algorithms are trained to identify patterns associated with customer churn.
4. **Model Evaluation:** Models are evaluated using classification metrics such as Precision, Recall, F1-score, and Confusion Matrix.
5. **Model Selection:** The trained model is selected based on evaluation results.
6. **Model Serialization:** The final model is saved as a reusable artifact.
7. **Model Integration:** The backend loads the trained model and uses it to generate predictions through the REST API.

The prediction service returns three important outputs:

| Output | Description |
|---|---|
| Prediction | Predicted churn outcome: Yes or No |
| Churn Probability | Probability of the customer churning |
| Risk Level | Low, Medium, or High |

### Risk Classification

Risk levels are determined using the predicted churn probability:

| Risk Level | Probability |
|---|---|
| Low | Below 0.40 |
| Medium | 0.40 to below 0.70 |
| High | 0.70 and above |

These thresholds provide a straightforward way to prioritize customers who may require retention attention.

## Project Architecture

The project follows a frontend-backend architecture with a dedicated Machine Learning prediction layer and PostgreSQL database.

```text
Customer-Churn-Intelligence/
│
├── Backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── customers.py
│   │   │   │   └── predictions.py
│   │   │   ├── database.py
│   │   │   ├── schemas.py
│   │   │   └── main.py
│   │   │
│   │   ├── services/
│   │   │   └── ...
│   │   │
│   │   └── models.py
│   │
│   ├── Artifacts/
│   │   └── churn_model.joblib
│   │
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   └── .env
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── assets/
│   │   └── ...
│   │
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

*The directory structure above illustrates the main application components.*

### Backend Architecture

The backend is built with FastAPI and organized into separate API, schema, database, model, and service responsibilities.

- **API Routes:** Handle HTTP requests and application endpoints.
- **Pydantic Schemas:** Validate incoming data and define API response structures.
- **SQLAlchemy Models:** Define database entities and relationships.
- **Database Layer:** Manage PostgreSQL connections and database sessions.
- **Prediction Service:** Load the trained model and generate churn predictions.
- **Alembic Migrations:** Manage database schema changes.
- **Tests:** Validate API behavior and application functionality.

### Frontend Architecture

The frontend is developed using React and TypeScript.

It communicates with the backend through a centralized API integration layer, allowing individual components to retrieve customer information, submit predictions, and display analytical data.

## Database Design

The application uses PostgreSQL to persist customer information and prediction records.

### Customers

Stores customer records and their associated information.

Important fields include:

- `id`
- `name`
- `customer_code`
- `customer_data`
- `created_at`
- `updated_at`

### Prediction Records

Stores the results of individual churn predictions.

Important fields include:

- `id`
- `customer_id`
- `customer_data`
- `prediction`
- `churn_probability`
- `risk_level`
- `created_at`

The relationship between customers and predictions allows the application to maintain historical prediction records for each customer.

Customer records can be deleted without deleting their associated prediction history. In this case, the prediction's `customer_id` is set to `NULL`.

## REST API

The backend exposes versioned REST API endpoints under:

`/api/v1`

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API health |

### Customer Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/customers/` | Create a customer |
| GET | `/api/v1/customers/` | Retrieve customers with search and pagination |
| GET | `/api/v1/customers/{customer_id}` | Retrieve customer details |
| GET | `/api/v1/customers/{customer_id}/predictions` | Retrieve customer prediction history |
| DELETE | `/api/v1/customers/{customer_id}` | Delete a customer |

### Prediction Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/predictions/predict` | Generate a churn prediction |
| GET | `/api/v1/predictions/` | Retrieve prediction history |
| GET | `/api/v1/predictions/{prediction_id}` | Retrieve prediction details |
| DELETE | `/api/v1/predictions/{prediction_id}` | Delete a prediction |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/predictions/stats/summary` | Retrieve dashboard summary |
| GET | `/api/v1/predictions/stats/risks` | Retrieve risk distribution |
| GET | `/api/v1/predictions/stats/trend` | Retrieve historical prediction trends |

Interactive API documentation is available through FastAPI Swagger UI:

`http://localhost:8000/docs`

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- Python 3.10+
- Node.js and npm
- Docker Desktop
- PostgreSQL (or Docker-based PostgreSQL)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Customer-Churn-Intelligence.git

cd Customer-Churn-Intelligence
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd Backend
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `Backend` directory.

Configure the database connection:

```env
DATABASE_URL=postgresql+psycopg://YOUR_USER:YOUR_PASSWORD@localhost:5432/churn_intelligence
```

Replace the placeholders with your PostgreSQL credentials.

### 4. Start PostgreSQL

If using Docker Compose, run:

```bash
docker compose up -d
```

Make sure the PostgreSQL container is running and healthy.

### 5. Apply Database Migrations

From the Backend directory:

```bash
alembic upgrade head
```

### 6. Start the Backend API

```bash
python -m uvicorn src.api.main:app --reload
```

The backend will be available at:

`http://localhost:8000`

Swagger documentation:

`http://localhost:8000/docs`

### 7. Start the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will typically be available at:

`http://localhost:5173`

The frontend API configuration can be customized using:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Create the frontend environment file as `.env` inside the `Frontend` directory if this configuration is needed.

## Running Tests

The backend test suite uses Pytest and an isolated SQLite in-memory database for API testing.

Run tests from the Backend directory:

```bash
pytest -v --tb=short
```

## Configuration & Security Notes

- Keep database credentials and environment-specific configuration outside source control.
- Do not commit `.env` files, virtual environments, or sensitive credentials.
- Keep the trained model artifact available at the configured backend artifact path.
- Use database migrations to manage schema changes instead of modifying production tables manually.

## Future Improvements

Potential future enhancements include:

- Authentication and role-based authorization.
- Advanced model comparison and hyperparameter optimization.
- Model monitoring and performance tracking.
- Explainable AI techniques for understanding individual predictions.
- Automated model retraining and version management.
- Real-time churn analytics and event processing.
- Customer segmentation and retention recommendations.

## Project Goals

Customer Churn Intelligence was developed as a practical end-to-end project to demonstrate the integration of Machine Learning into a real-world software application.

Beyond building a predictive model, the project focuses on the engineering required to turn an ML model into a usable product: API development, database design, frontend integration, data validation, historical record management, analytics, and testing.

It demonstrates how Machine Learning can be integrated into a full-stack application to transform customer data into actionable business insights.

## License

This project is available under the MIT License. See the `LICENSE` file for details, if included in the repository.

---

**Customer Churn Intelligence**  
*Turning Customer Data into Predictive Business Insights.*