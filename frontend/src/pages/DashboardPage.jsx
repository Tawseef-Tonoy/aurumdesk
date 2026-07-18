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

        {/* Gold Rate Card */}
        <div className="col-md-6 col-xl-4">

          <div className="card page-card h-100">

            <div className="card-body">


              <h2 className="h5">
                Gold Rates
              </h2>



              <p className="text-muted">
                Manage daily gold prices,
                purity, and active rates.
              </p>



              <Link
                to="/gold-rates"
                className="btn btn-dark"
              >
                Open gold rates
              </Link>



            </div>

          </div>

        </div>

        <div className="col-md-6 col-xl-4">

          <div className="card page-card h-100">

              <div className="card-body">

                  <h2 className="h5">
                      Expenses
                  </h2>


                  <p className="text-muted">
                      Manage business expenses,
                      payments, and expense status.
                  </p>


                  <Link
                  to="/expenses"
                  className="btn btn-dark"
                  >
                      Open expenses
                  </Link>


              </div>

          </div>

      </div>

      <div className="col-md-6 col-xl-4">

        <div className="card page-card h-100">

            <div className="card-body">

                <h2 className="h5">
                    Payments
                </h2>


                <p className="text-muted">
                    Manage customer payment
                    collections and records.
                </p>


                <Link
                to="/payments"
                className="btn btn-dark"
                >
                    Open payments
                </Link>


            </div>

        </div>

    </div>







      </div>
    </section>
  );
}

export default DashboardPage;