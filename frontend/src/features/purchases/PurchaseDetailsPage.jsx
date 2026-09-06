import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  getPurchaseById,
  confirmPurchase,
  cancelPurchase,
} from "./purchaseService";


function money(value){

return `৳${Number(value||0).toLocaleString(
"en-BD",
{
minimumFractionDigits:2
}
)}`;

}


function PurchaseDetailsPage(){

const {
id
}=useParams();

const navigate=
useNavigate();


const [
purchase,
setPurchase
]=useState(null);


const [
loading,
setLoading
]=useState(true);


const [
error,
setError
]=useState("");


const [
processing,
setProcessing
]=useState(false);



async function loadPurchase(){

try{

setLoading(true);
setError("");

const response=
await getPurchaseById(
id
);


setPurchase(
response.data
);


}catch(error){

setError(
error.message
);

}finally{

setLoading(false);

}

}



useEffect(()=>{

loadPurchase();

},[id]);




async function handleConfirm(){

try{

setProcessing(true);
setError("");

await confirmPurchase(
id,
"ADMIN"
);


await loadPurchase();


}catch(error){

setError(
error.message
);

}finally{

setProcessing(false);

}

}



async function handleCancel(){

const confirmed=
window.confirm(
"Cancel this purchase?"
);


if(!confirmed){
return;
}


try{

setProcessing(true);
setError("");

await cancelPurchase(
id
);


await loadPurchase();


}catch(error){

setError(
error.message
);

}finally{

setProcessing(false);

}

}



if(loading){

return(
<LoadingState message="Loading purchase..." />
);

}



if(!purchase){

return(
<ErrorAlert message="Purchase not found." />
);

}



return(

<section>


<div className="d-flex justify-content-between align-items-center mb-4">


<div>

<h1 className="h3 mb-1">
Purchase Details
</h1>

<p className="text-muted mb-0">
{purchase.purchaseNo}
</p>

</div>


<Link
to="/purchases"
className="btn btn-outline-secondary"
>
Back
</Link>


</div>



<ErrorAlert
message={error}
/>



<div className="card page-card mb-4">

<div className="card-body">


<div className="row">


<div className="col-md-6">

<strong>
Supplier
</strong>

<p>
{
purchase.supplier?.name ||
"N/A"
}
</p>

</div>



<div className="col-md-6">

<strong>
Status
</strong>

<p>

<span
className={
purchase.status==="CONFIRMED"
?
"badge text-bg-success"
:
purchase.status==="CANCELLED"
?
"badge text-bg-danger"
:
"badge text-bg-warning"
}
>
{
purchase.status
}
</span>

</p>

</div>


</div>


</div>

</div>




<div className="card page-card mb-4">


<div className="card-header bg-white">

<h2 className="h5 mb-0">
Items
</h2>

</div>


<div className="table-responsive">


<table className="table mb-0">


<thead>

<tr>

<th>
SKU
</th>

<th>
Item
</th>

<th>
Quantity
</th>

<th>
Price
</th>

<th>
Subtotal
</th>

</tr>

</thead>


<tbody>


{
purchase.items.map(
item=>(

<tr
key={item._id}
>

<td>
{item.sku}
</td>


<td>
{item.itemName}
</td>


<td>
{item.quantity}
</td>


<td>
{money(
item.purchasePrice
)}
</td>


<td>
{money(
item.subtotal
)}
</td>


</tr>

)
)
}


</tbody>


</table>


</div>


</div>




<div className="card page-card mb-4">


<div className="card-body">


<h5>
Subtotal:
{money(
purchase.subtotal
)}
</h5>


<h5>
Discount:
{money(
purchase.discount
)}
</h5>


<h5>
Total:
{money(
purchase.totalAmount
)}
</h5>


<h5>
Paid:
{money(
purchase.paidAmount
)}
</h5>


<h5>
Due:
{money(
purchase.dueAmount
)}
</h5>


</div>


</div>




{
purchase.status==="DRAFT"&&(

<div className="d-flex gap-2">


<button
className="btn btn-success"
disabled={processing}
onClick={
handleConfirm
}
>
{
processing
?
"Processing..."
:
"Confirm Purchase"
}
</button>


<button
className="btn btn-danger"
disabled={processing}
onClick={
handleCancel
}
>
Cancel Purchase
</button>


</div>

)

}


</section>

);

}


export default PurchaseDetailsPage;