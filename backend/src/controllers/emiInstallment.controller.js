const mongoose = require("mongoose");

const EMIPlan = require(
  "../models/emiPlan.model"
);

const EMIInstallment = require(
  "../models/emiInstallment.model"
);

const EMIInstallmentPayment = require(
  "../models/emiInstallmentPayment.model"
);

const {
  roundMoney,
  calculateInstallmentStatus,
} = require(
  "../services/emiInstallment.service"
);

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function generatePaymentNo() {
  return `EMIPAY-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
}

async function refreshOneInstallment(
  installment
) {
  const calculated =
    calculateInstallmentStatus(
      installment
    );

  if (
    installment.status !==
      calculated.status ||
    installment.overdueDays !==
      calculated.overdueDays
  ) {
    installment.status =
      calculated.status;

    installment.overdueDays =
      calculated.overdueDays;

    await installment.save();
  }

  return installment;
}

async function recalculatePlanBalance(
  planId
) {
  const installments =
    await EMIInstallment.find({
      emiPlan: planId,
    });

  const remainingBalance =
    roundMoney(
      installments.reduce(
        (sum, installment) =>
          sum +
          Number(
            installment.remainingAmount ||
              0
          ),
        0
      )
    );

  const plan =
    await EMIPlan.findById(
      planId
    );

  if (!plan) {
    return null;
  }

  plan.remainingBalance =
    remainingBalance;

  if (
    remainingBalance <= 0 &&
    plan.status === "APPROVED"
  ) {
    plan.status =
      "COMPLETED";
  }

  await plan.save();

  return plan;
}

async function getInstallments(
  req,
  res
) {
  try {
    const {
      status,
      plan,
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
      plan &&
      validId(plan)
    ) {
      filter.emiPlan = plan;
    }

    if (
      customer &&
      validId(customer)
    ) {
      const plans =
        await EMIPlan.find({
          customer,
        }).select("_id");

      filter.emiPlan = {
        $in: plans.map(
          (entry) =>
            entry._id
        ),
      };
    }

    let installments =
      await EMIInstallment.find(
        filter
      )
        .populate({
          path: "emiPlan",
          populate: [
            {
              path: "customer",
              select:
                "customerId name phone",
            },
            {
              path: "sale",
              select:
                "invoiceNumber totalAmount",
            },
          ],
        })
        .sort({
          dueDate: 1,
        });

    for (
      const installment
      of installments
    ) {
      await refreshOneInstallment(
        installment
      );
    }

    return res.status(200).json({
      success: true,
      count:
        installments.length,
      data: installments,
    });
  } catch (error) {
    console.error(
      "Get installments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve EMI installments",
      error: error.message,
    });
  }
}

async function getInstallmentById(
  req,
  res
) {
  try {
    if (
      !validId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid installment ID",
      });
    }

    let installment =
      await EMIInstallment.findById(
        req.params.id
      ).populate({
        path: "emiPlan",
        populate: [
          {
            path: "customer",
            select:
              "customerId name phone monthlyIncome",
          },
          {
            path: "sale",
            select:
              "invoiceNumber totalAmount paidAmount dueAmount",
          },
        ],
      });

    if (!installment) {
      return res.status(404).json({
        success: false,
        message:
          "Installment not found",
      });
    }

    await refreshOneInstallment(
      installment
    );

    const payments =
      await EMIInstallmentPayment.find({
        installment:
          installment._id,
      }).sort({
        paymentDate: -1,
      });

    return res.status(200).json({
      success: true,
      data: installment,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve installment",
      error: error.message,
    });
  }
}

async function refreshStatuses(
  req,
  res
) {
  try {
    const installments =
      await EMIInstallment.find({
        status: {
          $nin: [
            "PAID",
            "WAIVED",
          ],
        },
      });

    let updated = 0;

    for (
      const installment
      of installments
    ) {
      const beforeStatus =
        installment.status;

      const beforeDays =
        installment.overdueDays;

      await refreshOneInstallment(
        installment
      );

      if (
        beforeStatus !==
          installment.status ||
        beforeDays !==
          installment.overdueDays
      ) {
        updated += 1;
      }
    }

    return res.status(200).json({
      success: true,
      checked:
        installments.length,
      updated,
      message:
        "Installment statuses refreshed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to refresh installment statuses",
      error: error.message,
    });
  }
}

async function recordPayment(
  req,
  res
) {
  try {
    const installment =
      await EMIInstallment.findById(
        req.params.id
      ).populate("emiPlan");

    if (!installment) {
      return res.status(404).json({
        success: false,
        message:
          "Installment not found",
      });
    }

    if (
      !installment.emiPlan ||
      ![
        "APPROVED",
        "COMPLETED",
      ].includes(
        installment.emiPlan.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payments can only be recorded for approved EMI plans",
      });
    }

    if (
      installment.status ===
        "PAID" ||
      installment.status ===
        "WAIVED" ||
      installment.remainingAmount <=
        0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This installment has already been settled",
      });
    }

    const amount =
      roundMoney(
        req.body.amount
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount must be greater than zero",
      });
    }

    if (
      amount >
      roundMoney(
        installment.remainingAmount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Payment cannot exceed the remaining amount of ${installment.remainingAmount}`,
      });
    }

    const method =
      String(
        req.body.method ||
          ""
      ).toUpperCase();

    const allowedMethods = [
      "CASH",
      "CARD",
      "BANK_TRANSFER",
      "MOBILE_BANKING",
      "OTHER",
    ];

    if (
      !allowedMethods.includes(
        method
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method",
      });
    }

    const paymentDate =
      req.body.paymentDate
        ? new Date(
            req.body.paymentDate
          )
        : new Date();

    if (
      Number.isNaN(
        paymentDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment date",
      });
    }

    const plan =
      installment.emiPlan;

    const payment =
      await EMIInstallmentPayment.create({
        paymentNo:
          generatePaymentNo(),

        emiPlan:
          plan._id,

        installment:
          installment._id,

        customer:
          plan.customer,

        amount,

        paymentDate,

        method,

        receiptReference:
          String(
            req.body
              .receiptReference ||
              ""
          ).trim(),

        receivedBy:
          String(
            req.body
              .receivedBy ||
              "SYSTEM"
          ).trim(),

        notes:
          String(
            req.body.notes ||
              ""
          ).trim(),
      });

    installment.paidAmount =
      roundMoney(
        Number(
          installment.paidAmount ||
            0
        ) + amount
      );

    installment.remainingAmount =
      roundMoney(
        Number(
          installment.remainingAmount
        ) - amount
      );

    installment.lastPaymentDate =
      paymentDate;

    installment.lastPaymentMethod =
      method;

    installment.lastReceiptReference =
      payment.paymentNo;

    const newStatus =
      calculateInstallmentStatus(
        installment,
        paymentDate
      );

    installment.status =
      newStatus.status;

    installment.overdueDays =
      newStatus.overdueDays;

    await installment.save();

    const updatedPlan =
      await recalculatePlanBalance(
        plan._id
      );

    return res.status(201).json({
      success: true,
      message:
        installment.status ===
        "PAID"
          ? "Installment paid successfully"
          : "Partial payment recorded successfully",

      data: {
        payment,
        installment,
        plan:
          updatedPlan,
      },
    });
  } catch (error) {
    console.error(
      "Record EMI payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to record EMI payment",
    });
  }
}

async function waiveInstallment(
  req,
  res
) {
  try {
    const installment =
      await EMIInstallment.findById(
        req.params.id
      );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message:
          "Installment not found",
      });
    }

    if (
      [
        "PAID",
        "WAIVED",
      ].includes(
        installment.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This installment has already been settled",
      });
    }

    const approvedBy =
      String(
        req.body.approvedBy ||
          ""
      ).trim();

    const reason =
      String(
        req.body.reason ||
          ""
      ).trim();

    if (
      !approvedBy ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Approval name and waiver reason are required",
      });
    }

    installment.waivedAmount =
      installment.remainingAmount;

    installment.remainingAmount =
      0;

    installment.status =
      "WAIVED";

    installment.overdueDays =
      0;

    installment.waivedBy =
      approvedBy;

    installment.waivedAt =
      new Date();

    installment.waiverReason =
      reason;

    await installment.save();

    await recalculatePlanBalance(
      installment.emiPlan
    );

    return res.status(200).json({
      success: true,
      message:
        "Installment waived successfully",
      data: installment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to waive installment",
      error: error.message,
    });
  }
}

async function rescheduleInstallment(
  req,
  res
) {
  try {
    const installment =
      await EMIInstallment.findById(
        req.params.id
      );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message:
          "Installment not found",
      });
    }

    if (
      [
        "PAID",
        "WAIVED",
      ].includes(
        installment.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Paid or waived installments cannot be rescheduled",
      });
    }

    const newDueDate =
      new Date(
        req.body.newDueDate
      );

    if (
      Number.isNaN(
        newDueDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid new due date is required",
      });
    }

    const authorizedBy =
      String(
        req.body.authorizedBy ||
          ""
      ).trim();

    const reason =
      String(
        req.body.reason ||
          ""
      ).trim();

    if (
      !authorizedBy ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Authorization and reason are required",
      });
    }

    if (
      !installment.originalDueDate
    ) {
      installment.originalDueDate =
        installment.dueDate;
    }

    installment.dueDate =
      newDueDate;

    installment.rescheduledBy =
      authorizedBy;

    installment.rescheduleReason =
      reason;

    installment.status =
      "RESCHEDULED";

    installment.overdueDays =
      0;

    await installment.save();

    return res.status(200).json({
      success: true,
      message:
        "Installment rescheduled successfully",
      data: installment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to reschedule installment",
      error: error.message,
    });
  }
}

module.exports = {
  getInstallments,
  getInstallmentById,
  refreshStatuses,
  recordPayment,
  waiveInstallment,
  rescheduleInstallment,
};
