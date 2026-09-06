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
  getStockAdjustmentById,
} from "./stockAdjustmentService";

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

function StockAdjustmentDetailsPage() {
  const { id } =
    useParams();

  const [
    adjustment,
    setAdjustment,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadAdjustment() {
      try {
        setError("");

        const response =
          await getStockAdjustmentById(
            id
          );

        setAdjustment(
          response.data
        );
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadAdjustment();
  }, [id]);

  if (loading) {
    return (
      <LoadingState message="Loading adjustment..." />
    );
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          Adjustment Details
        </h1>

        <Link
          to="/stock-adjustments"
          className="btn btn-outline-secondary"
        >
          Back
        </Link>
      </div>

      <ErrorAlert
        message={error}
      />

      {adjustment && (
        <div className="card page-card">
          <div className="card-body">
            <dl className="row mb-0">
              <dt className="col-sm-4">
                Adjustment ID
              </dt>

              <dd className="col-sm-8">
                {
                  adjustment.adjustmentId
                }
              </dd>

              <dt className="col-sm-4">
                Item
              </dt>

              <dd className="col-sm-8">
                {
                  adjustment
                    .jewelryItem?.name
                }
                {" — "}
                {
                  adjustment
                    .jewelryItem?.sku
                }
              </dd>

              <dt className="col-sm-4">
                Direction
              </dt>

              <dd className="col-sm-8">
                {prettify(
                  adjustment.direction
                )}
              </dd>

              <dt className="col-sm-4">
                Adjustment amount
              </dt>

              <dd className="col-sm-8">
                {
                  adjustment.adjustmentAmount
                }
              </dd>

              <dt className="col-sm-4">
                Quantity change
              </dt>

              <dd className="col-sm-8">
                {
                  adjustment.previousQuantity
                }
                {" → "}
                {
                  adjustment.newQuantity
                }
              </dd>

              <dt className="col-sm-4">
                Reason
              </dt>

              <dd className="col-sm-8">
                {prettify(
                  adjustment.reason
                )}
              </dd>

              <dt className="col-sm-4">
                Notes
              </dt>

              <dd className="col-sm-8">
                {adjustment.notes ||
                  "—"}
              </dd>

              <dt className="col-sm-4">
                Adjusted by
              </dt>

              <dd className="col-sm-8">
                {
                  adjustment.adjustedBy
                }
              </dd>

              <dt className="col-sm-4">
                Date
              </dt>

              <dd className="col-sm-8">
                {new Date(
                  adjustment.createdAt
                ).toLocaleString(
                  "en-BD"
                )}
              </dd>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}

export default StockAdjustmentDetailsPage;
