const mongoose = require("mongoose");

const Customer = require(
  "../models/customer.model"
);

const Sale = require(
  "../models/sale.model"
);

const EMIPlan = require(
  "../models/emiPlan.model"
);

const EMIInstallment = require(
  "../models/emiInstallment.model"
);

const EMIRiskAssessment = require(
  "../models/emiRiskAssessment.model"
);

const {
  calculateRisk,
} = require(
  "../services/emiRisk.service"
);

function roundMoney(value) {
  return (
    Math.round(
      (Number(value) +
        Number.EPSILON) *
        100
    ) / 100
  );
}

function roundNumber(
  value,
  decimals = 2
) {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      Number(value) *
        factor
    ) / factor
  );
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(
    id
  );
}

function objectIdOf(value) {
  return (
    value?._id ||
    value ||
    null
  );
}

function sameId(a, b) {
  return (
    String(
      objectIdOf(a)
    ) ===
    String(
      objectIdOf(b)
    )
  );
}

function generateAssessmentNo() {
  return (
    `RISK-${Date.now()}-` +
    Math.floor(
      1000 +
        Math.random() *
          9000
    )
  );
}

function startOfDay(value) {
  const date =
    new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function calculateDelayDays(
  installment
) {
  if (
    installment.status ===
    "WAIVED"
  ) {
    return 0;
  }

  const dueDate =
    startOfDay(
      installment.dueDate
    );

  dueDate.setDate(
    dueDate.getDate() +
      Number(
        installment
          .gracePeriodDays ||
          0
      )
  );

  let comparisonDate;

  if (
    Number(
      installment
        .remainingAmount ||
        0
    ) <= 0
  ) {
    if (
      !installment
        .lastPaymentDate
    ) {
      return 0;
    }

    comparisonDate =
      startOfDay(
        installment
          .lastPaymentDate
      );
  } else {
    comparisonDate =
      startOfDay(
        new Date()
      );
  }

  if (
    comparisonDate <=
    dueDate
  ) {
    return 0;
  }

  const milliseconds =
    comparisonDate.getTime() -
    dueDate.getTime();

  return Math.floor(
    milliseconds /
      (
        1000 *
        60 *
        60 *
        24
      )
  );
}

function monthlyEquivalent(
  installmentAmount,
  frequency
) {
  const amount =
    Number(
      installmentAmount ||
        0
    );

  switch (
    String(
      frequency ||
        "MONTHLY"
    ).toUpperCase()
  ) {
    case "WEEKLY":
      return roundMoney(
        amount *
          (52 / 12)
      );

    case "BIWEEKLY":
      return roundMoney(
        amount *
          (26 / 12)
      );

    default:
      return roundMoney(
        amount
      );
  }
}

async function buildInputSummary({
  customer,
  plan,
  employmentStability,
  monthlyIncomeOverride,
}) {
  let monthlyIncome =
    Number(
      customer.monthlyIncome ||
        0
    );

  let incomeSource =
    "CUSTOMER_PROFILE";

  if (
    monthlyIncome <= 0 &&
    Number(
      monthlyIncomeOverride
    ) > 0
  ) {
    monthlyIncome =
      Number(
        monthlyIncomeOverride
      );

    incomeSource =
      "MANUAL_OVERRIDE";
  }

  if (
    !Number.isFinite(
      monthlyIncome
    ) ||
    monthlyIncome <= 0
  ) {
    const error =
      new Error(
        "Customer monthly income is required before risk assessment"
      );

    error.statusCode = 400;

    throw error;
  }

  const otherPlans =
    await EMIPlan.find({
      _id: {
        $ne: plan._id,
      },

      customer:
        customer._id,

      status: {
        $in: [
          "APPROVED",
          "COMPLETED",
        ],
      },
    });

  const otherPlanIds =
    otherPlans.map(
      (entry) =>
        entry._id
    );

  const historicalInstallments =
    otherPlanIds.length
      ? await EMIInstallment.find({
          emiPlan: {
            $in:
              otherPlanIds,
          },
        })
      : [];

  const confirmedSales =
    await Sale.find({
      customer:
        customer._id,

      status:
        "CONFIRMED",
    });

  const selectedSaleId =
    String(
      objectIdOf(
        plan.sale
      )
    );

  const previousPurchaseCount =
    confirmedSales.filter(
      (sale) =>
        String(
          sale._id
        ) !==
        selectedSaleId
    ).length;

  const otherPlanSaleIds =
    new Set(
      otherPlans
        .map(
          (entry) =>
            String(
              objectIdOf(
                entry.sale
              )
            )
        )
        .filter(Boolean)
    );

  const existingEMIBalance =
    roundMoney(
      otherPlans
        .filter(
          (entry) =>
            entry.status ===
            "APPROVED"
        )
        .reduce(
          (
            sum,
            entry
          ) =>
            sum +
            Number(
              entry.remainingBalance ||
                0
            ),
          0
        )
    );

  const otherOutstandingSaleDue =
    roundMoney(
      confirmedSales
        .filter((sale) => {
          const saleId =
            String(
              sale._id
            );

          if (
            saleId ===
            selectedSaleId
          ) {
            return false;
          }

          /*
            Do not double count sales
            already represented by
            another EMI plan.
          */
          if (
            otherPlanSaleIds.has(
              saleId
            )
          ) {
            return false;
          }

          return true;
        })
        .reduce(
          (
            sum,
            sale
          ) => {
            const due =
              Math.max(
                Number(
                  sale.totalAmount ||
                    0
                ) -
                  Number(
                    sale.paidAmount ||
                      0
                  ),
                0
              );

            return (
              sum + due
            );
          },
          0
        )
    );

  const existingDueBalance =
    roundMoney(
      existingEMIBalance +
        otherOutstandingSaleDue
    );

  const completedEMIPlans =
    otherPlans.filter(
      (entry) =>
        entry.status ===
        "COMPLETED"
    ).length;

  const delays =
    historicalInstallments.map(
      calculateDelayDays
    );

  const overdueDelays =
    delays.filter(
      (days) =>
        days > 0
    );

  const overdueInstallmentCount =
    overdueDelays.length;

  const totalHistoricalInstallments =
    historicalInstallments.length;

  const overdueRate =
    totalHistoricalInstallments >
    0
      ? roundNumber(
          (
            overdueInstallmentCount /
            totalHistoricalInstallments
          ) * 100,
          2
        )
      : 0;

  const averageDelayDays =
    overdueDelays.length > 0
      ? roundNumber(
          overdueDelays.reduce(
            (
              sum,
              days
            ) =>
              sum + days,
            0
          ) /
            overdueDelays.length,
          2
        )
      : 0;

  const maxDelayDays =
    overdueDelays.length > 0
      ? Math.max(
          ...overdueDelays
        )
      : 0;

  const monthlyInstallment =
    monthlyEquivalent(
      plan.installmentAmount,
      plan.frequency
    );

  const installmentToIncomePercentage =
    roundNumber(
      (
        monthlyInstallment /
        monthlyIncome
      ) * 100,
      2
    );

  const incomeToInstallmentRatio =
    monthlyInstallment > 0
      ? roundNumber(
          monthlyIncome /
            monthlyInstallment,
          2
        )
      : 0;

  const downPaymentPercentage =
    Number(
      plan.totalSaleAmount ||
        0
    ) > 0
      ? roundNumber(
          (
            Number(
              plan.downPayment ||
                0
            ) /
            Number(
              plan.totalSaleAmount
            )
          ) * 100,
          2
        )
      : 0;

  const referenceAvailable =
    Boolean(
      String(
        plan.referenceName ||
          ""
      ).trim() ||
        String(
          plan.referencePhone ||
            ""
        ).trim()
    );

  const guarantorAvailable =
    Boolean(
      String(
        plan.guarantorName ||
          ""
      ).trim() ||
        String(
          plan.guarantorPhone ||
            ""
        ).trim()
    );

  return {
    monthlyIncome:
      roundMoney(
        monthlyIncome
      ),

    incomeSource,

    occupation:
      customer.occupation ||
      "",

    employmentStability,

    requestedEMIAmount:
      roundMoney(
        plan.emiPayable
      ),

    installmentAmount:
      roundMoney(
        plan.installmentAmount
      ),

    monthlyEquivalentInstallment:
      monthlyInstallment,

    incomeToInstallmentRatio,

    installmentToIncomePercentage,

    downPayment:
      roundMoney(
        plan.downPayment
      ),

    downPaymentPercentage,

    existingDueBalance,

    existingEMIBalance,

    otherOutstandingSaleDue,

    previousPurchaseCount,

    previousEMIPlanCount:
      otherPlans.length,

    completedEMIPlans,

    totalHistoricalInstallments,

    overdueInstallmentCount,

    overdueRate,

    averageDelayDays,

    maxDelayDays,

    referenceAvailable,

    guarantorAvailable,

    frequency:
      plan.frequency ||
      "MONTHLY",
  };
}

async function createAssessment(
  req,
  res
) {
  try {
    const {
      customer: customerId,
      emiPlan: emiPlanId,
    } = req.body;

    if (
      !validId(
        customerId
      ) ||
      !validId(
        emiPlanId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid customer and EMI plan IDs are required",
      });
    }

    const customer =
      await Customer.findById(
        customerId
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }

    const plan =
      await EMIPlan.findById(
        emiPlanId
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "EMI plan not found",
      });
    }

    if (
      !sameId(
        plan.customer,
        customer._id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected EMI plan does not belong to this customer",
      });
    }

    const allowedPlanStatuses = [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
    ];

    if (
      !allowedPlanStatuses.includes(
        plan.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Risk assessment is only available for active or proposed EMI plans",
      });
    }

    const employmentStability =
      String(
        req.body
          .employmentStability ||
          "UNKNOWN"
      ).toUpperCase();

    if (
      ![
        "STABLE",
        "MODERATE",
        "UNSTABLE",
        "UNKNOWN",
      ].includes(
        employmentStability
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid employment stability value",
      });
    }

    const assessedBy =
      String(
        req.body.assessedBy ||
          ""
      ).trim();

    if (!assessedBy) {
      return res.status(400).json({
        success: false,
        message:
          "Assessed by is required",
      });
    }

    const inputSummary =
      await buildInputSummary({
        customer,
        plan,
        employmentStability,

        monthlyIncomeOverride:
          req.body
            .monthlyIncomeOverride,
      });

    const result =
      calculateRisk(
        inputSummary
      );

    const assessment =
      await EMIRiskAssessment.create({
        assessmentNo:
          generateAssessmentNo(),

        customer:
          customer._id,

        emiPlan:
          plan._id,

        modelVersion:
          result.modelVersion,

        inputSummary,

        scoreBreakdown:
          result.scoreBreakdown,

        score:
          result.score,

        riskLevel:
          result.riskLevel,

        positiveFactors:
          result.positiveFactors,

        negativeFactors:
          result.negativeFactors,

        recommendation:
          result.recommendation,

        assessedBy,
      });

    await assessment.populate(
      [
        {
          path:
            "customer",

          select:
            "customerId name phone monthlyIncome occupation",
        },

        {
          path:
            "emiPlan",

          select:
            "planNo status totalSaleAmount downPayment financedAmount emiPayable installmentAmount installmentCount frequency remainingBalance",
        },
      ]
    );

    return res.status(201).json({
      success: true,

      message:
        "EMI risk assessment completed",

      data:
        assessment,
    });
  } catch (error) {
    console.error(
      "Create EMI risk assessment error:",
      error
    );

    return res
      .status(
        error.statusCode ||
          500
      )
      .json({
        success: false,

        message:
          error.message ||
          "Failed to calculate EMI risk",
      });
  }
}

async function getAssessments(
  req,
  res
) {
  try {
    const filter = {};

    if (
      req.query.customer &&
      validId(
        req.query.customer
      )
    ) {
      filter.customer =
        req.query.customer;
    }

    if (
      req.query.emiPlan &&
      validId(
        req.query.emiPlan
      )
    ) {
      filter.emiPlan =
        req.query.emiPlan;
    }

    if (
      req.query.riskLevel
    ) {
      filter.riskLevel =
        String(
          req.query.riskLevel
        ).toUpperCase();
    }

    const assessments =
      await EMIRiskAssessment.find(
        filter
      )
        .populate(
          "customer",
          "customerId name phone monthlyIncome occupation"
        )
        .populate(
          "emiPlan",
          "planNo status totalSaleAmount emiPayable installmentAmount installmentCount frequency"
        )
        .sort({
          assessedAt: -1,
        });

    return res.status(200).json({
      success: true,
      count:
        assessments.length,
      data:
        assessments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve EMI risk assessments",
      error:
        error.message,
    });
  }
}

async function getAssessmentById(
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
          "Invalid assessment ID",
      });
    }

    const assessment =
      await EMIRiskAssessment.findById(
        req.params.id
      )
        .populate(
          "customer",
          "customerId name phone monthlyIncome occupation"
        )
        .populate(
          "emiPlan",
          "planNo status totalSaleAmount downPayment financedAmount emiPayable installmentAmount installmentCount frequency remainingBalance"
        );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message:
          "Risk assessment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data:
        assessment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve assessment",
      error:
        error.message,
    });
  }
}

async function recordHumanDecision(
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
          "Invalid assessment ID",
      });
    }

    const decision =
      String(
        req.body.decision ||
          ""
      ).toUpperCase();

    if (
      ![
        "APPROVED",
        "REJECTED",
        "NEEDS_REVIEW",
      ].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be APPROVED, REJECTED, or NEEDS_REVIEW",
      });
    }

    const decisionBy =
      String(
        req.body.decisionBy ||
          ""
      ).trim();

    if (!decisionBy) {
      return res.status(400).json({
        success: false,
        message:
          "Decision maker is required",
      });
    }

    const assessment =
      await EMIRiskAssessment.findById(
        req.params.id
      );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message:
          "Risk assessment not found",
      });
    }

    assessment.humanDecision =
      decision;

    assessment.decisionBy =
      decisionBy;

    assessment.decisionAt =
      new Date();

    assessment.decisionNotes =
      String(
        req.body.notes ||
          ""
      ).trim();

    await assessment.save();

    return res.status(200).json({
      success: true,

      message:
        "Human review decision recorded",

      /*
        IMPORTANT:
        This does NOT automatically
        modify or approve the EMI plan.
      */

      data:
        assessment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to record human decision",
      error:
        error.message,
    });
  }
}

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  recordHumanDecision,
};
