const GoldRate = require("../models/goldRate.model");

// Create a new gold rate
async function createGoldRate(req, res) {
  try {
    const {
      purity,
      ratePerGram,
      effectiveDate,
      isActive = true,
    } = req.body;

    if (!purity || ratePerGram === undefined || !effectiveDate) {
      return res.status(400).json({
        success: false,
        message: "Purity, rate per gram, and effective date are required",
      });
    }

    const numericRate = Number(ratePerGram);

    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Gold rate must be greater than zero",
      });
    }

    const normalizedPurity = String(purity).trim().toUpperCase();

    // If this new rate is active, deactivate the previous rate
    // for the same purity.
    if (isActive === true) {
      await GoldRate.updateMany(
        {
          purity: normalizedPurity,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        }
      );
    }

    const goldRate = await GoldRate.create({
      purity: normalizedPurity,
      ratePerGram: numericRate,
      effectiveDate,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Gold rate created successfully",
      data: goldRate,
    });
  } catch (error) {
    console.error("Create gold rate error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gold rate data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create gold rate",
      error: error.message,
    });
  }
}

// Get all gold rates
async function getGoldRates(req, res) {
  try {
    const { purity, isActive } = req.query;

    const filter = {};

    if (purity) {
      filter.purity = String(purity).trim().toUpperCase();
    }

    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = isActive === "true";
    }

    const goldRates = await GoldRate.find(filter).sort({
      effectiveDate: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: goldRates.length,
      data: goldRates,
    });
  } catch (error) {
    console.error("Get gold rates error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve gold rates",
      error: error.message,
    });
  }
}

// Get active gold rates
async function getActiveGoldRates(req, res) {
  try {
    const { purity } = req.query;

    const filter = {
      isActive: true,
    };

    if (purity) {
      filter.purity = String(purity).trim().toUpperCase();
    }

    const goldRates = await GoldRate.find(filter).sort({
      purity: 1,
    });

    return res.status(200).json({
      success: true,
      count: goldRates.length,
      data: goldRates,
    });
  } catch (error) {
    console.error("Get active gold rates error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve active gold rates",
      error: error.message,
    });
  }
}

// Get one gold rate by MongoDB ID
async function getGoldRateById(req, res) {
  try {
    const goldRate = await GoldRate.findById(req.params.id);

    if (!goldRate) {
      return res.status(404).json({
        success: false,
        message: "Gold rate not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: goldRate,
    });
  } catch (error) {
    console.error("Get gold rate error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gold rate ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve gold rate",
      error: error.message,
    });
  }
}

// Update a gold rate
async function updateGoldRate(req, res) {
  try {
    const goldRate = await GoldRate.findById(req.params.id);

    if (!goldRate) {
      return res.status(404).json({
        success: false,
        message: "Gold rate not found",
      });
    }

    const { purity, ratePerGram, effectiveDate, isActive } = req.body;

    if (purity !== undefined) {
      goldRate.purity = String(purity).trim().toUpperCase();
    }

    if (ratePerGram !== undefined) {
      const numericRate = Number(ratePerGram);

      if (!Number.isFinite(numericRate) || numericRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Gold rate must be greater than zero",
        });
      }

      goldRate.ratePerGram = numericRate;
    }

    if (effectiveDate !== undefined) {
      goldRate.effectiveDate = effectiveDate;
    }

    if (isActive !== undefined) {
      goldRate.isActive = isActive;
    }

    // Deactivate other active rates of the same purity.
    if (goldRate.isActive === true) {
      await GoldRate.updateMany(
        {
          _id: {
            $ne: goldRate._id,
          },
          purity: goldRate.purity,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        }
      );
    }

    await goldRate.save();

    return res.status(200).json({
      success: true,
      message: "Gold rate updated successfully",
      data: goldRate,
    });
  } catch (error) {
    console.error("Update gold rate error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gold rate ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gold rate data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update gold rate",
      error: error.message,
    });
  }
}

// Activate a selected gold rate
async function activateGoldRate(req, res) {
  try {
    const goldRate = await GoldRate.findById(req.params.id);

    if (!goldRate) {
      return res.status(404).json({
        success: false,
        message: "Gold rate not found",
      });
    }

    await GoldRate.updateMany(
      {
        _id: {
          $ne: goldRate._id,
        },
        purity: goldRate.purity,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

    goldRate.isActive = true;

    await goldRate.save();

    return res.status(200).json({
      success: true,
      message: "Gold rate activated successfully",
      data: goldRate,
    });
  } catch (error) {
    console.error("Activate gold rate error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gold rate ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to activate gold rate",
      error: error.message,
    });
  }
}

// Deactivate a gold rate
async function deactivateGoldRate(req, res) {
  try {
    const goldRate = await GoldRate.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!goldRate) {
      return res.status(404).json({
        success: false,
        message: "Gold rate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gold rate deactivated successfully",
      data: goldRate,
    });
  } catch (error) {
    console.error("Deactivate gold rate error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gold rate ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate gold rate",
      error: error.message,
    });
  }
}

module.exports = {
  createGoldRate,
  getGoldRates,
  getActiveGoldRates,
  getGoldRateById,
  updateGoldRate,
  activateGoldRate,
  deactivateGoldRate,
};