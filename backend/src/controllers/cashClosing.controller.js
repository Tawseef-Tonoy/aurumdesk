const CashClosing=require("../models/cashClosing.model");

const{
getDailyCashSummary,
calculateClosing,
refreshDailyCashClosing
}=require("../services/cashClosing.service");



async function createClosing(req,res){

try{

const{
businessDate,
openingCash
}=req.body;


if(!businessDate||openingCash===undefined){

return res.status(400).json({
success:false,
message:"Business date and opening cash are required"
});

}


const start=new Date(businessDate);
start.setHours(0,0,0,0);

const end=new Date(businessDate);
end.setHours(23,59,59,999);


const existing=
await CashClosing.findOne({
businessDate:{
$gte:start,
$lte:end
}
});


if(existing){

return res.status(400).json({
success:false,
message:"Closing already exists for this date"
});

}


const summary=
await getDailyCashSummary(
businessDate
);


const calculation=
calculateClosing({

openingCash:Number(openingCash),

...summary

});


const closing=
await CashClosing.create({

businessDate,

openingCash:Number(openingCash),

...summary,

...calculation

});


return res.status(201).json({

success:true,

message:"Cash closing created successfully",

data:closing

});


}catch(error){

console.error(
"Create cash closing error:",
error
);

return res.status(500).json({

success:false,

message:error.message

});

}

}





async function getAllClosings(req,res){

try{

const closings=
await CashClosing.find()
.sort({
businessDate:-1
});


return res.status(200).json({

success:true,

data:closings

});


}catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}





async function getClosing(req,res){

try{

const start=new Date(req.params.date);
start.setHours(0,0,0,0);

const end=new Date(req.params.date);
end.setHours(23,59,59,999);


const closing=
await CashClosing.findOne({

businessDate:{
$gte:start,
$lte:end
}

});


if(!closing){

return res.status(404).json({

success:false,

message:"Closing record not found"

});

}


return res.status(200).json({

success:true,

data:closing

});


}catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}





async function refreshClosing(req,res){

try{

const closing=
await CashClosing.findById(
req.params.id
);


if(!closing){

return res.status(404).json({

success:false,

message:"Closing not found"

});

}


await refreshDailyCashClosing(
closing
);


await closing.save();


return res.status(200).json({

success:true,

message:"Closing refreshed",

data:closing

});


}catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}





async function updateClosing(req,res){

try{

const closing=
await CashClosing.findById(
req.params.id
);


if(!closing){

return res.status(404).json({

success:false,

message:"Closing record not found"

});

}



await refreshDailyCashClosing(
closing
);



const{
actualClosingCash,
differenceExplanation,
status,
user
}=req.body;



if(actualClosingCash!==undefined){

closing.actualClosingCash=
Number(actualClosingCash);

}



if(differenceExplanation!==undefined){

closing.differenceExplanation=
differenceExplanation;

}



const calculation=
calculateClosing({

openingCash:
closing.openingCash,

cashSales:
closing.cashSales,

dueCollections:
closing.dueCollections,

emiCollections:
closing.emiCollections,

customOrderAdvances:
closing.customOrderAdvances,

supplierPayments:
closing.supplierPayments,

businessExpenses:
closing.businessExpenses,

refunds:
closing.refunds,

actualClosingCash:
closing.actualClosingCash

});



closing.totalCashInflow=
calculation.totalCashInflow;


closing.totalCashOutflow=
calculation.totalCashOutflow;


closing.expectedClosingCash=
calculation.expectedClosingCash;


closing.cashDifference=
calculation.cashDifference;



if(
closing.cashDifference!==0 &&
!closing.differenceExplanation
){

return res.status(400).json({

success:false,

message:"Difference explanation is required"

});

}



if(status==="PREPARED"){

closing.preparedBy=
user||"Admin";

closing.preparedAt=
new Date();

}



if(status==="SUBMITTED"){

closing.submittedBy=
user||"Admin";

closing.submittedAt=
new Date();

}



if(status==="APPROVED"){

closing.approvedBy=
user||"Admin";

closing.approvedAt=
new Date();

}



if(status){

closing.status=status;

}



await closing.save();



return res.status(200).json({

success:true,

message:"Cash closing updated successfully",

data:closing

});


}catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}



async function reopenClosing(req,res){

try{

const closing=
await CashClosing.findById(
req.params.id
);


if(!closing){

return res.status(404).json({

success:false,

message:"Closing record not found"

});

}



const{
reason,
user
}=req.body;



if(!reason){

return res.status(400).json({

success:false,

message:"Reopen reason is required"

});

}



closing.reopenHistory.push({

reopenedBy:user||"Unknown",

reason,

previousStatus:
closing.status

});


closing.status="REOPENED";


await closing.save();



return res.status(200).json({

success:true,

message:"Closing reopened successfully",

data:closing

});


}catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}





module.exports={

createClosing,

getClosing,

getAllClosings,

updateClosing,

refreshClosing,

reopenClosing

};