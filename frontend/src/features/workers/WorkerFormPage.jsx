import{useState}from"react";
import{Link,useNavigate}from"react-router-dom";
import ErrorAlert from"../../components/ErrorAlert";
import{createWorker}from"./workerService";

const initialForm={
name:"",
phone:"",
specialization:"",
availability:"AVAILABLE",
notes:""
};

function WorkerFormPage(){

const navigate=useNavigate();

const[formData,setFormData]=useState(initialForm);
const[error,setError]=useState("");
const[saving,setSaving]=useState(false);


function handleChange(e){

const{name,value}=e.target;

setFormData(current=>({
...current,
[name]:value
}));

}


async function handleSubmit(e){

e.preventDefault();

try{

setError("");
setSaving(true);

await createWorker(formData);

navigate("/workers");

}catch(err){

setError(err.message);

}finally{

setSaving(false);

}

}


return(
<section>

<div className="d-flex justify-content-between align-items-center mb-4">

<div>
<h1 className="h3 mb-1">
Add Worker
</h1>

<p className="text-muted mb-0">
Create workshop worker profile.
</p>
</div>

<Link
to="/workers"
className="btn btn-outline-secondary"
>
Back
</Link>

</div>


<ErrorAlert message={error}/>


<div className="card page-card">

<div className="card-body">

<form
className="row g-3"
onSubmit={handleSubmit}
>


<div className="col-md-6">

<label className="form-label">
Name
</label>

<input
className="form-control"
name="name"
value={formData.name}
onChange={handleChange}
required
/>

</div>


<div className="col-md-6">

<label className="form-label">
Phone
</label>

<input
className="form-control"
name="phone"
value={formData.phone}
onChange={handleChange}
required
/>

</div>


<div className="col-md-6">

<label className="form-label">
Specialization
</label>

<input
className="form-control"
name="specialization"
placeholder="Goldsmith, stone setter..."
value={formData.specialization}
onChange={handleChange}
required
/>

</div>


<div className="col-md-6">

<label className="form-label">
Availability
</label>

<select
className="form-select"
name="availability"
value={formData.availability}
onChange={handleChange}
>

<option value="AVAILABLE">
Available
</option>

<option value="BUSY">
Busy
</option>

<option value="UNAVAILABLE">
Unavailable
</option>

</select>

</div>


<div className="col-12">

<label className="form-label">
Notes
</label>

<textarea
className="form-control"
rows="3"
name="notes"
value={formData.notes}
onChange={handleChange}
/>

</div>


<div className="col-12">

<button
className="btn btn-dark"
disabled={saving}
>

{
saving?
"Saving..."
:
"Create Worker"
}

</button>

</div>


</form>

</div>

</div>

</section>
);

}

export default WorkerFormPage;