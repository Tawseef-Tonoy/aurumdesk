import { Link } from "react-router-dom";

function DashboardPage() {
  return (
    <section>
      <div className="mb-4">
        <h1 className="h3 mb-1">
          Dashboard
        </h1>

        <p className="text-muted mb-0">
          AurumDesk management dashboard
        </p>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-xl-4">
          <div className="card page-card h-100">
            <div className="card-body">
              <h2 className="h5">
                Customers
              </h2>

              <p className="text-muted">
                Create, search, update, and
                manage customer profiles.
              </p>

              <Link
                to="/customers"
                className="btn btn-dark"
              >
                Open customers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;