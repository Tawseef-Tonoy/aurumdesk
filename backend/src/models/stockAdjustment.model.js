const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    jewelryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JewelryItem",
      required: [true, "Jewelry item is required"],
      index: true,
    },

    direction: {
      type: String,
      required: [true, "Adjustment direction is required"],
      enum: ["INCREASE", "DECREASE"],
    },

    adjustmentAmount: {
      type: Number,
      required: [true, "Adjustment amount is required"],
      min: [1, "Adjustment amount must be at least 1"],
    },

    previousQuantity: {
      type: Number,
      required: true,
      min: [0, "Previous quantity cannot be negative"],
    },

    newQuantity: {
      type: Number,
      required: true,
      min: [0, "New quantity cannot be negative"],
    },

    reason: {
      type: String,
      required: [true, "Adjustment reason is required"],
      enum: [
        "PHYSICAL_COUNT_CORRECTION",
        "DAMAGED_ITEM",
        "LOST_ITEM",
        "FOUND_ITEM",
        "DATA_ENTRY_CORRECTION",
        "SUPPLIER_CORRECTION",
        "RETURN_OR_REPAIR",
        "OTHER",
      ],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    adjustedBy: {
      type: String,
      trim: true,
      default: "SYSTEM",
    },

    requestIp: {
      type: String,
      trim: true,
      default: "",
    },

    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

stockAdjustmentSchema.index({
  jewelryItem: 1,
  createdAt: -1,
});

stockAdjustmentSchema.index({
  reason: 1,
  createdAt: -1,
});

const StockAdjustment = mongoose.model(
  "StockAdjustment",
  stockAdjustmentSchema
);

module.exports = StockAdjustment;
