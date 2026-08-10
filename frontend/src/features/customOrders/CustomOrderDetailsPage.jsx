import{useEffect,useState}from"react";
import{Link,useParams}from"react-router-dom";
import ErrorAlert from"../../components/ErrorAlert";
import LoadingState from"../../components/LoadingState";
import{getCustomOrderById,getCustomOrderReceipt}from"./customOrderService";

function CustomOrderDetailsPage(){
const{id}=useParams();
const[order,setOrder]=useState(null);
const[loading,setLoading]=useState(true);
const[error,setError]=useState("");

useEffect(()=>{
async function loadOrder(){
try{
setError("");
const response=await getCustomOrderById(id);
setOrder(response.data);
}catch(err){
setError(err.message);
}finally{
setLoading(false);
}
}
loadOrder();
},[id]);

function formatDate(value){
return value?new Date(value).toLocaleDateString():"—";
}

function formatDateTime(value){
return value?new Date(value).toLocaleString():"—";
}

function formatMoney(value){
return `৳${Number(value||0).toLocaleString()}`;
}

function showValue(value){
return value===undefined||value===null||value===""?"—":String(value);
}

async function handlePrintReceipt(){
try{
setError("");
const response=await getCustomOrderReceipt(id);
const r=response.data;
const receiptWindow=window.open("","_blank","width=850,height=900");
if(!receiptWindow){
setError("Please allow pop-ups to print the receipt");
return;
}
receiptWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>${r.orderNo} Receipt</title>
<style>
body{font-family:Arial,sans-serif;padding:30px;color:#111}
h1,h2{margin-bottom:8px}
.header{text-align:center;border-bottom:2px solid #111;padding-bottom:15px;margin-bottom:20px}
.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:8px 0;gap:20px}
.label{font-weight:bold}
.section{margin-top:25px}
.total{font-size:18px;font-weight:bold}
.note{margin-top:30px;text-align:center;color:#555}
</style>
</head>
<body>
<div class="header">
<h1>AurumDesk</h1>
<h2>Custom Order Receipt</h2>
<div>${showValue(r.orderNo)}</div>
</div>
<div class="section">
<div class="row"><span class="label">Customer</span><span>${showValue(r.customer?.name)}</span></div>
<div class="row"><span class="label">Customer ID</span><span>${showValue(r.customer?.customerId)}</span></div>
<div class="row"><span class="label">Phone</span><span>${showValue(r.customer?.phone)}</span></div>
<div class="row"><span class="label">Booking Date</span><span>${formatDate(r.bookingDate)}</span></div>
<div class="row"><span class="label">Expected Delivery</span><span>${formatDate(r.expectedDeliveryDate)}</span></div>
<div class="row"><span class="label">Status</span><span>${showValue(r.status)}</span></div>
</div>
<div class="section">
<h2>Design Specification</h2>
<div class="row"><span class="label">Jewelry Type</span><span>${showValue(r.designSpecification?.jewelryType)}</span></div>
<div class="row"><span class="label">Purity</span><span>${showValue(r.designSpecification?.purity)}</span></div>
<div class="row"><span class="label">Expected Weight</span><span>${showValue(r.designSpecification?.expectedWeight)} g</span></div>
<div class="row"><span class="label">Size</span><span>${showValue(r.designSpecification?.size)}</span></div>
<div class="row"><span class="label">Design</span><span>${showValue(r.designSpecification?.designDescription)}</span></div>
<div class="row"><span class="label">Stone Requirements</span><span>${showValue(r.designSpecification?.stoneRequirements)}</span></div>
<div class="row"><span class="label">Engraving</span><span>${showValue(r.designSpecification?.engravingInstructions)}</span></div>
<div class="row"><span class="label">Special Instructions</span><span>${showValue(r.designSpecification?.specialInstructions)}</span></div>
</div>
<div class="section">
<h2>Payment</h2>
<div class="row"><span class="label">Estimated Price</span><span>${formatMoney(r.estimatedPrice)}</span></div>
<div class="row"><span class="label">Advance Paid</span><span>${formatMoney(r.advancePayment?.amount)}</span></div>
<div class="row"><span class="label">Payment Method</span><span>${showValue(r.advancePayment?.method)}</span></div>
<div class="row"><span class="label">Reference</span><span>${showValue(r.advancePayment?.referenceNumber)}</span></div>
<div class="row"><span class="label">Payment Date</span><span>${formatDate(r.advancePayment?.paymentDate)}</span></div>
<div class="row total"><span>Remaining Amount</span><span>${formatMoney(r.remainingAmount)}</span></div>
</div>
<div class="section">
<div class="row"><span class="label">Booked By</span><span>${showValue(r.bookedBy)}</span></div>
<div class="row"><span class="label">Notes</span><span>${showValue(r.notes)}</span></div>
</div>
<div class="note">Thank you for choosing AurumDesk</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>
`);
receiptWindow.document.close();
}catch(err){
setError(err.message);
}
}

if(loading)return <LoadingState message="Loading custom order..."/>;

if(!order)return(
<section>
<ErrorAlert message={error||"Custom order not found"}/>
<Link to="/custom-orders" className="btn btn-outline-secondary">Back</Link>
</section>
);

return(
<section>
<div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
<div>
<h1 className="h3 mb-1">{order.orderNo}</h1>
<p className="text-muted mb-0">Custom order details and revision history.</p>
</div>
<div className="d-flex gap-2 flex-wrap">
<button type="button" className="btn btn-outline-dark" onClick={handlePrintReceipt}>Print receipt</button>
<Link to={`/custom-orders/${order._id}/edit`} className="btn btn-primary">Edit order</Link>
<Link to="/custom-orders" className="btn btn-outline-secondary">Back</Link>
</div>
</div>

<ErrorAlert message={error}/>

<div className="row g-4">
<div className="col-lg-6">
<div className="card page-card h-100">
<div className="card-body">
<h2 className="h5 border-bottom pb-2">Customer & Booking</h2>
<dl className="row mb-0">
<dt className="col-sm-5">Customer</dt><dd className="col-sm-7">{showValue(order.customer?.name)}</dd>
<dt className="col-sm-5">Customer ID</dt><dd className="col-sm-7">{showValue(order.customer?.customerId)}</dd>
<dt className="col-sm-5">Phone</dt><dd className="col-sm-7">{showValue(order.customer?.phone)}</dd>
<dt className="col-sm-5">Booking date</dt><dd className="col-sm-7">{formatDate(order.bookingDate)}</dd>
<dt className="col-sm-5">Expected delivery</dt><dd className="col-sm-7">{formatDate(order.expectedDeliveryDate)}</dd>
<dt className="col-sm-5">Booked by</dt><dd className="col-sm-7">{showValue(order.bookedBy)}</dd>
<dt className="col-sm-5">Status</dt><dd className="col-sm-7"><span className="badge text-bg-primary">{order.status}</span></dd>
</dl>
</div>
</div>
</div>

<div className="col-lg-6">
<div className="card page-card h-100">
<div className="card-body">
<h2 className="h5 border-bottom pb-2">Price & Advance</h2>
<dl className="row mb-0">
<dt className="col-sm-5">Estimated price</dt><dd className="col-sm-7">{formatMoney(order.estimatedPrice)}</dd>
<dt className="col-sm-5">Advance paid</dt><dd className="col-sm-7">{formatMoney(order.advancePaid)}</dd>
<dt className="col-sm-5">Remaining</dt><dd className="col-sm-7 fw-bold">{formatMoney(order.remainingAmount)}</dd>
<dt className="col-sm-5">Payment method</dt><dd className="col-sm-7">{showValue(order.advancePaymentMethod).replaceAll("_"," ")}</dd>
<dt className="col-sm-5">Reference</dt><dd className="col-sm-7">{showValue(order.advanceReferenceNumber)}</dd>
<dt className="col-sm-5">Payment date</dt><dd className="col-sm-7">{formatDate(order.advancePaymentDate)}</dd>
</dl>
</div>
</div>
</div>

<div className="col-12">
<div className="card page-card">
<div className="card-body">
<h2 className="h5 border-bottom pb-2">Design Specification</h2>
<div className="row g-3">
<div className="col-md-4"><strong>Jewelry type</strong><div>{showValue(order.jewelryType)}</div></div>
<div className="col-md-4"><strong>Purity</strong><div>{showValue(order.purity)}</div></div>
<div className="col-md-4"><strong>Expected weight</strong><div>{showValue(order.expectedWeight)} g</div></div>
<div className="col-md-4"><strong>Size</strong><div>{showValue(order.size)}</div></div>
<div className="col-md-8"><strong>Design description</strong><div>{showValue(order.designDescription)}</div></div>
<div className="col-md-6"><strong>Stone requirements</strong><div>{showValue(order.stoneRequirements)}</div></div>
<div className="col-md-6"><strong>Engraving instructions</strong><div>{showValue(order.engravingInstructions)}</div></div>
<div className="col-12"><strong>Special instructions</strong><div>{showValue(order.specialInstructions)}</div></div>
<div className="col-12"><strong>Notes</strong><div>{showValue(order.notes)}</div></div>
</div>
</div>
</div>
</div>

<div className="col-12">
<div className="card page-card">
<div className="card-body">
<h2 className="h5 border-bottom pb-2">Revision History</h2>
{!order.revisionHistory?.length?(
<p className="text-muted mb-0">No revisions recorded.</p>
):(
<div className="table-responsive">
<table className="table table-bordered align-middle mb-0">
<thead className="table-light">
<tr>
<th>Date</th>
<th>Changed by</th>
<th>Reason</th>
<th>Changes</th>
</tr>
</thead>
<tbody>
{order.revisionHistory.map((revision,index)=>(
<tr key={index}>
<td>{formatDateTime(revision.changedAt)}</td>
<td>{revision.changedBy}</td>
<td>{revision.reason}</td>
<td>
{revision.changes?.map((change,i)=>(
<div key={i} className="mb-2">
<strong>{change.field}:</strong> {showValue(change.oldValue)} → {showValue(change.newValue)}
</div>
))}
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</div>
</div>
</div>
</div>
</section>
);
}

export default CustomOrderDetailsPage;