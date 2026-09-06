const express = require("express");

const {
  getInstallments,
  getInstallmentById,
  refreshStatuses,
  recordPayment,
  waiveInstallment,
  rescheduleInstallment,
} = require(
  "../controllers/emiInstallment.controller"
);

const router =
  express.Router();

router.get(
  "/",
  getInstallments
);

router.post(
  "/refresh-statuses",
  refreshStatuses
);

router.post(
  "/:id/payments",
  recordPayment
);

router.patch(
  "/:id/waive",
  waiveInstallment
);

router.patch(
  "/:id/reschedule",
  rescheduleInstallment
);

router.get(
  "/:id",
  getInstallmentById
);

module.exports = router;
