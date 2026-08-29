const mongoose = require("mongoose");

const inputSummarySchema = new mongoose.Schema(
  {
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0,
    },

    incomeSource: {
      type: String,
      enum: ["CUSTOMER_PROFILE", "MANUAL_OVERRIDE"],
      default: "CUSTOMER_PROFILE",
    },

    occupation: {
      type: String,
      default: "",
      trim: true,
    },

    employmentStability: {
      type: String,
      enum: [
        "STABLE",
        "MODERATE",
        "UNSTABLE",
        "UNKNOWN",
      ],
      default: "UNKNOWN",
    },

    requestedEMIAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    installmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    monthlyEquivalentInstallment: {
      type: Number,
      required: true,
      min: 0,
    },

    incomeToInstallmentRatio: {
      type: Number,
      required: true,
      min: 0,
    },

    installmentToIncomePercentage: {
      type: Number,
      required: true,
      min: 0,
    },

    downPayment: {
      type: Number,
      required: true,
      min: 0,
    },

    downPaymentPercentage: {
      type: Number,
      required: true,
      min: 0,
    },

    existingDueBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    existingEMIBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherOutstandingSaleDue: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousPurchaseCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousEMIPlanCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedEMIPlans: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalHistoricalInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    overdueInstallmentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    overdueRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageDelayDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDelayDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    referenceAvailable: {
      type: Boolean,
      default: false,
    },

    guarantorAvailable: {
      type: Boolean,
      default: false,
    },

    frequency: {
      type: String,
      default: "MONTHLY",
    },
  },
  {
    _id: false,
  }
);

const scoreBreakdownSchema = new mongoose.Schema(
  {
    installmentBurdenPoints: {
      type: Number,
      default: 0,
    },

    downPaymentPoints: {
      type: Number,
      default: 0,
    },

    existingDuePoints: {
      type: Number,
      default: 0,
    },

    overdueHistoryPoints: {
      type: Number,
      default: 0,
    },

    paymentDelayPoints: {
      type: Number,
      default: 0,
    },

    employmentStabilityPoints: {
      type: Number,
      default: 0,
    },

    supportPoints: {
      type: Number,
      default: 0,
    },

    completedPlanCredit: {
      type: Number,
      default: 0,
    },

    totalBeforeClamp: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const emiRiskAssessmentSchema = new mongoose.Schema(
  {
    assessmentNo: {
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

    emiPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMIPlan",
      required: true,
      index: true,
    },

    modelVersion: {
      type: String,
      required: true,
      default: "EXPLAINABLE-JS-V1.0",
    },

    inputSummary: {
      type: inputSummarySchema,
      required: true,
    },

    scoreBreakdown: {
      type: scoreBreakdownSchema,
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },

    riskLevel: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
      ],
      required: true,
      index: true,
    },

    positiveFactors: [
      {
        type: String,
        trim: true,
      },
    ],

    negativeFactors: [
      {
        type: String,
        trim: true,
      },
    ],

    recommendation: {
      type: String,
      required: true,
      trim: true,
    },

    assessedBy: {
      type: String,
      required: true,
      trim: true,
    },

    assessedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    humanDecision: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "NEEDS_REVIEW",
      ],
      default: "PENDING",
    },

    decisionBy: {
      type: String,
      trim: true,
      default: "",
    },

    decisionAt: {
      type: Date,
      default: null,
    },

    decisionNotes: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

emiRiskAssessmentSchema.index({
  customer: 1,
  assessedAt: -1,
});

emiRiskAssessmentSchema.index({
  emiPlan: 1,
  assessedAt: -1,
});

module.exports = mongoose.model(
  "EMIRiskAssessment",
  emiRiskAssessmentSchema
);
