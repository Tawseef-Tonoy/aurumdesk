const express = require(
  "express"
);

const {
  createEMIPlan,
  getEMIPlans,
  getEMIPlanById,
  updateEMIPlan,
  submitEMIPlan,
  approveEMIPlan,
  rejectEMIPlan,
  requestEMIRevision,
  cancelEMIPlan,
} = require(
  "../controllers/emiPlan.controller"
);

const router =
  express.Router();

router.post(
  "/",
  createEMIPlan
);

router.get(
  "/",
  getEMIPlans
);

router.patch(
  "/:id/submit",
  submitEMIPlan
);

router.patch(
  "/:id/approve",
  approveEMIPlan
);

router.patch(
  "/:id/reject",
  rejectEMIPlan
);

router.patch(
  "/:id/revision",
  requestEMIRevision
);

router.patch(
  "/:id/cancel",
  cancelEMIPlan
);

router.get(
  "/:id",
  getEMIPlanById
);

router.patch(
  "/:id",
  updateEMIPlan
);

module.exports = router;
