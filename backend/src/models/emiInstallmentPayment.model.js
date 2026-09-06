const mongoose = require("mongoose");

const emiInstallmentPaymentSchema =
  new mongoose.Schema(
    {
      paymentNo: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
      },

      emiPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EMIPlan",
        required: true,
        index: true,
      },

      installment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EMIInstallment",
        required: true,
        index: true,
      },

      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0.01,
      },

      paymentDate: {
        type: Date,
        default: Date.now,
      },

      method: {
        type: String,
        enum: [
          "CASH",
          "CARD",
          "BANK_TRANSFER",
          "MOBILE_BANKING",
          "OTHER",
        ],
        required: true,
      },

      receiptReference: {
        type: String,
        trim: true,
        default: "",
      },

      receivedBy: {
        type: String,
        trim: true,
        default: "SYSTEM",
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

emiInstallmentPaymentSchema.index({
  installment: 1,
  paymentDate: -1,
});

module.exports = mongoose.model(
  "EMIInstallmentPayment",
  emiInstallmentPaymentSchema
);
