import {useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {createSale} from "./saleService";
import apiClient from "../../api/apiClient";

function SaleFormPage(){

const navigate=useNavigate();

const [customers,setCustomers]=useState([]);
const [jewelryItems,setJewelryItems]=useState([]);
const [selectedItems,setSelectedItems]=useState([]);
const [selectedItem,setSelectedItem]=useState("");

const [form,setForm]=useState({
 invoiceNumber:"",
 customer:"",
 salesPerson:"Admin",
 goldRateSnapshot:0,
 subtotal:0,
 discount:0,
 vat:0,
 totalAmount:0,
 paidAmount:0,
 dueAmount:0,
 paymentMethod:"CASH",
 warrantyTerms:"",
 returnExchangeTerms:""
});


useEffect(()=>{
 loadCustomers();
 loadJewelryItems();
},[]);


const loadCustomers=async()=>{
 const res=await apiClient.get("/customers");
 setCustomers(res.data.data||[]);
};


const loadJewelryItems=async()=>{
 const res=await apiClient.get("/jewelry-items");
 setJewelryItems(res.data.data||[]);
};


const handleChange=e=>{

const updated={
 ...form,
 [e.target.name]:e.target.value
};

const subtotal=Number(updated.subtotal)||0;
const discount=Number(updated.discount)||0;
const vat=Number(updated.vat)||0;
const paid=Number(updated.paidAmount)||0;

updated.totalAmount=subtotal-discount+vat;
updated.dueAmount=updated.totalAmount-paid;

setForm(updated);

};


const addItem=async()=>{

const item=jewelryItems.find(
 i=>i._id===selectedItem
);

if(item.status!=="AVAILABLE"){
alert("This item is already sold");
return;
}

if(!item)return;


try{

const res=await apiClient.get(
 `/price-calculation/${item._id}`
);

const price=res.data.data;


const newItem={

 jewelryItem:item._id,
 itemName:item.name,
 quantity:1,

 purity:item.purity,

 grossWeight:item.grossWeight,

 netGoldWeight:item.netGoldWeight,

 goldRate:price.goldRate,

 goldValue:price.goldValue,

 makingCharge:price.makingCharge,

 stoneCost:price.stonePrice,

 subtotal:price.finalPrice

};


const updatedItems=[
 ...selectedItems,
 newItem
];


setSelectedItems(updatedItems);


const subtotal=
updatedItems.reduce(
(sum,i)=>sum+i.subtotal,
0
);


setForm({

...form,

goldRateSnapshot:price.goldRate,

subtotal,

totalAmount:
subtotal-
Number(form.discount||0)+
Number(form.vat||0),

dueAmount:
subtotal-
Number(form.discount||0)+
Number(form.vat||0)-
Number(form.paidAmount||0)

});


setSelectedItem("");

}catch(err){

alert("Price calculation failed");

}

};



const removeItem=index=>{

const updated=
selectedItems.filter(
(_,i)=>i!==index
);

setSelectedItems(updated);


const subtotal=
updated.reduce(
(sum,i)=>sum+i.subtotal,
0
);


setForm({
...form,
subtotal,
totalAmount:
subtotal-
Number(form.discount||0)+
Number(form.vat||0)
});

};



const handleSubmit=async e=>{

e.preventDefault();

try{

await createSale({

...form,

items:selectedItems,

subtotal:Number(form.subtotal),
discount:Number(form.discount),
vat:Number(form.vat),
totalAmount:Number(form.totalAmount),
paidAmount:Number(form.paidAmount),
dueAmount:Number(form.dueAmount)

});


navigate("/sales");

}catch(err){

alert(err.message);

}

};



return(

<section>

<h1 className="h3 mb-4">
Create Sale Invoice
</h1>


<form onSubmit={handleSubmit}>

<div className="card page-card">
<div className="card-body">


<input
className="form-control mb-3"
name="invoiceNumber"
placeholder="Invoice Number"
onChange={handleChange}
/>


<select
className="form-select mb-3"
name="customer"
onChange={handleChange}
>

<option>Select Customer</option>

{customers.map(c=>

<option key={c._id} value={c._id}>
{c.name}
</option>

)}

</select>


<input
className="form-control mb-3"
name="salesPerson"
value={form.salesPerson}
onChange={handleChange}
/>



<select
className="form-select mb-3"
value={selectedItem}
onChange={e=>setSelectedItem(e.target.value)}
>

<option>Select Jewelry Item</option>

{jewelryItems.map(i=>
<option 
key={i._id}
value={i._id}
disabled={i.status!=="AVAILABLE"}
>
{i.name}-{i.sku} ({i.status})
</option>
)}

</select>


<button
type="button"
className="btn btn-secondary mb-3"
onClick={addItem}
>
Add Item
</button>



{selectedItems.map((item,index)=>(

<div
key={index}
className="border p-2 mb-2"
>

<b>{item.itemName}</b>
<br/>
Purity: {item.purity}
<br/>
Weight: {item.netGoldWeight}g
<br/>
Gold Rate: {item.goldRate}
<br/>
Subtotal: {item.subtotal}


<button
type="button"
className="btn btn-danger btn-sm float-end"
onClick={()=>removeItem(index)}
>
Remove
</button>

</div>

))}



<input
className="form-control mb-3"
value={form.subtotal}
readOnly
placeholder="Subtotal"
/>


<input
className="form-control mb-3"
name="discount"
placeholder="Discount"
onChange={handleChange}
/>


<input
className="form-control mb-3"
name="vat"
placeholder="VAT"
onChange={handleChange}
/>


<input
className="form-control mb-3"
value={form.totalAmount}
readOnly
placeholder="Total Amount"
/>


<input
className="form-control mb-3"
name="paidAmount"
placeholder="Paid Amount"
onChange={handleChange}
/>


<input
className="form-control mb-3"
value={form.dueAmount}
readOnly
placeholder="Due Amount"
/>


<select
className="form-select mb-3"
name="paymentMethod"
onChange={handleChange}
>

<option>CASH</option>
<option>CARD</option>
<option>BANK</option>
<option>MOBILE_BANKING</option>
<option>DUE</option>

</select>


<textarea
className="form-control mb-3"
name="warrantyTerms"
placeholder="Warranty Terms"
onChange={handleChange}
/>


<textarea
className="form-control mb-3"
name="returnExchangeTerms"
placeholder="Return / Exchange Terms"
onChange={handleChange}
/>


<button className="btn btn-dark">
Save Invoice
</button>


</div>
</div>

</form>

</section>

);

}

export default SaleFormPage;