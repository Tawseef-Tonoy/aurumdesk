import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import {
  approveReturnExchange,
  cancelReturnExchange,
  completeReturnExchange,
  getReturnExchangeById,
  rejectReturnExchange,
  submitReturnExchange
} from "./returnExchangeService";

function ReturnExchangeDetailsPage(){
  const {id}=useParams();

  const navigate=useNavigate();

  const [document,setDocument]=
    useState(null);

  const [loading,setLoading]=
    useState(true);

  const [busy,setBusy]=
    useState(false);

  const [error,setError]=
    useState("");

  useEffect(()=>{
    loadDocument();
  },[id]);

  async function loadDocument(){
    try{
      setLoading(true);
      setError("");

      const response=
        await getReturnExchangeById(
          id
        );

      setDocument(
        response.data||response
      );
    }catch(err){
      setError(
        err.response?.data?.message||
        "Failed to load transaction"
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

  async function runAction(action){
    try{
      setBusy(true);
      setError("");

      await action();

      await loadDocument();
    }catch(err){
      setError(
        err.response?.data?.message||
        err.message||
        "Operation failed"
      );
    }finally{
      setBusy(false);
    }
  }

  function submit(){
    if(
      !window.confirm(
        "Submit this transaction for approval?"
      )
    ){
      return;
    }

    runAction(
      ()=>submitReturnExchange(id)
    );
  }

  function approve(){
    const approvedBy=
      window.prompt(
        "Approved by:"
      );

    if(!approvedBy?.trim()){
      return;
    }

    runAction(
      ()=>approveReturnExchange(
        id,
        approvedBy.trim()
      )
    );
  }

  function reject(){
    const rejectedBy=
      window.prompt(
        "Rejected by:"
      );

    if(!rejectedBy?.trim()){
      return;
    }

    const rejectionReason=
      window.prompt(
        "Rejection reason:"
      );

    if(
      !rejectionReason?.trim()
    ){
      return;
    }

    runAction(
      ()=>rejectReturnExchange(
        id,
        {
          rejectedBy:
            rejectedBy.trim(),

          rejectionReason:
            rejectionReason.trim()
        }
      )
    );
  }

  function cancel(){
    if(
      !window.confirm(
        "Cancel this transaction?"
      )
    ){
      return;
    }

    const cancelledBy=
      window.prompt(
        "Cancelled by:",
        document.requestedBy||""
      );

    if(!cancelledBy?.trim()){
      return;
    }

    runAction(
      ()=>cancelReturnExchange(
        id,
        cancelledBy.trim()
      )
    );
  }

  function complete(){
    const completedBy=
      window.prompt(
        "Completed by:"
      );

    if(!completedBy?.trim()){
      return;
    }

    let refundMethod="NONE";
    let refundReference="";

    if(
      Number(
        document.refundAmount||0
      )>0
    ){
      refundMethod=
        window.prompt(
          "Refund method: CASH, CARD, BANK, or MOBILE_BANKING",
          "CASH"
        )?.trim()
          .toUpperCase();

      if(!refundMethod){
        return;
      }

      refundReference=
        window.prompt(
          "Refund reference (optional):",
          ""
        )||"";
    }

    if(
      !window.confirm(
        "Complete this transaction? Inventory and customer ledger will be updated."
      )
    ){
      return;
    }

    runAction(
      ()=>completeReturnExchange(
        id,
        {
          completedBy:
            completedBy.trim(),

          refundMethod,

          refundReference:
            refundReference.trim()
        }
      )
    );
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

  if(!document){
    return(
      <div className="alert alert-danger">
        {error||
        "Transaction not found"}
      </div>
    );
  }

  return(
    <section className="return-exchange-print">
      <div className="d-flex justify-content-between align-items-start mb-4 no-print">
        <div>
          <h1 className="h3 mb-1">
            {document.type==="RETURN"
              ?"Sale Return"
              :"Sale Exchange"}
          </h1>

          <p className="text-muted mb-0">
            {document.returnExchangeNo}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={()=>window.print()}
          >
            Print
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={()=>
              navigate(
                "/return-exchanges"
              )
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

      <div className="card page-card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <strong>
                Reference
              </strong>

              <div>
                {document.returnExchangeNo}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Original Invoice
              </strong>

              <div>
                {document.sale?.invoiceNumber||
                "-"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Customer
              </strong>

              <div>
                {document.customer?.name||
                "-"}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Type
              </strong>

              <div>
                {document.type}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Status
              </strong>

              <div>
                {document.status}
              </div>
            </div>

            <div className="col-md-4">
              <strong>
                Requested By
              </strong>

              <div>
                {document.requestedBy}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card page-card mb-4">
        <div className="card-body">
          <h5 className="mb-3">
            Returned Items
          </h5>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>Condition</th>
                  <th>Disposition</th>
                  <th>Unit Value</th>
                  <th>Return Value</th>
                </tr>
              </thead>

              <tbody>
                {document.items.map(
                  item=>(
                    <tr key={item._id}>
                      <td>
                        {item.itemName}
                      </td>

                      <td>
                        {item.quantity}
                      </td>

                      <td>
                        {item.reason}
                      </td>

                      <td>
                        {item.condition}
                      </td>

                      <td>
                        {item.inventoryDisposition}
                      </td>

                      <td>
                        {money(
                          item.unitReturnValue
                        )}
                      </td>

                      <td>
                        {money(
                          item.returnValue
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

      {document.type==="EXCHANGE"&&(
        <div className="card page-card mb-4">
          <div className="card-body">
            <h5 className="mb-3">
              Replacement Items
            </h5>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Value</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {document.replacementItems.map(
                    item=>(
                      <tr key={item._id}>
                        <td>
                          {item.itemName}
                        </td>

                        <td>
                          {item.quantity}
                        </td>

                        <td>
                          {money(
                            item.unitValue
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
      )}

      <div className="card page-card mb-4">
        <div className="card-body">
          <h5 className="mb-3">
            Financial Settlement
          </h5>

          <div className="row g-3">
            <div className="col-md-3">
              <strong>
                Return Value
              </strong>

              <div>
                {money(
                  document.returnValue
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Replacement Value
              </strong>

              <div>
                {money(
                  document.replacementValue
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Adjustment
              </strong>

              <div>
                {money(
                  document.adjustmentAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Ledger Credit
              </strong>

              <div>
                {money(
                  document.ledgerCreditAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Ledger Debit
              </strong>

              <div>
                {money(
                  document.ledgerDebitAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Refund
              </strong>

              <div>
                {money(
                  document.refundAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Additional Due
              </strong>

              <div>
                {money(
                  document.additionalDueAmount
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>
                Refund Method
              </strong>

              <div>
                {document.refundMethod||
                "NONE"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {document.notes&&(
        <div className="card page-card mb-4">
          <div className="card-body">
            <strong>
              Notes
            </strong>

            <p className="mb-0 mt-2">
              {document.notes}
            </p>
          </div>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 no-print">
        {document.status==="DRAFT"&&(
          <>
            <Link
              to={`/return-exchanges/${document._id}/edit`}
              className="btn btn-outline-dark"
            >
              Edit Draft
            </Link>

            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={submit}
            >
              Submit for Approval
            </button>

            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={busy}
              onClick={cancel}
            >
              Cancel
            </button>
          </>
        )}

        {document.status==="PENDING_APPROVAL"&&(
          <>
            <button
              type="button"
              className="btn btn-success"
              disabled={busy}
              onClick={approve}
            >
              Approve
            </button>

            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={reject}
            >
              Reject
            </button>

            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={busy}
              onClick={cancel}
            >
              Cancel
            </button>
          </>
        )}

        {document.status==="APPROVED"&&(
          <>
            <button
              type="button"
              className="btn btn-success"
              disabled={busy}
              onClick={complete}
            >
              Complete Transaction
            </button>

            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={reject}
            >
              Reject
            </button>

            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={busy}
              onClick={cancel}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default ReturnExchangeDetailsPage;