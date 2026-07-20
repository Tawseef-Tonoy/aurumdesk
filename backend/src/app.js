const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const goldRateRoutes = require("./routes/goldRate.routes");
const jewelryItemRoutes = require("./routes/jewelryItem.routes");

const expenseRoutes =require("./routes/expense.routes");
const paymentRoutes = require("./routes/payment.routes");
const priceCalculationRoutes = require("./routes/priceCalculation.routes");
const saleRoutes = require("./routes/sale.routes");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AurumDesk backend is running",
  });
});

app.use("/api/customers", customerRoutes);
app.use("/api/gold-rates", goldRateRoutes);
app.use("/api/jewelry-items", jewelryItemRoutes);

app.use("/api/expenses", expenseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/price-calculation", priceCalculationRoutes);
app.use("/api/sales", saleRoutes);


module.exports = app;