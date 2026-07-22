const mongoose = require("mongoose");

const JewelryItem = require(
  "../models/jewelryItem.model"
);

const StockAdjustment = require(
  "../models/stockAdjustment.model"
);

const {
  syncLowStockAlertForItem,
} = require(
  "../services/lowStockAlert.service"
);

function generateAdjustmentId() {
  const timestamp = Date.now();

  const randomPart = Math.floor(
    1000 + Math.random() * 9000
  );

  return `ADJ-${timestamp}-${randomPart}`;
}

function calculateNewQuantity(
  previousQuantity,
  direction,
  adjustmentAmount
) {
  if (direction === "INCREASE") {
    return (
      previousQuantity +
      adjustmentAmount
    );
  }

  return (
    previousQuantity -
    adjustmentAmount
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
    console.error(
      "Low-stock synchronization failed:",
      error
    );
  }
}

// Create a stock adjustment and update inventory.
async function createStockAdjustment(
  req,
  res
) {
  const session =
    await mongoose.startSession();

  try {
    const {
      jewelryItem,
      direction,
      adjustmentAmount,
      reason,
      notes = "",
      adjustedBy = "SYSTEM",
    } = req.body;

    if (
      !jewelryItem ||
      !direction ||
      adjustmentAmount === undefined ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Jewelry item, direction, adjustment amount, and reason are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        jewelryItem
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

    const normalizedDirection =
      String(direction)
        .trim()
        .toUpperCase();

    const normalizedReason =
      String(reason)
        .trim()
        .toUpperCase();

    const allowedDirections = [
      "INCREASE",
      "DECREASE",
    ];

    const allowedReasons = [
      "PHYSICAL_COUNT_CORRECTION",
      "DAMAGED_ITEM",
      "LOST_ITEM",
      "FOUND_ITEM",
      "DATA_ENTRY_CORRECTION",
      "SUPPLIER_CORRECTION",
      "RETURN_OR_REPAIR",
      "OTHER",
    ];

    if (
      !allowedDirections.includes(
        normalizedDirection
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Direction must be INCREASE or DECREASE",
      });
    }

    if (
      !allowedReasons.includes(
        normalizedReason
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock adjustment reason",
      });
    }

    const numericAmount =
      Number(adjustmentAmount);

    if (
      !Number.isInteger(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Adjustment amount must be a positive whole number",
      });
    }

    let createdAdjustment;

    await session.withTransaction(
      async () => {
        const item =
          await JewelryItem.findById(
            jewelryItem
          ).session(session);

        if (!item) {
          const error = new Error(
            "Jewelry item not found"
          );

          error.statusCode = 404;

          throw error;
        }

        if (
          item.status ===
          "INACTIVE"
        ) {
          const error = new Error(
            "Inactive inventory items cannot be adjusted"
          );

          error.statusCode = 400;

          throw error;
        }

        const previousQuantity =
          Number(item.quantity);

        const newQuantity =
          calculateNewQuantity(
            previousQuantity,
            normalizedDirection,
            numericAmount
          );

        if (newQuantity < 0) {
          const error = new Error(
            `Stock cannot become negative. Current quantity is ${previousQuantity}.`
          );

          error.statusCode = 400;

          throw error;
        }

        item.quantity =
          newQuantity;

        await item.save({
          session,
          validateBeforeSave: true,
        });

        const adjustmentDocuments =
          await StockAdjustment.create(
            [
              {
                adjustmentId:
                  generateAdjustmentId(),

                jewelryItem:
                  item._id,

                direction:
                  normalizedDirection,

                adjustmentAmount:
                  numericAmount,

                previousQuantity,

                newQuantity,

                reason:
                  normalizedReason,

                notes:
                  String(
                    notes || ""
                  ).trim(),

                adjustedBy:
                  String(
                    adjustedBy ||
                      "SYSTEM"
                  ).trim(),

                requestIp:
                  req.ip || "",

                userAgent:
                  req.get(
                    "user-agent"
                  ) || "",
              },
            ],
            {
              session,
            }
          );

        createdAdjustment =
          adjustmentDocuments[0];
      }
    );

    /*
     * Synchronize the low-stock alert only after
     * the stock transaction has committed.
     */
    await safelySyncLowStockAlert(
      createdAdjustment.jewelryItem
    );

    const populatedAdjustment =
      await StockAdjustment.findById(
        createdAdjustment._id
      ).populate(
        "jewelryItem",
        [
          "sku",
          "name",
          "category",
          "purity",
          "quantity",
          "minStockLevel",
          "status",
        ].join(" ")
      );

    return res.status(201).json({
      success: true,
      message:
        "Stock adjustment completed successfully",
      data: populatedAdjustment,
    });
  } catch (error) {
    console.error(
      "Create stock adjustment error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock adjustment data",
        error: error.message,
      });
    }

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate stock adjustment ID. Please try again.",
      });
    }

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Failed to create stock adjustment",
      });
  } finally {
    await session.endSession();
  }
}

// List stock adjustment history.
async function getStockAdjustments(
  req,
  res
) {
  try {
    const {
      search,
      jewelryItem,
      direction,
      reason,
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {};

    if (jewelryItem) {
      if (
        !mongoose.Types.ObjectId.isValid(
          jewelryItem
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid jewelry item ID",
        });
      }

      filter.jewelryItem =
        jewelryItem;
    }

    if (direction) {
      filter.direction =
        String(direction)
          .trim()
          .toUpperCase();
    }

    if (reason) {
      filter.reason =
        String(reason)
          .trim()
          .toUpperCase();
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        const startDate =
          new Date(dateFrom);

        if (
          Number.isNaN(
            startDate.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid start date",
            });
        }

        startDate.setHours(
          0,
          0,
          0,
          0
        );

        filter.createdAt.$gte =
          startDate;
      }

      if (dateTo) {
        const endDate =
          new Date(dateTo);

        if (
          Number.isNaN(
            endDate.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid end date",
            });
        }

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        filter.createdAt.$lte =
          endDate;
      }
    }

    if (search) {
      const matchingItems =
        await JewelryItem.find({
          $or: [
            {
              sku: {
                $regex:
                  String(search).trim(),
                $options: "i",
              },
            },
            {
              name: {
                $regex:
                  String(search).trim(),
                $options: "i",
              },
            },
          ],
        }).select("_id");

      filter.jewelryItem = {
        $in: matchingItems.map(
          (item) => item._id
        ),
      };
    }

    const adjustments =
      await StockAdjustment.find(
        filter
      )
        .populate(
          "jewelryItem",
          [
            "sku",
            "name",
            "category",
            "purity",
            "quantity",
            "minStockLevel",
            "status",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count:
        adjustments.length,
      data: adjustments,
    });
  } catch (error) {
    console.error(
      "Get stock adjustments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve stock adjustments",
      error: error.message,
    });
  }
}

// Get one stock adjustment.
async function getStockAdjustmentById(
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
          "Invalid stock adjustment ID",
      });
    }

    const adjustment =
      await StockAdjustment.findById(
        req.params.id
      ).populate(
        "jewelryItem",
        [
          "sku",
          "name",
          "category",
          "purity",
          "quantity",
          "minStockLevel",
          "status",
        ].join(" ")
      );

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message:
          "Stock adjustment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    console.error(
      "Get stock adjustment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve stock adjustment",
      error: error.message,
    });
  }
}

// Get adjustment history for one inventory item.
async function getItemStockAdjustments(
  req,
  res
) {
  try {
    const { itemId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        itemId
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
        itemId
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Jewelry item not found",
      });
    }

    const adjustments =
      await StockAdjustment.find({
        jewelryItem: item._id,
      })
        .populate(
          "jewelryItem",
          [
            "sku",
            "name",
            "category",
            "purity",
            "quantity",
            "minStockLevel",
            "status",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      item: {
        _id: item._id,
        sku: item.sku,
        name: item.name,
        category:
          item.category,
        quantity:
          item.quantity,
        minStockLevel:
          item.minStockLevel,
        status:
          item.status,
      },

      count:
        adjustments.length,

      data: adjustments,
    });
  } catch (error) {
    console.error(
      "Get item stock history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve item stock history",
      error: error.message,
    });
  }
}

module.exports = {
  createStockAdjustment,
  getStockAdjustments,
  getStockAdjustmentById,
  getItemStockAdjustments,
};