const mongoose = require("mongoose");

const JewelryItem = require(
  "../models/jewelryItem.model"
);

const {
  syncLowStockAlertForItem,
} = require(
  "../services/lowStockAlert.service"
);

function calculateNetGoldWeight(
  grossWeight,
  stoneWeight = 0
) {
  return (
    Number(grossWeight) -
    Number(stoneWeight)
  );
}

async function safelySyncLowStockAlert(
  itemId
) {
  try {
    await syncLowStockAlertForItem(
      itemId
    );
  } catch (error) {
    /*
     * Inventory creation or editing should still succeed
     * even if alert synchronization temporarily fails.
     */
    console.error(
      "Low-stock synchronization failed:",
      error
    );
  }
}

function isNonNegativeNumber(
  value
) {
  const numericValue =
    Number(value);

  return (
    Number.isFinite(numericValue) &&
    numericValue >= 0
  );
}

function isNonNegativeInteger(
  value
) {
  const numericValue =
    Number(value);

  return (
    Number.isInteger(
      numericValue
    ) &&
    numericValue >= 0
  );
}

// Create a jewelry item.
async function createJewelryItem(
  req,
  res
) {
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
      makingChargeAmount ===
        undefined ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SKU, name, category, purity, gross weight, making charge type, making charge amount, and quantity are required",
      });
    }

    const normalizedSku =
      String(sku)
        .trim()
        .toUpperCase();

    const existingItem =
      await JewelryItem.findOne({
        sku: normalizedSku,
      });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message:
          "A jewelry item with this SKU already exists",
      });
    }

    const numericGrossWeight =
      Number(grossWeight);

    const numericStoneWeight =
      Number(stoneWeight);

    const numericStoneQuantity =
      Number(stoneQuantity);

    const numericStonePrice =
      Number(stonePrice);

    const numericMakingChargeAmount =
      Number(
        makingChargeAmount
      );

    const numericPurchaseCost =
      Number(purchaseCost);

    const numericQuantity =
      Number(quantity);

    const numericMinStockLevel =
      Number(minStockLevel);

    if (
      !isNonNegativeNumber(
        numericGrossWeight
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Gross weight must be a valid non-negative number",
      });
    }

    if (
      !isNonNegativeNumber(
        numericStoneWeight
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stone weight must be a valid non-negative number",
      });
    }

    if (
      numericStoneWeight >
      numericGrossWeight
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stone weight cannot exceed gross weight",
      });
    }

    if (
      !isNonNegativeInteger(
        numericStoneQuantity
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stone quantity must be a non-negative whole number",
      });
    }

    if (
      !isNonNegativeNumber(
        numericStonePrice
      ) ||
      !isNonNegativeNumber(
        numericMakingChargeAmount
      ) ||
      !isNonNegativeNumber(
        numericPurchaseCost
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Prices and charges must be valid non-negative numbers",
      });
    }

    if (
      !isNonNegativeInteger(
        numericQuantity
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a non-negative whole number",
      });
    }

    if (
      !isNonNegativeInteger(
        numericMinStockLevel
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum stock level must be a non-negative whole number",
      });
    }

    const netGoldWeight =
      calculateNetGoldWeight(
        numericGrossWeight,
        numericStoneWeight
      );

    const item =
      await JewelryItem.create({
        sku: normalizedSku,

        name:
          String(name).trim(),

        category:
          String(category)
            .trim()
            .toUpperCase(),

        purity:
          String(purity)
            .trim()
            .toUpperCase(),

        grossWeight:
          numericGrossWeight,

        stoneWeight:
          numericStoneWeight,

        netGoldWeight,

        stoneQuantity:
          numericStoneQuantity,

        stonePrice:
          numericStonePrice,

        makingChargeType:
          String(
            makingChargeType
          )
            .trim()
            .toUpperCase(),

        makingChargeAmount:
          numericMakingChargeAmount,

        purchaseCost:
          numericPurchaseCost,

        quantity:
          numericQuantity,

        minStockLevel:
          numericMinStockLevel,

        imageUrl:
          String(
            imageUrl || ""
          ).trim(),

        supplierReference:
          String(
            supplierReference || ""
          ).trim(),

        status:
          String(status)
            .trim()
            .toUpperCase(),
      });

    /*
     * Create a low-stock alert immediately when the
     * initial quantity is at or below the minimum level.
     */
    await safelySyncLowStockAlert(
      item._id
    );

    return res.status(201).json({
      success: true,
      message:
        "Jewelry item created successfully",
      data: item,
    });
  } catch (error) {
    console.error(
      "Create jewelry item error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A jewelry item with this SKU already exists",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create jewelry item",
      error: error.message,
    });
  }
}

// List jewelry items with search and filters.
async function getJewelryItems(
  req,
  res
) {
  try {
    const {
      search,
      category,
      purity,
      status,
    } = req.query;

    const filter = {};

    if (search) {
      const normalizedSearch =
        String(search).trim();

      filter.$or = [
        {
          sku: {
            $regex:
              normalizedSearch,
            $options: "i",
          },
        },
        {
          name: {
            $regex:
              normalizedSearch,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.category =
        String(category)
          .trim()
          .toUpperCase();
    }

    if (purity) {
      filter.purity =
        String(purity)
          .trim()
          .toUpperCase();
    }

    if (status) {
      filter.status =
        String(status)
          .trim()
          .toUpperCase();
    }

    const items =
      await JewelryItem.find(
        filter
      ).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error(
      "Get jewelry items error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve jewelry items",
      error: error.message,
    });
  }
}

// Get one jewelry item.
async function getJewelryItemById(
  req,
  res
) {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

    const item =
      await JewelryItem.findById(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Jewelry item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error(
      "Get jewelry item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve jewelry item",
      error: error.message,
    });
  }
}

// Update a jewelry item.
async function updateJewelryItem(
  req,
  res
) {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

    /*
     * Quantity must be changed only through the
     * Stock Adjustment feature.
     */
    if (
      req.body.quantity !==
      undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Inventory quantity cannot be edited directly. Use Stock Adjustment.",
      });
    }

    if (
      req.body.sku !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SKU cannot be changed after an inventory item is created",
      });
    }

    const item =
      await JewelryItem.findById(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Jewelry item not found",
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
      "minStockLevel",
      "imageUrl",
      "supplierReference",
      "status",
    ];

    for (
      const field of
      allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        item[field] =
          req.body[field];
      }
    }

    if (
      req.body.name !==
      undefined
    ) {
      item.name =
        String(
          req.body.name
        ).trim();
    }

    if (
      req.body.category !==
      undefined
    ) {
      item.category =
        String(
          req.body.category
        )
          .trim()
          .toUpperCase();
    }

    if (
      req.body.purity !==
      undefined
    ) {
      item.purity =
        String(req.body.purity)
          .trim()
          .toUpperCase();
    }

    if (
      req.body.makingChargeType !==
      undefined
    ) {
      item.makingChargeType =
        String(
          req.body
            .makingChargeType
        )
          .trim()
          .toUpperCase();
    }

    if (
      req.body.status !==
      undefined
    ) {
      item.status =
        String(req.body.status)
          .trim()
          .toUpperCase();
    }

    if (
      req.body.imageUrl !==
      undefined
    ) {
      item.imageUrl =
        String(
          req.body.imageUrl || ""
        ).trim();
    }

    if (
      req.body.supplierReference !==
      undefined
    ) {
      item.supplierReference =
        String(
          req.body
            .supplierReference ||
            ""
        ).trim();
    }

    const grossWeight =
      Number(item.grossWeight);

    const stoneWeight =
      Number(item.stoneWeight);

    const stoneQuantity =
      Number(item.stoneQuantity);

    const stonePrice =
      Number(item.stonePrice);

    const makingChargeAmount =
      Number(
        item.makingChargeAmount
      );

    const purchaseCost =
      Number(item.purchaseCost);

    const minStockLevel =
      Number(item.minStockLevel);

    if (
      !isNonNegativeNumber(
        grossWeight
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Gross weight must be a valid non-negative number",
      });
    }

    if (
      !isNonNegativeNumber(
        stoneWeight
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stone weight must be a valid non-negative number",
      });
    }

    if (
      stoneWeight >
      grossWeight
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stone weight cannot exceed gross weight",
      });
    }

    if (
      !isNonNegativeInteger(
        stoneQuantity
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stone quantity must be a non-negative whole number",
      });
    }

    if (
      !isNonNegativeNumber(
        stonePrice
      ) ||
      !isNonNegativeNumber(
        makingChargeAmount
      ) ||
      !isNonNegativeNumber(
        purchaseCost
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Prices and charges must be valid non-negative numbers",
      });
    }

    if (
      !isNonNegativeInteger(
        minStockLevel
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum stock level must be a non-negative whole number",
      });
    }

    item.grossWeight =
      grossWeight;

    item.stoneWeight =
      stoneWeight;

    item.stoneQuantity =
      stoneQuantity;

    item.stonePrice =
      stonePrice;

    item.makingChargeAmount =
      makingChargeAmount;

    item.purchaseCost =
      purchaseCost;

    item.minStockLevel =
      minStockLevel;

    item.netGoldWeight =
      calculateNetGoldWeight(
        grossWeight,
        stoneWeight
      );

    const updatedItem =
      await item.save();

    /*
     * This handles changes to minStockLevel and status.
     * For example, setting an item to INACTIVE resolves
     * its unresolved low-stock alert.
     */
    await safelySyncLowStockAlert(
      updatedItem._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Jewelry item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error(
      "Update jewelry item error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update jewelry item",
      error: error.message,
    });
  }
}

// Deactivate a jewelry item.
async function deactivateJewelryItem(
  req,
  res
) {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

    const item =
      await JewelryItem.findByIdAndUpdate(
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
        message:
          "Jewelry item not found",
      });
    }

    /*
     * Inactive inventory items should not retain an
     * unresolved low-stock alert.
     */
    await safelySyncLowStockAlert(
      item._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Jewelry item deactivated successfully",
      data: item,
    });
  } catch (error) {
    console.error(
      "Deactivate jewelry item error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to deactivate jewelry item",
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