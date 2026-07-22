import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  deactivateInventoryItem,
  getInventoryItems,
} from "./inventoryService";

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

const purityOptions = [
  "18K",
  "21K",
  "22K",
  "24K",
];

const statusOptions = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "DAMAGED",
  "RETURNED",
  "UNDER_REPAIR",
  "INACTIVE",
];

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `৳${Number(value).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatWeight(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${Number(value).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 3,
    }
  )} g`;
}

function prettify(value) {
  return String(value || "—")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "AVAILABLE":
      return "text-bg-success";

    case "RESERVED":
      return "text-bg-warning";

    case "SOLD":
      return "text-bg-primary";

    case "DAMAGED":
    case "RETURNED":
      return "text-bg-danger";

    case "UNDER_REPAIR":
      return "text-bg-info";

    case "INACTIVE":
      return "text-bg-secondary";

    default:
      return "text-bg-secondary";
  }
}

function InventoryPage() {
  const [items, setItems] =
    useState([]);

  const [filters, setFilters] =
    useState({
      search: "",
      category: "",
      purity: "",
      status: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [
    deactivatingId,
    setDeactivatingId,
  ] = useState("");

  const [error, setError] =
    useState("");

  async function loadItems(
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
        await getInventoryItems(
          params
        );

      setItems(response.data || []);
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems({
      search: "",
      category: "",
      purity: "",
      status: "",
    });
  }, []);

  function handleFilterChange(event) {
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
    loadItems();
  }

  function handleReset() {
    const clearedFilters = {
      search: "",
      category: "",
      purity: "",
      status: "",
    };

    setFilters(clearedFilters);
    loadItems(clearedFilters);
  }

  async function handleDeactivate(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to deactivate this inventory item?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingId(id);
      setError("");

      await deactivateInventoryItem(
        id
      );

      await loadItems();
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setDeactivatingId("");
    }
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            Inventory
          </h1>

          <p className="text-muted mb-0">
            Manage jewelry items,
            weight, making charge,
            stock, and product images.
          </p>
        </div>

        <Link
          to="/inventory/new"
          className="btn btn-dark"
        >
          Add inventory item
        </Link>
      </div>

      <div className="card page-card mb-4">
        <div className="card-body">
          <form
            className="row g-3"
            onSubmit={handleSearch}
          >
            <div className="col-lg-4">
              <label
                htmlFor="inventory-search"
                className="form-label"
              >
                Search
              </label>

              <input
                id="inventory-search"
                name="search"
                type="search"
                className="form-control"
                placeholder="Search by SKU or item name"
                value={
                  filters.search
                }
                onChange={
                  handleFilterChange
                }
              />
            </div>

            <div className="col-md-4 col-lg-2">
              <label
                htmlFor="inventory-category"
                className="form-label"
              >
                Category
              </label>

              <select
                id="inventory-category"
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

            <div className="col-md-4 col-lg-2">
              <label
                htmlFor="inventory-purity"
                className="form-label"
              >
                Purity
              </label>

              <select
                id="inventory-purity"
                name="purity"
                className="form-select"
                value={
                  filters.purity
                }
                onChange={
                  handleFilterChange
                }
              >
                <option value="">
                  All purities
                </option>

                {purityOptions.map(
                  (purity) => (
                    <option
                      key={purity}
                      value={purity}
                    >
                      {purity}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label
                htmlFor="inventory-status"
                className="form-label"
              >
                Status
              </label>

              <select
                id="inventory-status"
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

                {statusOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {prettify(
                        status
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-lg-2 d-flex align-items-end gap-2">
              <button
                type="submit"
                className="btn btn-outline-dark flex-grow-1"
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

      <ErrorAlert
        message={error}
      />

      {loading ? (
        <LoadingState message="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState message="No inventory items found." />
      ) : (
        <div className="card page-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Photo</th>
                  <th>SKU</th>
                  <th>Item</th>
                  <th>Purity</th>
                  <th>Weight</th>
                  <th>
                    Making charge
                  </th>
                  <th>
                    Purchase cost
                  </th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (item) => {
                    const lowStock =
                      Number(
                        item.quantity
                      ) <=
                      Number(
                        item.minStockLevel
                      );

                    return (
                      <tr
                        key={item._id}
                      >
                        <td>
                          {item.imageUrl ? (
                            <img
                              src={
                                item.imageUrl
                              }
                              alt={
                                item.name
                              }
                              className="inventory-thumbnail"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="inventory-thumbnail inventory-thumbnail-placeholder">
                              No image
                            </div>
                          )}
                        </td>

                        <td className="fw-semibold">
                          {item.sku}
                        </td>

                        <td>
                          <div className="fw-semibold">
                            {item.name}
                          </div>

                          <div className="small text-muted">
                            {prettify(
                              item.category
                            )}
                          </div>
                        </td>

                        <td>
                          {item.purity}
                        </td>

                        <td>
                          <div>
                            Net:{" "}
                            {formatWeight(
                              item.netGoldWeight
                            )}
                          </div>

                          <div className="small text-muted">
                            Gross:{" "}
                            {formatWeight(
                              item.grossWeight
                            )}
                          </div>

                          {Number(
                            item.stoneWeight
                          ) > 0 && (
                            <div className="small text-muted">
                              Stone:{" "}
                              {formatWeight(
                                item.stoneWeight
                              )}
                            </div>
                          )}
                        </td>

                        <td>
                          <div>
                            {formatCurrency(
                              item.makingChargeAmount
                            )}
                          </div>

                          <div className="small text-muted">
                            {prettify(
                              item.makingChargeType
                            )}
                          </div>
                        </td>

                        <td>
                          {formatCurrency(
                            item.purchaseCost
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              lowStock
                                ? "text-danger fw-semibold"
                                : ""
                            }
                          >
                            {
                              item.quantity
                            }
                          </span>

                          <div className="small text-muted">
                            Minimum:{" "}
                            {
                              item.minStockLevel
                            }
                          </div>

                          {lowStock && (
                            <div className="small text-danger">
                              Low stock
                            </div>
                          )}
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {prettify(
                              item.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Link
                              to={`/inventory/${item._id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Edit
                            </Link>

                            {item.status !==
                              "INACTIVE" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={
                                  deactivatingId ===
                                  item._id
                                }
                                onClick={() =>
                                  handleDeactivate(
                                    item._id
                                  )
                                }
                              >
                                {deactivatingId ===
                                item._id
                                  ? "Deactivating..."
                                  : "Deactivate"}
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

export default InventoryPage;
