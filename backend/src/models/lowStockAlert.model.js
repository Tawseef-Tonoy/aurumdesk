const mongoose = require("mongoose");

const lowStockAlertSchema = new mongoose.Schema(
  {
    jewelryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JewelryItem",
      required: [true, "Jewelry item is required"],
      index: true,
    },

    currentQuantity: {
      type: Number,
      required: true,
      min: [0, "Current quantity cannot be negative"],
    },

    minStockLevel: {
      type: Number,
      required: true,
      min: [0, "Minimum stock level cannot be negative"],
    },

    suggestedReorderQuantity: {
      type: Number,
      required: true,
      min: [0, "Suggested reorder quantity cannot be negative"],
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "VIEWED",
        "REORDER_PLANNED",
        "RESOLVED",
      ],
      default: "NEW",
      index: true,
    },

    firstTriggeredAt: {
      type: Date,
      default: Date.now,
    },

    lastTriggeredAt: {
      type: Date,
      default: Date.now,
    },

    viewedAt: {
      type: Date,
      default: null,
    },

    reorderPlannedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

lowStockAlertSchema.index({
  status: 1,
  lastTriggeredAt: -1,
});

lowStockAlertSchema.index({
  jewelryItem: 1,
  createdAt: -1,
});

const LowStockAlert = mongoose.model(
  "LowStockAlert",
  lowStockAlertSchema
);

module.exports = LowStockAlert;
