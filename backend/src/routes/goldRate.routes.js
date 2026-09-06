const express = require("express");

const {
  createGoldRate,
  getGoldRates,
  getActiveGoldRates,
  getGoldRateById,
  updateGoldRate,
  activateGoldRate,
  deactivateGoldRate,
} = require("../controllers/goldRate.controller");

const router = express.Router();

router.post("/", createGoldRate);

router.get("/", getGoldRates);

// Keep this above "/:id"
router.get("/active", getActiveGoldRates);

router.get("/:id", getGoldRateById);

router.patch("/:id", updateGoldRate);

router.patch("/:id/activate", activateGoldRate);

router.patch("/:id/deactivate", deactivateGoldRate);

module.exports = router;