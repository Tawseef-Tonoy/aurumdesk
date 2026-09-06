const CustomOrder=require("../models/customOrder.model");
const Customer=require("../models/customer.model");
const {updateStatus,getProgress}=require("../services/customOrderProgress.service");
const CustomOrderProgress=require("../models/customOrderProgress.model");

async function generateOrderNo(){
let orderNo;
let exists=true;
while(exists){
const now=new Date();
const date=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
const suffix=Math.random().toString(36).slice(2,8).toUpperCase();
orderNo=`CO-${date}-${suffix}`;
exists=await CustomOrder.exists({orderNo});
}
return orderNo;
}

function buildReceipt(order){
return{
orderNo:order.orderNo,
customer:{
_id:order.customer?._id||order.customer,
customerId:order.customer?.customerId,
name:order.customer?.name,
phone:order.customer?.phone
},
bookingDate:order.bookingDate,
designSpecification:{
jewelryType:order.jewelryType,
designDescription:order.designDescription,
purity:order.purity,
expectedWeight:order.expectedWeight,
size:order.size,
stoneRequirements:order.stoneRequirements,
engravingInstructions:order.engravingInstructions,
specialInstructions:order.specialInstructions
},
estimatedPrice:order.estimatedPrice,
advancePayment:{
amount:order.advancePaid,
method:order.advancePaymentMethod,
referenceNumber:order.advanceReferenceNumber,
paymentDate:order.advancePaymentDate
},
remainingAmount:order.remainingAmount,
expectedDeliveryDate:order.expectedDeliveryDate,
notes:order.notes,
bookedBy:order.bookedBy,
status:order.status
};
}

async function createCustomOrder(req,res){
try{
const{
customer,
bookingDate,
jewelryType,
designDescription,
purity,
expectedWeight,
size,
stoneRequirements,
engravingInstructions,
specialInstructions,
estimatedPrice,
advancePaid,
advancePaymentMethod,
advanceReferenceNumber,
advancePaymentDate,
expectedDeliveryDate,
notes,
bookedBy
}=req.body;

if(!customer||!jewelryType||!designDescription||!purity||expectedWeight===undefined||estimatedPrice===undefined||!expectedDeliveryDate||!bookedBy){
return res.status(400).json({
success:false,
message:"Customer, jewelry type, design description, purity, expected weight, estimated price, expected delivery date, and booked by are required"
});
}

const existingCustomer=await Customer.findById(customer);

if(!existingCustomer){
return res.status(404).json({
success:false,
message:"Customer not found"
});
}

const actualBookingDate=bookingDate?new Date(bookingDate):new Date();
const deliveryDate=new Date(expectedDeliveryDate);

if(Number.isNaN(actualBookingDate.getTime())||Number.isNaN(deliveryDate.getTime())){
return res.status(400).json({
success:false,
message:"Invalid booking or delivery date"
});
}

if(deliveryDate<actualBookingDate){
return res.status(400).json({
success:false,
message:"Expected delivery date cannot be earlier than booking date"
});
}

if(Number(advancePaid||0)>Number(estimatedPrice)){
return res.status(400).json({
success:false,
message:"Advance cannot exceed estimated price"
});
}

const orderNo=await generateOrderNo();

const customOrder=await CustomOrder.create({
orderNo,
customer,
bookingDate:actualBookingDate,
jewelryType,
designDescription,
purity,
expectedWeight,
size,
stoneRequirements,
engravingInstructions,
specialInstructions,
estimatedPrice,
advancePaid,
advancePaymentMethod,
advanceReferenceNumber,
advancePaymentDate,
expectedDeliveryDate:deliveryDate,
notes,
bookedBy,
status:"BOOKED"
});

await CustomOrderProgress.create({

customOrder:
customOrder._id,

status:
"BOOKED",

note:
"Custom order booked",

changedBy:
bookedBy

});

await customOrder.populate("customer","customerId name phone status");

return res.status(201).json({
success:true,
message:"Custom order booked successfully",
data:customOrder,
receipt:buildReceipt(customOrder)
});

}catch(error){
console.error("Create custom order error:",error);

if(error.name==="CastError"){
return res.status(400).json({
success:false,
message:"Invalid customer ID"
});
}

if(error.name==="ValidationError"){
return res.status(400).json({
success:false,
message:error.message
});
}

return res.status(500).json({
success:false,
message:"Failed to create custom order",
error:error.message
});
}
}

async function getCustomOrders(req,res){
try{
const{search,customer}=req.query;
const filter={};

if(search){
filter.$or=[
{orderNo:{$regex:search,$options:"i"}},
{jewelryType:{$regex:search,$options:"i"}},
{designDescription:{$regex:search,$options:"i"}}
];
}

if(customer){
filter.customer=customer;
}

const customOrders=await CustomOrder.find(filter)
.populate("customer","customerId name phone status")
.sort({createdAt:-1});

return res.status(200).json({
success:true,
count:customOrders.length,
data:customOrders
});

}catch(error){
console.error("Get custom orders error:",error);

if(error.name==="CastError"){
return res.status(400).json({
success:false,
message:"Invalid customer ID"
});
}

return res.status(500).json({
success:false,
message:"Failed to retrieve custom orders",
error:error.message
});
}
}

async function getCustomOrderById(req,res){
try{
const customOrder=await CustomOrder.findById(req.params.id)
.populate("customer","customerId name phone email address status");

if(!customOrder){
return res.status(404).json({
success:false,
message:"Custom order not found"
});
}

return res.status(200).json({
success:true,
data:customOrder
});

}catch(error){
console.error("Get custom order error:",error);

if(error.name==="CastError"){
return res.status(400).json({
success:false,
message:"Invalid custom order ID"
});
}

return res.status(500).json({
success:false,
message:"Failed to retrieve custom order",
error:error.message
});
}
}

async function updateCustomOrder(req,res){
try{
const customOrder=await CustomOrder.findById(req.params.id);

if(!customOrder){
return res.status(404).json({
success:false,
message:"Custom order not found"
});
}

const{changedBy,revisionReason}=req.body;

if(!changedBy){
return res.status(400).json({
success:false,
message:"Changed by is required for revision history"
});
}

const allowedFields=[
"jewelryType",
"designDescription",
"purity",
"expectedWeight",
"size",
"stoneRequirements",
"engravingInstructions",
"specialInstructions",
"estimatedPrice",
"advancePaid",
"advancePaymentMethod",
"advanceReferenceNumber",
"advancePaymentDate",
"expectedDeliveryDate",
"notes"
];

const changes=[];

for(const field of allowedFields){
if(req.body[field]!==undefined){
const oldValue=customOrder[field];
const newValue=req.body[field];

const oldComparable=oldValue instanceof Date?oldValue.toISOString():String(oldValue??"");
const newComparable=field.includes("Date")?new Date(newValue).toISOString():String(newValue??"");

if(oldComparable!==newComparable){
changes.push({
field,
oldValue,
newValue
});
customOrder[field]=newValue;
}
}
}

if(changes.length===0){
return res.status(400).json({
success:false,
message:"No changes were provided"
});
}

customOrder.revisionHistory.push({
changedBy,
reason:revisionReason||"Customer-requested change",
changes,
changedAt:new Date()
});

await customOrder.save();
await customOrder.populate("customer","customerId name phone status");

return res.status(200).json({
success:true,
message:"Custom order updated and revision recorded successfully",
data:customOrder
});

}catch(error){
console.error("Update custom order error:",error);

if(error.name==="CastError"){
return res.status(400).json({
success:false,
message:"Invalid custom order ID or data"
});
}

if(error.name==="ValidationError"){
return res.status(400).json({
success:false,
message:error.message
});
}

return res.status(500).json({
success:false,
message:"Failed to update custom order",
error:error.message
});
}
}

async function getCustomOrderReceipt(req,res){
try{
const customOrder=await CustomOrder.findById(req.params.id)
.populate("customer","customerId name phone");

if(!customOrder){
return res.status(404).json({
success:false,
message:"Custom order not found"
});
}

return res.status(200).json({
success:true,
data:buildReceipt(customOrder)
});

}catch(error){
console.error("Get custom order receipt error:",error);

if(error.name==="CastError"){
return res.status(400).json({
success:false,
message:"Invalid custom order ID"
});
}

return res.status(500).json({
success:false,
message:"Failed to generate custom order receipt",
error:error.message
});
}
}

async function updateCustomOrderStatus(req,res){

try{

const{
status,
changedBy,
note
}=req.body;


if(!status||!changedBy){

return res.status(400).json({

success:false,

message:"Status and changed by are required"

});

}


const progress=
await updateStatus(
req.params.id,
status,
changedBy,
note
);


return res.status(200).json({

success:true,

message:"Custom order status updated successfully",

data:progress

});


}catch(error){

console.error(
"Update custom order status error:",
error
);


return res.status(400).json({

success:false,

message:error.message

});

}

}



async function getCustomOrderProgress(req,res){

try{


const progress=
await getProgress(
req.params.id
);


return res.status(200).json({

success:true,

data:progress

});


}catch(error){

console.error(
"Get custom order progress error:",
error
);


return res.status(400).json({

success:false,

message:error.message

});

}

}

module.exports={
createCustomOrder,
getCustomOrders,
getCustomOrderById,
updateCustomOrder,
getCustomOrderReceipt,
updateCustomOrderStatus,
getCustomOrderProgress
};