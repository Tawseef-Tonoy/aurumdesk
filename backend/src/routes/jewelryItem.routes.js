const express = require("express");

const {
  createJewelryItem,
  getJewelryItems,
  getJewelryItemById,
  updateJewelryItem,
  deactivateJewelryItem,
} = require("../controllers/jewelryItem.controller");

const router = express.Router();

router.post("/", createJewelryItem);
router.get("/", getJewelryItems);

router.patch("/:id/deactivate", deactivateJewelryItem);

router.get("/:id", getJewelryItemById);
router.patch("/:id", updateJewelryItem);

module.exports = router;