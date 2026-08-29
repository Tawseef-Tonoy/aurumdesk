const BASE_URL =
  process.env.BASE_URL ||
  "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  let body = null;

  try {
    body = await response.json();
  } catch {}

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function getArray(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  return [];
}

function section(title) {
  console.log("\n" + "=".repeat(65));
  console.log(title);
  console.log("=".repeat(65));
}

async function main() {
  console.log(
    "\nAURUMDESK - FEATURE 17 EMI RISK TEST"
  );

  /*
   * 1. Load EMI plans
   */
  section("1. LOADING EMI PLANS");

  const planResponse =
    await request("/emi-plans");

  if (!planResponse.ok) {
    throw new Error(
      planResponse.body?.message ||
        "Could not load EMI plans"
    );
  }

  const plans =
    getArray(planResponse.body);

  console.log(
    `Found ${plans.length} EMI plan(s)`
  );

  const plan = plans.find((item) =>
    [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
    ].includes(item.status)
  );

  if (!plan) {
    throw new Error(
      "No eligible EMI plan found. Need DRAFT, PENDING_APPROVAL, or APPROVED."
    );
  }

  const customerId =
    plan.customer?._id ||
    plan.customer;

  if (!customerId) {
    throw new Error(
      "Selected EMI plan has no customer."
    );
  }

  console.log(
    `Plan: ${plan.planNo || plan._id}`
  );

  console.log(
    `Customer: ${
      plan.customer?.name ||
      customerId
    }`
  );

  /*
   * 2. Create assessment
   */
  section("2. CREATING RISK ASSESSMENT");

  const assessmentResponse =
    await request(
      "/emi-risk-assessments",
      {
        method: "POST",

        body: JSON.stringify({
          customer: customerId,
          emiPlan: plan._id,
          employmentStability:
            "MODERATE",
          assessedBy:
            "Feature 17 Automated Test",
          monthlyIncomeOverride:
            80000,
        }),
      }
    );

  if (!assessmentResponse.ok) {
    console.log(
      "Server response:",
      assessmentResponse.body
    );

    throw new Error(
      assessmentResponse.body?.message ||
        `Assessment failed with status ${assessmentResponse.status}`
    );
  }

  const assessment =
    assessmentResponse.body?.data;

  if (!assessment) {
    throw new Error(
      "Assessment data was not returned."
    );
  }

  console.log(
    `Assessment: ${assessment.assessmentNo}`
  );

  console.log(
    `Score: ${assessment.score}/100`
  );

  console.log(
    `Risk: ${assessment.riskLevel}`
  );

  /*
   * 3. Validate numerical score
   */
  section("3. VALIDATING SCORE");

  if (
    typeof assessment.score !== "number"
  ) {
    throw new Error(
      "Risk score is not numeric."
    );
  }

  if (
    assessment.score < 0 ||
    assessment.score > 100
  ) {
    throw new Error(
      "Risk score must be between 0 and 100."
    );
  }

  console.log(
    "Score range is valid."
  );

  /*
   * 4. Validate official categories
   */
  if (
    assessment.score <= 30 &&
    assessment.riskLevel !== "LOW"
  ) {
    throw new Error(
      "Score 0-30 must be LOW."
    );
  }

  if (
    assessment.score >= 31 &&
    assessment.score <= 60 &&
    assessment.riskLevel !==
      "MEDIUM"
  ) {
    throw new Error(
      "Score 31-60 must be MEDIUM."
    );
  }

  if (
    assessment.score >= 61 &&
    assessment.riskLevel !== "HIGH"
  ) {
    throw new Error(
      "Score 61-100 must be HIGH."
    );
  }

  console.log(
    "Risk category matches score."
  );

  /*
   * 5. Check explanation
   */
  section("4. CHECKING EXPLAINABILITY");

  if (
    !Array.isArray(
      assessment.positiveFactors
    )
  ) {
    throw new Error(
      "positiveFactors is missing."
    );
  }

  if (
    !Array.isArray(
      assessment.negativeFactors
    )
  ) {
    throw new Error(
      "negativeFactors is missing."
    );
  }

  console.log(
    `Positive factors: ${assessment.positiveFactors.length}`
  );

  assessment.positiveFactors.forEach(
    (factor) =>
      console.log(` + ${factor}`)
  );

  console.log(
    `Risk factors: ${assessment.negativeFactors.length}`
  );

  assessment.negativeFactors.forEach(
    (factor) =>
      console.log(` - ${factor}`)
  );

  if (!assessment.recommendation) {
    throw new Error(
      "Recommendation is missing."
    );
  }

  console.log(
    "Recommendation exists."
  );

  /*
   * 6. Check inputs
   */
  section("5. CHECKING INPUT SUMMARY");

  const input =
    assessment.inputSummary;

  if (!input) {
    throw new Error(
      "inputSummary is missing."
    );
  }

  const requiredInputs = [
    "monthlyIncome",
    "installmentAmount",
    "monthlyEquivalentInstallment",
    "installmentToIncomePercentage",
    "downPaymentPercentage",
    "existingDueBalance",
    "previousEMIPlanCount",
    "completedEMIPlans",
    "overdueInstallmentCount",
    "overdueRate",
    "averageDelayDays",
    "maxDelayDays",
  ];

  requiredInputs.forEach(
    (field) => {
      if (
        input[field] === undefined
      ) {
        throw new Error(
          `Missing input: ${field}`
        );
      }

      console.log(
        `${field}: ${input[field]}`
      );
    }
  );

  /*
   * 7. Check breakdown
   */
  section("6. CHECKING SCORE BREAKDOWN");

  if (!assessment.scoreBreakdown) {
    throw new Error(
      "scoreBreakdown is missing."
    );
  }

  Object.entries(
    assessment.scoreBreakdown
  ).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  /*
   * 8. Check model version
   */
  section("7. CHECKING MODEL VERSION");

  if (!assessment.modelVersion) {
    throw new Error(
      "modelVersion is missing."
    );
  }

  console.log(
    `Model: ${assessment.modelVersion}`
  );

  /*
   * 9. Check persistence/history
   */
  section("8. CHECKING HISTORY");

  const historyResponse =
    await request(
      `/emi-risk-assessments?customer=${customerId}`
    );

  if (!historyResponse.ok) {
    throw new Error(
      "Could not retrieve risk history."
    );
  }

  const history =
    getArray(historyResponse.body);

  const stored =
    history.some(
      (item) =>
        String(item._id) ===
        String(assessment._id)
    );

  if (!stored) {
    throw new Error(
      "Assessment was not stored."
    );
  }

  console.log(
    `History contains ${history.length} assessment(s).`
  );

  /*
   * 10. Human decision
   */
  section("9. TESTING HUMAN DECISION");

  const decisionResponse =
    await request(
      `/emi-risk-assessments/${assessment._id}/decision`,
      {
        method: "PATCH",

        body: JSON.stringify({
          decision:
            "NEEDS_REVIEW",

          decisionBy:
            "Automated Test Owner",

          notes:
            "Feature 17 automated test",
        }),
      }
    );

  if (!decisionResponse.ok) {
    console.log(
      decisionResponse.body
    );

    throw new Error(
      decisionResponse.body?.message ||
        "Human decision failed."
    );
  }

  if (
    decisionResponse.body?.data
      ?.humanDecision !==
    "NEEDS_REVIEW"
  ) {
    throw new Error(
      "Human decision was not stored correctly."
    );
  }

  console.log(
    "Human decision stored separately."
  );

  /*
   * Final result
   */
  section("FEATURE 17 TEST RESULT");

  console.log(
    "ALL FEATURE 17 TESTS PASSED"
  );

  console.log(
    "✓ Risk score generated"
  );

  console.log(
    "✓ LOW/MEDIUM/HIGH classification"
  );

  console.log(
    "✓ Financial features extracted"
  );

  console.log(
    "✓ EMI history analyzed"
  );

  console.log(
    "✓ Explainable factors generated"
  );

  console.log(
    "✓ Score breakdown generated"
  );

  console.log(
    "✓ Recommendation generated"
  );

  console.log(
    "✓ Assessment stored"
  );

  console.log(
    "✓ Human decision remains separate"
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    section("FEATURE 17 TEST RESULT");

    console.error("TEST FAILED");
    console.error(error.message);

    process.exit(1);
  });
