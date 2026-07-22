const JewelryItem = require("../models/jewelryItem.model");

function calculateNetGoldWeight(grossWeight, stoneWeight = 0) {
  return Number(grossWeight) - Number(stoneWeight);
}

// Create a jewelry item
async function createJewelryItem(req, res) {
  try {
    const {
      sku,
      name,
      category,
      purity,
      grossWeight,
      stoneWeight = 0,
      stoneQuantity = 0,
      stonePrice = 0,
      makingChargeType,
      makingChargeAmount,
      purchaseCost = 0,
      quantity,
      minStockLevel = 1,
      imageUrl = "",
      supplierReference = "",
      status = "AVAILABLE",
    } = req.body;

    if (
      !sku ||
      !name ||
      !category ||
      !purity ||
      grossWeight === undefined ||
      !makingChargeType ||
      makingChargeAmount === undefined ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SKU, name, category, purity, gross weight, making charge type, making charge amount, and quantity are required",
      });
    }

    const normalizedSku = sku.trim().toUpperCase();

    const existingItem = await JewelryItem.findOne({
      sku: normalizedSku,
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "A jewelry item with this SKU already exists",
      });
    }

    const numericGrossWeight = Number(grossWeight);
    const numericStoneWeight = Number(stoneWeight);

    if (numericStoneWeight > numericGrossWeight) {
      return res.status(400).json({
        success: false,
        message: "Stone weight cannot exceed gross weight",
      });
    }

    const netGoldWeight = calculateNetGoldWeight(
      numericGrossWeight,
      numericStoneWeight
    );

    const item = await JewelryItem.create({
      sku: normalizedSku,
      name,
      category: category.toUpperCase(),
      purity: purity.toUpperCase(),
      grossWeight: numericGrossWeight,
      stoneWeight: numericStoneWeight,
      netGoldWeight,
      stoneQuantity,
      stonePrice,
      makingChargeType: makingChargeType.toUpperCase(),
      makingChargeAmount,
      purchaseCost,
      quantity,
      minStockLevel,
      imageUrl,
      supplierReference,
      status: status.toUpperCase(),
    });

    return res.status(201).json({
      success: true,
      message: "Jewelry item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create jewelry item error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A jewelry item with this SKU already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid jewelry item data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create jewelry item",
      error: error.message,
    });
  }
}

// List jewelry items with search and filters
async function getJewelryItems(req, res) {
  try {
    const { search, category, purity, status } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        {
          sku: {
            $regex: search,
            $options: "i",
          },
        },
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.category = category.toUpperCase();
    }

    if (purity) {
      filter.purity = purity.toUpperCase();
    }

    if (status) {
      filter.status = status.toUpperCase();
    }

    const items = await JewelryItem.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Get jewelry items error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve jewelry items",
      error: error.message,
    });
  }
}

// Get one jewelry item
async function getJewelryItemById(req, res) {
  try {
    const item = await JewelryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Jewelry item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get jewelry item error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid jewelry item ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve jewelry item",
      error: error.message,
    });
  }
}

// Update a jewelry item
async function updateJewelryItem(req, res) {
  try {
    const item = await JewelryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Jewelry item not found",
      });
    }

    const allowedFields = [
      "name",
      "category",
      "purity",
      "grossWeight",
      "stoneWeight",
      "stoneQuantity",
      "stonePrice",
      "makingChargeType",
      "makingChargeAmount",
      "purchaseCost",
      "quantity",
      "minStockLevel",
      "imageUrl",
      "supplierReference",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    }

    if (req.body.category !== undefined) {
      item.category = req.body.category.toUpperCase();
    }

    if (req.body.purity !== undefined) {
      item.purity = req.body.purity.toUpperCase();
    }

    if (req.body.makingChargeType !== undefined) {
      item.makingChargeType =
        req.body.makingChargeType.toUpperCase();
    }

    if (req.body.status !== undefined) {
      item.status = req.body.status.toUpperCase();
    }

    const grossWeight = Number(item.grossWeight);
    const stoneWeight = Number(item.stoneWeight);

    if (stoneWeight > grossWeight) {
      return res.status(400).json({
        success: false,
        message: "Stone weight cannot exceed gross weight",
      });
    }

    item.netGoldWeight = calculateNetGoldWeight(
      grossWeight,
      stoneWeight
    );

    const updatedItem = await item.save();

    return res.status(200).json({
      success: true,
      message: "Jewelry item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Update jewelry item error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid jewelry item ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid jewelry item data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update jewelry item",
      error: error.message,
    });
  }
}

// Deactivate a jewelry item
async function deactivateJewelryItem(req, res) {
  try {
    const item = await JewelryItem.findByIdAndUpdate(
      req.params.id,
      {
        status: "INACTIVE",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Jewelry item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Jewelry item deactivated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Deactivate jewelry item error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid jewelry item ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate jewelry item",
      error: error.message,
    });
  }
}

module.exports = {
  createJewelryItem,
  getJewelryItems,
  getJewelryItemById,
  updateJewelryItem,
  deactivateJewelryItem,
};