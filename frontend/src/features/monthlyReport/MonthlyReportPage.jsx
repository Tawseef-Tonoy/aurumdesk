import {useState} from "react";
import ErrorAlert from "../../components/ErrorAlert";

import {
getMonthlyReport
} from "./monthlyReportService";


function MonthlyOwnerReportPage(){


const today=new Date();


const [year,setYear]=useState(
today.getFullYear()
);

const [month,setMonth]=useState(
today.getMonth()+1
);


const [report,setReport]=useState(null);

const [error,setError]=useState("");

const [loading,setLoading]=useState(false);



async function loadReport(){

try{

setLoading(true);
setError("");


const response=
await getMonthlyReport(
year,
month
);


setReport(
response.data
);


}
catch(err){

setError(
err.message
);

}
finally{

setLoading(false);

}

}




function printReport(){

window.print();

}





return(

<section>


<div className="d-flex justify-content-between align-items-center mb-3">


<h1 className="h3">
Monthly Owner Report
</h1>


<button
className="btn btn-outline-dark no-print"
onClick={printReport}
>
Print Report
</button>


</div>



<ErrorAlert message={error}/>



<div className="card page-card mb-3 no-print">

<div className="card-body">


<div className="row">


<div className="col-md-4">

<label>
Year
</label>


<input
className="form-control"
value={year}
onChange={
e=>setYear(e.target.value)
}
/>


</div>



<div className="col-md-4">

<label>
Month
</label>


<select

className="form-control"

value={month}

onChange={
e=>setMonth(
Number(e.target.value)
)
}

>


{
Array.from(
{
length:12
},
(_,i)=>i+1
)
.map(
m=>(

<option
key={m}
value={m}
>

{m}

</option>

)

)
}


</select>


</div>



<div className="col-md-4 d-flex align-items-end">


<button

className="btn btn-dark"

disabled={loading}

onClick={loadReport}

>

Load Report

</button>


</div>


</div>


</div>

</div>





{
report &&

<div id="print-area">



<div className="row g-3 mb-3">


<div className="col-md-3">

<div className="card page-card">

<div className="card-body">

Sales

<h4>

{report.sales.totalSales}

</h4>

</div>

</div>

</div>



<div className="col-md-3">

<div className="card page-card">

<div className="card-body">

Invoices

<h4>

{report.sales.invoiceCount}

</h4>

</div>

</div>

</div>



<div className="col-md-3">

<div className="card page-card">

<div className="card-body">

Collected

<h4>

{report.sales.collectedAmount}

</h4>

</div>

</div>

</div>



<div className="col-md-3">

<div className="card page-card">

<div className="card-body">

Gross Profit

<h4>

{report.finance.grossProfit}

</h4>


<small>

Margin:
{report.finance.grossMargin}%

</small>


</div>

</div>

</div>



</div>





<div className="card page-card mb-3">

<div className="card-body">


<h5>
Financial Summary
</h5>


<p>
Cash Sales:
{report.sales.cashSales}
</p>


<p>
Credit Sales:
{report.sales.creditSales}
</p>


<p>
Outstanding:
{report.sales.outstandingDues}
</p>


<p>
Expenses:
{report.finance.expenseTotal}
</p>


<p>
Customer Refunds:
{report.finance.refundTotal}
</p>


<p>
Returned Goods Value:
{report.finance.returnedGoodsValue}
</p>


<p>
Purchase Cost of Sold Products:
{report.finance.costOfGoodsSold}
</p>


</div>

</div>





<div className="card page-card mb-3">

<div className="card-body">


<h5>
Purchase Summary
</h5>


<p>
Total Purchases:
{report.purchases.purchaseAmount}
</p>


<p>
Supplier Due:
{report.purchases.supplierDue}
</p>


</div>

</div>





<div className="card page-card mb-3">


<div className="card-body">


<h5>
Category Sales
</h5>


<table className="table">

<thead>

<tr>

<th>
Category
</th>

<th>
Amount
</th>

</tr>

</thead>


<tbody>


{
report.charts.categorySales.map(
(item)=>(

<tr key={item.name}>

<td>
{item.name}
</td>

<td>
{item.value}
</td>

</tr>

)

)

}


</tbody>


</table>


</div>


</div>







<div className="card page-card mb-3">


<div className="card-body">


<h5>
Sold Items
</h5>



<table className="table">

<thead>

<tr>

<th>
Name
</th>

<th>
SKU
</th>

<th>
Category
</th>

<th>
Quantity
</th>

<th>
Revenue
</th>

</tr>

</thead>


<tbody>


{
report.inventory.soldItems.map(
(item)=>(

<tr key={item.name}>

<td>
{item.name}
</td>


<td>
{item.sku}
</td>


<td>
{item.category}
</td>


<td>
{item.quantity}
</td>


<td>
{item.revenue}
</td>


</tr>

)

)

}


</tbody>


</table>


</div>

</div>





<div className="card page-card mb-3">


<div className="card-body">


<h5>
Cash Closing Differences
</h5>



<table className="table">


<thead>

<tr>

<th>
Date
</th>

<th>
Difference
</th>

</tr>

</thead>


<tbody>


{
report.cash.dailyCashDifference.map(
(item,index)=>(

<tr key={index}>

<td>
{
new Date(
item.date
)
.toLocaleDateString()
}
</td>


<td>
{item.difference}
</td>


</tr>

)

)

}


</tbody>


</table>


</div>

</div>







<div className="card page-card mb-3">

<div className="card-body">


<h5>
Custom Orders
</h5>


{

Object.entries(
report.customOrders.customOrderStatus
)
.map(
([key,value])=>(

<p key={key}>

{key}:
{value}

</p>

)

)

}


</div>

</div>





<div className="card page-card mb-3">


<div className="card-body">


<h5>
Worker Assignments
</h5>


<p>

Total Assignments:
{report.workers.totalAssignments}

</p>


</div>


</div>





</div>

}


</section>

);

}


export default MonthlyOwnerReportPage;