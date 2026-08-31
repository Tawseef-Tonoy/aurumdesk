import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import apiClient from "../../api/apiClient";

import {
  getSaleById
} from "./saleService";

function SaleDetailsPage(){
  const {id}=useParams();

  const navigate=useNavigate();

  const [sale,setSale]=
    useState(null);

  const [error,setError]=
    useState("");

  const [loading,setLoading]=
    useState(true);

  useEffect(()=>{
    loadSale();
  },[id]);

  async function loadSale(){
    try{
      setLoading(true);
      setError("");

      const data=
        await getSaleById(id);

      setSale(
        data.data||data
      );
    }catch(err){
      setError(
        err.response?.data?.message||
        "Failed to load invoice"
      );
    }finally{
      setLoading(false);
    }
  }

  async function action(
    url,
    message
  ){
    try{
      await apiClient.patch(
        url
      );

      alert(message);

      await loadSale();
    }catch(err){
      alert(
        err.response?.data?.message||
        "Failed"
      );
    }
  }

  function money(value){
    return Number(
      value||0
    ).toFixed(2);
  }

  function formatDate(value){
    if(!value){
      return "-";
    }

    return new Date(
      value
    ).toLocaleString();
  }

  if(loading){
    return(
      <div className="card page-card">
        <div className="card-body">
          Loading...
        </div>
      </div>
    );
  }

  if(!sale){
    return(
      <div className="alert alert-danger">
        {error||
        "Invoice not found"}
      </div>
    );
  }

  const customerId=
    sale.customer?._id||
    sale.customer;

  const returnExchangeEligible=[
    "CONFIRMED",
    "PARTIALLY_PAID",
    "FULLY_PAID"
  ].includes(
    sale.status
  );

  const paymentEligible=[
    "CONFIRMED",
    "PARTIALLY_PAID"
  ].includes(
    sale.status
  );

  return(
    <section className="sale-invoice-print">
      <div className="d-flex justify-content-between align-items-start mb-4 no-print">
        <div>
          <h1 className="h3 mb-1">
            Invoice Details
          </h1>

          <p className="text-muted mb-0">
            {sale.invoiceNumber}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={()=>window.print()}
          >
            Print Invoice
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={()=>
              navigate("/sales")
            }
          >
            Back
          </button>
        </div>
      </div>

      {error&&(
        <div className="alert alert-danger no-print">
          {error}
        </div>
      )}

      <div className="invoice-print-header">
        <div>
          <h1 className="invoice-business-name">
            AurumDesk
          </h1>

          <div className="text-muted">
            Jewelry Sales Invoice
          </div>
        </div>

        <div className="invoice-print-meta">
          <div>
            <strong>
              Invoice:
            </strong>{" "}
            {sale.invoiceNumber}
          </div>

          <div>
            <strong>
              Date:
            </strong>{" "}
            {formatDate(
              sale.createdAt
            )}
          </div>

          <div>
            <strong>
              Status:
            </strong>{" "}
            {sale.status}
          </div>
        </div>
      </div>

      <div className="card page-card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <strong>
                Invoice Number
              </strong>

              <div>
                {sale.invoiceNumber}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Customer
              </strong>

              <div>
                {sale.customer?.name||
                "-"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Customer Phone
              </strong>

              <div>
                {sale.customer?.phone||
                "-"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Sales Person
              </strong>

              <div>
                {sale.salesPerson||
                "-"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Payment Method
              </strong>

              <div>
                {sale.paymentMethod||
                "-"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Status
              </strong>

              <div>
                {sale.status}
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4 no-print">
            {sale.status==="DRAFT"&&(
              <>
                <button
                  className="btn btn-success"
                  onClick={()=>
                    action(
                      `/sales/${id}/confirm`,
                      "Confirmed"
                    )
                  }
                >
                  Confirm
                </button>

                <button
                  className="btn btn-danger"
                  onClick={()=>
                    action(
                      `/sales/${id}/cancel`,
                      "Cancelled"
                    )
                  }
                >
                  Cancel
                </button>
              </>
            )}

            {paymentEligible&&(
              <button
                className="btn btn-warning"
                onClick={()=>
                  navigate(
                    `/payments/new?customerId=${customerId}&saleId=${sale._id}`
                  )
                }
              >
                Collect Payment
              </button>
            )}

            {returnExchangeEligible&&(
              <>
                <button
                  className="btn btn-info"
                  onClick={()=>
                    navigate(
                      `/return-exchanges/new?saleId=${sale._id}&type=RETURN`
                    )
                  }
                >
                  Create Return
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={()=>
                    navigate(
                      `/return-exchanges/new?saleId=${sale._id}&type=EXCHANGE`
                    )
                  }
                >
                  Create Exchange
                </button>

                <Link
                  className="btn btn-outline-dark"
                  to={`/return-exchanges?sale=${sale._id}`}
                >
                  Return / Exchange History
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card page-card mb-4">
        <div className="card-body">
          <h5 className="mb-3">
            Invoice Items
          </h5>

          <div className="table-responsive">
            <table className="table table-bordered align-middle invoice-items-table">
              <thead>
                <tr>
                  <th>
                    Item
                  </th>

                  <th>
                    Qty
                  </th>

                  <th>
                    Purity
                  </th>

                  <th>
                    Net Weight
                  </th>

                  <th>
                    Gold Rate
                  </th>

                  <th>
                    Gold Value
                  </th>

                  <th>
                    Making
                  </th>

                  <th>
                    Stone
                  </th>

                  <th>
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.items.map(
                  (item,index)=>(
                    <tr
                      key={
                        item._id||
                        index
                      }
                    >
                      <td>
                        {item.itemName}
                      </td>

                      <td>
                        {item.quantity}
                      </td>

                      <td>
                        {item.purity}
                      </td>

                      <td>
                        {Number(
                          item.netGoldWeight||0
                        ).toFixed(3)}g
                      </td>

                      <td>
                        {money(
                          item.goldRate
                        )}
                      </td>

                      <td>
                        {money(
                          item.goldValue
                        )}
                      </td>

                      <td>
                        {money(
                          item.makingCharge
                        )}
                      </td>

                      <td>
                        {money(
                          item.stoneCost
                        )}
                      </td>

                      <td>
                        {money(
                          item.subtotal
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card page-card h-100">
            <div className="card-body">
              <h5 className="mb-3">
                Terms
              </h5>

              <div className="mb-3">
                <strong>
                  Warranty Terms
                </strong>

                <p className="mb-0 mt-1">
                  {sale.warrantyTerms||
                  "No warranty terms recorded."}
                </p>
              </div>

              <div>
                <strong>
                  Return / Exchange Terms
                </strong>

                <p className="mb-0 mt-1">
                  {sale.returnExchangeTerms||
                  "No return or exchange terms recorded."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card page-card invoice-summary-card">
            <div className="card-body">
              <h5 className="mb-3">
                Invoice Summary
              </h5>

              <div className="invoice-summary-row">
                <span>
                  Subtotal
                </span>

                <strong>
                  {money(
                    sale.subtotal
                  )}
                </strong>
              </div>

              <div className="invoice-summary-row">
                <span>
                  Discount
                </span>

                <strong>
                  {money(
                    sale.discount
                  )}
                </strong>
              </div>

              <div className="invoice-summary-row">
                <span>
                  VAT
                </span>

                <strong>
                  {money(
                    sale.vat
                  )}
                </strong>
              </div>

              <hr/>

              <div className="invoice-summary-row invoice-total-row">
                <span>
                  Total
                </span>

                <strong>
                  {money(
                    sale.totalAmount
                  )}
                </strong>
              </div>

              <div className="invoice-summary-row">
                <span>
                  Paid
                </span>

                <strong>
                  {money(
                    sale.paidAmount
                  )}
                </strong>
              </div>

              <div className="invoice-summary-row">
                <span>
                  Due
                </span>

                <strong>
                  {money(
                    sale.dueAmount
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-print-footer">
        <div>
          Thank you for your business.
        </div>

        <div className="invoice-signature">
          Authorized Signature
        </div>
      </div>
    </section>
  );
}

export default SaleDetailsPage;