const express = require("express");

const {
  createAssessment,
  getAssessments,
  getAssessmentById,
  recordHumanDecision,
} = require(
  "../controllers/emiRiskAssessment.controller"
);

const router =
  express.Router();

router.post(
  "/",
  createAssessment
);

router.get(
  "/",
  getAssessments
);

router.patch(
  "/:id/decision",
  recordHumanDecision
);

router.get(
  "/:id",
  getAssessmentById
);

module.exports = router;
