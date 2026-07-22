import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  getStockAdjustments,
} from "./stockAdjustmentService";

const reasonOptions = [
  "PHYSICAL_COUNT_CORRECTION",
  "DAMAGED_ITEM",
  "LOST_ITEM",
  "FOUND_ITEM",
  "DATA_ENTRY_CORRECTION",
  "SUPPLIER_CORRECTION",
  "RETURN_OR_REPAIR",
  "OTHER",
];

function prettify(value) {
  return String(value || "—")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString("en-BD");
}

function StockAdjustmentsPage() {
  const [
    adjustments,
    setAdjustments,
  ] = useState([]);

  const [filters, setFilters] =
    useState({
      search: "",
      direction: "",
      reason: "",
      dateFrom: "",
      dateTo: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadAdjustments(
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
            ([, value]) => value
          )
        );

      const response =
        await getStockAdjustments(
          params
        );

      setAdjustments(
        response.data || []
      );
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdjustments({
      search: "",
      direction: "",
      reason: "",
      dateFrom: "",
      dateTo: "",
    });
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();
    loadAdjustments();
  }

  function handleReset() {
    const cleared = {
      search: "",
      direction: "",
      reason: "",
      dateFrom: "",
      dateTo: "",
    };

    setFilters(cleared);
    loadAdjustments(cleared);
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            Stock Adjustments
          </h1>

          <p className="text-muted mb-0">
            Review inventory quantity
            changes and their audit
            history.
          </p>
        </div>

        <Link
          to="/stock-adjustments/new"
          className="btn btn-dark"
        >
          New adjustment
        </Link>
      </div>

      <div className="card page-card mb-4">
        <div className="card-body">
          <form
            className="row g-3"
            onSubmit={handleSearch}
          >
            <div className="col-lg-3">
              <label className="form-label">
                Item
              </label>

              <input
                name="search"
                className="form-control"
                placeholder="Search by SKU or item name"
                value={
                  filters.search
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label">
                Direction
              </label>

              <select
                name="direction"
                className="form-select"
                value={
                  filters.direction
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  All directions
                </option>

                <option value="INCREASE">
                  Increase
                </option>

                <option value="DECREASE">
                  Decrease
                </option>
              </select>
            </div>

            <div className="col-md-4 col-lg-3">
              <label className="form-label">
                Reason
              </label>

              <select
                name="reason"
                className="form-select"
                value={
                  filters.reason
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  All reasons
                </option>

                {reasonOptions.map(
                  (reason) => (
                    <option
                      key={reason}
                      value={reason}
                    >
                      {prettify(
                        reason
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label">
                From
              </label>

              <input
                name="dateFrom"
                type="date"
                className="form-control"
                value={
                  filters.dateFrom
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label">
                To
              </label>

              <input
                name="dateTo"
                type="date"
                className="form-control"
                value={
                  filters.dateTo
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                className="btn btn-outline-dark"
                type="submit"
              >
                Search
              </button>

              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErrorAlert
        message={error}
      />

      {loading ? (
        <LoadingState message="Loading stock adjustments..." />
      ) : adjustments.length ===
        0 ? (
        <EmptyState message="No stock adjustments found." />
      ) : (
        <div className="card page-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>
                    Adjustment
                  </th>
                  <th>Item</th>
                  <th>Change</th>
                  <th>
                    Quantity
                  </th>
                  <th>Reason</th>
                  <th>
                    Adjusted by
                  </th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {adjustments.map(
                  (adjustment) => (
                    <tr
                      key={
                        adjustment._id
                      }
                    >
                      <td className="fw-semibold">
                        {
                          adjustment.adjustmentId
                        }
                      </td>

                      <td>
                        <div className="fw-semibold">
                          {
                            adjustment
                              .jewelryItem
                              ?.name
                          }
                        </div>

                        <div className="small text-muted">
                          {
                            adjustment
                              .jewelryItem
                              ?.sku
                          }
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            adjustment.direction ===
                            "INCREASE"
                              ? "text-bg-success"
                              : "text-bg-danger"
                          }`}
                        >
                          {adjustment.direction ===
                          "INCREASE"
                            ? "+"
                            : "-"}
                          {
                            adjustment.adjustmentAmount
                          }
                        </span>
                      </td>

                      <td>
                        {
                          adjustment.previousQuantity
                        }
                        {" → "}
                        <strong>
                          {
                            adjustment.newQuantity
                          }
                        </strong>
                      </td>

                      <td>
                        {prettify(
                          adjustment.reason
                        )}
                      </td>

                      <td>
                        {
                          adjustment.adjustedBy
                        }
                      </td>

                      <td>
                        {formatDate(
                          adjustment.createdAt
                        )}
                      </td>

                      <td>
                        <Link
                          to={`/stock-adjustments/${adjustment._id}`}
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

export default StockAdjustmentsPage;
