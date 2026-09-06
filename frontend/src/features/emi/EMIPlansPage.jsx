import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  getEMIPlans,
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

function statusClass(status) {
  if (status === "APPROVED") {
    return "text-bg-success";
  }

  if (
    status ===
    "PENDING_APPROVAL"
  ) {
    return "text-bg-warning";
  }

  if (
    status === "REJECTED" ||
    status === "CANCELLED"
  ) {
    return "text-bg-danger";
  }

  if (
    status ===
    "REVISION_REQUIRED"
  ) {
    return "text-bg-info";
  }

  return "text-bg-secondary";
}

function EMIPlansPage() {
  const [plans, setPlans] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filters, setFilters] =
    useState({
      search: "",
      status: "",
    });

  async function loadPlans(
    customFilters = filters
  ) {
    try {
      setLoading(true);
      setError("");

      const params =
        Object.fromEntries(
          Object.entries(
            customFilters
          ).filter(
            ([, value]) =>
              value !== ""
          )
        );

      const response =
        await getEMIPlans(
          params
        );

      setPlans(
        response?.data || []
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
    loadPlans({
      search: "",
      status: "",
    });
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFilters(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadPlans();
  }

  function handleReset() {
    const cleared = {
      search: "",
      status: "",
    };

    setFilters(cleared);
    loadPlans(cleared);
  }

  return (
    <section>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1 className="h3 mb-1">
            EMI Plans
          </h1>

          <p className="text-muted mb-0">
            Manage jewelry
            installment plans and
            approvals.
          </p>
        </div>

        <Link
          to="/emi-plans/new"
          className="btn btn-dark"
        >
          Create EMI Plan
        </Link>

      </div>

      <ErrorAlert
        message={error}
      />

      <div className="card page-card mb-4">
        <div className="card-body">

          <form
            className="row g-3"
            onSubmit={
              handleSubmit
            }
          >

            <div className="col-md-6">
              <label className="form-label">
                Search
              </label>

              <input
                name="search"
                className="form-control"
                placeholder="Plan, invoice, customer or phone"
                value={
                  filters.search
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Status
              </label>

              <select
                name="status"
                className="form-select"
                value={
                  filters.status
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  All
                </option>

                <option value="DRAFT">
                  Draft
                </option>

                <option value="PENDING_APPROVAL">
                  Pending Approval
                </option>

                <option value="REVISION_REQUIRED">
                  Revision Required
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end gap-2">

              <button
                className="btn btn-outline-dark"
              >
                Search
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={
                  handleReset
                }
              >
                Reset
              </button>

            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading EMI plans..." />
      ) : plans.length === 0 ? (
        <EmptyState message="No EMI plans found." />
      ) : (
        <div className="card page-card">

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-light">
                <tr>
                  <th>Plan</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>
                    Financed
                  </th>
                  <th>
                    EMI Payable
                  </th>
                  <th>
                    Installments
                  </th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {plans.map(
                  (plan) => (
                    <tr
                      key={
                        plan._id
                      }
                    >

                      <td className="fw-semibold">
                        {
                          plan.planNo
                        }
                      </td>

                      <td>
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
                      </td>

                      <td>
                        {plan.sale
                          ?.invoiceNumber ||
                          "—"}
                      </td>

                      <td>
                        {money(
                          plan.financedAmount
                        )}
                      </td>

                      <td>
                        {money(
                          plan.emiPayable
                        )}
                      </td>

                      <td>
                        {plan.installmentCount}
                        {" × "}
                        {prettify(
                          plan.frequency
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${statusClass(
                            plan.status
                          )}`}
                        >
                          {prettify(
                            plan.status
                          )}
                        </span>
                      </td>

                      <td>
                        <Link
                          to={`/emi-plans/${plan._id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </Link>
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

export default EMIPlansPage;
