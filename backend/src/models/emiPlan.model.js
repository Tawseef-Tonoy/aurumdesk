const mongoose = require("mongoose");

const emiPlanSchema = new mongoose.Schema(
  {
    planNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
      index: true,
    },

    totalSaleAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    downPayment: {
      type: Number,
      required: true,
      min: 0,
    },

    financedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    emiPayable: {
      type: Number,
      required: true,
      min: 0,
    },

    installmentCount: {
      type: Number,
      required: true,
      min: 1,
    },

    frequency: {
      type: String,
      enum: ["WEEKLY", "BIWEEKLY", "MONTHLY"],
      default: "MONTHLY",
      required: true,
    },

    firstDueDate: {
      type: Date,
      required: true,
    },

    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    installmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    remainingBalance: {
      type: Number,
      required: true,
      min: 0,
    },

    referenceName: {
      type: String,
      trim: true,
      default: "",
    },

    referencePhone: {
      type: String,
      trim: true,
      default: "",
    },

    guarantorName: {
      type: String,
      trim: true,
      default: "",
    },

    guarantorPhone: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "REVISION_REQUIRED",
        "APPROVED",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },

    preparedBy: {
      type: String,
      trim: true,
      default: "SYSTEM",
    },

    approvedBy: {
      type: String,
      trim: true,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: String,
      trim: true,
      default: "",
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    revisionReason: {
      type: String,
      trim: true,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emiPlanSchema.index({
  customer: 1,
  createdAt: -1,
});

emiPlanSchema.index({
  sale: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "EMIPlan",
  emiPlanSchema
);
