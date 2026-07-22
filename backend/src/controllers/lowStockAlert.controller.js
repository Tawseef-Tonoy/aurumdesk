const LowStockAlert = require(
  "../models/lowStockAlert.model"
);

const JewelryItem = require(
  "../models/jewelryItem.model"
);

const {
  syncLowStockAlertForItem,
  syncAllLowStockAlerts,
} = require(
  "../services/lowStockAlert.service"
);

async function getLowStockAlerts(
  req,
  res
) {
  try {
    const {
      search,
      status,
      category,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status =
        String(status).toUpperCase();
    }

    if (search || category) {
      const itemFilter = {};

      if (search) {
        itemFilter.$or = [
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
        itemFilter.category =
          String(category).toUpperCase();
      }

      const matchingItems =
        await JewelryItem.find(
          itemFilter
        ).select("_id");

      filter.jewelryItem = {
        $in: matchingItems.map(
          (item) => item._id
        ),
      };
    }

    const alerts =
      await LowStockAlert.find(filter)
        .populate(
          "jewelryItem",
          [
            "sku",
            "name",
            "category",
            "purity",
            "quantity",
            "minStockLevel",
            "supplierReference",
            "status",
          ].join(" ")
        )
        .sort({
          status: 1,
          lastTriggeredAt: -1,
        });

    const unresolvedCount =
      await LowStockAlert.countDocuments({
        status: {
          $in: [
            "NEW",
            "VIEWED",
            "REORDER_PLANNED",
          ],
        },
      });

    const newCount =
      await LowStockAlert.countDocuments({
        status: "NEW",
      });

    return res.status(200).json({
      success: true,

      count: alerts.length,

      summary: {
        unresolved:
          unresolvedCount,

        new: newCount,
      },

      data: alerts,
    });
  } catch (error) {
    console.error(
      "Get low stock alerts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve low stock alerts",
      error: error.message,
    });
  }
}

async function getLowStockAlertById(
  req,
  res
) {
  try {
    const alert =
      await LowStockAlert.findById(
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
          "supplierReference",
          "status",
          "imageUrl",
        ].join(" ")
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message:
          "Low-stock alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error(
      "Get low stock alert error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid low-stock alert ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve low-stock alert",
      error: error.message,
    });
  }
}

async function markAlertViewed(
  req,
  res
) {
  try {
    const alert =
      await LowStockAlert.findById(
        req.params.id
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message:
          "Low-stock alert not found",
      });
    }

    if (
      alert.status ===
      "RESOLVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A resolved alert cannot be marked as viewed",
      });
    }

    alert.status = "VIEWED";
    alert.viewedAt = new Date();

    await alert.save();

    const populatedAlert =
      await LowStockAlert.findById(
        alert._id
      ).populate(
        "jewelryItem",
        "sku name category quantity minStockLevel status"
      );

    return res.status(200).json({
      success: true,
      message:
        "Alert marked as viewed",
      data: populatedAlert,
    });
  } catch (error) {
    console.error(
      "Mark alert viewed error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update the alert",
      error: error.message,
    });
  }
}

async function markReorderPlanned(
  req,
  res
) {
  try {
    const alert =
      await LowStockAlert.findById(
        req.params.id
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message:
          "Low-stock alert not found",
      });
    }

    if (
      alert.status ===
      "RESOLVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A resolved alert cannot be changed",
      });
    }

    alert.status =
      "REORDER_PLANNED";

    alert.reorderPlannedAt =
      new Date();

    if (
      req.body.notes !== undefined
    ) {
      alert.notes =
        String(req.body.notes).trim();
    }

    await alert.save();

    const populatedAlert =
      await LowStockAlert.findById(
        alert._id
      ).populate(
        "jewelryItem",
        "sku name category quantity minStockLevel status"
      );

    return res.status(200).json({
      success: true,
      message:
        "Reorder marked as planned",
      data: populatedAlert,
    });
  } catch (error) {
    console.error(
      "Mark reorder planned error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update the alert",
      error: error.message,
    });
  }
}

async function resolveAlert(
  req,
  res
) {
  try {
    const alert =
      await LowStockAlert.findById(
        req.params.id
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message:
          "Low-stock alert not found",
      });
    }

    alert.status =
      "RESOLVED";

    alert.resolvedAt =
      new Date();

    if (
      req.body.notes !== undefined
    ) {
      alert.notes =
        String(req.body.notes).trim();
    }

    await alert.save();

    const populatedAlert =
      await LowStockAlert.findById(
        alert._id
      ).populate(
        "jewelryItem",
        "sku name category quantity minStockLevel status"
      );

    return res.status(200).json({
      success: true,
      message:
        "Low-stock alert resolved",
      data: populatedAlert,
    });
  } catch (error) {
    console.error(
      "Resolve low stock alert error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to resolve the alert",
      error: error.message,
    });
  }
}

async function syncOneAlert(
  req,
  res
) {
  try {
    const result =
      await syncLowStockAlertForItem(
        req.params.itemId
      );

    if (
      result.action ===
      "ITEM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Jewelry item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Low-stock status synchronized",
      action: result.action,
      data: result.alert,
    });
  } catch (error) {
    console.error(
      "Sync low stock alert error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to synchronize low-stock alert",
      error: error.message,
    });
  }
}

async function syncAllAlerts(
  req,
  res
) {
  try {
    const results =
      await syncAllLowStockAlerts();

    const summary =
      results.reduce(
        (counts, result) => {
          const action =
            result.action;

          counts[action] =
            (counts[action] || 0) +
            1;

          return counts;
        },
        {}
      );

    return res.status(200).json({
      success: true,
      message:
        "All inventory items synchronized",
      summary,
      data: results,
    });
  } catch (error) {
    console.error(
      "Sync all low stock alerts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to synchronize low-stock alerts",
      error: error.message,
    });
  }
}

module.exports = {
  getLowStockAlerts,
  getLowStockAlertById,
  markAlertViewed,
  markReorderPlanned,
  resolveAlert,
  syncOneAlert,
  syncAllAlerts,
};
