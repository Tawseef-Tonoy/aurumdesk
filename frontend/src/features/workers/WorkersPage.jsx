import{useEffect,useState}from"react";
import{Link}from"react-router-dom";
import ErrorAlert from"../../components/ErrorAlert";
import LoadingState from"../../components/LoadingState";
import EmptyState from"../../components/EmptyState";
import{getWorkers}from"./workerService";

function WorkersPage(){

const[workers,setWorkers]=useState([]);
const[loading,setLoading]=useState(true);
const[error,setError]=useState("");

async function loadWorkers(){

try{

setError("");

const response=
await getWorkers();

setWorkers(
response.data||[]
);

}catch(err){

setError(
err.message
);

}finally{

setLoading(false);

}

}


useEffect(()=>{

loadWorkers();

},[]);



return(
<section>

<div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

<div>
<h1 className="h3 mb-1">
Workers
</h1>

<p className="text-muted mb-0">
Manage workshop workers and availability.
</p>

</div>


<Link
to="/workers/new"
className="btn btn-dark"
>
Add worker
</Link>

</div>


<ErrorAlert message={error}/>


{
loading?
(
<LoadingState message="Loading workers..."/>
)
:
workers.length===0?
(
<EmptyState message="No workers found."/>
)
:
(
<div className="card page-card">

<div className="table-responsive">

<table className="table table-hover align-middle mb-0">

<thead className="table-light">

<tr>
<th>ID</th>
<th>Name</th>
<th>Phone</th>
<th>Specialization</th>
<th>Availability</th>
<th>Workload</th>
<th>Status</th>
</tr>

</thead>


<tbody>

{
workers.map(worker=>(

<tr key={worker._id}>

<td>
{worker.workerId}
</td>


<td>
{worker.name}
</td>


<td>
{worker.phone}
</td>


<td>
{worker.specialization}
</td>


<td>
<span className="badge text-bg-info">
{worker.availability}
</span>
</td>


<td>
{worker.activeWorkload}
</td>


<td>
<span className={
`badge ${
worker.status==="ACTIVE"
?
"text-bg-success"
:
"text-bg-secondary"
}`
}>
{worker.status}
</span>
</td>


</tr>

))

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

export default WorkersPage;