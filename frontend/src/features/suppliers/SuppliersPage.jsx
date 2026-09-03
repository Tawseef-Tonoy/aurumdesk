import {
useEffect,
useState,
} from "react";

import {
Link,
} from "react-router-dom";

import {
getSuppliers,
} from "./supplierService";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";


function prettify(value){

return String(value||"")
.toLowerCase()
.replaceAll("_"," ")
.replace(
 /\b\w/g,
 letter=>letter.toUpperCase()
);

}



function SuppliersPage(){

const [
suppliers,
setSuppliers
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

async function load(){

try{

setError("");

const response=
await getSuppliers();


setSuppliers(
response.data||[]
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



return(

<section>


<div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

<div>

<h1 className="h3 mb-1">
Suppliers
</h1>

<p className="text-muted mb-0">
Manage workshops and suppliers.
</p>

</div>


<Link
to="/suppliers/new"
className="btn btn-dark"
>
Add Supplier
</Link>


</div>



<ErrorAlert
message={error}
/>



{
loading?

(
<LoadingState
message="Loading suppliers..."
/>
)

:

suppliers.length===0?

(
<EmptyState
message="No suppliers found."
/>
)

:

(
<div className="card page-card">

<div className="table-responsive">

<table className="table table-hover align-middle mb-0">

<thead className="table-light">

<tr>

<th>
Code
</th>

<th>
Name
</th>

<th>
Phone
</th>

<th>
Type
</th>

<th>
Status
</th>

</tr>

</thead>


<tbody>

{
suppliers.map(
supplier=>(

<tr
key={
supplier._id
}
>

<td>
{
supplier.supplierCode
}
</td>


<td>
<strong>
{
supplier.name
}
</strong>
</td>


<td>
{
supplier.phone
}
</td>


<td>

<span className="badge text-bg-info">

{
prettify(
supplier.supplierType
)
}

</span>

</td>


<td>

<span
className={
supplier.status==="ACTIVE"
?
"badge text-bg-success"
:
"badge text-bg-secondary"
}
>

{
prettify(
supplier.status
)
}

</span>

</td>


</tr>

)
)
}


</tbody>


</table>


</div>


</div>
)

}


</section>

);

}


export default SuppliersPage;