import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSales } from "./saleService";

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await getSales();
      setSales(data);
    } catch (err) {
      setError("Failed to load sales");
    }
  };

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Sales Invoices
          </h1>
          <p className="text-muted">
            Create and manage jewelry sales invoices.
          </p>
        </div>

        <Link
          to="/sales/new"
          className="btn btn-dark"
        >
          Create Invoice
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {sales.length === 0 ? (
        <div className="card page-card">
          <div className="card-body text-center">
            No sales invoices found.
          </div>
        </div>
      ) : (
        sales.map((sale) => (
          <div
            className="card page-card mb-3"
            key={sale._id}
          >
            <div className="card-body">

              <h5>
                Invoice: {sale.invoiceNumber}
              </h5>

              <p>
                Status: {sale.status}
              </p>

              <p>
                Total: {sale.totalAmount}
              </p>

              <p>
                Paid: {sale.paidAmount}
              </p>

              <p>
                Due: {sale.dueAmount}
              </p>

              <Link
                to={`/sales/${sale._id}`}
                className="btn btn-secondary"
              >
                View Details
              </Link>

            </div>
          </div>
        ))
      )}

    </section>
  );
}

export default SalesPage;