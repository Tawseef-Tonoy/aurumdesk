import {
  useEffect,
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
  createCustomer,
  getCustomerById,
  updateCustomer,
} from "./customerService";

const emptyForm = {
  customerId: "",
  name: "",
  phone: "",
  alternativePhone: "",
  email: "",
  address: "",
  nid: "",
  occupation: "",
  monthlyIncome: "",
};

function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [formData, setFormData] =
    useState(emptyForm);

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    async function loadCustomer() {
      try {
        setError("");

        const response =
          await getCustomerById(id);

        setFormData({
          ...emptyForm,
          ...response.data,
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id, isEdit]);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,

        monthlyIncome:
          formData.monthlyIncome === ""
            ? 0
            : Number(
                formData.monthlyIncome
              ),
      };

      if (isEdit) {
        const {
          customerId,
          _id,
          createdAt,
          updatedAt,
          __v,
          ...updates
        } = payload;

        await updateCustomer(
          id,
          updates
        );
      } else {
        await createCustomer(payload);
      }

      navigate("/customers");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LoadingState message="Loading customer..." />
    );
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          {isEdit
            ? "Edit customer"
            : "Add customer"}
        </h1>

        <Link
          to="/customers"
          className="btn btn-outline-secondary"
        >
          Back
        </Link>
      </div>

      <ErrorAlert message={error} />

      <div className="card page-card">
        <div className="card-body">
          <form
            className="row g-3"
            onSubmit={handleSubmit}
          >
            <div className="col-md-6">
              <label
                htmlFor="customerId"
                className="form-label"
              >
                Customer ID
              </label>

              <input
                id="customerId"
                name="customerId"
                className="form-control"
                value={formData.customerId}
                onChange={handleChange}
                disabled={isEdit}
                required
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="name"
                className="form-label"
              >
                Full name
              </label>

              <input
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="phone"
                className="form-label"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="alternativePhone"
                className="form-label"
              >
                Alternative phone
              </label>

              <input
                id="alternativePhone"
                name="alternativePhone"
                className="form-control"
                value={
                  formData.alternativePhone
                }
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="email"
                className="form-label"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="nid"
                className="form-label"
              >
                National ID
              </label>

              <input
                id="nid"
                name="nid"
                className="form-control"
                value={formData.nid}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="occupation"
                className="form-label"
              >
                Occupation
              </label>

              <input
                id="occupation"
                name="occupation"
                className="form-control"
                value={formData.occupation}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="monthlyIncome"
                className="form-label"
              >
                Monthly income
              </label>

              <input
                id="monthlyIncome"
                type="number"
                min="0"
                name="monthlyIncome"
                className="form-control"
                value={
                  formData.monthlyIncome
                }
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label
                htmlFor="address"
                className="form-label"
              >
                Address
              </label>

              <textarea
                id="address"
                name="address"
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-dark"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : isEdit
                    ? "Update customer"
                    : "Create customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default CustomerFormPage;