import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  createLedgerAdjustment,
  getAdjustableSales,
  getCustomers
} from "./ledgerService";

const adjustmentTypes=[
  {
    value:"RETURN_ADJUSTMENT",
    label:"Return Adjustment",
    directions:["CREDIT"],
    description:
      "Reduces customer due for an approved return."
  },
  {
    value:"EXCHANGE_ADJUSTMENT",
    label:"Exchange Adjustment",
    directions:[
      "DEBIT",
      "CREDIT"
    ],
    description:
      "Increases or reduces due depending on the exchange difference."
  },
  {
    value:"DISCOUNT_ADJUSTMENT",
    label:"Discount Adjustment",
    directions:["CREDIT"],
    description:
      "Reduces customer due using an approved discount."
  },
  {
    value:"REFUND_ADJUSTMENT",
    label:"Refund Adjustment",
    directions:["DEBIT"],
    description:
      "Restores or increases an amount owed after an approved refund-related correction."
  },
  {
    value:"APPROVED_CORRECTION",
    label:"Approved Correction",
    directions:[
      "DEBIT",
      "CREDIT"
    ],
    description:
      "Creates a compensating correction without modifying previous ledger history."
  }
];

function localDate(){
  const date=new Date();

  const offset=
    date.getTimezoneOffset()*
    60000;

  return new Date(
    date-offset
  )
    .toISOString()
    .slice(0,10);
}

function LedgerAdjustmentFormPage(){
  const navigate=useNavigate();

  const [customers,setCustomers]=
    useState([]);

  const [sales,setSales]=
    useState([]);

  const [loading,setLoading]=
    useState(true);

  const [
    loadingSales,
    setLoadingSales
  ]=useState(false);

  const [
    submitting,
    setSubmitting
  ]=useState(false);

  const [
    confirmed,
    setConfirmed
  ]=useState(false);

  const [error,setError]=
    useState("");

  const [formData,setFormData]=
    useState({
      customer:"",
      sale:"",
      transactionType:
        "RETURN_ADJUSTMENT",
      direction:"CREDIT",
      amount:"",
      entryDate:localDate(),
      dueDate:"",
      notes:"",
      approvedBy:"Owner",
      createdBy:"Admin"
    });

  const selectedSale=useMemo(
    ()=>sales.find(
      sale=>
        sale._id===
        formData.sale
    ),
    [
      sales,
      formData.sale
    ]
  );

  const selectedType=useMemo(
    ()=>adjustmentTypes.find(
      type=>
        type.value===
        formData.transactionType
    ),
    [formData.transactionType]
  );

  useEffect(()=>{
    let active=true;

    async function loadCustomers(){
      try{
        const response=
          await getCustomers();

        if(active){
          setCustomers(
            response.data||[]
          );
        }
      }catch(error){
        if(active){
          setError(
            error.message
          );
        }
      }finally{
        if(active){
          setLoading(false);
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
      if(!formData.customer){
        setSales([]);
        setLoadingSales(false);
        return;
      }

      try{
        setLoadingSales(true);
        setError("");

        const response=
          await getAdjustableSales(
            formData.customer
          );

        if(active){
          setSales(
            response.data||[]
          );
        }
      }catch(error){
        if(active){
          setSales([]);
          setError(
            error.message
          );
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
  },[formData.customer]);

  function handleChange(event){
    const {
      name,
      value
    }=event.target;

    setError("");
    setConfirmed(false);

    if(name==="customer"){
      setFormData(current=>({
        ...current,
        customer:value,
        sale:"",
        amount:""
      }));

      return;
    }

    if(name==="sale"){
      setFormData(current=>({
        ...current,
        sale:value,
        amount:""
      }));

      return;
    }

    if(name==="transactionType"){
      const type=
        adjustmentTypes.find(
          item=>
            item.value===value
        );

      setFormData(current=>({
        ...current,
        transactionType:value,
        direction:
          type?.directions?.[0]||
          "DEBIT",
        amount:""
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

    if(
      !formData.customer||
      !formData.sale
    ){
      setError(
        "Select a customer and invoice"
      );

      return;
    }

    const amount=Number(
      formData.amount
    );

    if(
      !Number.isFinite(amount)||
      amount<=0
    ){
      setError(
        "Adjustment amount must be greater than zero"
      );

      return;
    }

    const currentDue=Number(
      selectedSale?.dueAmount||0
    );

    if(
      formData.direction==="CREDIT"&&
      amount>currentDue
    ){
      setError(
        `Credit adjustment cannot exceed current due of ${currentDue}`
      );

      return;
    }

    if(
      !selectedType
        ?.directions
        ?.includes(
          formData.direction
        )
    ){
      setError(
        "Invalid direction for the selected adjustment type"
      );

      return;
    }

    if(
      !formData.notes.trim()||
      !formData.approvedBy.trim()||
      !formData.createdBy.trim()
    ){
      setError(
        "Notes, approved by and created by are required"
      );

      return;
    }

    if(!confirmed){
      setError(
        "Confirm that this adjustment has been reviewed and approved"
      );

      return;
    }

    try{
      setSubmitting(true);

      await createLedgerAdjustment({
        customer:
          formData.customer,
        sale:
          formData.sale,
        transactionType:
          formData.transactionType,
        direction:
          formData.direction,
        amount,
        entryDate:
          formData.entryDate,
        dueDate:
          formData.dueDate||
          null,
        notes:
          formData.notes.trim(),
        approvedBy:
          formData.approvedBy.trim(),
        createdBy:
          formData.createdBy.trim()
      });

      navigate(
        "/customer-ledgers"
      );
    }catch(error){
      setError(
        error.message
      );
    }finally{
      setSubmitting(false);
    }
  }

  if(loading){
    return(
      <div className="card p-4 text-center">
        Loading adjustment form...
      </div>
    );
  }

  return(
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Create Ledger Adjustment
          </h1>

          <p className="text-muted mb-0">
            Approved corrections create
            new immutable ledger entries.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={()=>
            navigate(
              "/customer-ledgers"
            )
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
        Existing ledger entries are never
        edited. Every correction is recorded
        as a new approved debit or credit.
      </div>

      <div className="card page-card">
        <div className="card-body">
          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="row g-3">
              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="customer"
                >
                  Customer
                </label>

                <select
                  id="customer"
                  className="form-select"
                  name="customer"
                  value={
                    formData.customer
                  }
                  onChange={
                    handleChange
                  }
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

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="sale"
                >
                  Source Invoice
                </label>

                <select
                  id="sale"
                  className="form-select"
                  name="sale"
                  value={
                    formData.sale
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !formData.customer||
                    loadingSales
                  }
                  required
                >
                  <option value="">
                    {loadingSales
                      ?"Loading invoices..."
                      :"Select Invoice"}
                  </option>

                  {sales.map(
                    sale=>(
                      <option
                        key={sale._id}
                        value={sale._id}
                      >
                        {sale.invoiceNumber}
                        {" | "}
                        {sale.status}
                        {" | Due: "}
                        {sale.dueAmount}
                      </option>
                    )
                  )}
                </select>

                {formData.customer&&
                  !loadingSales&&
                  sales.length===0&&(
                    <div className="form-text text-danger">
                      No eligible confirmed
                      invoices found.
                    </div>
                  )}
              </div>

              {selectedSale&&(
                <div className="col-12">
                  <div className="alert alert-info mb-0">
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
                      Status:{" "}
                      {
                        selectedSale
                          .status
                      }
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
                      Current Due:{" "}
                      <strong>
                        {
                          selectedSale
                            .dueAmount
                        }
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="transactionType"
                >
                  Adjustment Type
                </label>

                <select
                  id="transactionType"
                  className="form-select"
                  name="transactionType"
                  value={
                    formData
                      .transactionType
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  {adjustmentTypes.map(
                    type=>(
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="direction"
                >
                  Direction
                </label>

                <select
                  id="direction"
                  className="form-select"
                  name="direction"
                  value={
                    formData.direction
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    selectedType
                      ?.directions
                      ?.length===1
                  }
                  required
                >
                  {selectedType
                    ?.directions
                    ?.includes(
                      "DEBIT"
                    )&&(
                      <option value="DEBIT">
                        Debit - Increase Customer Due
                      </option>
                    )}

                  {selectedType
                    ?.directions
                    ?.includes(
                      "CREDIT"
                    )&&(
                      <option value="CREDIT">
                        Credit - Reduce Customer Due
                      </option>
                    )}
                </select>
              </div>

              {selectedType&&(
                <div className="col-12">
                  <div className="form-text">
                    {
                      selectedType
                        .description
                    }
                  </div>
                </div>
              )}

              <div className="col-md-4">
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
                  onChange={
                    handleChange
                  }
                  min="0.01"
                  max={
                    formData.direction===
                    "CREDIT"
                      ?selectedSale
                        ?.dueAmount||
                        ""
                      :""
                  }
                  step="0.01"
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  className="form-label"
                  htmlFor="entryDate"
                >
                  Entry Date
                </label>

                <input
                  id="entryDate"
                  type="date"
                  className="form-control"
                  name="entryDate"
                  value={
                    formData.entryDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  className="form-label"
                  htmlFor="dueDate"
                >
                  Due Date
                </label>

                <input
                  id="dueDate"
                  type="date"
                  className="form-control"
                  name="dueDate"
                  value={
                    formData.dueDate
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="approvedBy"
                >
                  Approved By
                </label>

                <input
                  id="approvedBy"
                  className="form-control"
                  name="approvedBy"
                  value={
                    formData.approvedBy
                  }
                  onChange={
                    handleChange
                  }
                  maxLength="120"
                  required
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="createdBy"
                >
                  Created By
                </label>

                <input
                  id="createdBy"
                  className="form-control"
                  name="createdBy"
                  value={
                    formData.createdBy
                  }
                  onChange={
                    handleChange
                  }
                  maxLength="120"
                  required
                />
              </div>

              <div className="col-12">
                <label
                  className="form-label"
                  htmlFor="notes"
                >
                  Reason / Notes
                </label>

                <textarea
                  id="notes"
                  className="form-control"
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  maxLength="1000"
                  required
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="confirmed"
                    type="checkbox"
                    className="form-check-input"
                    checked={
                      confirmed
                    }
                    onChange={
                      event=>
                        setConfirmed(
                          event.target
                            .checked
                        )
                    }
                  />

                  <label
                    className="form-check-label"
                    htmlFor="confirmed"
                  >
                    I confirm that this
                    adjustment has been
                    reviewed and approved.
                  </label>
                </div>
              </div>

              <div className="col-12">
                <div
                  className={
                    formData.direction===
                    "DEBIT"
                      ?"alert alert-warning mb-0"
                      :"alert alert-success mb-0"
                  }
                >
                  {formData.direction===
                  "DEBIT"
                    ?"This entry will increase the customer's outstanding balance."
                    :"This entry will reduce the customer's outstanding balance."}
                </div>
              </div>

              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={
                    submitting||
                    !selectedSale||
                    !confirmed
                  }
                >
                  {submitting
                    ?"Creating..."
                    :"Create Approved Adjustment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default LedgerAdjustmentFormPage;