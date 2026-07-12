const express = require("express");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
} = require("../controllers/customer.controller");

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.patch("/:id", updateCustomer);
router.patch("/:id/deactivate", deactivateCustomer);

module.exports = router;