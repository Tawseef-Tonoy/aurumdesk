const CustomOrder=require("../models/customOrder.model");
const CustomOrderProgress=require("../models/customOrderProgress.model");


const allowedStatuses=[
"BOOKED",
"DESIGN_APPROVED",
"IN_PRODUCTION",
"QUALITY_CHECK",
"READY",
"DELIVERED",
"CANCELLED"
];


const statusFlow={
BOOKED:[
"DESIGN_APPROVED",
"CANCELLED"
],

DESIGN_APPROVED:[
"IN_PRODUCTION",
"CANCELLED"
],

IN_PRODUCTION:[
"QUALITY_CHECK",
"CANCELLED"
],

QUALITY_CHECK:[
"READY",
"CANCELLED"
],

READY:[
"DELIVERED"
],

DELIVERED:[],

CANCELLED:[]
};



async function updateStatus(
orderId,
status,
changedBy,
note=""
){


if(
!allowedStatuses.includes(status)
){

throw new Error(
"Invalid custom order status"
);

}


const order=
await CustomOrder.findById(
orderId
);


if(!order){

throw new Error(
"Custom order not found"
);

}



if(
order.status!==status
&&
!statusFlow[order.status].includes(status)
){

throw new Error(
`Cannot change status from ${order.status} to ${status}`
);

}



order.status=status;


await order.save();



const progress=
await CustomOrderProgress.create({

customOrder:
order._id,

status,

note,

changedBy

});


return progress;

}




async function getProgress(
orderId
){


const order=
await CustomOrder.findById(
orderId
);


if(!order){

throw new Error(
"Custom order not found"
);

}


return CustomOrderProgress.find({

customOrder:
orderId

})
.sort({
createdAt:1
});


}



module.exports={
updateStatus,
getProgress
};