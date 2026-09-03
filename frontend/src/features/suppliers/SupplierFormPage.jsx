import {
useState
} from "react";

import {
Link,
useNavigate
} from "react-router-dom";

import {
createSupplier
} from "./supplierService";

import ErrorAlert from "../../components/ErrorAlert";


function SupplierFormPage(){

const navigate=useNavigate();

const [form,setForm]=useState({
name:"",
phone:"",
email:"",
address:"",
supplierType:"SUPPLIER"
});


const [error,setError]=useState("");

const [saving,setSaving]=useState(false);



function handleChange(e){

const {
name,
value
}=e.target;


setForm(current=>({
...current,
[name]:value
}));

}



async function handleSubmit(e){

e.preventDefault();

try{

setSaving(true);
setError("");

await createSupplier(
form
);

navigate(
"/suppliers"
);


}catch(error){

setError(
error.message
);

}finally{

setSaving(false);

}

}



return(

<section>

<div className="d-flex justify-content-between mb-4">

<div>

<h1 className="h3">
Create Supplier
</h1>

</div>


<Link
to="/suppliers"
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

<div className="card page-card">

<div className="card-body">


<div className="mb-3">

<label className="form-label">
Name
</label>


<input
className="form-control"
name="name"
value={form.name}
onChange={handleChange}
required
/>

</div>



<div className="mb-3">

<label className="form-label">
Phone
</label>


<input
className="form-control"
name="phone"
value={form.phone}
onChange={handleChange}
required
/>

</div>



<div className="mb-3">

<label className="form-label">
Email
</label>


<input
className="form-control"
name="email"
value={form.email}
onChange={handleChange}
/>

</div>



<div className="mb-3">

<label className="form-label">
Address
</label>


<textarea
className="form-control"
name="address"
value={form.address}
onChange={handleChange}
/>

</div>



<div className="mb-3">

<label className="form-label">
Type
</label>


<select
className="form-select"
name="supplierType"
value={form.supplierType}
onChange={handleChange}
>

<option value="SUPPLIER">
Supplier
</option>

<option value="WORKSHOP">
Workshop
</option>

<option value="OTHER">
Other
</option>

</select>


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
"Create Supplier"
}
</button>



</div>

</div>

</form>


</section>

);

}


export default SupplierFormPage;