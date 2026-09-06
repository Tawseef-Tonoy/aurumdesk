import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import {
  createPayment,
  getCustomers,
  getOutstandingSales
} from "./paymentService";

function localDate(){
  const date=new Date();
  const offset=
    date.getTimezoneOffset()*60000;

  return new Date(date-offset)
    .toISOString()
    .slice(0,10);
}

function PaymentFormPage(){
  const navigate=useNavigate();
  const [searchParams]=useSearchParams();

  const requestedCustomerId=
    searchParams.get("customerId")||"";

  const requestedSaleId=
    searchParams.get("saleId")||"";

  const [customers,setCustomers]=
    useState([]);

  const [sales,setSales]=
    useState([]);

  const [loadingSales,setLoadingSales]=
    useState(false);

  const [submitting,setSubmitting]=
    useState(false);

  const [error,setError]=
    useState("");

  const [formData,setFormData]=
    useState({
      customerId:requestedCustomerId,
      saleId:"",
      amount:"",
      paymentMethod:"CASH",
      paymentDate:localDate(),
      referenceNumber:"",
      note:"",
      collectedBy:"Admin"
    });

  const selectedSale=useMemo(
    ()=>sales.find(
      sale=>sale._id===formData.saleId
    ),
    [sales,formData.saleId]
  );

  useEffect(()=>{
    let active=true;

    async function loadCustomers(){
      try{
        const result=
          await getCustomers();

        if(active){
          setCustomers(
            result.data||[]
          );
        }
      }catch(error){
        if(active){
          setError(error.message);
        }
      }
    }

    loadCustomers();

    return ()=>{
      active=false;
    };
  },[]);

  useEffect(()=>{
    let active=true;

    async function loadSales(){
      if(!formData.customerId){
        setSales([]);
        setLoadingSales(false);
        return;
      }

      setLoadingSales(true);
      setError("");

      try{
        const result=
          await getOutstandingSales(
            formData.customerId
          );

        if(!active){
          return;
        }

        const outstanding=
          result.data||[];

        setSales(outstanding);

        const requested=
          outstanding.find(
            sale=>
              sale._id===
              requestedSaleId
          );

        if(requested){
          setFormData(current=>({
            ...current,
            saleId:requested._id,
            amount:String(
              requested.dueAmount
            )
          }));
        }
      }catch(error){
        if(active){
          setSales([]);
          setError(error.message);
        }
      }finally{
        if(active){
          setLoadingSales(false);
        }
      }
    }

    loadSales();

    return ()=>{
      active=false;
    };
  },[
    formData.customerId,
    requestedSaleId
  ]);

  function handleChange(event){
    const {
      name,
      value
    }=event.target;

    if(name==="customerId"){
      setFormData(current=>({
        ...current,
        customerId:value,
        saleId:"",
        amount:""
      }));

      return;
    }

    if(name==="saleId"){
      const sale=sales.find(
        item=>item._id===value
      );

      setFormData(current=>({
        ...current,
        saleId:value,
        amount:sale
          ?String(sale.dueAmount)
          :""
      }));

      return;
    }

    setFormData(current=>({
      ...current,
      [name]:value
    }));
  }

  async function handleSubmit(event){
    event.preventDefault();

    setError("");

    const amount=Number(
      formData.amount
    );

    const dueAmount=Number(
      selectedSale?.dueAmount||0
    );

    if(
      !formData.customerId||
      !formData.saleId
    ){
      setError(
        "Select a customer and outstanding invoice"
      );

      return;
    }

    if(
      !Number.isFinite(amount)||
      amount<=0||
      amount>dueAmount
    ){
      setError(
        `Payment must be between 0.01 and ${dueAmount}`
      );

      return;
    }

    if(
      !formData.collectedBy.trim()
    ){
      setError(
        "Collected by is required"
      );

      return;
    }

    try{
      setSubmitting(true);

      await createPayment({
        ...formData,
        amount
      });

      navigate("/payments");
    }catch(error){
      setError(error.message);
    }finally{
      setSubmitting(false);
    }
  }

  return(
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            New Payment
          </h1>

          <p className="text-muted mb-0">
            Save the payment as a draft,
            review it, then confirm it.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={()=>
            navigate("/payments")
          }
        >
          Back
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

      <div className="alert alert-warning">
        Saving this form does not change
        the invoice or customer Ledger.
        Financial changes happen only
        after the draft is confirmed.
      </div>

      <div className="card page-card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                className="form-label"
                htmlFor="customerId"
              >
                Customer
              </label>

              <select
                id="customerId"
                className="form-select"
                name="customerId"
                value={
                  formData.customerId
                }
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Customer
                </option>

                {customers.map(
                  customer=>(
                    <option
                      key={customer._id}
                      value={customer._id}
                    >
                      {customer.customerId}
                      {" - "}
                      {customer.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="mb-3">
              <label
                className="form-label"
                htmlFor="saleId"
              >
                Outstanding Invoice
              </label>

              <select
                id="saleId"
                className="form-select"
                name="saleId"
                value={formData.saleId}
                onChange={handleChange}
                disabled={
                  !formData.customerId||
                  loadingSales
                }
                required
              >
                <option value="">
                  {loadingSales
                    ?"Loading invoices..."
                    :"Select Invoice"}
                </option>

                {sales.map(sale=>(
                  <option
                    key={sale._id}
                    value={sale._id}
                  >
                    {sale.invoiceNumber}
                    {" - Due: "}
                    {sale.dueAmount}
                  </option>
                ))}
              </select>

              {formData.customerId&&
                !loadingSales&&
                sales.length===0&&(
                  <div className="form-text text-danger">
                    This customer has no
                    outstanding invoices.
                  </div>
                )}
            </div>

            {selectedSale&&(
              <div className="alert alert-info">
                <div>
                  Invoice:{" "}
                  <strong>
                    {
                      selectedSale
                        .invoiceNumber
                    }
                  </strong>
                </div>

                <div>
                  Total:{" "}
                  {
                    selectedSale
                      .totalAmount
                  }
                </div>

                <div>
                  Paid:{" "}
                  {
                    selectedSale
                      .paidAmount
                  }
                </div>

                <div>
                  Due:{" "}
                  <strong>
                    {
                      selectedSale
                        .dueAmount
                    }
                  </strong>
                </div>
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="amount"
                >
                  Amount
                </label>

                <input
                  id="amount"
                  type="number"
                  className="form-control"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  max={
                    selectedSale
                      ?.dueAmount||""
                  }
                  step="0.01"
                  required
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="paymentMethod"
                >
                  Payment Method
                </label>

                <select
                  id="paymentMethod"
                  className="form-select"
                  name="paymentMethod"
                  value={
                    formData
                      .paymentMethod
                  }
                  onChange={handleChange}
                  required
                >
                  <option value="CASH">
                    Cash
                  </option>

                  <option value="CARD">
                    Card
                  </option>

                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>

                  <option value="MOBILE_BANKING">
                    Mobile Banking
                  </option>
                </select>
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="paymentDate"
                >
                  Payment Date
                </label>

                <input
                  id="paymentDate"
                  type="date"
                  className="form-control"
                  name="paymentDate"
                  value={
                    formData.paymentDate
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="referenceNumber"
                >
                  Reference
                </label>

                <input
                  id="referenceNumber"
                  className="form-control"
                  name="referenceNumber"
                  value={
                    formData
                      .referenceNumber
                  }
                  onChange={handleChange}
                  maxLength="100"
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="collectedBy"
                >
                  Collected By
                </label>

                <input
                  id="collectedBy"
                  className="form-control"
                  name="collectedBy"
                  value={
                    formData.collectedBy
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                <label
                  className="form-label"
                  htmlFor="note"
                >
                  Note
                </label>

                <textarea
                  id="note"
                  className="form-control"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={submitting}
                >
                  {submitting
                    ?"Saving..."
                    :"Save Draft"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default PaymentFormPage;