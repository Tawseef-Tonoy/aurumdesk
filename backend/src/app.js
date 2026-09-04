const express = require("express");
const cors = require("cors");

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

const authRoutes = require(
  "./routes/auth.routes"
);

const {
  requireAuth,
} = require(
  "./middleware/auth.middleware"
);

const {
  authorizeFeatureAccess,
} = require(
  "./middleware/featureAccess.middleware"
);

/*
|--------------------------------------------------------------------------
| Business Routes
|--------------------------------------------------------------------------
*/

const customerRoutes = require(
  "./routes/customer.routes"
);

const goldRateRoutes = require(
  "./routes/goldRate.routes"
);

const jewelryItemRoutes = require(
  "./routes/jewelryItem.routes"
);

const expenseRoutes = require(
  "./routes/expense.routes"
);

const paymentRoutes = require(
  "./routes/payment.routes"
);

const priceCalculationRoutes = require(
  "./routes/priceCalculation.routes"
);

const saleRoutes = require(
  "./routes/sale.routes"
);

const customOrderRoutes = require(
  "./routes/customOrder.routes"
);

const ledgerRoutes = require(
  "./routes/ledger.routes"
);

const returnExchangeRoutes = require(
  "./routes/returnExchange.routes"
);

const supplierRoutes = require(
  "./routes/supplier.routes"
);

const purchaseRoutes = require(
  "./routes/purchase.routes"
);

const workerRoutes = require(
  "./routes/worker.routes"
);

const workerAssignmentRoutes = require(
  "./routes/workerAssignment.routes"
);

const cashClosingRoutes = require(
  "./routes/cashClosing.routes"
);

const monthlyReportRoutes = require(
  "./routes/monthlyReport.routes"
);

const emiPlanRoutes = require(
  "./routes/emiPlan.routes"
);

const emiInstallmentRoutes = require(
  "./routes/emiInstallment.routes"
);

const emiRiskAssessmentRoutes = require(
  "./routes/emiRiskAssessment.routes"
);

const stockAdjustmentRoutes = require(
  "./routes/stockAdjustment.routes"
);

const lowStockAlertRoutes = require(
  "./routes/lowStockAlert.routes"
);

/*
|--------------------------------------------------------------------------
| Express App
|--------------------------------------------------------------------------
*/

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| Public Health Route
|--------------------------------------------------------------------------
|
| This does NOT require login.
|
*/

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "AurumDesk backend is running",
    });
  }
);

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
|
| /api/auth/login must remain public.
| /me and /logout are already protected inside auth.routes.js.
|
*/

app.use(
  "/api/auth",
  authRoutes
);

/*
|--------------------------------------------------------------------------
| Authentication Wall
|--------------------------------------------------------------------------
|
| EVERYTHING registered below this point requires a valid JWT.
|
*/

app.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Role-Based Authorization
|--------------------------------------------------------------------------
|
| After authentication, check whether the logged-in user's role is
| allowed to access each business feature.
|
*/

app.use(authorizeFeatureAccess);

/*
|--------------------------------------------------------------------------
| Low Stock Alerts
|--------------------------------------------------------------------------
*/

app.use(
  "/api/low-stock-alerts",
  lowStockAlertRoutes
);

/*
|--------------------------------------------------------------------------
| Customers
|--------------------------------------------------------------------------
*/

app.use(
  "/api/customers",
  customerRoutes
);

/*
|--------------------------------------------------------------------------
| Gold Rates
|--------------------------------------------------------------------------
*/

app.use(
  "/api/gold-rates",
  goldRateRoutes
);

/*
|--------------------------------------------------------------------------
| Jewelry Inventory
|--------------------------------------------------------------------------
*/

app.use(
  "/api/jewelry-items",
  jewelryItemRoutes
);

/*
|--------------------------------------------------------------------------
| Expenses
|--------------------------------------------------------------------------
*/

app.use(
  "/api/expenses",
  expenseRoutes
);

/*
|--------------------------------------------------------------------------
| Customer Payments
|--------------------------------------------------------------------------
*/

app.use(
  "/api/payments",
  paymentRoutes
);

/*
|--------------------------------------------------------------------------
| Automatic Price Calculation
|--------------------------------------------------------------------------
*/

app.use(
  "/api/price-calculation",
  priceCalculationRoutes
);

/*
|--------------------------------------------------------------------------
| Sales
|--------------------------------------------------------------------------
*/

app.use(
  "/api/sales",
  saleRoutes
);

/*
|--------------------------------------------------------------------------
| Return / Exchange
|--------------------------------------------------------------------------
*/

app.use(
  "/api/return-exchanges",
  returnExchangeRoutes
);

/*
|--------------------------------------------------------------------------
| Stock Adjustments
|--------------------------------------------------------------------------
*/

app.use(
  "/api/stock-adjustments",
  stockAdjustmentRoutes
);

/*
|--------------------------------------------------------------------------
| Custom Orders
|--------------------------------------------------------------------------
*/

app.use(
  "/api/custom-orders",
  customOrderRoutes
);

/*
|--------------------------------------------------------------------------
| Workers
|--------------------------------------------------------------------------
*/

app.use(
  "/api/workers",
  workerRoutes
);

app.use(
  "/api/worker-assignments",
  workerAssignmentRoutes
);

/*
|--------------------------------------------------------------------------
| Cash Closing
|--------------------------------------------------------------------------
*/

app.use(
  "/api/cash-closings",
  cashClosingRoutes
);

/*
|--------------------------------------------------------------------------
| Suppliers
|--------------------------------------------------------------------------
*/

app.use(
  "/api/suppliers",
  supplierRoutes
);

/*
|--------------------------------------------------------------------------
| Purchases
|--------------------------------------------------------------------------
*/

app.use(
  "/api/purchases",
  purchaseRoutes
);

/*
|--------------------------------------------------------------------------
| EMI Plans
|--------------------------------------------------------------------------
*/

app.use(
  "/api/emi-plans",
  emiPlanRoutes
);

/*
|--------------------------------------------------------------------------
| EMI Installments
|--------------------------------------------------------------------------
*/

app.use(
  "/api/emi-installments",
  emiInstallmentRoutes
);

/*
|--------------------------------------------------------------------------
| Feature 17 - AI EMI Risk Checker
|--------------------------------------------------------------------------
*/

app.use(
  "/api/emi-risk-assessments",
  emiRiskAssessmentRoutes
);

/*
|--------------------------------------------------------------------------
| Customer Due Ledger
|--------------------------------------------------------------------------
*/

app.use(
  "/api/customer-ledgers",
  ledgerRoutes
);

/*
|--------------------------------------------------------------------------
| Monthly Reports
|--------------------------------------------------------------------------
*/

app.use(
  "/api/monthly-reports",
  monthlyReportRoutes
);

module.exports = app;