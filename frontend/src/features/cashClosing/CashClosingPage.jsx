import{useEffect,useState}from"react";
import ErrorAlert from"../../components/ErrorAlert";

import{
createClosing,
getClosing,
getAllClosings,
updateClosing,
refreshClosing,
reopenClosing
}from"./cashClosingService";


function CashClosingPage(){

const[today]=useState(
new Date().toISOString().split("T")[0]
);

const[closing,setClosing]=useState(null);
const[history,setHistory]=useState([]);

const[openingCash,setOpeningCash]=useState("");
const[actualCash,setActualCash]=useState("");
const[explanation,setExplanation]=useState("");

const[error,setError]=useState("");
const[loading,setLoading]=useState(false);



useEffect(()=>{

loadHistory();

},[]);



async function loadHistory(){

try{

const response=
await getAllClosings();

setHistory(
response.data||[]
);

}catch(error){

setHistory([]);

}

}



async function handleLoad(){

try{

const response=
await getClosing(today);

setClosing(
response.data
);

}catch(error){

setClosing(null);

}

}



async function handleCreate(){

try{

setLoading(true);
setError("");

const response=
await createClosing({

businessDate:today,

openingCash:Number(openingCash)

});


setClosing(
response.data
);

loadHistory();


}catch(error){

setError(
error.message
);

}finally{

setLoading(false);

}

}



async function handleRefresh(){

try{

setLoading(true);
setError("");

const response=
await refreshClosing(
closing._id
);


setClosing(
response.data
);


loadHistory();


}catch(error){

setError(
error.message
);

}finally{

setLoading(false);

}

}



async function handlePrepare(){

try{

setLoading(true);
setError("");

const response=
await updateClosing(

closing._id,

{

actualClosingCash:Number(actualCash),

differenceExplanation:explanation,

status:"PREPARED",

user:"Admin"

}

);


setClosing(
response.data
);


loadHistory();


}catch(error){

setError(
error.message
);

}finally{

setLoading(false);

}

}



async function changeStatus(status){

try{

const response=
await updateClosing(

closing._id,

{

status,

user:"Admin"

}

);


setClosing(
response.data
);


loadHistory();


}catch(error){

setError(
error.message
);

}

}



async function handleReopen(){

try{

const response=
await reopenClosing(

closing._id,

{

reason:"Authorized reopen",

user:"Admin"

}

);


setClosing(
response.data
);


loadHistory();


}catch(error){

setError(
error.message
);

}

}



return(

<section>

<h1 className="h3 mb-3">
Daily Cash Closing
</h1>


<ErrorAlert message={error}/>



<div className="card page-card mb-4">

<div className="card-body">


<h2 className="h5">
Closing History
</h2>


<div className="table-responsive">

<table className="table table-sm">


<thead>

<tr>

<th>Date</th>

<th>Status</th>

<th>Expected</th>

<th>Difference</th>

<th>Prepared</th>

<th>Submitted</th>

<th>Approved</th>

</tr>

</thead>


<tbody>


{

history.map(item=>(

<tr key={item._id}>


<td>

{
new Date(
item.businessDate
).toLocaleDateString()

}

</td>


<td>

<span className="badge text-bg-secondary">

{item.status}

</span>

</td>


<td>

{item.expectedClosingCash}

</td>


<td>

{item.cashDifference??0}

</td>


<td>

{item.preparedBy||"-"}

</td>


<td>

{item.submittedBy||"-"}

</td>


<td>

{item.approvedBy||"-"}

</td>


</tr>

))

}


</tbody>


</table>

</div>


</div>

</div>





{

!closing?

<div className="card page-card">

<div className="card-body">


<h2 className="h5">
Open Today Closing
</h2>


<label className="form-label">

Opening Cash

</label>


<input

className="form-control mb-3"

type="number"

value={openingCash}

onChange={
e=>setOpeningCash(e.target.value)
}

/>


<button

className="btn btn-dark"

disabled={loading}

onClick={handleCreate}

>

Create Closing

</button>



<button

className="btn btn-outline-primary ms-2"

onClick={handleLoad}

>

Load Today

</button>


</div>

</div>


:

<div className="card page-card">

<div className="card-body">


<h2 className="h5">

Cash Summary

</h2>


<p>

<strong>Status:</strong>{" "}

{closing.status}

</p>


<hr/>


<h6>

Approval Information

</h6>


<p>

Prepared By:
{closing.preparedBy||"-"}

</p>


<p>

Submitted By:
{closing.submittedBy||"-"}

</p>


<p>

Approved By:
{closing.approvedBy||"-"}

</p>



<hr/>


<h6>

Cash Inflow

</h6>


<p>

Cash Sales:
{closing.cashSales}

</p>


<p>

Due Collections:
{closing.dueCollections}

</p>


<p>

EMI Collections:
{closing.emiCollections}

</p>


<p>

Custom Order Advances:
{closing.customOrderAdvances}

</p>


<p>

<strong>

Total Inflow:
{closing.totalCashInflow}

</strong>

</p>



<hr/>


<h6>

Cash Outflow

</h6>


<p>

Supplier Payments:
{closing.supplierPayments}

</p>


<p>

Business Expenses:
{closing.businessExpenses}

</p>


<p>

Refunds:
{closing.refunds}

</p>


<p>

<strong>

Total Outflow:
{closing.totalCashOutflow}

</strong>

</p>



<hr/>


<p>

Expected Closing:

{closing.expectedClosingCash}

</p>


<p>

Difference:

{closing.cashDifference??0}

</p>



<button

className="btn btn-outline-primary me-2"

disabled={loading}

onClick={handleRefresh}

>

Refresh Summary

</button>



<input

className="form-control mt-3"

placeholder="Actual cash"

type="number"

value={actualCash}

onChange={
e=>setActualCash(e.target.value)
}

/>



<textarea

className="form-control mt-3"

placeholder="Difference explanation"

value={explanation}

onChange={
e=>setExplanation(e.target.value)
}

/>



<button

className="btn btn-dark mt-3"

disabled={loading}

onClick={handlePrepare}

>

Prepare

</button>



{

closing.status==="PREPARED"&&

<button

className="btn btn-primary mt-3 ms-2"

onClick={
()=>changeStatus("SUBMITTED")
}

>

Submit

</button>

}



{

closing.status==="SUBMITTED"&&

<button

className="btn btn-success mt-3 ms-2"

onClick={
()=>changeStatus("APPROVED")
}

>

Approve

</button>

}



{

closing.status==="APPROVED"&&

<button

className="btn btn-warning mt-3 ms-2"

onClick={handleReopen}

>

Reopen

</button>

}



</div>

</div>

}


</section>

);

}


export default CashClosingPage;