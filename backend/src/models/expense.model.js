const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    expenseDate: {
      type: Date,
      required: [true, "Expense date is required"],
    },

    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: [
        "RENT",
        "ELECTRICITY",
        "SALARY",
        "WORKER_PAYMENT",
        "TRANSPORTATION",
        "PACKAGING",
        "MAINTENANCE",
        "MARKETING",
        "SECURITY",
        "MISCELLANEOUS",
      ],
      uppercase: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [1, "Amount must be greater than zero"],
    },

    paymentMethod: {
      type: String,
      enum: [
        "CASH",
        "BANK_TRANSFER",
        "CARD",
        "MOBILE_BANKING",
      ],
      default: "CASH",
    },

    paidTo: {
      type: String,
      required: [true, "Receiver name is required"],
      trim: true,
    },

    voucherNumber: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    createdBy: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);


const Expense = mongoose.model(
  "Expense",
  expenseSchema
);


module.exports = Expense;