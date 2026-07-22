import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  createStockAdjustment,
  getInventoryItems,
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
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function StockAdjustmentFormPage() {
  const navigate =
    useNavigate();

  const [items, setItems] =
    useState([]);

  const [formData, setFormData] =
    useState({
      jewelryItem: "",
      direction: "INCREASE",
      adjustmentAmount: "1",
      reason:
        "PHYSICAL_COUNT_CORRECTION",
      notes: "",
      adjustedBy: "Admin",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        setError("");

        const response =
          await getInventoryItems();

        const activeItems =
          (response.data || []).filter(
            (item) =>
              item.status !==
              "INACTIVE"
          );

        setItems(activeItems);
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  const selectedItem =
    useMemo(
      () =>
        items.find(
          (item) =>
            item._id ===
            formData.jewelryItem
        ),
      [
        items,
        formData.jewelryItem,
      ]
    );

  const previewQuantity =
    useMemo(() => {
      if (!selectedItem) {
        return null;
      }

      const currentQuantity =
        Number(
          selectedItem.quantity
        );

      const amount =
        Number(
          formData.adjustmentAmount
        ) || 0;

      if (
        formData.direction ===
        "INCREASE"
      ) {
        return (
          currentQuantity + amount
        );
      }

      return (
        currentQuantity - amount
      );
    }, [
      selectedItem,
      formData.direction,
      formData.adjustmentAmount,
    ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const amount =
      Number(
        formData.adjustmentAmount
      );

    if (!formData.jewelryItem) {
      setError(
        "Please select an inventory item."
      );

      return;
    }

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setError(
        "Adjustment amount must be a positive whole number."
      );

      return;
    }

    if (
      previewQuantity !== null &&
      previewQuantity < 0
    ) {
      setError(
        "This adjustment would make stock negative."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      await createStockAdjustment({
        ...formData,

        adjustmentAmount:
          amount,
      });

      navigate(
        "/stock-adjustments"
      );
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LoadingState message="Loading inventory items..." />
    );
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            New Stock Adjustment
          </h1>

          <p className="text-muted mb-0">
            Increase or decrease
            inventory while preserving
            an audit record.
          </p>
        </div>

        <Link
          to="/stock-adjustments"
          className="btn btn-outline-secondary"
        >
          Back to history
        </Link>
      </div>

      <ErrorAlert
        message={error}
      />

      <div className="card page-card">
        <div className="card-body">
          <form
            className="row g-3"
            onSubmit={handleSubmit}
          >
            <div className="col-12">
              <label className="form-label">
                Inventory item
              </label>

              <select
                name="jewelryItem"
                className="form-select"
                value={
                  formData.jewelryItem
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="">
                  Select an item
                </option>

                {items.map(
                  (item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.sku} —{" "}
                      {item.name} (
                      Stock:{" "}
                      {item.quantity})
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedItem && (
              <div className="col-12">
                <div className="alert alert-light border mb-0">
                  <strong>
                    {
                      selectedItem.name
                    }
                  </strong>

                  <div className="small text-muted mt-1">
                    SKU:{" "}
                    {selectedItem.sku}
                    {" • "}
                    Current quantity:{" "}
                    {
                      selectedItem.quantity
                    }
                    {" • "}
                    Status:{" "}
                    {
                      selectedItem.status
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="col-md-4">
              <label className="form-label">
                Direction
              </label>

              <select
                name="direction"
                className="form-select"
                value={
                  formData.direction
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="INCREASE">
                  Increase
                </option>

                <option value="DECREASE">
                  Decrease
                </option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Adjustment amount
              </label>

              <input
                name="adjustmentAmount"
                type="number"
                min="1"
                step="1"
                className="form-control"
                value={
                  formData.adjustmentAmount
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                New quantity
              </label>

              <div
                className={`form-control ${
                  previewQuantity !==
                    null &&
                  previewQuantity < 0
                    ? "is-invalid"
                    : "bg-light"
                }`}
              >
                {previewQuantity ===
                null
                  ? "Select an item"
                  : previewQuantity}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Reason
              </label>

              <select
                name="reason"
                className="form-select"
                value={
                  formData.reason
                }
                onChange={
                  handleChange
                }
                required
              >
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

            <div className="col-md-6">
              <label className="form-label">
                Adjusted by
              </label>

              <input
                name="adjustedBy"
                className="form-control"
                value={
                  formData.adjustedBy
                }
                onChange={
                  handleChange
                }
                placeholder="Admin or staff name"
              />
            </div>

            <div className="col-12">
              <label className="form-label">
                Notes
              </label>

              <textarea
                name="notes"
                className="form-control"
                rows="4"
                value={
                  formData.notes
                }
                onChange={
                  handleChange
                }
                placeholder="Explain why this adjustment is required"
              />
            </div>

            <div className="col-12">
              <button
                className="btn btn-dark"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Confirm adjustment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default StockAdjustmentFormPage;
