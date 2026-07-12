import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  deactivateCustomer,
  getCustomers,
} from "./customerService";

function CustomersPage() {
  const [customers, setCustomers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await getCustomers({
        search: search || undefined,
        status: status || undefined,
      });

      setCustomers(response.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadCustomers();
  }

  async function handleDeactivate(id) {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deactivateCustomer(id);
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            Customers
          </h1>

          <p className="text-muted mb-0">
            Manage customer profiles and
            contact information.
          </p>
        </div>

        <Link
          to="/customers/new"
          className="btn btn-dark"
        >
          Add customer
        </Link>
      </div>

      <div className="card page-card mb-4">
        <div className="card-body">
          <form
            className="row g-2"
            onSubmit={handleSearch}
          >
            <div className="col-md-7">
              <input
                type="search"
                className="form-control"
                placeholder="Search by customer ID, name, or phone"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option value="">
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>

            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-outline-dark w-100"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <LoadingState message="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState message="No customers found." />
      ) : (
        <div className="card page-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Occupation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      {customer.customerId}
                    </td>

                    <td>
                      {customer.name}
                    </td>

                    <td>
                      {customer.phone}
                    </td>

                    <td>
                      {customer.occupation ||
                        "—"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          customer.status ===
                          "ACTIVE"
                            ? "text-bg-success"
                            : "text-bg-secondary"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <Link
                          to={`/customers/${customer._id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Edit
                        </Link>

                        {customer.status ===
                          "ACTIVE" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDeactivate(
                                customer._id
                              )
                            }
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default CustomersPage;