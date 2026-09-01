import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  getPurchases
} from "./purchaseService";


function money(value){
return new Intl.NumberFormat(
"en-BD",
{
style:"currency",
currency:"BDT",
minimumFractionDigits:2
}
).format(
Number(value||0)
);
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



function PurchasesPage(){

const [
purchases,
setPurchases
]=useState([]);

const [
loading,
setLoading
]=useState(true);

const [
error,
setError
]=useState("");



useEffect(()=>{

let active=true;


async function load(){

try{

setLoading(true);
setError("");

const response=
await getPurchases();


if(active){

setPurchases(
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


load();


return()=>{

active=false;

};


},[]);



if(loading){

return(
<div className="card p-4 text-center">
Loading Purchases...
</div>
);

}


return(

<section>

<div className="d-flex justify-content-between align-items-center mb-4">

<div>

<h1 className="h3 mb-1">
Purchases
</h1>

<p className="text-muted mb-0">
Manage supplier purchases and stock entries.
</p>

</div>


<Link
to="/purchases/new"
className="btn btn-dark"
>
New Purchase
</Link>


</div>



{error&&(

<div
className="alert alert-danger"
role="alert"
>
{error}
</div>

)}



<div className="card page-card">

<div className="card-body">


<div className="table-responsive">

<table className="table table-bordered table-hover">

<thead>

<tr>

<th>
Purchase No
</th>

<th>
Supplier
</th>

<th>
Date
</th>

<th>
Amount
</th>

<th>
Paid
</th>

<th>
Due
</th>

<th>
Status
</th>

<th>
Action
</th>

</tr>

</thead>


<tbody>


{purchases.map(
purchase=>(

<tr
key={
purchase._id
}
>


<td>
{purchase.purchaseNo}
</td>


<td>

<div>
<strong>
{
purchase.supplier?.name||
"N/A"
}
</strong>
</div>

<small>
{
purchase.supplier?.phone||
""
}
</small>

</td>


<td>
{
dateText(
purchase.purchaseDate
)
}
</td>


<td>
{
money(
purchase.totalAmount
)
}
</td>


<td>
{
money(
purchase.paidAmount
)
}
</td>


<td>
{
money(
purchase.dueAmount
)
}
</td>


<td>

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

</td>


<td>

<Link
to={`/purchases/${purchase._id}`}
className="btn btn-sm btn-dark"
>
View
</Link>

</td>


</tr>

)

)}



{
!purchases.length&&(

<tr>

<td
colSpan="8"
className="text-center"
>
No purchases found.
</td>

</tr>

)

}


</tbody>

</table>

</div>


</div>

</div>


</section>

);

}


export default PurchasesPage;