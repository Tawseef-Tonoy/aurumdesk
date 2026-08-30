import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  getDateWiseOutstanding,
  getDueAging,
  getInvoiceOutstanding,
  getLedgerStatement,
  getLedgerSummary
} from "./ledgerService";

const transactionTypes=[
  "NEW_SALE_DUE",
  "EMI_DUE",
  "CUSTOMER_PAYMENT",
  "RETURN_ADJUSTMENT",
  "EXCHANGE_ADJUSTMENT",
  "DISCOUNT_ADJUSTMENT",
  "REFUND_ADJUSTMENT",
  "APPROVED_CORRECTION"
];

const agingBuckets=[
  ["Current","current"],
  ["1-30 Days","days1To30"],
  ["31-60 Days","days31To60"],
  ["61-90 Days","days61To90"],
  ["Over 90 Days","over90Days"]
];

function money(value){
  return new Intl.NumberFormat(
    "en-BD",
    {
      style:"currency",
      currency:"BDT",
      minimumFractionDigits:2
    }
  ).format(Number(value||0));
}

function dateText(value){
  if(!value){
    return "N/A";
  }

  const date=new Date(value);

  return Number.isNaN(date.getTime())
    ?"N/A"
    :date.toLocaleDateString();
}

function typeText(value){
  return String(value||"")
    .replaceAll("_"," ");
}

function statementParams(
  filters,
  page,
  limit=50
){
  const params={page,limit};

  if(filters.from){
    params.from=filters.from;
  }

  if(filters.to){
    params.to=filters.to;
  }

  if(filters.transactionType){
    params.transactionType=
      filters.transactionType;
  }

  return params;
}

function Metric({
  label,
  value,
  className=""
}){
  return(
    <div className="col-md-3">
      <div
        className={
          `card h-100 ${className}`
        }
      >
        <div className="card-body">
          <div className="text-muted">
            {label}
          </div>

          <div className="h5 mb-0">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDueLedgerPage(){
  const navigate=useNavigate();
  const [summary,setSummary]=useState([]);
  const [selectedId,setSelectedId]=
    useState("");
  const [search,setSearch]=useState("");
  const [activeTab,setActiveTab]=
    useState("statement");

  const [statement,setStatement]=
    useState(null);
  const [outstanding,setOutstanding]=
    useState([]);
  const [dateWise,setDateWise]=
    useState([]);
  const [aging,setAging]=useState(null);

  const [loading,setLoading]=useState(true);
  const [loadingReport,setLoadingReport]=
    useState(false);
  const [printing,setPrinting]=
    useState(false);
  const [error,setError]=useState("");
  const [page,setPage]=useState(1);

  const [filters,setFilters]=useState({
    from:"",
    to:"",
    transactionType:""
  });

  const selectedCustomer=useMemo(
    ()=>summary.find(
      customer=>
        String(customer.customerId)===
        String(selectedId)
    ),
    [summary,selectedId]
  );

  const filteredSummary=useMemo(()=>{
    const query=search
      .trim()
      .toLowerCase();

    if(!query){
      return summary;
    }

    return summary.filter(customer=>
      [
        customer.customerCode,
        customer.customerName,
        customer.phone
      ].some(value=>
        String(value||"")
          .toLowerCase()
          .includes(query)
      )
    );
  },[summary,search]);

  async function loadReport(
    customerId,
    nextFilters=filters,
    nextPage=1
  ){
    if(!customerId){
      return;
    }

    try{
      setLoadingReport(true);
      setError("");

      const [
        statementResponse,
        outstandingResponse,
        dateWiseResponse,
        agingResponse
      ]=await Promise.all([
        getLedgerStatement(
          customerId,
          statementParams(
            nextFilters,
            nextPage
          )
        ),

        getInvoiceOutstanding(
          customerId
        ),

        getDateWiseOutstanding(
          customerId
        ),

        getDueAging(
          customerId,
          new Date().toISOString()
        )
      ]);

      setStatement(
        statementResponse.data
      );

      setOutstanding(
        outstandingResponse.data||[]
      );

      setDateWise(
        dateWiseResponse.data||[]
      );

      setAging(
        agingResponse.data
      );

      setPage(nextPage);
    }catch(error){
      setError(error.message);
    }finally{
      setLoadingReport(false);
    }
  }

  useEffect(()=>{
    let active=true;

    async function loadSummary(){
      try{
        setLoading(true);
        setError("");

        const response=
          await getLedgerSummary();

        if(!active){
          return;
        }

        const customers=response.data||[];

        setSummary(customers);

        if(customers.length){
          const firstId=
            customers[0].customerId;

          setSelectedId(firstId);

          await loadReport(
            firstId,
            {
              from:"",
              to:"",
              transactionType:""
            },
            1
          );
        }
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

    loadSummary();

    return ()=>{
      active=false;
    };
  },[]);

  function selectCustomer(customerId){
    const emptyFilters={
      from:"",
      to:"",
      transactionType:""
    };

    setSelectedId(customerId);
    setFilters(emptyFilters);
    setActiveTab("statement");

    loadReport(
      customerId,
      emptyFilters,
      1
    );
  }

  function handleFilterChange(event){
    const {name,value}=event.target;

    setFilters(current=>({
      ...current,
      [name]:value
    }));
  }

  function applyFilters(event){
    event.preventDefault();

    loadReport(
      selectedId,
      filters,
      1
    );
  }

  async function printLedger(){
    if(
      !selectedId||
      !statement||
      printing
    ){
      return;
    }

    const previousStatement=statement;
    const previousTab=activeTab;

    try{
      setPrinting(true);
      setError("");

      const firstResponse=
        await getLedgerStatement(
          selectedId,
          statementParams(
            filters,
            1,
            100
          )
        );

      const completeStatement=
        firstResponse.data;

      const allEntries=[
        ...(completeStatement.entries||[])
      ];

      const pages=
        completeStatement.pagination
          ?.pages||1;

      for(
        let pageNumber=2;
        pageNumber<=pages;
        pageNumber+=1
      ){
        const response=
          await getLedgerStatement(
            selectedId,
            statementParams(
              filters,
              pageNumber,
              100
            )
          );

        allEntries.push(
          ...(response.data.entries||[])
        );
      }

      setStatement({
        ...completeStatement,
        entries:allEntries,
        pagination:{
          ...completeStatement.pagination,
          page:1,
          limit:allEntries.length,
          pages:1
        }
      });

      setActiveTab("statement");

      window.setTimeout(()=>{
        window.print();

        setStatement(
          previousStatement
        );

        setActiveTab(
          previousTab
        );

        setPrinting(false);
      },250);
    }catch(error){
      setError(error.message);
      setPrinting(false);
    }
  }

  const balance=statement?.balance||{
    totalDebit:0,
    totalCredit:0,
    balance:0,
    entryCount:0
  };

  if(loading){
    return(
      <div className="card p-4 text-center">
        Loading Customer Ledger...
      </div>
    );
  }

  return(
    <section className="ledger-print">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Customer Due Ledger
          </h1>

          <p className="text-muted mb-0">
            Customer debit, credit and
            outstanding history.
          </p>
        </div>

        <div className="d-flex gap-2 no-print">
            <button
                type="button"
                className="btn btn-warning"
                onClick={()=>
                navigate(
                    "/customer-ledgers/adjustments/new"
                )
                }
            >
                Create Adjustment
            </button>

            <button
                type="button"
                className="btn btn-dark"
                disabled={
                !statement||
                printing
                }
                onClick={printLedger}
            >
                {printing
                ?"Preparing..."
                :"Print Ledger"}
            </button>
            </div>
      </div>

      {error&&(
        <div
          className="alert alert-danger no-print"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-4 no-print">
          <div className="card page-card">
            <div className="card-body">
              <h5>Customers</h5>

              <input
                className="form-control mb-3"
                placeholder="Search customer"
                value={search}
                onChange={event=>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <div
                className="list-group"
                style={{
                  maxHeight:"70vh",
                  overflowY:"auto"
                }}
              >
                {filteredSummary.map(
                  customer=>(
                    <button
                      type="button"
                      key={customer.customerId}
                      className={
                        String(selectedId)===
                        String(
                          customer.customerId
                        )
                          ?"list-group-item list-group-item-action active"
                          :"list-group-item list-group-item-action"
                      }
                      onClick={()=>
                        selectCustomer(
                          customer.customerId
                        )
                      }
                    >
                      <div className="d-flex justify-content-between">
                        <strong>
                          {customer.customerName}
                        </strong>

                        <span>
                          {money(
                            customer.balance
                          )}
                        </span>
                      </div>

                      <small>
                        {customer.customerCode}
                        {" | "}
                        {customer.phone}
                      </small>
                    </button>
                  )
                )}

                {!filteredSummary.length&&(
                  <div className="text-muted text-center p-3">
                    No Ledger customers found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {!selectedCustomer?(
            <div className="card p-4 text-center">
              Select a customer.
            </div>
          ):(
            <>
              <div className="card page-card mb-3">
                <div className="card-body">
                  <h4>
                    {selectedCustomer
                      .customerName}
                  </h4>

                  <div className="text-muted">
                    {selectedCustomer
                      .customerCode}
                    {" | "}
                    {selectedCustomer.phone}
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <Metric
                  label="Total Debit"
                  value={money(
                    balance.totalDebit
                  )}
                />

                <Metric
                  label="Total Credit"
                  value={money(
                    balance.totalCredit
                  )}
                />

                <Metric
                  label="Running Balance"
                  value={money(
                    balance.balance
                  )}
                  className={
                    balance.balance>0
                      ?"border-danger"
                      :"border-success"
                  }
                />

                <Metric
                  label="Entries"
                  value={balance.entryCount}
                />
              </div>

              <div className="card page-card">
                <div className="card-body">
                  <div className="nav nav-tabs mb-4 no-print">
                    {[
                      [
                        "statement",
                        "Statement"
                      ],
                      [
                        "outstanding",
                        "Invoices"
                      ],
                      [
                        "aging",
                        "Due Aging"
                      ],
                      [
                        "dateWise",
                        "Date Wise"
                      ]
                    ].map(([key,label])=>(
                      <button
                        type="button"
                        key={key}
                        className={
                          activeTab===key
                            ?"nav-link active"
                            :"nav-link"
                        }
                        onClick={()=>
                          setActiveTab(key)
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {loadingReport?(
                    <div className="text-center p-4">
                      Loading Ledger report...
                    </div>
                  ):(
                    <>
                      {activeTab==="statement"&&(
                        <>
                          <form
                            className="row g-2 mb-3 no-print"
                            onSubmit={
                              applyFilters
                            }
                          >
                            <div className="col-md-3">
                              <input
                                type="date"
                                className="form-control"
                                name="from"
                                value={filters.from}
                                onChange={
                                  handleFilterChange
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <input
                                type="date"
                                className="form-control"
                                name="to"
                                value={filters.to}
                                onChange={
                                  handleFilterChange
                                }
                              />
                            </div>

                            <div className="col-md-4">
                              <select
                                className="form-select"
                                name="transactionType"
                                value={
                                  filters
                                    .transactionType
                                }
                                onChange={
                                  handleFilterChange
                                }
                              >
                                <option value="">
                                  All Entry Types
                                </option>

                                {transactionTypes.map(
                                  type=>(
                                    <option
                                      key={type}
                                      value={type}
                                    >
                                      {typeText(type)}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div className="col-md-2">
                              <button
                                type="submit"
                                className="btn btn-dark w-100"
                              >
                                Filter
                              </button>
                            </div>
                          </form>

                          <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Reference</th>
                                  <th>Type</th>
                                  <th>Debit</th>
                                  <th>Credit</th>
                                  <th>Balance</th>
                                  <th>Created By</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>

                              <tbody>
                                {statement?.entries
                                  ?.map(entry=>(
                                    <tr key={entry._id}>
                                      <td>
                                        {dateText(
                                          entry.entryDate
                                        )}
                                      </td>

                                      <td>
                                        {entry
                                          .sourceDocument
                                          ?.documentNumber||
                                          "N/A"}
                                      </td>

                                      <td>
                                        {typeText(
                                          entry
                                            .transactionType
                                        )}
                                      </td>

                                      <td>
                                        {money(
                                          entry.debitAmount
                                        )}
                                      </td>

                                      <td>
                                        {money(
                                          entry.creditAmount
                                        )}
                                      </td>

                                      <td>
                                        <strong>
                                          {money(
                                            entry
                                              .runningBalance
                                          )}
                                        </strong>
                                      </td>

                                      <td>
                                        {entry.createdBy}
                                      </td>

                                      <td>
                                        {entry.notes||
                                          "N/A"}
                                      </td>
                                    </tr>
                                  ))}

                                {!statement?.entries
                                  ?.length&&(
                                    <tr>
                                      <td
                                        colSpan="8"
                                        className="text-center"
                                      >
                                        No entries found.
                                      </td>
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </div>

                          <div className="d-flex justify-content-between align-items-center no-print">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={page<=1}
                              onClick={()=>
                                loadReport(
                                  selectedId,
                                  filters,
                                  page-1
                                )
                              }
                            >
                              Previous
                            </button>

                            <span>
                              Page {page} of{" "}
                              {statement
                                ?.pagination
                                ?.pages||1}
                            </span>

                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={
                                page>=(
                                  statement
                                    ?.pagination
                                    ?.pages||1
                                )
                              }
                              onClick={()=>
                                loadReport(
                                  selectedId,
                                  filters,
                                  page+1
                                )
                              }
                            >
                              Next
                            </button>
                          </div>
                        </>
                      )}

                      {activeTab==="outstanding"&&(
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead>
                              <tr>
                                <th>Invoice</th>
                                <th>Sale Date</th>
                                <th>Due Date</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Outstanding</th>
                              </tr>
                            </thead>

                            <tbody>
                              {outstanding.map(
                                invoice=>(
                                  <tr
                                    key={
                                      invoice.saleId
                                    }
                                  >
                                    <td>
                                      {invoice
                                        .invoiceNumber}
                                    </td>

                                    <td>
                                      {dateText(
                                        invoice.saleDate
                                      )}
                                    </td>

                                    <td>
                                      {dateText(
                                        invoice.dueDate
                                      )}
                                    </td>

                                    <td>
                                      {money(
                                        invoice.totalDebit
                                      )}
                                    </td>

                                    <td>
                                      {money(
                                        invoice.totalCredit
                                      )}
                                    </td>

                                    <td>
                                      <strong>
                                        {money(
                                          invoice
                                            .outstanding
                                        )}
                                      </strong>
                                    </td>
                                  </tr>
                                )
                              )}

                              {!outstanding.length&&(
                                <tr>
                                  <td
                                    colSpan="6"
                                    className="text-center"
                                  >
                                    No outstanding
                                    invoices.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {activeTab==="aging"&&(
                        <>
                          <div className="row g-3">
                            {agingBuckets.map(
                              ([label,key])=>(
                                <div
                                  className="col-md-4"
                                  key={key}
                                >
                                  <div className="border rounded p-3 h-100">
                                    <div className="text-muted">
                                      {label}
                                    </div>

                                    <strong>
                                      {money(
                                        aging
                                          ?.buckets
                                          ?.[key]
                                      )}
                                    </strong>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="alert alert-warning mt-3">
                            Total Outstanding:{" "}
                            <strong>
                              {money(
                                aging
                                  ?.totalOutstanding
                              )}
                            </strong>
                          </div>

                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>Invoice</th>
                                  <th>Due Date</th>
                                  <th>Overdue Days</th>
                                  <th>Bucket</th>
                                  <th>Outstanding</th>
                                </tr>
                              </thead>

                              <tbody>
                                {aging?.items?.map(
                                  item=>(
                                    <tr
                                      key={
                                        item.saleId
                                      }
                                    >
                                      <td>
                                        {item
                                          .invoiceNumber}
                                      </td>

                                      <td>
                                        {dateText(
                                          item.dueDate
                                        )}
                                      </td>

                                      <td>
                                        {item
                                          .overdueDays}
                                      </td>

                                      <td>
                                        {typeText(
                                          item.bucket
                                        )}
                                      </td>

                                      <td>
                                        <strong>
                                          {money(
                                            item
                                              .outstanding
                                          )}
                                        </strong>
                                      </td>
                                    </tr>
                                  )
                                )}

                                {!aging?.items
                                  ?.length&&(
                                    <tr>
                                      <td
                                        colSpan="5"
                                        className="text-center"
                                      >
                                        No aging records.
                                      </td>
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}

                      {activeTab==="dateWise"&&(
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Outstanding</th>
                              </tr>
                            </thead>

                            <tbody>
                              {dateWise.map(item=>(
                                <tr key={item.date}>
                                  <td>
                                    {item.date}
                                  </td>

                                  <td>
                                    {money(
                                      item.debit
                                    )}
                                  </td>

                                  <td>
                                    {money(
                                      item.credit
                                    )}
                                  </td>

                                  <td>
                                    <strong>
                                      {money(
                                        item.outstanding
                                      )}
                                    </strong>
                                  </td>
                                </tr>
                              ))}

                              {!dateWise.length&&(
                                <tr>
                                  <td
                                    colSpan="4"
                                    className="text-center"
                                  >
                                    No date-wise
                                    entries.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default CustomerDueLedgerPage;