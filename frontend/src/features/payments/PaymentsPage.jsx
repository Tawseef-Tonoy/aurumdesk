import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  cancelPayment,
  confirmPayment,
  getPayments
} from "./paymentService";

function formatDate(value){
  if(!value){
    return "N/A";
  }

  return new Date(value)
    .toLocaleDateString();
}

function statusClass(status){
  switch(status){
    case "COMPLETED":
      return "badge bg-success";

    case "CANCELLED":
      return "badge bg-danger";

    default:
      return "badge bg-warning text-dark";
  }
}

function PaymentsPage(){
  const navigate=useNavigate();

  const [payments,setPayments]=
    useState([]);

  const [loading,setLoading]=
    useState(true);

  const [error,setError]=
    useState("");

  const [
    confirmingId,
    setConfirmingId
  ]=useState("");

  const [
    cancelTarget,
    setCancelTarget
  ]=useState(null);

  const [
    cancelling,
    setCancelling
  ]=useState(false);

  const [
    cancelData,
    setCancelData
  ]=useState({
    cancelledBy:"Admin",
    cancellationReason:""
  });

  async function loadPayments(){
    try{
      setLoading(true);
      setError("");

      const result=
        await getPayments();

      setPayments(
        result.data||[]
      );
    }catch(error){
      setError(error.message);
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    loadPayments();
  },[]);

  async function handleConfirm(payment){
    const approved=window.confirm(
      "Confirm this payment? After confirmation it becomes permanent and cannot be edited or cancelled."
    );

    if(!approved){
      return;
    }

    try{
      setConfirmingId(
        payment._id
      );

      setError("");

      await confirmPayment(
        payment._id
      );

      await loadPayments();
    }catch(error){
      setError(error.message);
    }finally{
      setConfirmingId("");
    }
  }

  function openCancellation(payment){
    setCancelTarget(payment);

    setCancelData({
      cancelledBy:"Admin",
      cancellationReason:""
    });
  }

  function closeCancellation(){
    if(cancelling){
      return;
    }

    setCancelTarget(null);
  }

  function handleCancelChange(event){
    const {
      name,
      value
    }=event.target;

    setCancelData(current=>({
      ...current,
      [name]:value
    }));
  }

  async function handleCancellation(event){
    event.preventDefault();

    if(!cancelTarget){
      return;
    }

    try{
      setCancelling(true);
      setError("");

      await cancelPayment(
        cancelTarget._id,
        cancelData
      );

      setCancelTarget(null);

      await loadPayments();
    }catch(error){
      setError(error.message);
    }finally{
      setCancelling(false);
    }
  }

  return(
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Payments
          </h1>

          <p className="text-muted mb-0">
            Create, review and confirm customer payments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-dark"
          onClick={()=>
            navigate("/payments/new")
          }
        >
          New Payment
        </button>
      </div>

      {error&&(
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}



      {loading?(
        <div className="card p-4 text-center">
          Loading payments...
        </div>
      ):payments.length===0?(
        <div className="card p-4 text-center">
          No payments found.
        </div>
      ):(
        payments.map(payment=>(
          <div
            className="card page-card mb-3"
            key={payment._id}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <h5 className="mb-1">
                    {payment.saleId
                      ?.invoiceNumber||
                      "Unknown Invoice"}
                  </h5>

                  <div className="text-muted">
                    {payment.customerId
                      ?.customerId||
                      "Unknown ID"}
                    {" - "}
                    {payment.customerId
                      ?.name||
                      "Unknown Customer"}
                  </div>
                </div>

                <span
                  className={
                    statusClass(
                      payment.status
                    )
                  }
                >
                  {payment.status}
                </span>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <strong>
                    Amount
                  </strong>

                  <div>
                    {payment.amount}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Method
                  </strong>

                  <div>
                    {payment.paymentMethod}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Payment Date
                  </strong>

                  <div>
                    {formatDate(
                      payment.paymentDate
                    )}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Reference
                  </strong>

                  <div>
                    {payment.referenceNumber||
                      "N/A"}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Collected By
                  </strong>

                  <div>
                    {payment.collectedBy}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Current Invoice Due
                  </strong>

                  <div>
                    {payment.saleId
                      ?.dueAmount??
                      "N/A"}
                  </div>
                </div>
              </div>

              {payment.note&&(
                <div className="mt-3">
                  <strong>
                    Note
                  </strong>

                  <div>
                    {payment.note}
                  </div>
                </div>
              )}

              {payment.status==="DRAFT"&&(
                <div className="alert alert-warning mt-3 mb-0">
                  This payment has not been confirmed.

                </div>
              )}

              {payment.status==="COMPLETED"&&(
                <div className="alert alert-success mt-3 mb-0">
                  Confirmed{" "}
                  {payment.confirmedAt
                    ?`on ${formatDate(
                      payment.confirmedAt
                    )}`
                    :""}.

                </div>
              )}

              {payment.status==="CANCELLED"&&(
                <div className="alert alert-secondary mt-3 mb-0">
                  <div>
                    Draft cancelled by:{" "}
                    {payment.cancelledBy||
                      "Unknown"}
                  </div>

                  <div>
                    Reason:{" "}
                    {payment.cancellationReason||
                      "Not provided"}
                  </div>

                  <div>
                    Date:{" "}
                    {formatDate(
                      payment.cancelledAt
                    )}
                  </div>
                </div>
              )}

              {payment.status==="DRAFT"&&(
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={()=>
                      navigate(
                        `/payments/${payment._id}/edit`
                      )
                    }
                  >
                    Edit Draft
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={
                      confirmingId===
                      payment._id
                    }
                    onClick={()=>
                      handleConfirm(
                        payment
                      )
                    }
                  >
                    {confirmingId===
                      payment._id
                      ?"Confirming..."
                      :"Confirm Payment"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={()=>
                      openCancellation(
                        payment
                      )
                    }
                  >
                    Cancel Draft
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {cancelTarget&&(
        <>
          <div
            className="modal d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelPaymentTitle"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <form
                  onSubmit={
                    handleCancellation
                  }
                >
                  <div className="modal-header">
                    <h5
                      className="modal-title"
                      id="cancelPaymentTitle"
                    >
                      Cancel Payment Draft
                    </h5>

                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={
                        closeCancellation
                      }
                    />
                  </div>

                  <div className="modal-body">
                    <div className="alert alert-warning">
                      Cancelling this draft will not
                      affect the invoice or customer ledger.
                    </div>

                    <p>
                      Invoice:{" "}
                      <strong>
                        {cancelTarget
                          .saleId
                          ?.invoiceNumber||
                          "N/A"}
                      </strong>
                    </p>

                    <p>
                      Amount:{" "}
                      <strong>
                        {cancelTarget.amount}
                      </strong>
                    </p>

                    <div className="mb-3">
                      <label
                        className="form-label"
                        htmlFor="cancelledBy"
                      >
                        Cancelled By
                      </label>

                      <input
                        id="cancelledBy"
                        className="form-control"
                        name="cancelledBy"
                        value={
                          cancelData.cancelledBy
                        }
                        onChange={
                          handleCancelChange
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        className="form-label"
                        htmlFor="cancellationReason"
                      >
                        Cancellation Reason
                      </label>

                      <textarea
                        id="cancellationReason"
                        className="form-control"
                        name="cancellationReason"
                        value={
                          cancelData
                            .cancellationReason
                        }
                        onChange={
                          handleCancelChange
                        }
                        rows="3"
                        maxLength="500"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={
                        closeCancellation
                      }
                      disabled={cancelling}
                    >
                      Keep Draft
                    </button>

                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={cancelling}
                    >
                      {cancelling
                        ?"Cancelling..."
                        :"Cancel Draft"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop show"/>
        </>
      )}
    </section>
  );
}

export default PaymentsPage;
