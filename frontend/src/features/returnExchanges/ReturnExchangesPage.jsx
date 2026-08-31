import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useSearchParams
} from "react-router-dom";

import {
  getReturnExchanges
} from "./returnExchangeService";

function ReturnExchangesPage(){
  const [searchParams]=
    useSearchParams();

  const [documents,setDocuments]=
    useState([]);

  const [type,setType]=
    useState("");

  const [status,setStatus]=
    useState("");

  const [loading,setLoading]=
    useState(true);

  const [error,setError]=
    useState("");

  const saleId=
    searchParams.get("sale")||"";

  useEffect(()=>{
    loadDocuments();
  },[
    type,
    status,
    saleId
  ]);

  async function loadDocuments(){
    try{
      setLoading(true);
      setError("");

      const response=
        await getReturnExchanges({
          ...(type?{type}:{}),
          ...(status?{status}:{}),
          ...(saleId?{sale:saleId}:{})
        });

      setDocuments(
        Array.isArray(response)
          ?response
          :response.data||[]
      );
    }catch(err){
      setError(
        err.response?.data?.message||
        "Failed to load return and exchange transactions"
      );
    }finally{
      setLoading(false);
    }
  }

  function money(value){
    return Number(
      value||0
    ).toFixed(2);
  }

  return(
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Sale Returns & Exchanges
          </h1>

          <p className="text-muted mb-0">
            Review return, exchange, approval and settlement history.
          </p>
        </div>

        <Link
          to="/sales"
          className="btn btn-dark"
        >
          Find Invoice
        </Link>
      </div>

      {saleId&&(
        <div className="alert alert-info">
          Showing transactions linked to the selected invoice.
        </div>
      )}

      <div className="card page-card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                Type
              </label>

              <select
                className="form-select"
                value={type}
                onChange={event=>
                  setType(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All Types
                </option>

                <option value="RETURN">
                  Return
                </option>

                <option value="EXCHANGE">
                  Exchange
                </option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Status
              </label>

              <select
                className="form-select"
                value={status}
                onChange={event=>
                  setStatus(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All Statuses
                </option>

                <option value="DRAFT">
                  Draft
                </option>

                <option value="PENDING_APPROVAL">
                  Pending Approval
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error&&(
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {loading?(
        <div className="card page-card">
          <div className="card-body">
            Loading...
          </div>
        </div>
      ):documents.length===0?(
        <div className="card page-card">
          <div className="card-body text-center">
            No return or exchange transactions found.
          </div>
        </div>
      ):(
        <div className="card page-card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Return Value</th>
                    <th>Replacement</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map(
                    document=>(
                      <tr key={document._id}>
                        <td>
                          {document.returnExchangeNo}
                        </td>

                        <td>
                          {document.sale?.invoiceNumber||
                          "-"}
                        </td>

                        <td>
                          {document.customer?.name||
                          "-"}
                        </td>

                        <td>
                          {document.type}
                        </td>

                        <td>
                          {document.status}
                        </td>

                        <td>
                          {money(
                            document.returnValue
                          )}
                        </td>

                        <td>
                          {money(
                            document.replacementValue
                          )}
                        </td>

                        <td>
                          {document.createdAt
                            ?new Date(
                              document.createdAt
                            ).toLocaleString()
                            :"-"}
                        </td>

                        <td>
                          <Link
                            className="btn btn-sm btn-secondary"
                            to={`/return-exchanges/${document._id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ReturnExchangesPage;