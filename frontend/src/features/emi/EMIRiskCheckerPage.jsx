import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getEMIPlans,
} from "./emiPlanService";

import {
  createEMIRiskAssessment,
  getEMIRiskAssessments,
  recordEMIRiskDecision,
} from "./emiRiskService";

function money(value) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function pretty(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function riskBadge(level) {
  if (level === "LOW") {
    return "text-bg-success";
  }

  if (level === "MEDIUM") {
    return "text-bg-warning";
  }

  return "text-bg-danger";
}

function decisionBadge(decision) {
  if (decision === "APPROVED") {
    return "text-bg-success";
  }

  if (decision === "REJECTED") {
    return "text-bg-danger";
  }

  if (decision === "NEEDS_REVIEW") {
    return "text-bg-warning";
  }

  return "text-bg-secondary";
}

function EMIRiskCheckerPage() {
  const [plans, setPlans] = useState([]);
  const [assessments, setAssessments] =
    useState([]);

  const [selectedPlanId, setSelectedPlanId] =
    useState("");

  const [
    employmentStability,
    setEmploymentStability,
  ] = useState("UNKNOWN");

  const [assessedBy, setAssessedBy] =
    useState("Admin");

  const [
    monthlyIncomeOverride,
    setMonthlyIncomeOverride,
  ] = useState("");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [calculating, setCalculating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        planResponse,
        assessmentResponse,
      ] = await Promise.all([
        getEMIPlans(),
        getEMIRiskAssessments(),
      ]);

      const planList =
        Array.isArray(planResponse)
          ? planResponse
          : Array.isArray(planResponse?.data)
            ? planResponse.data
            : [];

      const assessmentList =
        Array.isArray(assessmentResponse)
          ? assessmentResponse
          : Array.isArray(assessmentResponse?.data)
            ? assessmentResponse.data
            : [];

      setPlans(planList);
      setAssessments(assessmentList);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load EMI risk data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const eligiblePlans = useMemo(() => {
    return plans.filter((plan) =>
      [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
      ].includes(plan.status)
    );
  }, [plans]);

  const selectedPlan = useMemo(() => {
    return (
      eligiblePlans.find(
        (plan) =>
          String(plan._id) ===
          String(selectedPlanId)
      ) || null
    );
  }, [
    eligiblePlans,
    selectedPlanId,
  ]);

  async function handleAssessment(event) {
    event.preventDefault();

    if (!selectedPlan) {
      setError(
        "Please select an EMI plan."
      );

      return;
    }

    const customerId =
      selectedPlan.customer?._id ||
      selectedPlan.customer;

    if (!customerId) {
      setError(
        "Selected EMI plan has no customer."
      );

      return;
    }

    try {
      setCalculating(true);
      setError("");
      setSuccess("");
      setResult(null);

      const payload = {
        customer: customerId,
        emiPlan: selectedPlan._id,
        employmentStability,
        assessedBy,
      };

      if (
        monthlyIncomeOverride &&
        Number(monthlyIncomeOverride) > 0
      ) {
        payload.monthlyIncomeOverride =
          Number(monthlyIncomeOverride);
      }

      const response =
        await createEMIRiskAssessment(
          payload
        );

      setResult(response.data);

      setSuccess(
        "Risk assessment completed successfully."
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Risk assessment failed"
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleDecision(
    assessment,
    decision
  ) {
    const decisionBy =
      window.prompt(
        "Decision made by:",
        "Owner"
      );

    if (!decisionBy) {
      return;
    }

    const notes =
      window.prompt(
        "Review notes:",
        ""
      );

    try {
      setError("");
      setSuccess("");

      const response =
        await recordEMIRiskDecision(
          assessment._id,
          {
            decision,
            decisionBy,
            notes: notes || "",
          }
        );

      if (
        result?._id ===
        assessment._id
      ) {
        setResult(response.data);
      }

      setSuccess(
        "Human review decision recorded."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message
      );
    }
  }

  if (loading) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border" />

        <p className="text-muted mt-3">
          Loading EMI risk data...
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4">
        <h1 className="h3 mb-1">
          AI EMI Risk Checker
        </h1>

        <p className="text-muted mb-0">
          Explainable repayment-risk
          assessment for EMI applications.
        </p>
      </div>

      <div className="alert alert-info">
        <strong>
          Decision-support tool:
        </strong>{" "}
        the calculated risk score does not
        automatically approve or reject the
        EMI application. Final approval
        remains with the Owner/Admin.
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <strong>
                New Assessment
              </strong>
            </div>

            <div className="card-body">
              <form
                onSubmit={
                  handleAssessment
                }
              >
                <div className="mb-3">
                  <label className="form-label">
                    EMI Plan
                  </label>

                  <select
                    className="form-select"
                    value={
                      selectedPlanId
                    }
                    onChange={(event) => {
                      setSelectedPlanId(
                        event.target.value
                      );

                      setResult(null);
                    }}
                    required
                  >
                    <option value="">
                      Select EMI plan
                    </option>

                    {eligiblePlans.map(
                      (plan) => (
                        <option
                          key={plan._id}
                          value={plan._id}
                        >
                          {plan.planNo}
                          {" — "}
                          {plan.customer
                            ?.name ||
                            "Customer"}
                          {" — "}
                          {plan.status}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {selectedPlan && (
                  <div className="border rounded bg-light p-3 mb-3">
                    <div className="row g-3">
                      <div className="col-6">
                        <small className="text-muted">
                          Customer
                        </small>

                        <div>
                          {selectedPlan
                            .customer
                            ?.name || "—"}
                        </div>
                      </div>

                      <div className="col-6">
                        <small className="text-muted">
                          Plan Status
                        </small>

                        <div>
                          {pretty(
                            selectedPlan.status
                          )}
                        </div>
                      </div>

                      <div className="col-6">
                        <small className="text-muted">
                          Sale Amount
                        </small>

                        <div>
                          {money(
                            selectedPlan
                              .totalSaleAmount
                          )}
                        </div>
                      </div>

                      <div className="col-6">
                        <small className="text-muted">
                          Down Payment
                        </small>

                        <div>
                          {money(
                            selectedPlan
                              .downPayment
                          )}
                        </div>
                      </div>

                      <div className="col-6">
                        <small className="text-muted">
                          EMI Payable
                        </small>

                        <div>
                          {money(
                            selectedPlan
                              .emiPayable
                          )}
                        </div>
                      </div>

                      <div className="col-6">
                        <small className="text-muted">
                          Installment
                        </small>

                        <div>
                          {money(
                            selectedPlan
                              .installmentAmount
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Employment / Business
                    Stability
                  </label>

                  <select
                    className="form-select"
                    value={
                      employmentStability
                    }
                    onChange={(event) =>
                      setEmploymentStability(
                        event.target.value
                      )
                    }
                  >
                    <option value="UNKNOWN">
                      Unknown
                    </option>

                    <option value="STABLE">
                      Stable
                    </option>

                    <option value="MODERATE">
                      Moderate
                    </option>

                    <option value="UNSTABLE">
                      Unstable
                    </option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Monthly Income Override
                  </label>

                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="Only needed if profile income is missing"
                    value={
                      monthlyIncomeOverride
                    }
                    onChange={(event) =>
                      setMonthlyIncomeOverride(
                        event.target.value
                      )
                    }
                  />

                  <div className="form-text">
                    Customer profile income
                    is used automatically when
                    available.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Assessed By
                  </label>

                  <input
                    className="form-control"
                    value={assessedBy}
                    onChange={(event) =>
                      setAssessedBy(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={
                    calculating ||
                    !selectedPlan
                  }
                >
                  {calculating
                    ? "Calculating..."
                    : "Run Risk Assessment"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {!result ? (
            <div className="card h-100">
              <div className="card-body d-flex align-items-center justify-content-center text-center">
                <div>
                  <div className="display-4 fw-bold text-muted">
                    0–100
                  </div>

                  <p className="text-muted mb-0">
                    Select an EMI plan and
                    run an assessment.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>
                  Assessment Result
                </strong>

                <span
                  className={`badge ${riskBadge(
                    result.riskLevel
                  )}`}
                >
                  {result.riskLevel} RISK
                </span>
              </div>

              <div className="card-body">
                <div className="text-center mb-4">
                  <div className="display-2 fw-bold">
                    {result.score}
                  </div>

                  <div className="text-muted">
                    Risk Score / 100
                  </div>
                </div>

                <div className="progress mb-4">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${result.score}%`,
                    }}
                    aria-valuenow={
                      result.score
                    }
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {result.score}%
                  </div>
                </div>

                <h5>
                  Recommendation
                </h5>

                <p>
                  {result.recommendation}
                </p>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <h6 className="text-success">
                        Positive Factors
                      </h6>

                      <ul className="mb-0">
                        {result
                          .positiveFactors
                          ?.map(
                            (
                              factor,
                              index
                            ) => (
                              <li
                                key={
                                  index
                                }
                                className="mb-2"
                              >
                                {factor}
                              </li>
                            )
                          )}
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <h6 className="text-danger">
                        Risk Factors
                      </h6>

                      <ul className="mb-0">
                        {result
                          .negativeFactors
                          ?.map(
                            (
                              factor,
                              index
                            ) => (
                              <li
                                key={
                                  index
                                }
                                className="mb-2"
                              >
                                {factor}
                              </li>
                            )
                          )}
                      </ul>
                    </div>
                  </div>
                </div>

                <h5>
                  Assessment Inputs
                </h5>

                <div className="table-responsive mb-4">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>
                          Monthly Income
                        </td>

                        <td className="text-end">
                          {money(
                            result
                              .inputSummary
                              ?.monthlyIncome
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Monthly EMI
                        </td>

                        <td className="text-end">
                          {money(
                            result
                              .inputSummary
                              ?.monthlyEquivalentInstallment
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          EMI / Income
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.installmentToIncomePercentage ??
                            0}
                          %
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Down Payment
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.downPaymentPercentage ??
                            0}
                          %
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Existing Due
                        </td>

                        <td className="text-end">
                          {money(
                            result
                              .inputSummary
                              ?.existingDueBalance
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Previous EMI Plans
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.previousEMIPlanCount ??
                            0}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Completed EMI Plans
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.completedEMIPlans ??
                            0}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Overdue Installments
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.overdueInstallmentCount ??
                            0}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Overdue Rate
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.overdueRate ??
                            0}
                          %
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Average Delay
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.averageDelayDays ??
                            0}{" "}
                          days
                        </td>
                      </tr>

                      <tr>
                        <td>
                          Maximum Delay
                        </td>

                        <td className="text-end">
                          {result
                            .inputSummary
                            ?.maxDelayDays ??
                            0}{" "}
                          days
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h5>
                  Score Breakdown
                </h5>

                <div className="table-responsive mb-4">
                  <table className="table table-sm">
                    <tbody>
                      {Object.entries(
                        result.scoreBreakdown ||
                          {}
                      )
                        .filter(
                          ([key]) =>
                            key !==
                            "totalBeforeClamp"
                        )
                        .map(
                          ([
                            key,
                            value,
                          ]) => (
                            <tr key={key}>
                              <td>
                                {pretty(
                                  key
                                    .replace(
                                      "Points",
                                      ""
                                    )
                                    .replace(
                                      "Credit",
                                      " Credit"
                                    )
                                )}
                              </td>

                              <td className="text-end">
                                {Number(
                                  value
                                ) > 0
                                  ? "+"
                                  : ""}
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>

                <div className="border-top pt-3">
                  <h5>
                    Human Review
                  </h5>

                  <p className="text-muted">
                    The automated score is
                    advisory. Record the
                    Owner/Admin decision
                    separately.
                  </p>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() =>
                        handleDecision(
                          result,
                          "APPROVED"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() =>
                        handleDecision(
                          result,
                          "NEEDS_REVIEW"
                        )
                      }
                    >
                      Needs Review
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        handleDecision(
                          result,
                          "REJECTED"
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>

                  <div className="mt-3">
                    Current Decision:{" "}
                    <span
                      className={`badge ${decisionBadge(
                        result.humanDecision
                      )}`}
                    >
                      {pretty(
                        result.humanDecision
                      )}
                    </span>
                  </div>
                </div>

                <div className="small text-muted mt-4">
                  Assessment:{" "}
                  {result.assessmentNo}
                  {" • "}
                  Model:{" "}
                  {result.modelVersion}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <strong>
            Assessment History
          </strong>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Assessment</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Score</th>
                <th>Risk</th>
                <th>
                  Human Decision
                </th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {assessments.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-muted py-4"
                  >
                    No assessments yet.
                  </td>
                </tr>
              ) : (
                assessments.map(
                  (assessment) => (
                    <tr
                      key={
                        assessment._id
                      }
                    >
                      <td>
                        {
                          assessment.assessmentNo
                        }
                      </td>

                      <td>
                        {assessment
                          .customer?.name ||
                          "—"}
                      </td>

                      <td>
                        {assessment
                          .emiPlan?.planNo ||
                          "—"}
                      </td>

                      <td>
                        <strong>
                          {
                            assessment.score
                          }
                          /100
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`badge ${riskBadge(
                            assessment.riskLevel
                          )}`}
                        >
                          {
                            assessment.riskLevel
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${decisionBadge(
                            assessment.humanDecision
                          )}`}
                        >
                          {pretty(
                            assessment.humanDecision
                          )}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          assessment.assessedAt
                        ).toLocaleString(
                          "en-BD"
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default EMIRiskCheckerPage;
