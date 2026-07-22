import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
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

const makingChargeOptions = [
  "FIXED",
  "PER_GRAM",
  "PER_BHORI",
  "PERCENTAGE",
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

const emptyForm = {
  sku: "",
  name: "",
  category: "RING",
  purity: "22K",

  grossWeight: "",
  stoneWeight: "0",
  stoneQuantity: "0",
  stonePrice: "0",

  makingChargeType: "PER_GRAM",
  makingChargeAmount: "0",

  purchaseCost: "0",

  quantity: "1",
  minStockLevel: "1",

  imageUrl: "",
  supplierReference: "",

  status: "AVAILABLE",
};

const numericFields = [
  "grossWeight",
  "stoneWeight",
  "stoneQuantity",
  "stonePrice",
  "makingChargeAmount",
  "purchaseCost",
  "quantity",
  "minStockLevel",
];

function prettify(value) {
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
}

function InventoryFormPage() {
  const { id } = useParams();

  const navigate =
    useNavigate();

  const isEdit =
    Boolean(id);

  const [formData, setFormData] =
    useState(emptyForm);

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);

  const [
    imageError,
    setImageError,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const netGoldWeight =
    useMemo(() => {
      const grossWeight =
        Number(
          formData.grossWeight
        ) || 0;

      const stoneWeight =
        Number(
          formData.stoneWeight
        ) || 0;

      return Math.max(
        grossWeight -
          stoneWeight,
        0
      );
    }, [
      formData.grossWeight,
      formData.stoneWeight,
    ]);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    async function loadItem() {
      try {
        setError("");

        const response =
          await getInventoryItemById(
            id
          );

        const item =
          response.data || {};

        setFormData({
          ...emptyForm,
          ...item,

          grossWeight:
            item.grossWeight ??
            "",

          stoneWeight:
            item.stoneWeight ??
            "0",

          stoneQuantity:
            item.stoneQuantity ??
            "0",

          stonePrice:
            item.stonePrice ??
            "0",

          makingChargeAmount:
            item.makingChargeAmount ??
            "0",

          purchaseCost:
            item.purchaseCost ??
            "0",

          quantity:
            item.quantity ??
            "1",

          minStockLevel:
            item.minStockLevel ??
            "1",
        });
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [id, isEdit]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    if (name === "imageUrl") {
      setImageError(false);
    }

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  function validateForm() {
    const grossWeight =
      Number(
        formData.grossWeight
      );

    const stoneWeight =
      Number(
        formData.stoneWeight
      );

    const stoneQuantity =
      Number(
        formData.stoneQuantity
      );

    const quantity =
      Number(
        formData.quantity
      );

    const minStockLevel =
      Number(
        formData.minStockLevel
      );

    if (
      !Number.isFinite(
        grossWeight
      ) ||
      grossWeight < 0
    ) {
      return "Gross weight must be a valid non-negative number.";
    }

    if (
      !Number.isFinite(
        stoneWeight
      ) ||
      stoneWeight < 0
    ) {
      return "Stone weight must be a valid non-negative number.";
    }

    if (
      stoneWeight >
      grossWeight
    ) {
      return "Stone weight cannot exceed gross weight.";
    }

    if (
      !Number.isInteger(
        stoneQuantity
      ) ||
      stoneQuantity < 0
    ) {
      return "Stone quantity must be a non-negative whole number.";
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity < 0
    ) {
      return "Quantity must be a non-negative whole number.";
    }

    if (
      !Number.isInteger(
        minStockLevel
      ) ||
      minStockLevel < 0
    ) {
      return "Minimum stock level must be a non-negative whole number.";
    }

    return "";
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,
      };

      numericFields.forEach(
        (field) => {
          payload[field] =
            Number(
              payload[field]
            );
        }
      );

      if (isEdit) {
        const {
          sku,
          _id,
          netGoldWeight,
          createdAt,
          updatedAt,
          __v,
          ...updates
        } = payload;

        await updateInventoryItem(
          id,
          updates
        );
      } else {
        await createInventoryItem(
          payload
        );
      }

      navigate(
        "/inventory"
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
      <LoadingState message="Loading inventory item..." />
    );
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            {isEdit
              ? "Edit inventory item"
              : "Add inventory item"}
          </h1>

          <p className="text-muted mb-0">
            Add jewelry
            specifications, weights,
            making charge, stock, and
            product information.
          </p>
        </div>

        <Link
          to="/inventory"
          className="btn btn-outline-secondary"
        >
          Back to inventory
        </Link>
      </div>

      <ErrorAlert
        message={error}
      />

      <form
        onSubmit={handleSubmit}
      >
        <div className="card page-card mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">
              Basic information
            </h2>
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label
                  htmlFor="sku"
                  className="form-label"
                >
                  SKU
                </label>

                <input
                  id="sku"
                  name="sku"
                  className="form-control"
                  value={
                    formData.sku
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isEdit
                  }
                  required
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="name"
                  className="form-label"
                >
                  Item name
                </label>

                <input
                  id="name"
                  name="name"
                  className="form-control"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="category"
                  className="form-label"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  className="form-select"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
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

              <div className="col-md-4">
                <label
                  htmlFor="purity"
                  className="form-label"
                >
                  Gold purity
                </label>

                <select
                  id="purity"
                  name="purity"
                  className="form-select"
                  value={
                    formData.purity
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
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

              <div className="col-md-4">
                <label
                  htmlFor="status"
                  className="form-label"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={
                    formData.status
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
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
            </div>
          </div>
        </div>

        <div className="card page-card mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">
              Weight and stone details
            </h2>
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label
                  htmlFor="grossWeight"
                  className="form-label"
                >
                  Gross weight
                  (grams)
                </label>

                <input
                  id="grossWeight"
                  name="grossWeight"
                  type="number"
                  min="0"
                  step="0.001"
                  className="form-control"
                  value={
                    formData.grossWeight
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="stoneWeight"
                  className="form-label"
                >
                  Stone weight
                  (grams)
                </label>

                <input
                  id="stoneWeight"
                  name="stoneWeight"
                  type="number"
                  min="0"
                  step="0.001"
                  className="form-control"
                  value={
                    formData.stoneWeight
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Net gold weight
                </label>

                <div className="form-control bg-light">
                  {netGoldWeight.toFixed(
                    3
                  )}{" "}
                  grams
                </div>

                <div className="form-text">
                  The backend
                  calculates and stores
                  this value.
                </div>
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="stoneQuantity"
                  className="form-label"
                >
                  Stone quantity
                </label>

                <input
                  id="stoneQuantity"
                  name="stoneQuantity"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={
                    formData.stoneQuantity
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="stonePrice"
                  className="form-label"
                >
                  Total stone price
                </label>

                <input
                  id="stonePrice"
                  name="stonePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={
                    formData.stonePrice
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card page-card mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">
              Cost and making charge
            </h2>
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label
                  htmlFor="makingChargeType"
                  className="form-label"
                >
                  Making charge type
                </label>

                <select
                  id="makingChargeType"
                  name="makingChargeType"
                  className="form-select"
                  value={
                    formData.makingChargeType
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  {makingChargeOptions.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {prettify(
                          type
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="makingChargeAmount"
                  className="form-label"
                >
                  Making charge
                  amount
                </label>

                <input
                  id="makingChargeAmount"
                  name="makingChargeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={
                    formData.makingChargeAmount
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="purchaseCost"
                  className="form-label"
                >
                  Purchase cost
                </label>

                <input
                  id="purchaseCost"
                  name="purchaseCost"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={
                    formData.purchaseCost
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-12">
                <div className="alert alert-info mb-0">
                  Selling price is not
                  stored in the
                  inventory document.
                  It can later be
                  calculated from the
                  net gold weight,
                  active gold rate,
                  making charge, and
                  stone price.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card page-card mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 mb-0">
              Stock and media
            </h2>
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label
                  htmlFor="quantity"
                  className="form-label"
                >
                  Quantity
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={
                    formData.quantity
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="minStockLevel"
                  className="form-label"
                >
                  Minimum stock
                  level
                </label>

                <input
                  id="minStockLevel"
                  name="minStockLevel"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={
                    formData.minStockLevel
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="supplierReference"
                  className="form-label"
                >
                  Supplier
                  reference
                </label>

                <input
                  id="supplierReference"
                  name="supplierReference"
                  className="form-control"
                  value={
                    formData.supplierReference
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-12">
                <label
                  htmlFor="imageUrl"
                  className="form-label"
                >
                  Product image URL
                </label>

                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/item.jpg"
                  value={
                    formData.imageUrl
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              {formData.imageUrl &&
                !imageError && (
                  <div className="col-12">
                    <p className="form-label">
                      Image preview
                    </p>

                    <img
                      src={
                        formData.imageUrl
                      }
                      alt="Inventory preview"
                      className="inventory-image-preview"
                      onError={() =>
                        setImageError(
                          true
                        )
                      }
                    />
                  </div>
                )}

              {formData.imageUrl &&
                imageError && (
                  <div className="col-12">
                    <div className="alert alert-warning mb-0">
                      The image URL
                      could not be
                      loaded.
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-dark"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Update item"
                : "Create item"}
          </button>

          <Link
            to="/inventory"
            className="btn btn-outline-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

export default InventoryFormPage;
