import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  approveEMIPlan,
  cancelEMIPlan,
  getEMIPlanById,
  rejectEMIPlan,
  requestEMIRevision,
  submitEMIPlan,
} from "./emiPlanService";

function money(amount) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }
  ).format(
    Number(amount || 0)
  );
}

function prettify(value) {
  return String(
    value || "—"
  )
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function EMIPlanDetailsPage() {
  const { id } =
    useParams();

  const [plan, setPlan] =
    useState(null);

  const [
    installments,
    setInstallments,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadPlan() {
    try {
      setLoading(true);

      const response =
        await getEMIPlanById(
          id
        );

      setPlan(
        response.data
      );

      setInstallments(
        response.installments ||
          []
      );
    } catch (requestError) {
      setError(
        requestError.response
          ?.data?.message ||
        requestError.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, [id]);

  async function execute(
    callback,
    message
  ) {
    try {
      setWorking(true);
      setError("");
      setSuccess("");

      await callback();

      setSuccess(message);

      await loadPlan();
    } catch (requestError) {
      setError(
        requestError.response
          ?.data?.message ||
        requestError.message
      );
    } finally {
      setWorking(false);
    }
  }

  function handleApprove() {
    const approvedBy =
      window.prompt(
        "Approved by:",
        "Owner"
      );

    if (!approvedBy) {
      return;
    }

    execute(
      () =>
        approveEMIPlan(
          id,
          approvedBy
        ),

      "EMI plan approved."
    );
  }

  function handleReject() {
    const reason =
      window.prompt(
        "Rejection reason:"
      );

    if (!reason) {
      return;
    }

    execute(
      () =>
        rejectEMIPlan(
          id,
          reason,
          "Owner/Admin"
        ),

      "EMI plan rejected."
    );
  }

  function handleRevision() {
    const reason =
      window.prompt(
        "Required revision:"
      );

    if (!reason) {
      return;
    }

    execute(
      () =>
        requestEMIRevision(
          id,
          reason
        ),

      "Plan returned for revision."
    );
  }

  if (loading) {
    return (
      <LoadingState message="Loading EMI plan..." />
    );
  }

  if (!plan) {
    return (
      <ErrorAlert
        message={
          error ||
          "EMI plan not found."
        }
      />
    );
  }

  return (
    <section>

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h1 className="h3 mb-1">
            {plan.planNo}
          </h1>

          <p className="text-muted mb-0">
            EMI plan details
          </p>
        </div>

        <Link
          to="/emi-plans"
          className="btn btn-outline-secondary"
        >
          Back
        </Link>

      </div>

      <ErrorAlert
        message={error}
      />

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="card page-card mb-4">
        <div className="card-body">

          <div className="row g-4">

            <div className="col-md-4">
              <strong>
                Customer
              </strong>

              <div>
                {plan.customer
                  ?.name ||
                  "—"}
              </div>

              <small className="text-muted">
                {plan.customer
                  ?.phone ||
                  ""}
              </small>
            </div>

            <div className="col-md-4">
              <strong>
                Invoice
              </strong>

              <div>
                {plan.sale
                  ?.invoiceNumber ||
                  "—"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Status
              </strong>

              <div>
                {prettify(
                  plan.status
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Sale Amount
              </strong>

              <div>
                {money(
                  plan.totalSaleAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Down Payment
              </strong>

              <div>
                {money(
                  plan.downPayment
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Financed Amount
              </strong>

              <div>
                {money(
                  plan.financedAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Service Charge
              </strong>

              <div>
                {money(
                  plan.serviceCharge
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                EMI Payable
              </strong>

              <div>
                {money(
                  plan.emiPayable
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Installments
              </strong>

              <div>
                {
                  plan.installmentCount
                }
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Frequency
              </strong>

              <div>
                {prettify(
                  plan.frequency
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                First Due Date
              </strong>

              <div>
                {new Date(
                  plan.firstDueDate
                ).toLocaleDateString(
                  "en-BD"
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {plan.revisionReason && (
        <div className="alert alert-info">
          <strong>
            Revision:
          </strong>{" "}
          {plan.revisionReason}
        </div>
      )}

      {plan.rejectionReason && (
        <div className="alert alert-danger">
          <strong>
            Rejection:
          </strong>{" "}
          {plan.rejectionReason}
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-4">

        {[
          "DRAFT",
          "REVISION_REQUIRED",
        ].includes(plan.status) && (
          <>
            <Link
              to={`/emi-plans/${id}/edit`}
              className="btn btn-outline-primary"
            >
              Edit
            </Link>

            <button
              className="btn btn-dark"
              disabled={working}
              onClick={() =>
                execute(
                  () =>
                    submitEMIPlan(
                      id
                    ),
                  "Submitted for approval."
                )
              }
            >
              Submit for Approval
            </button>

            <button
              className="btn btn-outline-danger"
              disabled={working}
              onClick={() => {
                if (
                  window.confirm(
                    "Cancel this EMI plan?"
                  )
                ) {
                  execute(
                    () =>
                      cancelEMIPlan(
                        id
                      ),
                    "EMI plan cancelled."
                  );
                }
              }}
            >
              Cancel
            </button>
          </>
        )}

        {plan.status ===
          "PENDING_APPROVAL" && (
          <>
            <button
              className="btn btn-success"
              disabled={working}
              onClick={
                handleApprove
              }
            >
              Approve
            </button>

            <button
              className="btn btn-outline-info"
              disabled={working}
              onClick={
                handleRevision
              }
            >
              Request Revision
            </button>

            <button
              className="btn btn-outline-danger"
              disabled={working}
              onClick={
                handleReject
              }
            >
              Reject
            </button>
          </>
        )}

      </div>

      {installments.length >
        0 && (
        <div className="card page-card">

          <div className="card-header bg-white">
            <h2 className="h5 mb-0">
              Installment Schedule
            </h2>
          </div>

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>
                    Due Date
                  </th>
                  <th>
                    Scheduled
                  </th>
                  <th>Paid</th>
                  <th>
                    Remaining
                  </th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {installments.map(
                  (installment) => (
                    <tr
                      key={
                        installment._id
                      }
                    >

                      <td>
                        {
                          installment.installmentNo
                        }
                      </td>

                      <td>
                        {new Date(
                          installment.dueDate
                        ).toLocaleDateString(
                          "en-BD"
                        )}
                      </td>

                      <td>
                        {money(
                          installment.scheduledAmount
                        )}
                      </td>

                      <td>
                        {money(
                          installment.paidAmount
                        )}
                      </td>

                      <td>
                        {money(
                          installment.remainingAmount
                        )}
                      </td>

                      <td>
                        {prettify(
                          installment.status
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>
          </div>
        </div>
      )}

    </section>
  );
}

export default EMIPlanDetailsPage;
