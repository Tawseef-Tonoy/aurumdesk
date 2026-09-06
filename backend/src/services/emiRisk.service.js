const MODEL_VERSION =
  "EXPLAINABLE-JS-V1.0";

function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

function scoreInstallmentBurden(
  percentage
) {
  if (percentage <= 15) {
    return 0;
  }

  if (percentage <= 25) {
    return 8;
  }

  if (percentage <= 35) {
    return 15;
  }

  if (percentage <= 45) {
    return 20;
  }

  return 25;
}

function scoreDownPayment(
  percentage
) {
  if (percentage >= 35) {
    return 0;
  }

  if (percentage >= 25) {
    return 4;
  }

  if (percentage >= 15) {
    return 8;
  }

  if (percentage >= 10) {
    return 12;
  }

  return 15;
}

function scoreExistingDue(
  existingDue,
  monthlyIncome
) {
  if (monthlyIncome <= 0) {
    return 15;
  }

  const ratio =
    existingDue /
    monthlyIncome;

  if (ratio <= 0.25) {
    return 0;
  }

  if (ratio <= 0.75) {
    return 4;
  }

  if (ratio <= 1.5) {
    return 8;
  }

  if (ratio <= 3) {
    return 12;
  }

  return 15;
}

function scoreOverdueHistory(
  overdueRate
) {
  if (overdueRate <= 0) {
    return 0;
  }

  if (overdueRate <= 10) {
    return 5;
  }

  if (overdueRate <= 25) {
    return 10;
  }

  if (overdueRate <= 50) {
    return 15;
  }

  return 20;
}

function scorePaymentDelay(
  averageDelayDays,
  maxDelayDays
) {
  if (
    averageDelayDays <= 0 &&
    maxDelayDays <= 0
  ) {
    return 0;
  }

  if (
    averageDelayDays <= 3 &&
    maxDelayDays <= 7
  ) {
    return 2;
  }

  if (averageDelayDays <= 7) {
    return 5;
  }

  if (averageDelayDays <= 15) {
    return 8;
  }

  return 10;
}

function scoreEmploymentStability(
  stability
) {
  switch (stability) {
    case "STABLE":
      return 0;

    case "MODERATE":
      return 5;

    case "UNSTABLE":
      return 10;

    default:
      return 3;
  }
}

function scoreSupport(
  referenceAvailable,
  guarantorAvailable
) {
  if (
    referenceAvailable &&
    guarantorAvailable
  ) {
    return 0;
  }

  if (
    referenceAvailable ||
    guarantorAvailable
  ) {
    return 2;
  }

  return 5;
}

function completedPlanCredit(
  completedPlans
) {
  if (completedPlans >= 2) {
    return -10;
  }

  if (completedPlans === 1) {
    return -5;
  }

  return 0;
}

function getRiskLevel(score) {
  /*
    Official classification:

    0-30   LOW
    31-60  MEDIUM
    61-100 HIGH
  */

  if (score <= 30) {
    return "LOW";
  }

  if (score <= 60) {
    return "MEDIUM";
  }

  return "HIGH";
}

function createExplanations(
  input
) {
  const positiveFactors = [];
  const negativeFactors = [];

  if (
    input.installmentToIncomePercentage <=
    25
  ) {
    positiveFactors.push(
      "Installment burden is reasonable compared with monthly income."
    );
  } else if (
    input.installmentToIncomePercentage >
    35
  ) {
    negativeFactors.push(
      "Installment is high compared with monthly income."
    );
  }

  if (
    input.downPaymentPercentage >=
    25
  ) {
    positiveFactors.push(
      "Customer is making a strong down payment."
    );
  } else if (
    input.downPaymentPercentage <
    15
  ) {
    negativeFactors.push(
      "Down payment is low compared with the sale amount."
    );
  }

  if (
    input.existingDueBalance <=
    input.monthlyIncome * 0.5
  ) {
    positiveFactors.push(
      "Existing outstanding balance is relatively low."
    );
  } else if (
    input.existingDueBalance >
    input.monthlyIncome
  ) {
    negativeFactors.push(
      "Customer already has a large existing outstanding balance."
    );
  }

  if (
    input.overdueInstallmentCount ===
    0
  ) {
    positiveFactors.push(
      "No previous overdue EMI installments were found."
    );
  } else {
    negativeFactors.push(
      `${input.overdueInstallmentCount} historical installment(s) show overdue repayment behavior.`
    );
  }

  if (
    input.averageDelayDays >= 7
  ) {
    negativeFactors.push(
      `Average historical repayment delay is ${input.averageDelayDays} days.`
    );
  }

  if (
    input.completedEMIPlans > 0
  ) {
    positiveFactors.push(
      `Customer successfully completed ${input.completedEMIPlans} previous EMI plan(s).`
    );
  }

  if (
    input.employmentStability ===
    "STABLE"
  ) {
    positiveFactors.push(
      "Employment or business stability is reported as stable."
    );
  }

  if (
    input.employmentStability ===
    "UNSTABLE"
  ) {
    negativeFactors.push(
      "Employment or business stability is reported as unstable."
    );
  }

  if (
    input.referenceAvailable ||
    input.guarantorAvailable
  ) {
    positiveFactors.push(
      "Reference or guarantor information is available."
    );
  } else {
    negativeFactors.push(
      "No reference or guarantor information is available."
    );
  }

  if (
    positiveFactors.length === 0
  ) {
    positiveFactors.push(
      "No major positive repayment-history factor was identified."
    );
  }

  if (
    negativeFactors.length === 0
  ) {
    negativeFactors.push(
      "No major negative repayment-risk factor was identified."
    );
  }

  return {
    positiveFactors,
    negativeFactors,
  };
}

function recommendationFor(
  riskLevel
) {
  if (riskLevel === "LOW") {
    return (
      "Low observed repayment risk. " +
      "Owner/Admin may proceed with the normal human review process."
    );
  }

  if (riskLevel === "MEDIUM") {
    return (
      "Moderate repayment risk. Review affordability, existing obligations, " +
      "repayment history, and guarantee information before making a decision."
    );
  }

  return (
    "High repayment-risk indicators detected. A detailed manual review is strongly recommended. " +
    "Consider a higher down payment, lower installment burden, or stronger guarantee before approval."
  );
}

function calculateRisk(input) {
  const scoreBreakdown = {
    installmentBurdenPoints:
      scoreInstallmentBurden(
        input.installmentToIncomePercentage
      ),

    downPaymentPoints:
      scoreDownPayment(
        input.downPaymentPercentage
      ),

    existingDuePoints:
      scoreExistingDue(
        input.existingDueBalance,
        input.monthlyIncome
      ),

    overdueHistoryPoints:
      scoreOverdueHistory(
        input.overdueRate
      ),

    paymentDelayPoints:
      scorePaymentDelay(
        input.averageDelayDays,
        input.maxDelayDays
      ),

    employmentStabilityPoints:
      scoreEmploymentStability(
        input.employmentStability
      ),

    supportPoints:
      scoreSupport(
        input.referenceAvailable,
        input.guarantorAvailable
      ),

    completedPlanCredit:
      completedPlanCredit(
        input.completedEMIPlans
      ),
  };

  const totalBeforeClamp =
    Object.values(
      scoreBreakdown
    ).reduce(
      (sum, value) =>
        sum + Number(value),
      0
    );

  scoreBreakdown.totalBeforeClamp =
    totalBeforeClamp;

  const score =
    clamp(
      Math.round(
        totalBeforeClamp
      ),
      0,
      100
    );

  const riskLevel =
    getRiskLevel(score);

  const explanations =
    createExplanations(input);

  return {
    modelVersion:
      MODEL_VERSION,

    score,

    riskLevel,

    scoreBreakdown,

    positiveFactors:
      explanations.positiveFactors,

    negativeFactors:
      explanations.negativeFactors,

    recommendation:
      recommendationFor(
        riskLevel
      ),
  };
}

module.exports = {
  MODEL_VERSION,
  calculateRisk,
};
