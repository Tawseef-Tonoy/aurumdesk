import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import apiClient from "../../api/apiClient";
import {getSaleById} from "./saleService";

function SaleDetailsPage(){

const {id}=useParams();
const navigate=useNavigate();

const [sale,setSale]=useState(null);

useEffect(()=>{
loadSale();
},[]);

const loadSale=async()=>{
const data=await getSaleById(id);
setSale(data.data||data);
};


const action=async(url,msg)=>{
try{
await apiClient.patch(url);
alert(msg);
loadSale();
}catch(err){
alert(err.response?.data?.message||"Failed");
}
};


if(!sale)
return <div>Loading...</div>;


return(
<section>

<div className="d-flex justify-content-between mb-4">

<h1 className="h3">
Invoice Details
</h1>

<button
className="btn btn-secondary"
onClick={()=>navigate("/sales")}
>
Back
</button>

</div>


<div className="card page-card mb-3">
<div className="card-body">

<h5>
Invoice: {sale.invoiceNumber}
</h5>

<p>Customer: {sale.customer?.name}</p>
<p>Status: {sale.status}</p>


{sale.status==="DRAFT"&&
<>
<button
className="btn btn-success me-2"
onClick={()=>action(`/sales/${id}/confirm`,"Confirmed")}
>
Confirm
</button>

<button
className="btn btn-danger"
onClick={()=>action(`/sales/${id}/cancel`,"Cancelled")}
>
Cancel
</button>
</>
}


{(sale.status==="CONFIRMED"||sale.status==="PARTIALLY_PAID")&&
<button
className="btn btn-warning"
onClick={()=>action(`/sales/${id}/payment`,"Payment Updated")}
>
Update Payment
</button>
}


{(sale.status==="CONFIRMED"||sale.status==="FULLY_PAID")&&
<>
<button
className="btn btn-info me-2"
onClick={()=>action(`/sales/${id}/return`,"Returned")}
>
Return
</button>

<button
className="btn btn-secondary"
onClick={()=>action(`/sales/${id}/exchange`,"Exchanged")}
>
Exchange
</button>
</>
}

</div>
</div>


<div className="card page-card">

<div className="card-body">

<h5>Items</h5>

{sale.items.map((item,index)=>(

<div className="border p-2 mb-2" key={index}>

<b>{item.itemName}</b><br/>

Purity: {item.purity}<br/>
Weight: {item.netGoldWeight}g<br/>
Gold Rate: {item.goldRate}<br/>
Gold Value: {item.goldValue}<br/>
Making Charge: {item.makingCharge}<br/>
Stone Cost: {item.stoneCost}<br/>
Subtotal: {item.subtotal}

</div>

))}

<hr/>

<p>Total: {sale.totalAmount}</p>
<p>Paid: {sale.paidAmount}</p>
<p>Due: {sale.dueAmount}</p>

</div>

</div>

</section>
);

}

export default SaleDetailsPage;