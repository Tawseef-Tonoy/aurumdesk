const Customer = require("../models/customer.model");

// Create a new customer
async function createCustomer(req, res) {
  try {
    // Data sent by the client is available inside req.body
    const {
      customerId,
      name,
      phone,
      alternativePhone,
      email,
      address,
      nid,
      occupation,
      monthlyIncome,
    } = req.body;

    // Basic required-field validation
    if (!customerId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, name, and phone are required",
      });
    }

    // Check whether the customer ID already exists
    const existingCustomer = await Customer.findOne({ customerId });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "A customer with this customer ID already exists",
      });
    }

    // Create and save the customer in MongoDB
    const customer = await Customer.create({
      customerId,
      name,
      phone,
      alternativePhone,
      email,
      address,
      nid,
      occupation,
      monthlyIncome,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
}



// Get all customers
// Get customers with optional search and status filtering
async function getCustomers(req, res) {
  try {
    const { search, status } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { customerId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status.toUpperCase();
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
      error: error.message,
    });
  }
}



// Get one customer by MongoDB document ID
async function getCustomerById(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get customer by ID error:", error);

    // This happens when the provided ID is not a valid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer",
      error: error.message,
    });
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
};


// Update a customer
async function updateCustomer(req, res) {
  try {
    const allowedFields = [
      "name",
      "phone",
      "alternativePhone",
      "email",
      "address",
      "nid",
      "occupation",
      "monthlyIncome",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
}

// Deactivate a customer
async function deactivateCustomer(req, res) {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: "INACTIVE" },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deactivated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Deactivate customer error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate customer",
      error: error.message,
    });
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
};