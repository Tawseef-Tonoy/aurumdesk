import{useEffect,useState}from"react";
import{Link,useNavigate,useParams}from"react-router-dom";
import ErrorAlert from"../../components/ErrorAlert";
import LoadingState from"../../components/LoadingState";
import{getCustomers}from"../customers/customerService";
import{createCustomOrder,getCustomOrderById,updateCustomOrder}from"./customOrderService";

const today=new Date().toISOString().slice(0,10);

const emptyForm={
customer:"",
bookingDate:today,
jewelryType:"",
designDescription:"",
purity:"",
expectedWeight:"",
size:"",
stoneRequirements:"",
engravingInstructions:"",
specialInstructions:"",
estimatedPrice:"",
advancePaid:"",
advancePaymentMethod:"CASH",
advanceReferenceNumber:"",
advancePaymentDate:today,
expectedDeliveryDate:"",
notes:"",
bookedBy:"Salesman"
};

function CustomOrderFormPage(){
const{id}=useParams();
const navigate=useNavigate();
const isEdit=Boolean(id);
const[formData,setFormData]=useState(emptyForm);
const[customers,setCustomers]=useState([]);
const[loading,setLoading]=useState(true);
const[saving,setSaving]=useState(false);
const[error,setError]=useState("");
const[changedBy,setChangedBy]=useState("Salesman");
const[revisionReason,setRevisionReason]=useState("");

useEffect(()=>{
async function loadData(){
try{
setError("");
const customerResponse=await getCustomers({status:"ACTIVE"});
setCustomers(customerResponse.data||[]);
if(isEdit){
const response=await getCustomOrderById(id);
const order=response.data;
setFormData({
customer:order.customer?._id||order.customer||"",
bookingDate:dateValue(order.bookingDate),
jewelryType:order.jewelryType||"",
designDescription:order.designDescription||"",
purity:order.purity||"",
expectedWeight:order.expectedWeight??"",
size:order.size||"",
stoneRequirements:order.stoneRequirements||"",
engravingInstructions:order.engravingInstructions||"",
specialInstructions:order.specialInstructions||"",
estimatedPrice:order.estimatedPrice??"",
advancePaid:order.advancePaid??"",
advancePaymentMethod:order.advancePaymentMethod||"CASH",
advanceReferenceNumber:order.advanceReferenceNumber||"",
advancePaymentDate:dateValue(order.advancePaymentDate),
expectedDeliveryDate:dateValue(order.expectedDeliveryDate),
notes:order.notes||"",
bookedBy:order.bookedBy||"Salesman"
});
}
}catch(err){
setError(err.message);
}finally{
setLoading(false);
}
}
loadData();
},[id,isEdit]);

function dateValue(value){
return value?new Date(value).toISOString().slice(0,10):"";
}

function handleChange(e){
const{name,value}=e.target;
setFormData(current=>({...current,[name]:value}));
}

async function handleSubmit(e){
e.preventDefault();
try{
setError("");
const estimatedPrice=Number(formData.estimatedPrice);
const advancePaid=formData.advancePaid===""?0:Number(formData.advancePaid);
const expectedWeight=Number(formData.expectedWeight);

if(advancePaid>estimatedPrice){
setError("Advance cannot exceed estimated price");
return;
}

if(formData.expectedDeliveryDate<formData.bookingDate){
setError("Expected delivery date cannot be earlier than booking date");
return;
}

setSaving(true);

if(isEdit){
if(!revisionReason.trim()){
setError("Revision reason is required when editing a custom order");
setSaving(false);
return;
}

await updateCustomOrder(id,{
jewelryType:formData.jewelryType,
designDescription:formData.designDescription,
purity:formData.purity,
expectedWeight,
size:formData.size,
stoneRequirements:formData.stoneRequirements,
engravingInstructions:formData.engravingInstructions,
specialInstructions:formData.specialInstructions,
estimatedPrice,
advancePaid,
advancePaymentMethod:formData.advancePaymentMethod,
advanceReferenceNumber:formData.advanceReferenceNumber,
advancePaymentDate:formData.advancePaymentDate||undefined,
expectedDeliveryDate:formData.expectedDeliveryDate,
notes:formData.notes,
changedBy,
revisionReason
});
navigate(`/custom-orders/${id}`);
}else{
const response=await createCustomOrder({
...formData,
expectedWeight,
estimatedPrice,
advancePaid,
advancePaymentDate:formData.advancePaymentDate||undefined
});
navigate(`/custom-orders/${response.data._id}`);
}
}catch(err){
setError(err.message);
}finally{
setSaving(false);
}
}

if(loading)return <LoadingState message={isEdit?"Loading custom order...":"Loading form..."}/>;

return(
<section>
<div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
<div>
<h1 className="h3 mb-1">{isEdit?"Edit custom order":"Book custom order"}</h1>
<p className="text-muted mb-0">{isEdit?"Update specifications with revision history.":"Record customer specifications and advance payment."}</p>
</div>
<Link to="/custom-orders" className="btn btn-outline-secondary">Back</Link>
</div>

<ErrorAlert message={error}/>

<div className="card page-card">
<div className="card-body">
<form className="row g-3" onSubmit={handleSubmit}>

<div className="col-12">
<h2 className="h5 border-bottom pb-2">Customer & Booking</h2>
</div>

<div className="col-md-8">
<label className="form-label">Customer</label>
<select name="customer" className="form-select" value={formData.customer} onChange={handleChange} disabled={isEdit} required>
<option value="">Select customer</option>
{customers.map(customer=>(
<option key={customer._id} value={customer._id}>
{customer.customerId} - {customer.name} - {customer.phone}
</option>
))}
</select>
</div>

<div className="col-md-4 d-flex align-items-end">
<Link to="/customers/new" className="btn btn-outline-dark w-100">Create new customer</Link>
</div>

<div className="col-md-6">
<label className="form-label">Booking date</label>
<input type="date" name="bookingDate" className="form-control" value={formData.bookingDate} onChange={handleChange} disabled={isEdit} required/>
</div>

<div className="col-md-6">
<label className="form-label">{isEdit?"Originally booked by":"Booked by"}</label>
<select name="bookedBy" className="form-select" value={formData.bookedBy} onChange={handleChange} disabled={isEdit} required>
<option value="Owner">Owner</option>
<option value="Admin">Admin</option>
<option value="Salesman">Salesman</option>
</select>
</div>

<div className="col-12 mt-4">
<h2 className="h5 border-bottom pb-2">Design Specification</h2>
</div>

<div className="col-md-6">
<label className="form-label">Jewelry type</label>
<input name="jewelryType" className="form-control" placeholder="Ring, necklace, bracelet..." value={formData.jewelryType} onChange={handleChange} required/>
</div>

<div className="col-md-6">
<label className="form-label">Purity</label>
<select name="purity" className="form-select" value={formData.purity} onChange={handleChange} required>
<option value="">Select purity</option>
<option value="18K">18K</option>
<option value="21K">21K</option>
<option value="22K">22K</option>
<option value="24K">24K</option>
</select>
</div>

<div className="col-12">
<label className="form-label">Design description</label>
<textarea name="designDescription" className="form-control" rows="3" value={formData.designDescription} onChange={handleChange} required/>
</div>

<div className="col-md-6">
<label className="form-label">Expected weight</label>
<input type="number" min="0" step="0.01" name="expectedWeight" className="form-control" value={formData.expectedWeight} onChange={handleChange} required/>
</div>

<div className="col-md-6">
<label className="form-label">Size</label>
<input name="size" className="form-control" value={formData.size} onChange={handleChange}/>
</div>

<div className="col-md-6">
<label className="form-label">Stone requirements</label>
<textarea name="stoneRequirements" className="form-control" rows="2" value={formData.stoneRequirements} onChange={handleChange}/>
</div>

<div className="col-md-6">
<label className="form-label">Engraving instructions</label>
<textarea name="engravingInstructions" className="form-control" rows="2" value={formData.engravingInstructions} onChange={handleChange}/>
</div>

<div className="col-12">
<label className="form-label">Special instructions</label>
<textarea name="specialInstructions" className="form-control" rows="2" value={formData.specialInstructions} onChange={handleChange}/>
</div>

<div className="col-12 mt-4">
<h2 className="h5 border-bottom pb-2">Price & Advance Payment</h2>
</div>

<div className="col-md-6">
<label className="form-label">Estimated price</label>
<input type="number" min="0" step="0.01" name="estimatedPrice" className="form-control" value={formData.estimatedPrice} onChange={handleChange} required/>
</div>

<div className="col-md-6">
<label className="form-label">Advance paid</label>
<input type="number" min="0" step="0.01" name="advancePaid" className="form-control" value={formData.advancePaid} onChange={handleChange}/>
</div>

<div className="col-md-6">
<label className="form-label">Advance payment method</label>
<select name="advancePaymentMethod" className="form-select" value={formData.advancePaymentMethod} onChange={handleChange}>
<option value="CASH">Cash</option>
<option value="CARD">Card</option>
<option value="BANK_TRANSFER">Bank transfer</option>
<option value="MOBILE_BANKING">Mobile banking</option>
</select>
</div>

<div className="col-md-6">
<label className="form-label">Payment reference</label>
<input name="advanceReferenceNumber" className="form-control" value={formData.advanceReferenceNumber} onChange={handleChange}/>
</div>

<div className="col-md-6">
<label className="form-label">Advance payment date</label>
<input type="date" name="advancePaymentDate" className="form-control" value={formData.advancePaymentDate} onChange={handleChange}/>
</div>

<div className="col-md-6">
<label className="form-label">Remaining amount</label>
<input className="form-control" value={`৳${Math.max(Number(formData.estimatedPrice||0)-Number(formData.advancePaid||0),0).toLocaleString()}`} disabled/>
</div>

<div className="col-12 mt-4">
<h2 className="h5 border-bottom pb-2">Delivery & Notes</h2>
</div>

<div className="col-md-6">
<label className="form-label">Expected delivery date</label>
<input type="date" name="expectedDeliveryDate" className="form-control" min={formData.bookingDate} value={formData.expectedDeliveryDate} onChange={handleChange} required/>
</div>

<div className="col-12">
<label className="form-label">Notes</label>
<textarea name="notes" className="form-control" rows="3" value={formData.notes} onChange={handleChange}/>
</div>

{isEdit&&(
<>
<div className="col-12 mt-4">
<h2 className="h5 border-bottom pb-2">Revision Information</h2>
<p className="text-muted">Every customer-requested specification change is permanently recorded.</p>
</div>

<div className="col-md-6">
<label className="form-label">Changed by</label>
<select className="form-select" value={changedBy} onChange={(e)=>setChangedBy(e.target.value)} required>
<option value="Owner">Owner</option>
<option value="Admin">Admin</option>
<option value="Salesman">Salesman</option>
</select>
</div>

<div className="col-md-6">
<label className="form-label">Revision reason</label>
<input className="form-control" placeholder="Example: Customer requested larger size" value={revisionReason} onChange={(e)=>setRevisionReason(e.target.value)} required/>
</div>
</>
)}

<div className="col-12 mt-3">
<button type="submit" className="btn btn-dark" disabled={saving}>
{saving?"Saving...":isEdit?"Save revision":"Book custom order"}
</button>
</div>

</form>
</div>
</div>
</section>
);
}

export default CustomOrderFormPage;