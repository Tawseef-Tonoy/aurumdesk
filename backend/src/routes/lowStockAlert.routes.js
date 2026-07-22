const express = require("express");

const {
  getLowStockAlerts,
  getLowStockAlertById,
  markAlertViewed,
  markReorderPlanned,
  resolveAlert,
  syncOneAlert,
  syncAllAlerts,
} = require(
  "../controllers/lowStockAlert.controller"
);

const router = express.Router();

router.get(
  "/",
  getLowStockAlerts
);

router.post(
  "/sync",
  syncAllAlerts
);

router.post(
  "/sync/:itemId",
  syncOneAlert
);

router.patch(
  "/:id/view",
  markAlertViewed
);

router.patch(
  "/:id/reorder-planned",
  markReorderPlanned
);

router.patch(
  "/:id/resolve",
  resolveAlert
);

router.get(
  "/:id",
  getLowStockAlertById
);

module.exports = router;
