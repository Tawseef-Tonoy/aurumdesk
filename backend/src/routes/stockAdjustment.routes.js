const express = require("express");

const {
  createStockAdjustment,
  getStockAdjustments,
  getStockAdjustmentById,
  getItemStockAdjustments,
} = require(
  "../controllers/stockAdjustment.controller"
);

const router = express.Router();

router.post(
  "/",
  createStockAdjustment
);

router.get(
  "/",
  getStockAdjustments
);

// Keep this route above "/:id".
router.get(
  "/item/:itemId",
  getItemStockAdjustments
);

router.get(
  "/:id",
  getStockAdjustmentById
);

module.exports = router;
