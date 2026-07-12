const mongoose = require("mongoose");

const goldRateSchema = new mongoose.Schema(
  {
    purity: {
      type: String,
      required: [true, "Gold purity is required"],
      enum: ["18K", "21K", "22K", "24K"],
      trim: true,
      uppercase: true,
    },

    ratePerGram: {
      type: Number,
      required: [true, "Gold rate per gram is required"],
      min: [0.01, "Gold rate must be greater than zero"],
    },

    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const GoldRate = mongoose.model("GoldRate", goldRateSchema);

module.exports = GoldRate;