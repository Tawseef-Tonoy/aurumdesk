const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");

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

module.exports = app;