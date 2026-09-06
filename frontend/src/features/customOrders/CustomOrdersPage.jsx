import{useEffect,useState}from"react";
import{Link}from"react-router-dom";
import EmptyState from"../../components/EmptyState";
import ErrorAlert from"../../components/ErrorAlert";
import LoadingState from"../../components/LoadingState";
import{getCustomOrders}from"./customOrderService";

function CustomOrdersPage(){
const[orders,setOrders]=useState([]);
const[search,setSearch]=useState("");
const[loading,setLoading]=useState(true);
const[error,setError]=useState("");

async function loadOrders(){
try{
setLoading(true);
setError("");
const response=await getCustomOrders({search:search||undefined});
setOrders(response.data||[]);
}catch(err){
setError(err.message);
}finally{
setLoading(false);
}
}

useEffect(()=>{loadOrders();},[]);

function handleSearch(e){
e.preventDefault();
loadOrders();
}

function formatDate(value){
return value?new Date(value).toLocaleDateString():"—";
}

function formatMoney(value){
return `৳${Number(value||0).toLocaleString()}`;
}

return(
<section>
<div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
<div>
<h1 className="h3 mb-1">Custom Orders</h1>
<p className="text-muted mb-0">Book and manage made-to-order jewelry.</p>
</div>
<Link to="/custom-orders/new" className="btn btn-dark">Book custom order</Link>
</div>

<div className="card page-card mb-4">
<div className="card-body">
<form className="row g-2" onSubmit={handleSearch}>
<div className="col-md-10">
<input type="search" className="form-control" placeholder="Search by order number, jewelry type, or design" value={search} onChange={(e)=>setSearch(e.target.value)}/>
</div>
<div className="col-md-2">
<button type="submit" className="btn btn-outline-dark w-100">Search</button>
</div>
</form>
</div>
</div>

<ErrorAlert message={error}/>

{loading?(
<LoadingState message="Loading custom orders..."/>
):orders.length===0?(
<EmptyState message="No custom orders found."/>
):(
<div className="card page-card">
<div className="table-responsive">
<table className="table table-hover align-middle mb-0">
<thead className="table-light">
<tr>
<th>Order No.</th>
<th>Customer</th>
<th>Jewelry</th>
<th>Booking</th>
<th>Price</th>
<th>Advance</th>
<th>Remaining</th>
<th>Delivery</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
{orders.map((order)=>(
<tr key={order._id}>
<td>{order.orderNo}</td>
<td>
<div>{order.customer?.name||"—"}</div>
<small className="text-muted">{order.customer?.phone||""}</small>
</td>
<td>
<div>{order.jewelryType}</div>
<small className="text-muted">{order.purity}</small>
</td>
<td>{formatDate(order.bookingDate)}</td>
<td>{formatMoney(order.estimatedPrice)}</td>
<td>{formatMoney(order.advancePaid)}</td>
<td>{formatMoney(order.remainingAmount)}</td>
<td>{formatDate(order.expectedDeliveryDate)}</td>
<td><span className="badge text-bg-primary">{order.status}</span></td>
<td>
<div className="d-flex gap-2 flex-wrap">
<Link to={`/custom-orders/${order._id}`} className="btn btn-sm btn-outline-dark">View</Link>
<Link to={`/custom-orders/${order._id}/edit`} className="btn btn-sm btn-outline-primary">Edit</Link>
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}
</section>
);
}

export default CustomOrdersPage;