const mongoose = require("mongoose");

const jewelryItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: [true, "Jewelry name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "RING",
        "NECKLACE",
        "BRACELET",
        "EARRING",
        "CHAIN",
        "PENDANT",
        "BANGLE",
        "NOSE_PIN",
        "OTHER",
      ],
    },

    purity: {
      type: String,
      required: [true, "Gold purity is required"],
      enum: ["18K", "21K", "22K", "24K"],
    },

    grossWeight: {
      type: Number,
      required: [true, "Gross weight is required"],
      min: [0, "Gross weight cannot be negative"],
    },

    stoneWeight: {
      type: Number,
      default: 0,
      min: [0, "Stone weight cannot be negative"],
    },

    netGoldWeight: {
      type: Number,
      required: true,
      min: [0, "Net gold weight cannot be negative"],
    },

    stoneQuantity: {
      type: Number,
      default: 0,
      min: [0, "Stone quantity cannot be negative"],
    },

    stonePrice: {
      type: Number,
      default: 0,
      min: [0, "Stone price cannot be negative"],
    },

    makingChargeType: {
      type: String,
      required: [true, "Making charge type is required"],
      enum: ["FIXED", "PER_GRAM", "PER_BHORI", "PERCENTAGE"],
    },

    makingChargeAmount: {
      type: Number,
      required: [true, "Making charge amount is required"],
      min: [0, "Making charge cannot be negative"],
    },

    purchaseCost: {
      type: Number,
      default: 0,
      min: [0, "Purchase cost cannot be negative"],
    },

    

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    minStockLevel: {
      type: Number,
      min: [0, "Minimum stock level cannot be negative"],
      default: 1,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    supplierReference: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "RESERVED",
        "SOLD",
        "DAMAGED",
        "RETURNED",
        "UNDER_REPAIR",
        "INACTIVE",
      ],
      default: "AVAILABLE",
    },
  },
  {
    timestamps: true,
  }
);

const JewelryItem = mongoose.model("JewelryItem", jewelryItemSchema);

module.exports = JewelryItem;