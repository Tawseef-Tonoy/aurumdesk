const mongoose = require("mongoose");

const JewelryItem = require(
  "../models/jewelryItem.model"
);

const StockAdjustment = require(
  "../models/stockAdjustment.model"
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
    return previousQuantity + adjustmentAmount;
  }

  return previousQuantity - adjustmentAmount;
}

// Create an adjustment and update inventory.
async function createStockAdjustment(req, res) {
  const session = await mongoose.startSession();

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

    const normalizedDirection =
      String(direction).toUpperCase();

    const normalizedReason =
      String(reason).toUpperCase();

    if (
      !["INCREASE", "DECREASE"].includes(
        normalizedDirection
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Direction must be INCREASE or DECREASE",
      });
    }

    const numericAmount =
      Number(adjustmentAmount);

    if (
      !Number.isInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Adjustment amount must be a positive whole number",
      });
    }

    let createdAdjustment;

    await session.withTransaction(async () => {
      const item = await JewelryItem.findById(
        jewelryItem
      ).session(session);

      if (!item) {
        const error = new Error(
          "Jewelry item not found"
        );

        error.statusCode = 404;
        throw error;
      }

      if (item.status === "INACTIVE") {
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

      item.quantity = newQuantity;

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

              jewelryItem: item._id,

              direction:
                normalizedDirection,

              adjustmentAmount:
                numericAmount,

              previousQuantity,

              newQuantity,

              reason:
                normalizedReason,

              notes,

              adjustedBy,

              requestIp:
                req.ip || "",

              userAgent:
                req.get("user-agent") ||
                "",
            },
          ],
          {
            session,
          }
        );

      createdAdjustment =
        adjustmentDocuments[0];
    });

    const populatedAdjustment =
      await StockAdjustment.findById(
        createdAdjustment._id
      ).populate(
        "jewelryItem",
        "sku name category purity quantity status"
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

    const statusCode =
      error.statusCode || 500;

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock adjustment data",
        error: error.message,
      });
    }

    return res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        "Failed to create stock adjustment",
    });
  } finally {
    await session.endSession();
  }
}

// List adjustment history.
async function getStockAdjustments(req, res) {
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
      filter.jewelryItem =
        jewelryItem;
    }

    if (direction) {
      filter.direction =
        String(direction).toUpperCase();
    }

    if (reason) {
      filter.reason =
        String(reason).toUpperCase();
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        filter.createdAt.$gte =
          new Date(dateFrom);
      }

      if (dateTo) {
        const endDate =
          new Date(dateTo);

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

    let itemIds;

    if (search) {
      const matchingItems =
        await JewelryItem.find({
          $or: [
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
          ],
        }).select("_id");

      itemIds = matchingItems.map(
        (item) => item._id
      );

      filter.jewelryItem = {
        $in: itemIds,
      };
    }

    const adjustments =
      await StockAdjustment.find(
        filter
      )
        .populate(
          "jewelryItem",
          "sku name category purity quantity status"
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

// Get one audit record.
async function getStockAdjustmentById(
  req,
  res
) {
  try {
    const adjustment =
      await StockAdjustment.findById(
        req.params.id
      ).populate(
        "jewelryItem",
        "sku name category purity quantity status"
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

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock adjustment ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve stock adjustment",
      error: error.message,
    });
  }
}

// Get history for one inventory item.
async function getItemStockAdjustments(
  req,
  res
) {
  try {
    const item =
      await JewelryItem.findById(
        req.params.itemId
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
          "sku name category purity quantity status"
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
        quantity:
          item.quantity,
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

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid jewelry item ID",
      });
    }

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
