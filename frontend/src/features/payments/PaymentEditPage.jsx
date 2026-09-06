import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getCustomers,
  getOutstandingSales,
  getPaymentById,
  updatePayment
} from "./paymentService";

function dateInputValue(value){
  if(!value){
    return "";
  }

  return new Date(value)
    .toISOString()
    .slice(0,10);
}

function PaymentEditPage(){
  const {id}=useParams();
  const navigate=useNavigate();

  const [customers,setCustomers]=
    useState([]);

  const [sales,setSales]=
    useState([]);

  const [loading,setLoading]=
    useState(true);

  const [loadingSales,setLoadingSales]=
    useState(false);

  const [saving,setSaving]=
    useState(false);

  const [error,setError]=
    useState("");

  const [formData,setFormData]=
    useState({
      customerId:"",
      saleId:"",
      amount:"",
      paymentMethod:"CASH",
      paymentDate:"",
      referenceNumber:"",
      note:"",
      collectedBy:""
    });

  const selectedSale=useMemo(
    ()=>sales.find(
      sale=>sale._id===formData.saleId
    ),
    [sales,formData.saleId]
  );

  useEffect(()=>{
    let active=true;

    async function load(){
      try{
        const [
          paymentResult,
          customerResult
        ]=await Promise.all([
          getPaymentById(id),
          getCustomers()
        ]);

        if(!active){
          return;
        }

        const payment=
          paymentResult.data;

        if(payment.status!=="DRAFT"){
          setError(
            "Confirmed or cancelled payments are immutable."
          );

          return;
        }

        const customerId=
          payment.customerId?._id||
          payment.customerId;

        const saleId=
          payment.saleId?._id||
          payment.saleId;

        setCustomers(
          customerResult.data||[]
        );

        const salesResult=
          await getOutstandingSales(
            customerId
          );

        if(!active){
          return;
        }

        setSales(
          salesResult.data||[]
        );

        setFormData({
          customerId,
          saleId,
          amount:String(
            payment.amount
          ),
          paymentMethod:
            payment.paymentMethod,
          paymentDate:
            dateInputValue(
              payment.paymentDate
            ),
          referenceNumber:
            payment.referenceNumber||
            "",
          note:payment.note||"",
          collectedBy:
            payment.collectedBy||""
        });
      }catch(error){
        if(active){
          setError(error.message);
        }
      }finally{
        if(active){
          setLoading(false);
        }
      }
    }

    load();

    return ()=>{
      active=false;
    };
  },[id]);

  async function loadSales(
    customerId
  ){
    if(!customerId){
      setSales([]);
      return;
    }

    try{
      setLoadingSales(true);

      const result=
        await getOutstandingSales(
          customerId
        );

      setSales(result.data||[]);
    }catch(error){
      setSales([]);
      setError(error.message);
    }finally{
      setLoadingSales(false);
    }
  }

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

      loadSales(value);

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
      setSaving(true);

      await updatePayment(
        id,
        {
          ...formData,
          amount
        }
      );

      navigate("/payments");
    }catch(error){
      setError(error.message);
    }finally{
      setSaving(false);
    }
  }

  if(loading){
    return(
      <div className="card p-4 text-center">
        Loading payment...
      </div>
    );
  }

  return(
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Edit Payment Draft
          </h1>

          <p className="text-muted mb-0">
            Drafts remain editable until
            confirmation.
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

      {!error&&(
        <div className="card page-card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
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
                          value={
                            customer._id
                          }
                        >
                          {
                            customer
                              .customerId
                          }
                          {" - "}
                          {customer.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="col-md-6">
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
                        ?"Loading..."
                        :"Select Invoice"}
                    </option>

                    {sales.map(sale=>(
                      <option
                        key={sale._id}
                        value={sale._id}
                      >
                        {
                          sale
                            .invoiceNumber
                        }
                        {" - Due: "}
                        {sale.dueAmount}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSale&&(
                  <div className="col-12">
                    <div className="alert alert-info mb-0">
                      Invoice{" "}
                      <strong>
                        {
                          selectedSale
                            .invoiceNumber
                        }
                      </strong>
                      {" | "}
                      Current Due:{" "}
                      <strong>
                        {
                          selectedSale
                            .dueAmount
                        }
                      </strong>
                    </div>
                  </div>
                )}

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
                    value={
                      formData.amount
                    }
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
                      formData
                        .paymentDate
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
                      formData
                        .collectedBy
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
                    value={
                      formData.note
                    }
                    onChange={handleChange}
                    rows="3"
                    maxLength="500"
                  />
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-dark"
                    disabled={saving}
                  >
                    {saving
                      ?"Saving..."
                      :"Update Draft"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default PaymentEditPage;