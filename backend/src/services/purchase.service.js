const mongoose=require("mongoose");

const Purchase=require("../models/purchase.model");
const Supplier=require("../models/supplier.model");
const JewelryItem=require("../models/jewelryItem.model");
const StockAdjustment=require("../models/stockAdjustment.model");

const {
syncLowStockAlertForItem
}=require("./lowStockAlert.service");


function serviceError(
message,
statusCode=400
){
const error=new Error(message);
error.statusCode=statusCode;
return error;
}


function text(
value,
fallback=""
){
return String(value??fallback).trim();
}


function roundMoney(value){
return Math.round(
(Number(value)+Number.EPSILON)*100
)/100;
}


function withSession(
query,
session
){
return session
?query.session(session)
:query;
}


function generatePurchaseNo(){

const date=new Date()
.toISOString()
.slice(0,10)
.replaceAll("-","");

const suffix=new mongoose.Types.ObjectId()
.toString()
.slice(-6)
.toUpperCase();

return `PUR-${date}-${suffix}`;

}


function generateAdjustmentId(){

return `ADJ-${Date.now()}-${
Math.floor(
1000+
Math.random()*9000
)
}`;

}


async function requireSupplier(
supplierId,
session=null
){

if(
!mongoose.Types.ObjectId.isValid(
supplierId
)
){
throw serviceError(
"Invalid supplier ID"
);
}


const supplier=
await withSession(
Supplier.findById(supplierId),
session
);


if(!supplier){
throw serviceError(
"Supplier not found",
404
);
}


if(
supplier.status!=="ACTIVE"
){
throw serviceError(
"Inactive supplier cannot be used"
);
}


return supplier;

}



async function requireJewelryItem(
itemId,
session=null
){

if(
!mongoose.Types.ObjectId.isValid(
itemId
)
){
throw serviceError(
"Invalid jewelry item ID"
);
}


const item=
await withSession(
JewelryItem.findById(itemId),
session
);


if(!item){
throw serviceError(
"Jewelry item not found",
404
);
}


return item;

}



function validateItems(items){

if(
!Array.isArray(items)||
items.length===0
){
throw serviceError(
"At least one purchase item is required"
);
}


for(const item of items){

const quantity=
Number(item.quantity);


const price=
Number(item.purchasePrice);


if(
!Number.isInteger(quantity)||
quantity<=0
){
throw serviceError(
"Purchase quantity must be a positive whole number"
);
}


if(
!Number.isFinite(price)||
price<0
){
throw serviceError(
"Purchase price must be valid"
);
}

}

}



async function buildPurchaseItems(
items,
session=null
){

validateItems(items);


const result=[];


for(const line of items){

const jewelryItem=
await requireJewelryItem(
line.jewelryItem,
session
);


const quantity=
Number(line.quantity);


const purchasePrice=
roundMoney(
line.purchasePrice
);


result.push({

jewelryItem:
jewelryItem._id,

itemName:
jewelryItem.name,

sku:
jewelryItem.sku,

quantity,

purchasePrice,

subtotal:
roundMoney(
quantity*
purchasePrice
)

});

}


return result;

}



async function createPurchase(
input
){

const supplier=
await requireSupplier(
input.supplier
);


const items=
await buildPurchaseItems(
input.items
);


const subtotal=
roundMoney(
items.reduce(
(sum,item)=>
sum+
item.subtotal,
0
)
);


const discount=
roundMoney(
input.discount||0
);


const totalAmount=
roundMoney(
subtotal-discount
);


return Purchase.create({

purchaseNo:
generatePurchaseNo(),

supplier:
supplier._id,

purchaseDate:
input.purchaseDate||
new Date(),

items,

subtotal,

discount,

totalAmount,

paidAmount:
roundMoney(
input.paidAmount||0
),

dueAmount:
roundMoney(
totalAmount-
(input.paidAmount||0)
),

paymentMethod:
input.paymentMethod||
"CASH",

createdBy:
text(
input.createdBy,
"SYSTEM"
)

});

}



async function updatePurchase(
id,
input
){

const purchase=
await Purchase.findById(id);


if(!purchase){
throw serviceError(
"Purchase not found",
404
);
}


if(
purchase.status!=="DRAFT"
){
throw serviceError(
"Only draft purchases can be edited"
);
}


if(input.items){

purchase.items=
await buildPurchaseItems(
input.items
);

}


if(input.supplier){

await requireSupplier(
input.supplier
);

purchase.supplier=
input.supplier;

}


if(input.discount!==undefined){
purchase.discount=
roundMoney(
input.discount
);
}


purchase.subtotal=
roundMoney(
purchase.items.reduce(
(sum,item)=>
sum+
item.subtotal,
0
)
);


purchase.totalAmount=
roundMoney(
purchase.subtotal-
purchase.discount
);


purchase.dueAmount=
roundMoney(
purchase.totalAmount-
purchase.paidAmount
);


await purchase.save();


return purchase;

}



async function createStockAudit({
item,
amount,
previousQuantity,
newQuantity,
adjustedBy,
session
}){


const records=
await StockAdjustment.create(
[{

adjustmentId:
generateAdjustmentId(),

jewelryItem:
item._id,

direction:
"INCREASE",

adjustmentAmount:
amount,

previousQuantity,

newQuantity,

reason:
"SUPPLIER_CORRECTION",

notes:
"Stock increased through purchase entry",

adjustedBy:
adjustedBy||"SYSTEM"

}],
{
session
}
);


return records[0];

}



async function confirmPurchase(
id,
confirmedBy="SYSTEM"
){

const session=
await mongoose.startSession();


try{


let result;


await session.withTransaction(
async()=>{


const purchase=
await Purchase.findById(id)
.session(session);


if(!purchase){

throw serviceError(
"Purchase not found",
404
);

}


if(
purchase.status!=="DRAFT"
){

throw serviceError(
"Only draft purchases can be confirmed"
);

}



for(const line of purchase.items){


const item=
await JewelryItem.findById(
line.jewelryItem
)
.session(session);


if(!item){

throw serviceError(
"Inventory item not found",
404
);

}



const previousQuantity=
Number(
item.quantity
);


const newQuantity=
previousQuantity+
Number(
line.quantity
);



item.quantity=
newQuantity;


item.purchaseCost=
Number(
line.purchasePrice
);


await item.save({
session,
validateBeforeSave:true
});


await createStockAudit({

item,

amount:
line.quantity,

previousQuantity,

newQuantity,

adjustedBy:
confirmedBy,

session

});


}



purchase.status=
"CONFIRMED";


purchase.confirmedBy=
confirmedBy;


purchase.confirmedAt=
new Date();


await purchase.save({
session
});


result=purchase;


});


for(const item of result.items){

await syncLowStockAlertForItem(
item.jewelryItem
);

}


return result;


}
finally{

await session.endSession();

}

}



async function cancelPurchase(
id
){

const purchase=
await Purchase.findById(id);


if(!purchase){

throw serviceError(
"Purchase not found",
404
);

}


if(
purchase.status!=="DRAFT"
){

throw serviceError(
"Only draft purchases can be cancelled"
);

}


purchase.status=
"CANCELLED";


await purchase.save();


return purchase;

}



module.exports={

createPurchase,

updatePurchase,

confirmPurchase,

cancelPurchase

};