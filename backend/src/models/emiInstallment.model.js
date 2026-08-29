const mongoose = require("mongoose");

const emiInstallmentSchema = new mongoose.Schema(
  {
    emiPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMIPlan",
      required: true,
      index: true,
    },

    installmentNo: {
      type: Number,
      required: true,
      min: 1,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    scheduledAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    paymentMethod: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "UPCOMING",
        "DUE_TODAY",
        "PARTIALLY_PAID",
        "PAID",
        "OVERDUE",
        "WAIVED",
        "RESCHEDULED",
      ],
      default: "UPCOMING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

emiInstallmentSchema.index(
  {
    emiPlan: 1,
    installmentNo: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "EMIInstallment",
  emiInstallmentSchema
);
