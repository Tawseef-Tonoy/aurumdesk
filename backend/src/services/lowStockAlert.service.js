const JewelryItem = require(
  "../models/jewelryItem.model"
);

const LowStockAlert = require(
  "../models/lowStockAlert.model"
);

const unresolvedStatuses = [
  "NEW",
  "VIEWED",
  "REORDER_PLANNED",
];

function calculateSuggestedReorderQuantity(
  quantity,
  minStockLevel
) {
  const targetQuantity =
    Math.max(minStockLevel * 2, 1);

  return Math.max(
    targetQuantity - quantity,
    1
  );
}

async function syncLowStockAlertForItem(
  itemId
) {
  const item =
    await JewelryItem.findById(itemId);

  if (!item) {
    return {
      action: "ITEM_NOT_FOUND",
      alert: null,
    };
  }

  const unresolvedAlert =
    await LowStockAlert.findOne({
      jewelryItem: item._id,
      status: {
        $in: unresolvedStatuses,
      },
    });

  const isActive =
    item.status !== "INACTIVE";

  const isLowStock =
    Number(item.quantity) <=
    Number(item.minStockLevel);

  /*
   * An inactive product or a product above its
   * minimum level should not have an unresolved alert.
   */
  if (!isActive || !isLowStock) {
    if (!unresolvedAlert) {
      return {
        action: "NO_CHANGE",
        alert: null,
      };
    }

    unresolvedAlert.status =
      "RESOLVED";

    unresolvedAlert.currentQuantity =
      item.quantity;

    unresolvedAlert.minStockLevel =
      item.minStockLevel;

    unresolvedAlert.resolvedAt =
      new Date();

    await unresolvedAlert.save();

    return {
      action: "RESOLVED",
      alert: unresolvedAlert,
    };
  }

  const suggestedReorderQuantity =
    calculateSuggestedReorderQuantity(
      Number(item.quantity),
      Number(item.minStockLevel)
    );

  /*
   * Update the existing unresolved alert rather than
   * creating duplicate alerts for the same product.
   */
  if (unresolvedAlert) {
    unresolvedAlert.currentQuantity =
      item.quantity;

    unresolvedAlert.minStockLevel =
      item.minStockLevel;

    unresolvedAlert.suggestedReorderQuantity =
      suggestedReorderQuantity;

    unresolvedAlert.lastTriggeredAt =
      new Date();

    await unresolvedAlert.save();

    return {
      action: "UPDATED",
      alert: unresolvedAlert,
    };
  }

  const alert =
    await LowStockAlert.create({
      jewelryItem: item._id,

      currentQuantity:
        item.quantity,

      minStockLevel:
        item.minStockLevel,

      suggestedReorderQuantity,

      status: "NEW",

      firstTriggeredAt:
        new Date(),

      lastTriggeredAt:
        new Date(),
    });

  return {
    action: "CREATED",
    alert,
  };
}

async function syncAllLowStockAlerts() {
  const items =
    await JewelryItem.find({});

  const results = [];

  for (const item of items) {
    const result =
      await syncLowStockAlertForItem(
        item._id
      );

    results.push({
      jewelryItem: item._id,
      sku: item.sku,
      name: item.name,
      action: result.action,
    });
  }

  return results;
}

module.exports = {
  unresolvedStatuses,
  calculateSuggestedReorderQuantity,
  syncLowStockAlertForItem,
  syncAllLowStockAlerts,
};
