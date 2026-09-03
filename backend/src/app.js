const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const goldRateRoutes = require("./routes/goldRate.routes");
const jewelryItemRoutes = require("./routes/jewelryItem.routes");
const expenseRoutes = require("./routes/expense.routes");
const paymentRoutes = require("./routes/payment.routes");
const priceCalculationRoutes = require("./routes/priceCalculation.routes");
const saleRoutes = require("./routes/sale.routes");
const customOrderRoutes = require("./routes/customOrder.routes");
const ledgerRoutes=require("./routes/ledger.routes");
const returnExchangeRoutes=require("./routes/returnExchange.routes");
const supplierRoutes=require("./routes/supplier.routes");
const purchaseRoutes=require("./routes/purchase.routes");
const workerRoutes=require("./routes/worker.routes");
const workerAssignmentRoutes=require("./routes/workerAssignment.routes");
const cashClosingRoutes=require("./routes/cashClosing.routes");
const monthlyReportRoutes=require("./routes/monthlyReport.routes");

const emiPlanRoutes = require("./routes/emiPlan.routes");
const emiInstallmentRoutes = require("./routes/emiInstallment.routes");
const emiRiskAssessmentRoutes = require(
  "./routes/emiRiskAssessment.routes"
);

const stockAdjustmentRoutes = require(
  "./routes/stockAdjustment.routes"
);

const lowStockAlertRoutes = require(
  "./routes/lowStockAlert.routes"
);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AurumDesk backend is running",
  });
});

app.use(
  "/api/low-stock-alerts",
  lowStockAlertRoutes
);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/gold-rates",
  goldRateRoutes
);

app.use(
  "/api/jewelry-items",
  jewelryItemRoutes
);

app.use(
  "/api/expenses",
  expenseRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/price-calculation",
  priceCalculationRoutes
);

app.use(
  "/api/sales",
  saleRoutes
);

app.use(
  "/api/return-exchanges",
  returnExchangeRoutes
);

app.use(
  "/api/stock-adjustments",
  stockAdjustmentRoutes
);

app.use(
  "/api/custom-orders",
  customOrderRoutes
);

app.use("/api/workers",workerRoutes);
app.use("/api/worker-assignments",workerAssignmentRoutes);
app.use("/api/cash-closings",cashClosingRoutes);

app.use(
"/api/suppliers",
supplierRoutes
);

app.use(
"/api/purchases",
purchaseRoutes
);

app.use(
  "/api/emi-plans",
  emiPlanRoutes
);

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

app.use(
  "/api/customer-ledgers",
  ledgerRoutes
);

app.use(
"/api/monthly-reports",
monthlyReportRoutes
);

module.exports = app;