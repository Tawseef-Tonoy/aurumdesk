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
      index: true,
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

    overdueDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPaymentDate: {
      type: Date,
      default: null,
    },

    lastPaymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    lastReceiptReference: {
      type: String,
      default: "",
      trim: true,
    },

    waivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    waivedBy: {
      type: String,
      default: "",
      trim: true,
    },

    waivedAt: {
      type: Date,
      default: null,
    },

    waiverReason: {
      type: String,
      default: "",
      trim: true,
    },

    originalDueDate: {
      type: Date,
      default: null,
    },

    rescheduledBy: {
      type: String,
      default: "",
      trim: true,
    },

    rescheduleReason: {
      type: String,
      default: "",
      trim: true,
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
