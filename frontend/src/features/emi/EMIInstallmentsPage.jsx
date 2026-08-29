import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  getEMIInstallments,
  recordEMIPayment,
  refreshEMIStatuses,
  rescheduleEMIInstallment,
  waiveEMIInstallment,
} from "./emiInstallmentService";

function money(value) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function pretty(value) {
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

function badge(status) {
  switch (status) {
    case "PAID":
      return "text-bg-success";

    case "OVERDUE":
      return "text-bg-danger";

    case "DUE_TODAY":
      return "text-bg-warning";

    case "PARTIALLY_PAID":
      return "text-bg-info";

    case "WAIVED":
      return "text-bg-secondary";

    default:
      return "text-bg-light";
  }
}

function EMIInstallmentsPage() {
  const [
    installments,
    setInstallments,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [status, setStatus] =
    useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response =
        await getEMIInstallments(
          status
            ? { status }
            : {}
        );

      setInstallments(
        response.data || []
      );
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  const totals =
    useMemo(() => {
      return installments.reduce(
        (result, item) => {
          result.scheduled +=
            Number(
              item.scheduledAmount ||
                0
            );

          result.paid +=
            Number(
              item.paidAmount ||
                0
            );

          result.remaining +=
            Number(
              item.remainingAmount ||
                0
            );

          if (
            item.status ===
            "OVERDUE"
          ) {
            result.overdue +=
              Number(
                item.remainingAmount ||
                  0
              );
          }

          return result;
        },
        {
          scheduled: 0,
          paid: 0,
          remaining: 0,
          overdue: 0,
        }
      );
    }, [installments]);

  async function refresh() {
    try {
      setError("");
      setSuccess("");

      await refreshEMIStatuses();

      setSuccess(
        "Installment statuses refreshed."
      );

      await load();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          err.message
      );
    }
  }

  async function pay(item) {
    const amount =
      window.prompt(
        `Payment amount (remaining ${item.remainingAmount}):`,
        item.remainingAmount
      );

    if (!amount) {
      return;
    }

    const method =
      window.prompt(
        "Payment method: CASH, CARD, BANK_TRANSFER, MOBILE_BANKING, OTHER",
        "CASH"
      );

    if (!method) {
      return;
    }

    const reference =
      window.prompt(
        "Receipt/reference (optional):",
        ""
      );

    try {
      setError("");
      setSuccess("");

      await recordEMIPayment(
        item._id,
        {
          amount:
            Number(amount),

          method:
            method.toUpperCase(),

          receiptReference:
            reference || "",

          receivedBy:
            "Admin",
        }
      );

      setSuccess(
        "Payment recorded successfully."
      );

      await load();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          err.message
      );
    }
  }

  async function waive(item) {
    const reason =
      window.prompt(
        "Waiver reason:"
      );

    if (!reason) {
      return;
    }

    const approvedBy =
      window.prompt(
        "Approved by:",
        "Owner"
      );

    if (!approvedBy) {
      return;
    }

    try {
      await waiveEMIInstallment(
        item._id,
        {
          reason,
          approvedBy,
        }
      );

      setSuccess(
        "Installment waived."
      );

      await load();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          err.message
      );
    }
  }

  async function reschedule(
    item
  ) {
    const newDueDate =
      window.prompt(
        "New due date (YYYY-MM-DD):"
      );

    if (!newDueDate) {
      return;
    }

    const reason =
      window.prompt(
        "Reason:"
      );

    if (!reason) {
      return;
    }

    try {
      await rescheduleEMIInstallment(
        item._id,
        {
          newDueDate,
          reason,
          authorizedBy:
            "Owner/Admin",
        }
      );

      setSuccess(
        "Installment rescheduled."
      );

      await load();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          err.message
      );
    }
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            EMI Installments
          </h1>

          <p className="text-muted mb-0">
            Track upcoming,
            partially paid and
            overdue installments.
          </p>
        </div>

        <button
          className="btn btn-outline-dark"
          onClick={refresh}
        >
          Refresh Statuses
        </button>
      </div>

      <ErrorAlert
        message={error}
      />

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <small className="text-muted">
                Scheduled
              </small>

              <div className="h5">
                {money(
                  totals.scheduled
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <small className="text-muted">
                Paid
              </small>

              <div className="h5">
                {money(
                  totals.paid
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <small className="text-muted">
                Remaining
              </small>

              <div className="h5">
                {money(
                  totals.remaining
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <small className="text-muted">
                Overdue
              </small>

              <div className="h5">
                {money(
                  totals.overdue
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <label className="form-label">
            Status
          </label>

          <select
            className="form-select"
            style={{
              maxWidth: 300,
            }}
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
          >
            <option value="">
              All
            </option>

            <option value="UPCOMING">
              Upcoming
            </option>

            <option value="DUE_TODAY">
              Due Today
            </option>

            <option value="PARTIALLY_PAID">
              Partially Paid
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="OVERDUE">
              Overdue
            </option>

            <option value="WAIVED">
              Waived
            </option>

            <option value="RESCHEDULED">
              Rescheduled
            </option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading installments..." />
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Scheduled</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Overdue</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {installments.map(
                  (item) => {
                    const plan =
                      item.emiPlan;

                    const settled =
                      [
                        "PAID",
                        "WAIVED",
                      ].includes(
                        item.status
                      );

                    return (
                      <tr
                        key={
                          item._id
                        }
                      >
                        <td>
                          {plan
                            ?.customer
                            ?.name ||
                            "—"}
                        </td>

                        <td>
                          {plan?.sale
                            ?.invoiceNumber ||
                            "—"}
                        </td>

                        <td>
                          {
                            item.installmentNo
                          }
                        </td>

                        <td>
                          {new Date(
                            item.dueDate
                          ).toLocaleDateString(
                            "en-BD"
                          )}
                        </td>

                        <td>
                          {money(
                            item.scheduledAmount
                          )}
                        </td>

                        <td>
                          {money(
                            item.paidAmount
                          )}
                        </td>

                        <td>
                          {money(
                            item.remainingAmount
                          )}
                        </td>

                        <td>
                          <span
                            className={`badge ${badge(
                              item.status
                            )}`}
                          >
                            {pretty(
                              item.status
                            )}
                          </span>
                        </td>

                        <td>
                          {item.overdueDays
                            ? `${item.overdueDays} day(s)`
                            : "—"}
                        </td>

                        <td>
                          {!settled && (
                            <div className="d-flex flex-wrap gap-1">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  pay(
                                    item
                                  )
                                }
                              >
                                Pay
                              </button>

                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  reschedule(
                                    item
                                  )
                                }
                              >
                                Reschedule
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  waive(
                                    item
                                  )
                                }
                              >
                                Waive
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default EMIInstallmentsPage;
