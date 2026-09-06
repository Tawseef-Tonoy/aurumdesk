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
  createEMIPlan,
  getCustomers,
  getEMIPlanById,
  getSales,
  updateEMIPlan,
} from "./emiPlanService";

const emptyForm = {
  customer: "",
  sale: "",
  downPayment: "0",
  serviceCharge: "0",
  installmentCount: "6",
  frequency: "MONTHLY",
  firstDueDate: "",
  gracePeriodDays: "0",
  referenceName: "",
  referencePhone: "",
  guarantorName: "",
  guarantorPhone: "",
  preparedBy: "Admin",
  notes: "",
};

function customerName(customer) {
  return (
    customer?.name ||
    customer?.fullName ||
    "Unnamed customer"
  );
}

function formatMoney(amount) {
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

function addMonthsClamped(
  originalDate,
  months
) {
  const date =
    new Date(originalDate);

  const day =
    date.getDate();

  date.setDate(1);

  date.setMonth(
    date.getMonth() + months
  );

  const lastDay =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

  date.setDate(
    Math.min(day, lastDay)
  );

  return date;
}

function calculateDueDate(
  firstDueDate,
  frequency,
  index
) {
  const date =
    new Date(firstDueDate);

  if (frequency === "WEEKLY") {
    date.setDate(
      date.getDate() +
        index * 7
    );

    return date;
  }

  if (
    frequency ===
    "BIWEEKLY"
  ) {
    date.setDate(
      date.getDate() +
        index * 14
    );

    return date;
  }

  return addMonthsClamped(
    date,
    index
  );
}

function EMIPlanFormPage() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const isEdit =
    Boolean(id);

  const [customers, setCustomers] =
    useState([]);

  const [sales, setSales] =
    useState([]);

  const [formData, setFormData] =
    useState(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          customerResponse,
          salesResponse,
          planResponse,
        ] = await Promise.all([
          getCustomers(),
          getSales(),
          isEdit
            ? getEMIPlanById(id)
            : Promise.resolve(null),
        ]);

        /*
          Customers API returns:
          {
            success,
            count,
            data: [...]
          }

          Sales API currently returns:
          [...]
        */

        const customerList =
          Array.isArray(
            customerResponse
          )
            ? customerResponse
            : Array.isArray(
                customerResponse?.data
              )
              ? customerResponse.data
              : customerResponse?.customers ||
                [];

        const salesList =
          Array.isArray(
            salesResponse
          )
            ? salesResponse
            : Array.isArray(
                salesResponse?.data
              )
              ? salesResponse.data
              : salesResponse?.sales ||
                [];

        setCustomers(
          customerList
        );

        setSales(
          salesList
        );

        if (
          isEdit &&
          planResponse?.data
        ) {
          const plan =
            planResponse.data;

          setFormData({
            customer:
              plan.customer?._id ||
              plan.customer ||
              "",

            sale:
              plan.sale?._id ||
              plan.sale ||
              "",

            downPayment:
              String(
                plan.downPayment ??
                  0
              ),

            serviceCharge:
              String(
                plan.serviceCharge ??
                  0
              ),

            installmentCount:
              String(
                plan.installmentCount ??
                  6
              ),

            frequency:
              plan.frequency ||
              "MONTHLY",

            firstDueDate:
              plan.firstDueDate
                ? new Date(
                    plan.firstDueDate
                  )
                    .toISOString()
                    .slice(0, 10)
                : "",

            gracePeriodDays:
              String(
                plan.gracePeriodDays ??
                  0
              ),

            referenceName:
              plan.referenceName ||
              "",

            referencePhone:
              plan.referencePhone ||
              "",

            guarantorName:
              plan.guarantorName ||
              "",

            guarantorPhone:
              plan.guarantorPhone ||
              "",

            preparedBy:
              plan.preparedBy ||
              "Admin",

            notes:
              plan.notes || "",
          });
        }
      } catch (requestError) {
        console.error(
          requestError
        );

        setError(
          requestError.response
            ?.data?.message ||
          requestError.message ||
          "Failed to load EMI information"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isEdit]);

  const eligibleSales =
    useMemo(() => {
      if (!formData.customer) {
        return [];
      }

      return sales.filter(
        (sale) => {
          const saleCustomerId =
            sale.customer?._id ||
            sale.customer ||
            sale.customerId?._id ||
            sale.customerId ||
            "";

          const status =
            String(
              sale.status || ""
            ).toUpperCase();

          const dueAmount =
            Number(
              sale.dueAmount ??
                (
                  Number(
                    sale.totalAmount ||
                      0
                  ) -
                  Number(
                    sale.paidAmount ||
                      0
                  )
                )
            );

          return (
            String(
              saleCustomerId
            ) ===
              String(
                formData.customer
              ) &&
            status ===
              "CONFIRMED" &&
            dueAmount > 0
          );
        }
      );
    }, [
      sales,
      formData.customer,
    ]);

  const selectedSale =
    useMemo(() => {
      return sales.find(
        (sale) =>
          String(sale._id) ===
          String(formData.sale)
      );
    }, [
      sales,
      formData.sale,
    ]);

  const calculations =
    useMemo(() => {
      const total =
        Number(
          selectedSale
            ?.totalAmount ||
            0
        );

      /*
        Existing payment on the
        confirmed sale becomes the
        EMI down payment.
      */
      const down =
        Number(
          selectedSale
            ?.paidAmount ||
            formData.downPayment ||
            0
        );

      const service =
        Number(
          formData
            .serviceCharge ||
            0
        );

      const count =
        Number(
          formData
            .installmentCount ||
            0
        );

      const financed =
        Math.max(
          total - down,
          0
        );

      const payable =
        financed + service;

      const installment =
        count > 0
          ? payable / count
          : 0;

      return {
        total,
        down,
        financed,
        payable,
        installment,
      };
    }, [
      selectedSale,
      formData.downPayment,
      formData.serviceCharge,
      formData.installmentCount,
    ]);

  const schedulePreview =
    useMemo(() => {
      if (
        !formData.firstDueDate
      ) {
        return [];
      }

      const count =
        Number(
          formData.installmentCount
        );

      if (
        !Number.isInteger(
          count
        ) ||
        count < 1
      ) {
        return [];
      }

      const total =
        Math.round(
          calculations.payable *
            100
        ) / 100;

      if (total <= 0) {
        return [];
      }

      const regular =
        Math.floor(
          (total / count) *
            100
        ) / 100;

      let allocated = 0;

      return Array.from(
        {
          length: count,
        },
        (_, index) => {
          let amount;

          if (
            index ===
            count - 1
          ) {
            amount =
              Math.round(
                (
                  total -
                  allocated
                ) * 100
              ) / 100;
          } else {
            amount = regular;

            allocated =
              Math.round(
                (
                  allocated +
                  amount
                ) * 100
              ) / 100;
          }

          return {
            installmentNo:
              index + 1,

            dueDate:
              calculateDueDate(
                formData.firstDueDate,
                formData.frequency,
                index
              ),

            amount,
          };
        }
      );
    }, [
      formData.firstDueDate,
      formData.installmentCount,
      formData.frequency,
      calculations.payable,
    ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    if (name === "customer") {
      setFormData(
        (current) => ({
          ...current,
          customer: value,
          sale: "",
          downPayment: "0",
        })
      );

      return;
    }

    if (name === "sale") {
      const sale =
        sales.find(
          (entry) =>
            String(entry._id) ===
            String(value)
        );

      setFormData(
        (current) => ({
          ...current,
          sale: value,

          downPayment:
            String(
              sale?.paidAmount ||
                0
            ),
        })
      );

      return;
    }

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  function validateForm() {
    if (
      !formData.customer
    ) {
      return "Please select a customer.";
    }

    if (!formData.sale) {
      return "Please select an eligible sale.";
    }

    if (!selectedSale) {
      return "Selected sale could not be found.";
    }

    const service =
      Number(
        formData.serviceCharge
      );

    if (
      !Number.isFinite(
        service
      ) ||
      service < 0
    ) {
      return "Service charge cannot be negative.";
    }

    const count =
      Number(
        formData.installmentCount
      );

    if (
      !Number.isInteger(
        count
      ) ||
      count < 1
    ) {
      return "At least one installment is required.";
    }

    if (
      !formData.firstDueDate
    ) {
      return "First due date is required.";
    }

    if (
      calculations.financed <=
      0
    ) {
      return "This sale has no amount remaining for EMI.";
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
        customer:
          formData.customer,

        sale:
          formData.sale,

        serviceCharge:
          Number(
            formData.serviceCharge
          ),

        installmentCount:
          Number(
            formData.installmentCount
          ),

        frequency:
          formData.frequency,

        firstDueDate:
          formData.firstDueDate,

        gracePeriodDays:
          Number(
            formData.gracePeriodDays
          ),

        referenceName:
          formData.referenceName,

        referencePhone:
          formData.referencePhone,

        guarantorName:
          formData.guarantorName,

        guarantorPhone:
          formData.guarantorPhone,

        preparedBy:
          formData.preparedBy,

        notes:
          formData.notes,
      };

      const response =
        isEdit
          ? await updateEMIPlan(
              id,
              payload
            )
          : await createEMIPlan(
              payload
            );

      navigate(
        `/emi-plans/${response.data._id}`
      );
    } catch (requestError) {
      console.error(
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
        requestError.message ||
        "Failed to save EMI plan"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LoadingState message="Loading EMI information..." />
    );
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            {isEdit
              ? "Edit EMI Plan"
              : "Create EMI Plan"}
          </h1>

          <p className="text-muted mb-0">
            Create an installment
            plan from a confirmed
            sale with an outstanding
            balance.
          </p>
        </div>

        <Link
          to="/emi-plans"
          className="btn btn-outline-secondary"
        >
          Back to EMI Plans
        </Link>
      </div>

      <ErrorAlert
        message={error}
      />

      <form
        onSubmit={
          handleSubmit
        }
      >
        <div className="card page-card mb-4">
          <div className="card-header bg-white">
            <h2 className="h5 mb-0">
              Customer and Sale
            </h2>
          </div>

          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">
                  Customer
                </label>

                <select
                  name="customer"
                  className="form-select"
                  value={
                    formData.customer
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers
                    .filter(
                      (customer) =>
                        customer.status !==
                        "INACTIVE"
                    )
                    .map(
                      (customer) => (
                        <option
                          key={
                            customer._id
                          }
                          value={
                            customer._id
                          }
                        >
                          {customerName(
                            customer
                          )}
                          {" — "}
                          {
                            customer.phone
                          }
                        </option>
                      )
                    )}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Eligible Sale
                </label>

                <select
                  name="sale"
                  className="form-select"
                  value={
                    formData.sale
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !formData.customer
                  }
                  required
                >
                  <option value="">
                    {formData.customer
                      ? "Select eligible sale"
                      : "Select customer first"}
                  </option>

                  {eligibleSales.map(
                    (sale) => (
                      <option
                        key={
                          sale._id
                        }
                        value={
                          sale._id
                        }
                      >
                        {sale.invoiceNumber ||
                          sale._id}
                        {" — Total: "}
                        {formatMoney(
                          sale.totalAmount
                        )}
                        {" — Due: "}
                        {formatMoney(
                          sale.dueAmount
                        )}
                      </option>
                    )
                  )}
                </select>

                {formData.customer &&
                  eligibleSales.length ===
                    0 && (
                    <div className="form-text text-danger">
                      No confirmed
                      sale with an
                      outstanding
                      balance exists
                      for this
                      customer.
                    </div>
                  )}
              </div>

              {selectedSale && (
                <div className="col-12">
                  <div className="alert alert-light border mb-0">
                    <div>
                      <strong>
                        Invoice:
                      </strong>{" "}
                      {selectedSale.invoiceNumber ||
                        selectedSale._id}
                    </div>

                    <div>
                      <strong>
                        Total:
                      </strong>{" "}
                      {formatMoney(
                        selectedSale.totalAmount
                      )}
                    </div>

                    <div>
                      <strong>
                        Already Paid:
                      </strong>{" "}
                      {formatMoney(
                        selectedSale.paidAmount
                      )}
                    </div>

                    <div>
                      <strong>
                        Outstanding Due:
                      </strong>{" "}
                      {formatMoney(
                        selectedSale.dueAmount
                      )}
                    </div>

                    <div>
                      <strong>
                        Sale Status:
                      </strong>{" "}
                      {
                        selectedSale.status
                      }
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="card page-card mb-4">
          <div className="card-header bg-white">
            <h2 className="h5 mb-0">
              EMI Configuration
            </h2>
          </div>

          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-4">
                <label className="form-label">
                  Down Payment
                </label>

                <input
                  type="number"
                  className="form-control"
                  value={
                    calculations.down
                  }
                  readOnly
                />

                <div className="form-text">
                  Uses the amount
                  already paid on
                  the selected sale.
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Service Charge
                </label>

                <input
                  name="serviceCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={
                    formData.serviceCharge
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Installment Count
                </label>

                <input
                  name="installmentCount"
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  value={
                    formData.installmentCount
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Frequency
                </label>

                <select
                  name="frequency"
                  className="form-select"
                  value={
                    formData.frequency
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="WEEKLY">
                    Weekly
                  </option>

                  <option value="BIWEEKLY">
                    Every Two Weeks
                  </option>

                  <option value="MONTHLY">
                    Monthly
                  </option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  First Due Date
                </label>

                <input
                  name="firstDueDate"
                  type="date"
                  className="form-control"
                  value={
                    formData.firstDueDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Grace Period
                  (Days)
                </label>

                <input
                  name="gracePeriodDays"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={
                    formData.gracePeriodDays
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">

          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <small className="text-muted">
                  Sale Amount
                </small>

                <div className="h5 mt-1 mb-0">
                  {formatMoney(
                    calculations.total
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <small className="text-muted">
                  Financed Amount
                </small>

                <div className="h5 mt-1 mb-0">
                  {formatMoney(
                    calculations.financed
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <small className="text-muted">
                  EMI Payable
                </small>

                <div className="h5 mt-1 mb-0">
                  {formatMoney(
                    calculations.payable
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <small className="text-muted">
                  Approx.
                  Installment
                </small>

                <div className="h5 mt-1 mb-0">
                  {formatMoney(
                    calculations.installment
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {schedulePreview.length >
          0 && (
          <div className="card page-card mb-4">

            <div className="card-header bg-white">
              <h2 className="h5 mb-0">
                Proposed
                Installment Schedule
              </h2>
            </div>

            <div className="table-responsive">
              <table className="table table-hover mb-0">

                <thead className="table-light">
                  <tr>
                    <th>
                      Installment
                    </th>
                    <th>
                      Due Date
                    </th>
                    <th>
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {schedulePreview.map(
                    (entry) => (
                      <tr
                        key={
                          entry.installmentNo
                        }
                      >
                        <td>
                          #
                          {
                            entry.installmentNo
                          }
                        </td>

                        <td>
                          {entry.dueDate.toLocaleDateString(
                            "en-BD"
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            entry.amount
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

        <div className="card page-card mb-4">

          <div className="card-header bg-white">
            <h2 className="h5 mb-0">
              Reference and
              Guarantor
            </h2>
          </div>

          <div className="card-body">

            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">
                  Reference Name
                </label>

                <input
                  name="referenceName"
                  className="form-control"
                  value={
                    formData.referenceName
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Reference Phone
                </label>

                <input
                  name="referencePhone"
                  className="form-control"
                  value={
                    formData.referencePhone
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Guarantor Name
                </label>

                <input
                  name="guarantorName"
                  className="form-control"
                  value={
                    formData.guarantorName
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Guarantor Phone
                </label>

                <input
                  name="guarantorPhone"
                  className="form-control"
                  value={
                    formData.guarantorPhone
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Prepared By
                </label>

                <input
                  name="preparedBy"
                  className="form-control"
                  value={
                    formData.preparedBy
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-12">
                <label className="form-label">
                  Notes
                </label>

                <textarea
                  name="notes"
                  rows="4"
                  className="form-control"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

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
                ? "Update EMI Plan"
                : "Create EMI Plan"}
          </button>

          <Link
            to="/emi-plans"
            className="btn btn-outline-secondary"
          >
            Cancel
          </Link>

        </div>
      </form>
    </section>
  );
}

export default EMIPlanFormPage;
