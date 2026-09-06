const Sale=require("../models/sale.model");
const Payment=require("../models/payment.model");
const EMIPlan=require("../models/emiPlan.model");
const EMIInstallment=require("../models/emiInstallment.model");
const EMIInstallmentPayment=require("../models/emiInstallmentPayment.model");
const Purchase=require("../models/purchase.model");
const Expense=require("../models/expense.model");
const ReturnExchange=require("../models/returnExchange.model");
const CustomOrder=require("../models/customOrder.model");
const WorkerAssignment=require("../models/workerAssignment.model");
const CashClosing=require("../models/cashClosing.model");
const JewelryItem=require("../models/jewelryItem.model");



function getMonthRange(year,month){

const start=new Date(
year,
month-1,
1
);

const end=new Date(
year,
month,
0,
23,
59,
59,
999
);

return {
start,
end
};

}





async function getMonthlyReport(year,month){


const {
start,
end
}=getMonthRange(year,month);




const sales=
await Sale.find({

createdAt:{
$gte:start,
$lte:end
},

status:{
$nin:[
"DRAFT",
"CANCELLED"
]
}

}).lean();



const payments=
await Payment.find({

paymentDate:{
$gte:start,
$lte:end
},

status:"COMPLETED"

}).lean();



const emiPlans=
await EMIPlan.find({

createdAt:{
$gte:start,
$lte:end
}

}).lean();



const emiPayments=
await EMIInstallmentPayment.find({

paymentDate:{
$gte:start,
$lte:end
}

}).lean();



const installments=
await EMIInstallment.find({

dueDate:{
$gte:start,
$lte:end
}

}).lean();



const purchases=
await Purchase.find({

purchaseDate:{
$gte:start,
$lte:end
}

}).lean();



const expenses=
await Expense.find({

expenseDate:{
$gte:start,
$lte:end
}

}).lean();



const returns=
await ReturnExchange.find({

completedAt:{
$gte:start,
$lte:end
}

}).lean();



const customOrders=
await CustomOrder.find({

bookingDate:{
$gte:start,
$lte:end
}

}).lean();



const assignments=
await WorkerAssignment.find({

createdAt:{
$gte:start,
$lte:end
}

}).lean();



const cashClosings=
await CashClosing.find({

businessDate:{
$gte:start,
$lte:end
}

}).lean();





const totalSales=
sales.reduce(
(sum,item)=>
sum+Number(item.totalAmount||0),
0
);



const invoiceCount=sales.length;



const cashSales=
sales
.filter(
item=>item.paymentMethod==="CASH"
)
.reduce(
(sum,item)=>
sum+Number(item.totalAmount||0),
0
);



const creditSales=
sales
.filter(
item=>item.paymentMethod!=="CASH"
)
.reduce(
(sum,item)=>
sum+Number(item.dueAmount||0),
0
);



const collectedAmount=
payments.reduce(
(sum,item)=>
sum+Number(item.amount||0),
0
);



const outstandingDues=
sales.reduce(
(sum,item)=>
sum+Number(item.dueAmount||0),
0
);




const emiSales=
emiPlans.reduce(
(sum,item)=>
sum+Number(item.emiPayable||0),
0
);



const emiCollections=
emiPayments.reduce(
(sum,item)=>
sum+Number(item.amount||0),
0
);



const emiOverdue=
installments
.filter(
item=>item.status==="OVERDUE"
)
.reduce(
(sum,item)=>
sum+Number(item.remainingAmount||0),
0
);




const purchaseAmount=
purchases.reduce(
(sum,item)=>
sum+Number(item.totalAmount||0),
0
);



const supplierDue=
purchases.reduce(
(sum,item)=>
sum+Number(item.dueAmount||0),
0
);



const expenseTotal=
expenses.reduce(
(sum,item)=>
sum+Number(item.amount||0),
0
);



const refundTotal=
returns.reduce(
(sum,item)=>
sum+Number(item.refundAmount||0),
0
);



const returnedGoodsValue=
returns.reduce(
(sum,item)=>
sum+Number(item.returnValue||0),
0
);






let costOfGoodsSold=0;


const soldItems={};

const categorySalesMap={};



for(const sale of sales){


for(const item of (sale.items||[])){


const inventoryItem=
await JewelryItem.findOne({

$or:[

{
sku:item.sku
},

{
name:item.itemName
}

]

}).lean();




const quantity=
Number(item.quantity||0);



const revenue=
Number(
item.subtotal ||
0
);



if(inventoryItem){


costOfGoodsSold +=
Number(
inventoryItem.purchaseCost||0
)
*
quantity;


}



const key=
item.itemName||"Unknown";



if(!soldItems[key]){

soldItems[key]={

name:key,

sku:
inventoryItem?.sku ||
item.sku ||
"-",

category:
inventoryItem?.category ||
item.category ||
"UNKNOWN",

quantity:0,

revenue:0

};

}



soldItems[key].quantity+=quantity;

soldItems[key].revenue+=revenue;



const category=
inventoryItem?.category ||
item.category ||
"UNKNOWN";



if(!categorySalesMap[category]){

categorySalesMap[category]=0;

}


categorySalesMap[category]+=
Number(revenue);



}

}




const soldItemsSummary=
Object.values(soldItems)
.sort(
(a,b)=>
b.quantity-a.quantity
);



const categorySales=
Object.entries(categorySalesMap)
.map(
([name,value])=>({

name,

value

})
)
.sort(
(a,b)=>
b.value-a.value
);





const grossProfit=
totalSales-
costOfGoodsSold;



const grossMargin=
totalSales>0
?
((grossProfit/totalSales)*100).toFixed(2)
:
0;




const customOrderStatus={};



customOrders.forEach(
item=>{

const status=
item.status||"UNKNOWN";


if(!customOrderStatus[status]){

customOrderStatus[status]=0;

}


customOrderStatus[status]++;

}

);





return{


period:{
year,
month,
start,
end
},



sales:{

totalSales,

invoiceCount,

cashSales,

creditSales,

collectedAmount,

outstandingDues

},



emi:{

emiSales,

emiCollections,

emiOverdue

},



purchases:{

purchaseAmount,

supplierDue

},



finance:{

expenseTotal,

refundTotal,

returnedGoodsValue,

costOfGoodsSold,

grossProfit,

grossMargin

},



inventory:{

soldItems:soldItemsSummary

},



customOrders:{

customOrderStatus,

total:customOrders.length

},



workers:{

totalAssignments:assignments.length

},



cash:{

dailyCashDifference:
cashClosings.map(
item=>({

date:item.businessDate,

difference:item.cashDifference||0

})
)

},



charts:{


salesTrend:[

{
label:"Sales",
value:totalSales
},

{
label:"Collected",
value:collectedAmount
},

{
label:"Outstanding",
value:outstandingDues
}

],



paymentBreakdown:[

{
name:"Cash",
value:cashSales
},

{
name:"Credit",
value:creditSales
},

{
name:"Collected",
value:collectedAmount
}

],



expenseBreakdown:
expenses.reduce(
(acc,item)=>{

const name=item.category||"UNKNOWN";


const found=
acc.find(
x=>x.name===name
);


if(found){

found.value+=Number(item.amount||0);

}
else{

acc.push({

name,

value:Number(item.amount||0)

});

}


return acc;

},
[]
),



categorySales

}


};

}





module.exports={
getMonthlyReport
};