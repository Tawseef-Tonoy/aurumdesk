const mongoose = require("mongoose");

const {
  createEMIServiceChargeEntry
}=require(
  "../services/ledger.service"
);

const EMIPlan = require(
  "../models/emiPlan.model"
);

const EMIInstallment = require(
  "../models/emiInstallment.model"
);

const Customer = require(
  "../models/customer.model"
);

const Sale = require(
  "../models/sale.model"
);

const {
  calculateEMIValues,
  generateInstallmentSchedule,
} = require(
  "../services/emiPlan.service"
);

function generatePlanNo() {
  const random =
    Math.floor(1000 + Math.random() * 9000);

  return `EMI-${Date.now()}-${random}`;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getSaleCustomerId(sale) {
  return (
    sale?.customer?._id ||
    sale?.customer ||
    null
  );
}

function getSaleDueAmount(sale) {
  if (
    sale.dueAmount !== undefined &&
    sale.dueAmount !== null
  ) {
    return Number(sale.dueAmount);
  }

  return (
    Number(sale.totalAmount || 0) -
    Number(sale.paidAmount || 0)
  );
}

async function validateCustomerAndSale(
  customerId,
  saleId,
  currentPlanId = null
) {
  if (!isValidObjectId(customerId)) {
    throw Object.assign(
      new Error("Invalid customer ID"),
      { statusCode: 400 }
    );
  }

  if (!isValidObjectId(saleId)) {
    throw Object.assign(
      new Error("Invalid sale ID"),
      { statusCode: 400 }
    );
  }

  const customer =
    await Customer.findById(customerId);

  if (!customer) {
    throw Object.assign(
      new Error("Customer not found"),
      { statusCode: 404 }
    );
  }

  if (
    String(customer.status || "").toUpperCase() ===
    "INACTIVE"
  ) {
    throw Object.assign(
      new Error(
        "Inactive customers cannot receive a new EMI plan"
      ),
      { statusCode: 400 }
    );
  }

  const sale = await Sale.findById(saleId);

  if (!sale) {
    throw Object.assign(
      new Error("Sale not found"),
      { statusCode: 404 }
    );
  }

  const saleCustomerId =
    getSaleCustomerId(sale);

  if (!saleCustomerId) {
    throw Object.assign(
      new Error(
        "The selected sale is not linked to a customer"
      ),
      { statusCode: 400 }
    );
  }

  if (
    String(saleCustomerId) !==
    String(customer._id)
  ) {
    throw Object.assign(
      new Error(
        "The selected sale does not belong to the selected customer"
      ),
      { statusCode: 400 }
    );
  }

  if (
    String(
      sale.status || ""
    ).toUpperCase() !== "CONFIRMED"
  ) {
    throw Object.assign(
      new Error(
        "Only confirmed sales are eligible for EMI"
      ),
      { statusCode: 400 }
    );
  }

  const dueAmount =
    getSaleDueAmount(sale);

  if (
    !Number.isFinite(dueAmount) ||
    dueAmount <= 0
  ) {
    throw Object.assign(
      new Error(
        "This sale has no outstanding amount for EMI"
      ),
      { statusCode: 400 }
    );
  }

  const existingFilter = {
    sale: sale._id,

    status: {
      $nin: [
        "REJECTED",
        "CANCELLED",
      ],
    },
  };

  if (currentPlanId) {
    existingFilter._id = {
      $ne: currentPlanId,
    };
  }

  const existingPlan =
    await EMIPlan.findOne(
      existingFilter
    );

  if (existingPlan) {
    throw Object.assign(
      new Error(
        "An active EMI plan already exists for this sale"
      ),
      { statusCode: 409 }
    );
  }

  return {
    customer,
    sale,
    dueAmount,
  };
}

function validateFirstDueDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw Object.assign(
      new Error("Invalid first due date"),
      { statusCode: 400 }
    );
  }

  return date;
}

function normalizeFrequency(value) {
  const frequency = String(
    value || "MONTHLY"
  ).toUpperCase();

  const allowed = [
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
  ];

  if (!allowed.includes(frequency)) {
    throw Object.assign(
      new Error(
        "Frequency must be WEEKLY, BIWEEKLY, or MONTHLY"
      ),
      { statusCode: 400 }
    );
  }

  return frequency;
}

async function createEMIPlan(req, res) {
  try {
    const {
      customer,
      sale,
    } = req.body;

    if (!customer || !sale) {
      return res.status(400).json({
        success: false,
        message:
          "Customer and sale are required",
      });
    }

    const validation =
      await validateCustomerAndSale(
        customer,
        sale
      );

    const saleDocument =
      validation.sale;

    const frequency =
      normalizeFrequency(
        req.body.frequency
      );

    const firstDueDate =
      validateFirstDueDate(
        req.body.firstDueDate
      );

    /*
      In AurumDesk, payment already recorded
      against the sale is treated as the
      current down payment.

      Example:
      Sale total = 159000
      Sale paid  = 100000
      EMI financed = 59000
    */
    const downPayment =
      Number(
        saleDocument.paidAmount || 0
      );

    const calculations =
      calculateEMIValues({
        totalSaleAmount:
          saleDocument.totalAmount,

        downPayment,

        serviceCharge:
          Number(
            req.body.serviceCharge || 0
          ),

        installmentCount:
          Number(
            req.body.installmentCount
          ),
      });

    const plan =
      await EMIPlan.create({
        planNo: generatePlanNo(),

        customer:
          saleDocument.customer,

        sale:
          saleDocument._id,

        ...calculations,

        frequency,

        firstDueDate,

        gracePeriodDays:
          Number(
            req.body.gracePeriodDays || 0
          ),

        referenceName:
          String(
            req.body.referenceName || ""
          ).trim(),

        referencePhone:
          String(
            req.body.referencePhone || ""
          ).trim(),

        guarantorName:
          String(
            req.body.guarantorName || ""
          ).trim(),

        guarantorPhone:
          String(
            req.body.guarantorPhone || ""
          ).trim(),

        notes:
          String(
            req.body.notes || ""
          ).trim(),

        preparedBy:
          String(
            req.body.preparedBy ||
              "SYSTEM"
          ).trim(),

        status: "DRAFT",
      });

    const populatedPlan =
      await EMIPlan.findById(
        plan._id
      )
        .populate(
          "customer",
          "customerId name phone email monthlyIncome status"
        )
        .populate(
          "sale",
          "invoiceNumber saleDate totalAmount paidAmount dueAmount paymentMethod status"
        );

    return res.status(201).json({
      success: true,
      message:
        "EMI plan created successfully",
      data: populatedPlan,
    });
  } catch (error) {
    console.error(
      "Create EMI plan error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid EMI plan data",
        error: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate EMI plan. Please try again.",
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
          "Failed to create EMI plan",
      });
  }
}

async function getEMIPlans(req, res) {
  try {
    const {
      search,
      status,
      customer,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status =
        String(status)
          .trim()
          .toUpperCase();
    }

    if (
      customer &&
      isValidObjectId(customer)
    ) {
      filter.customer = customer;
    }

    if (search) {
      const searchValue =
        String(search).trim();

      const matchingCustomers =
        await Customer.find({
          $or: [
            {
              name: {
                $regex: searchValue,
                $options: "i",
              },
            },
            {
              phone: {
                $regex: searchValue,
                $options: "i",
              },
            },
            {
              customerId: {
                $regex: searchValue,
                $options: "i",
              },
            },
          ],
        }).select("_id");

      const matchingSales =
        await Sale.find({
          invoiceNumber: {
            $regex: searchValue,
            $options: "i",
          },
        }).select("_id");

      filter.$or = [
        {
          planNo: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          customer: {
            $in:
              matchingCustomers.map(
                (entry) =>
                  entry._id
              ),
          },
        },

        {
          sale: {
            $in:
              matchingSales.map(
                (entry) =>
                  entry._id
              ),
          },
        },
      ];
    }

    const plans =
      await EMIPlan.find(filter)
        .populate(
          "customer",
          "customerId name phone status"
        )
        .populate(
          "sale",
          "invoiceNumber saleDate totalAmount paidAmount dueAmount status"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error(
      "Get EMI plans error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve EMI plans",
      error: error.message,
    });
  }
}

async function getEMIPlanById(req, res) {
  try {
    if (
      !isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid EMI plan ID",
      });
    }

    const plan =
      await EMIPlan.findById(
        req.params.id
      )
        .populate(
          "customer",
          "customerId name phone email occupation monthlyIncome status"
        )
        .populate(
          "sale",
          "invoiceNumber saleDate totalAmount paidAmount dueAmount paymentMethod status"
        );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    const installments =
      await EMIInstallment.find({
        emiPlan: plan._id,
      }).sort({
        installmentNo: 1,
      });

    return res.status(200).json({
      success: true,
      data: plan,
      installments,
    });
  } catch (error) {
    console.error(
      "Get EMI plan error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve EMI plan",
      error: error.message,
    });
  }
}

async function updateEMIPlan(req, res) {
  try {
    if (
      !isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid EMI plan ID",
      });
    }

    const plan =
      await EMIPlan.findById(
        req.params.id
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    if (
      ![
        "DRAFT",
        "REVISION_REQUIRED",
      ].includes(plan.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only draft or revision-required EMI plans can be edited",
      });
    }

    const customerId =
      req.body.customer ||
      plan.customer;

    const saleId =
      req.body.sale ||
      plan.sale;

    const validation =
      await validateCustomerAndSale(
        customerId,
        saleId,
        plan._id
      );

    const saleDocument =
      validation.sale;

    const frequency =
      normalizeFrequency(
        req.body.frequency ||
          plan.frequency
      );

    const firstDueDate =
      validateFirstDueDate(
        req.body.firstDueDate ||
          plan.firstDueDate
      );

    const downPayment =
      Number(
        saleDocument.paidAmount || 0
      );

    const calculations =
      calculateEMIValues({
        totalSaleAmount:
          saleDocument.totalAmount,

        downPayment,

        serviceCharge:
          req.body.serviceCharge !==
          undefined
            ? Number(
                req.body.serviceCharge
              )
            : plan.serviceCharge,

        installmentCount:
          req.body.installmentCount !==
          undefined
            ? Number(
                req.body.installmentCount
              )
            : plan.installmentCount,
      });

    plan.customer =
      saleDocument.customer;

    plan.sale =
      saleDocument._id;

    Object.assign(
      plan,
      calculations
    );

    plan.frequency =
      frequency;

    plan.firstDueDate =
      firstDueDate;

    plan.gracePeriodDays =
      req.body.gracePeriodDays !==
      undefined
        ? Number(
            req.body.gracePeriodDays
          )
        : plan.gracePeriodDays;

    plan.referenceName =
      req.body.referenceName !==
      undefined
        ? String(
            req.body.referenceName
          ).trim()
        : plan.referenceName;

    plan.referencePhone =
      req.body.referencePhone !==
      undefined
        ? String(
            req.body.referencePhone
          ).trim()
        : plan.referencePhone;

    plan.guarantorName =
      req.body.guarantorName !==
      undefined
        ? String(
            req.body.guarantorName
          ).trim()
        : plan.guarantorName;

    plan.guarantorPhone =
      req.body.guarantorPhone !==
      undefined
        ? String(
            req.body.guarantorPhone
          ).trim()
        : plan.guarantorPhone;

    plan.notes =
      req.body.notes !== undefined
        ? String(
            req.body.notes
          ).trim()
        : plan.notes;

    plan.preparedBy =
      req.body.preparedBy !==
      undefined
        ? String(
            req.body.preparedBy
          ).trim()
        : plan.preparedBy;

    await plan.save();

    const populated =
      await EMIPlan.findById(
        plan._id
      )
        .populate(
          "customer",
          "customerId name phone status"
        )
        .populate(
          "sale",
          "invoiceNumber saleDate totalAmount paidAmount dueAmount status"
        );

    return res.status(200).json({
      success: true,
      message:
        "EMI plan updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error(
      "Update EMI plan error:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Failed to update EMI plan",
      });
  }
}

async function submitEMIPlan(req, res) {
  try {
    const plan =
      await EMIPlan.findById(
        req.params.id
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    if (
      ![
        "DRAFT",
        "REVISION_REQUIRED",
      ].includes(plan.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only draft or revision-required plans can be submitted",
      });
    }

    plan.status =
      "PENDING_APPROVAL";

    plan.revisionReason = "";

    await plan.save();

    return res.status(200).json({
      success: true,
      message:
        "EMI plan submitted for approval",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to submit EMI plan",
      error: error.message,
    });
  }
}

async function approveEMIPlan(
  req,
  res
){
  const session=
    await mongoose.startSession();

  try{
    let approvedPlan;
    let installments=[];
    let ledgerEntry=null;

    await session.withTransaction(
      async()=>{
        const plan=
          await EMIPlan.findById(
            req.params.id
          ).session(session);

        if(!plan){
          throw Object.assign(
            new Error(
              "EMI plan not found"
            ),
            {
              statusCode:404
            }
          );
        }

        if(
          plan.status!==
          "PENDING_APPROVAL"
        ){
          throw Object.assign(
            new Error(
              "Only plans pending approval can be approved"
            ),
            {
              statusCode:400
            }
          );
        }

        const existingCount=
          await EMIInstallment
            .countDocuments({
              emiPlan:
                plan._id
            })
            .session(session);

        if(existingCount>0){
          throw Object.assign(
            new Error(
              "Installments already exist for this EMI plan"
            ),
            {
              statusCode:409
            }
          );
        }

        const sale=
          await Sale.findById(
            plan.sale
          ).session(session);

        if(!sale){
          throw Object.assign(
            new Error(
              "Related sale not found"
            ),
            {
              statusCode:404
            }
          );
        }

        if(
          ![
            "CONFIRMED",
            "PARTIALLY_PAID"
          ].includes(
            sale.status
          )
        ){
          throw Object.assign(
            new Error(
              "EMI can only be approved for an unpaid confirmed sale"
            ),
            {
              statusCode:400
            }
          );
        }

        const currentDue=
          Number(
            sale.dueAmount||0
          );

        if(
          !Number.isFinite(
            currentDue
          )||
          currentDue<=0
        ){
          throw Object.assign(
            new Error(
              "Related sale has no outstanding balance"
            ),
            {
              statusCode:400
            }
          );
        }

        const schedule=
          generateInstallmentSchedule({
            emiPayable:
              plan.emiPayable,

            installmentCount:
              plan.installmentCount,

            firstDueDate:
              plan.firstDueDate,

            frequency:
              plan.frequency,

            gracePeriodDays:
              plan.gracePeriodDays
          });

        const documents=
          schedule.map(
            installment=>({
              emiPlan:
                plan._id,

              ...installment
            })
          );

        installments=
          await EMIInstallment.insertMany(
            documents,
            {
              session
            }
          );

        plan.status=
          "APPROVED";

        plan.approvedBy=
          String(
            req.body?.approvedBy||
            "Owner/Admin"
          ).trim();

        plan.approvedAt=
          new Date();

        plan.remainingBalance=
          plan.emiPayable;

        await plan.save({
          session,
          validateBeforeSave:true
        });

        /*
          IMPORTANT ACCOUNTING RULE

          The financed principal already
          exists in Customer Due Ledger as
          NEW_SALE_DUE.

          Therefore only the EMI service
          charge creates a new EMI_DUE debit.
        */
        ledgerEntry=
          await createEMIServiceChargeEntry(
            plan,
            {
              createdBy:
                plan.approvedBy||
                "SYSTEM",

              session
            }
          );

        approvedPlan=plan;
      }
    );

    return res.status(200).json({
      success:true,
      message:
        "EMI plan approved and installment schedule created",

      data:
        approvedPlan,

      installments,

      ledgerEntry
    });
  }catch(error){
    console.error(
      "Approve EMI error:",
      error
    );

    const statusCode=
      error.statusCode||
      500;

    return res
      .status(statusCode)
      .json({
        success:false,
        message:
          error.message||
          "Failed to approve EMI plan"
      });
  }finally{
    await session.endSession();
  }
}

async function rejectEMIPlan(req, res) {
  try {
    const plan =
      await EMIPlan.findById(
        req.params.id
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    if (
      plan.status !==
      "PENDING_APPROVAL"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only plans pending approval can be rejected",
      });
    }

    const reason =
      String(
        req.body.reason || ""
      ).trim();

    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required",
      });
    }

    plan.status =
      "REJECTED";

    plan.rejectionReason =
      reason;

    plan.rejectedBy =
      String(
        req.body.rejectedBy ||
          "Owner/Admin"
      ).trim();

    plan.rejectedAt =
      new Date();

    await plan.save();

    return res.status(200).json({
      success: true,
      message:
        "EMI plan rejected",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to reject EMI plan",
      error: error.message,
    });
  }
}

async function requestEMIRevision(
  req,
  res
) {
  try {
    const plan =
      await EMIPlan.findById(
        req.params.id
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    if (
      plan.status !==
      "PENDING_APPROVAL"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only plans pending approval can be returned for revision",
      });
    }

    const reason =
      String(
        req.body.reason || ""
      ).trim();

    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Revision reason is required",
      });
    }

    plan.status =
      "REVISION_REQUIRED";

    plan.revisionReason =
      reason;

    await plan.save();

    return res.status(200).json({
      success: true,
      message:
        "EMI plan returned for revision",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to request revision",
      error: error.message,
    });
  }
}

async function cancelEMIPlan(req, res) {
  try {
    const plan =
      await EMIPlan.findById(
        req.params.id
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    if (
      [
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ].includes(plan.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This EMI plan cannot be cancelled",
      });
    }

    plan.status =
      "CANCELLED";

    plan.cancelledAt =
      new Date();

    await plan.save();

    return res.status(200).json({
      success: true,
      message:
        "EMI plan cancelled",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel EMI plan",
      error: error.message,
    });
  }
}

module.exports = {
  createEMIPlan,
  getEMIPlans,
  getEMIPlanById,
  updateEMIPlan,
  submitEMIPlan,
  approveEMIPlan,
  rejectEMIPlan,
  requestEMIRevision,
  cancelEMIPlan,
};
