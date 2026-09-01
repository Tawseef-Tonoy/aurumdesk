import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";

import {
  getSuppliers,
} from "../suppliers/supplierService";

import {
  createPurchase,
} from "./purchaseService";

import {
  getInventoryItems,
} from "../inventory/inventoryService";


const emptyItem={
  jewelryItem:"",
  quantity:1,
  purchasePrice:0,
};


function PurchaseFormPage(){

const navigate=useNavigate();


const [
suppliers,
setSuppliers
]=useState([]);


const [
inventory,
setInventory
]=useState([]);


const [
items,
setItems
]=useState([
{
...emptyItem
}
]);


const [
supplier,
setSupplier
]=useState("");


const [
discount,
setDiscount
]=useState(0);


const [
paidAmount,
setPaidAmount
]=useState(0);


const [
paymentMethod,
setPaymentMethod
]=useState("CASH");


const [
loading,
setLoading
]=useState(true);


const [
saving,
setSaving
]=useState(false);


const [
error,
setError
]=useState("");



useEffect(()=>{

async function load(){

try{

const [
supplierResponse,
inventoryResponse
]=await Promise.all([
getSuppliers(),
getInventoryItems()
]);


setSuppliers(
supplierResponse.data||[]
);


setInventory(
inventoryResponse.data||[]
);


}catch(error){

setError(
error.message
);

}finally{

setLoading(false);

}

}


load();

},[]);



const subtotal=
useMemo(()=>{

return items.reduce(
(total,item)=>{

return total+
(
Number(item.quantity||0)*
Number(item.purchasePrice||0)
);

},
0
);

},[items]);



const totalAmount=
Math.max(
subtotal-
Number(discount||0),
0
);


const dueAmount=
Math.max(
totalAmount-
Number(paidAmount||0),
0
);



function updateItem(
index,
field,
value
){

setItems(
current=>
current.map(
(item,itemIndex)=>

itemIndex===index
?
{
...item,
[field]:value
}
:
item

)
);

}



function addItem(){

setItems(
current=>[
...current,
{
...emptyItem
}
]
);

}



function removeItem(index){

setItems(
current=>
current.filter(
(_,itemIndex)=>
itemIndex!==index
)
);

}



async function handleSubmit(
event
){

event.preventDefault();


if(!supplier){

setError(
"Supplier is required."
);

return;

}


try{

setSaving(true);
setError("");


await createPurchase({

supplier,

items,

discount:Number(
discount
),

paidAmount:Number(
paidAmount
),

paymentMethod

});


navigate(
"/purchases"
);


}catch(error){

setError(
error.message
);

}finally{

setSaving(false);

}

}



if(loading){

return(
<LoadingState message="Loading purchase form..." />
);

}



return(

<section>

<div className="d-flex justify-content-between align-items-center mb-4">

<div>

<h1 className="h3 mb-1">
Create Purchase
</h1>

<p className="text-muted mb-0">
Create supplier purchase entry.
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


<form
onSubmit={handleSubmit}
>


<div className="card page-card mb-4">

<div className="card-body">


<label className="form-label">
Supplier
</label>


<select
className="form-select"
value={supplier}
onChange={
e=>setSupplier(
e.target.value
)
}
required
>

<option value="">
Select supplier
</option>


{
suppliers.map(
supplier=>(

<option
key={supplier._id}
value={supplier._id}
>
{supplier.name}
</option>

)
)
}


</select>


</div>

</div>




<div className="card page-card mb-4">

<div className="card-header bg-white">
<h2 className="h5 mb-0">
Items
</h2>
</div>


<div className="card-body">


{
items.map(
(item,index)=>(

<div
className="row g-3 mb-3"
key={index}
>


<div className="col-md-5">

<label className="form-label">
Jewelry Item
</label>


<select
className="form-select"
value={
item.jewelryItem
}
onChange={
e=>
updateItem(
index,
"jewelryItem",
e.target.value
)
}
required
>

<option value="">
Select item
</option>


{
inventory.map(
product=>(

<option
key={product._id}
value={product._id}
>
{product.sku}
 - 
{product.name}
</option>

)
)
}


</select>

</div>


<div className="col-md-2">

<label className="form-label">
Quantity
</label>


<input
type="number"
min="1"
className="form-control"
value={
item.quantity
}
onChange={
e=>
updateItem(
index,
"quantity",
Number(e.target.value)
)
}
/>

</div>


<div className="col-md-3">

<label className="form-label">
Purchase Price
</label>


<input
type="number"
min="0"
className="form-control"
value={
item.purchasePrice
}
onChange={
e=>
updateItem(
index,
"purchasePrice",
Number(e.target.value)
)
}
/>

</div>


<div className="col-md-2 d-flex align-items-end">

<button
type="button"
className="btn btn-outline-danger w-100"
onClick={
()=>removeItem(index)
}
disabled={
items.length===1
}
>
Remove
</button>


</div>


</div>

)
)
}



<button
type="button"
className="btn btn-outline-dark"
onClick={addItem}
>
Add Item
</button>


</div>

</div>




<div className="card page-card mb-4">

<div className="card-body">


<div className="row g-3">


<div className="col-md-4">

<label className="form-label">
Discount
</label>

<input
type="number"
className="form-control"
value={discount}
onChange={
e=>setDiscount(
e.target.value
)
}
/>

</div>


<div className="col-md-4">

<label className="form-label">
Paid Amount
</label>

<input
type="number"
className="form-control"
value={paidAmount}
onChange={
e=>setPaidAmount(
e.target.value
)
}
/>

</div>


<div className="col-md-4">

<label className="form-label">
Payment Method
</label>


<select
className="form-select"
value={paymentMethod}
onChange={
e=>setPaymentMethod(
e.target.value
)
}
>

<option>
CASH
</option>

<option>
BANK_TRANSFER
</option>

<option>
CARD
</option>

<option>
MOBILE_BANKING
</option>

<option>
DUE
</option>


</select>


</div>


</div>


<hr/>


<h5>
Subtotal:
৳{subtotal.toLocaleString()}
</h5>


<h5>
Total:
৳{totalAmount.toLocaleString()}
</h5>


<h5>
Due:
৳{dueAmount.toLocaleString()}
</h5>


</div>

</div>



<button
className="btn btn-dark"
disabled={saving}
>
{
saving
?
"Saving..."
:
"Create Purchase"
}
</button>


</form>


</section>

);

}


export default PurchaseFormPage;