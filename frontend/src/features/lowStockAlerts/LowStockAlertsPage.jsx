import {
  useEffect,
  useState,
} from "react";

import ErrorAlert from "../../components/ErrorAlert";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";

import {
  getLowStockAlerts,
  markLowStockAlertViewed,
  markLowStockReorderPlanned,
  resolveLowStockAlert,
  syncAllLowStockAlerts,
} from "./lowStockAlertService";

const categoryOptions = [
  "RING",
  "NECKLACE",
  "BRACELET",
  "EARRING",
  "CHAIN",
  "PENDANT",
  "BANGLE",
  "NOSE_PIN",
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

function getStatusBadge(status) {
  switch (status) {
    case "NEW":
      return "text-bg-danger";

    case "VIEWED":
      return "text-bg-warning";

    case "REORDER_PLANNED":
      return "text-bg-primary";

    case "RESOLVED":
      return "text-bg-success";

    default:
      return "text-bg-secondary";
  }
}

function LowStockAlertsPage() {
  const [alerts, setAlerts] =
    useState([]);

  const [summary, setSummary] =
    useState({
      unresolved: 0,
      new: 0,
    });

  const [filters, setFilters] =
    useState({
      search: "",
      status: "",
      category: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [syncing, setSyncing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadAlerts(
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
        await getLowStockAlerts(
          params
        );

      setAlerts(
        response.data || []
      );

      setSummary(
        response.summary || {
          unresolved: 0,
          new: 0,
        }
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
    loadAlerts({
      search: "",
      status: "",
      category: "",
    });
  }, []);

  function handleFilterChange(
    event
  ) {
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
    loadAlerts();
  }

  function handleReset() {
    const clearedFilters = {
      search: "",
      status: "",
      category: "",
    };

    setFilters(clearedFilters);
    loadAlerts(clearedFilters);
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setError("");
      setSuccess("");

      await syncAllLowStockAlerts();

      setSuccess(
        "Inventory stock levels synchronized successfully."
      );

      await loadAlerts();
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleViewed(
    alertId
  ) {
    try {
      setError("");
      setSuccess("");

      await markLowStockAlertViewed(
        alertId
      );

      setSuccess(
        "Alert marked as viewed."
      );

      await loadAlerts();
    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  }

  async function handleReorder(
    alertId
  ) {
    const notes =
      window.prompt(
        "Enter reorder notes:",
        "Supplier will be contacted"
      );

    if (notes === null) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await markLowStockReorderPlanned(
        alertId,
        notes
      );

      setSuccess(
        "Reorder marked as planned."
      );

      await loadAlerts();
    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  }

  async function handleResolve(
    alertId
  ) {
    const confirmed =
      window.confirm(
        "Resolve this low-stock alert?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await resolveLowStockAlert(
        alertId,
        "Resolved manually"
      );

      setSuccess(
        "Alert resolved."
      );

      await loadAlerts();
    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            Low Stock Alerts
          </h1>

          <p className="text-muted mb-0">
            Monitor items that have
            reached or fallen below
            their minimum stock level.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-dark"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing
            ? "Synchronizing..."
            : "Synchronize inventory"}
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card page-card h-100">
            <div className="card-body">
              <div className="text-muted">
                Unresolved alerts
              </div>

              <div className="display-6 fw-semibold">
                {summary.unresolved}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card page-card h-100">
            <div className="card-body">
              <div className="text-muted">
                New alerts
              </div>

              <div className="display-6 fw-semibold">
                {summary.new}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card page-card h-100">
            <div className="card-body">
              <div className="text-muted">
                Displayed records
              </div>

              <div className="display-6 fw-semibold">
                {alerts.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ErrorAlert
        message={error}
      />

      {success && (
        <div
          className="alert alert-success"
          role="alert"
        >
          {success}
        </div>
      )}

      <div className="card page-card mb-4">
        <div className="card-body">
          <form
            className="row g-3"
            onSubmit={handleSearch}
          >
            <div className="col-md-4">
              <label className="form-label">
                Product
              </label>

              <input
                name="search"
                className="form-control"
                placeholder="Search by SKU or name"
                value={
                  filters.search
                }
                onChange={
                  handleFilterChange
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
                  handleFilterChange
                }
              >
                <option value="">
                  All statuses
                </option>

                <option value="NEW">
                  New
                </option>

                <option value="VIEWED">
                  Viewed
                </option>

                <option value="REORDER_PLANNED">
                  Reorder planned
                </option>

                <option value="RESOLVED">
                  Resolved
                </option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Category
              </label>

              <select
                name="category"
                className="form-select"
                value={
                  filters.category
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  All categories
                </option>

                {categoryOptions.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {prettify(
                        category
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-outline-dark"
              >
                Search
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading low-stock alerts..." />
      ) : alerts.length === 0 ? (
        <EmptyState message="No low-stock alerts found." />
      ) : (
        <div className="card page-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>
                    Current stock
                  </th>
                  <th>
                    Minimum level
                  </th>
                  <th>
                    Suggested reorder
                  </th>
                  <th>Status</th>
                  <th>
                    Last triggered
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {alerts.map(
                  (alert) => {
                    const item =
                      alert.jewelryItem;

                    return (
                      <tr
                        key={alert._id}
                      >
                        <td>
                          <div className="fw-semibold">
                            {item?.name ||
                              "Deleted item"}
                          </div>

                          <div className="small text-muted">
                            {item?.sku ||
                              "—"}
                          </div>
                        </td>

                        <td>
                          {prettify(
                            item?.category
                          )}
                        </td>

                        <td>
                          <span className="fw-semibold text-danger">
                            {
                              alert.currentQuantity
                            }
                          </span>
                        </td>

                        <td>
                          {
                            alert.minStockLevel
                          }
                        </td>

                        <td>
                          {
                            alert.suggestedReorderQuantity
                          }
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusBadge(
                              alert.status
                            )}`}
                          >
                            {prettify(
                              alert.status
                            )}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            alert.lastTriggeredAt
                          )}
                        </td>

                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {alert.status ===
                              "NEW" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  handleViewed(
                                    alert._id
                                  )
                                }
                              >
                                Mark viewed
                              </button>
                            )}

                            {[
                              "NEW",
                              "VIEWED",
                            ].includes(
                              alert.status
                            ) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  handleReorder(
                                    alert._id
                                  )
                                }
                              >
                                Plan reorder
                              </button>
                            )}

                            {alert.status !==
                              "RESOLVED" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  handleResolve(
                                    alert._id
                                  )
                                }
                              >
                                Resolve
                              </button>
                            )}
                          </div>
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

export default LowStockAlertsPage;
