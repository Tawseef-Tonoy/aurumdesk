const WorkerAssignment=require("../models/workerAssignment.model");
const Worker=require("../models/worker.model");
const CustomOrder=require("../models/customOrder.model");


async function createAssignment(req,res){

try{

const{
customOrder,
worker,
deadline,
instructions,
workerCharge,
notes
}=req.body;


if(!customOrder||!worker||!deadline){

return res.status(400).json({
success:false,
message:"Custom order, worker and deadline are required"
});

}


const order=await CustomOrder.findById(customOrder);

if(!order){

return res.status(404).json({
success:false,
message:"Custom order not found"
});

}


const existingWorker=await Worker.findById(worker);

if(!existingWorker){

return res.status(404).json({
success:false,
message:"Worker not found"
});

}


const assignment=await WorkerAssignment.create({
customOrder,
worker,
deadline,
instructions,
workerCharge,
notes
});


existingWorker.activeWorkload+=1;

existingWorker.availability="BUSY";

await existingWorker.save();


return res.status(201).json({
success:true,
message:"Worker assigned successfully",
data:assignment
});


}catch(error){

console.error("Create assignment error:",error);

return res.status(500).json({
success:false,
message:"Failed to create worker assignment",
error:error.message
});

}

}



async function getAssignments(req,res){

try{

const assignments=await WorkerAssignment.find()
.populate("worker","workerId name phone specialization")
.populate("customOrder","orderNo jewelryType status")
.sort({
createdAt:-1
});


return res.status(200).json({
success:true,
data:assignments
});


}catch(error){

console.error("Get assignments error:",error);

return res.status(500).json({
success:false,
message:"Failed to retrieve assignments",
error:error.message
});

}

}



async function getAssignmentByOrder(req,res){

try{

const assignments=await WorkerAssignment.find({
customOrder:req.params.id
})
.populate("worker","workerId name phone specialization")
.sort({
createdAt:-1
});


return res.status(200).json({
success:true,
data:assignments
});


}catch(error){

console.error("Get order assignment error:",error);

return res.status(500).json({
success:false,
message:"Failed to retrieve assignment",
error:error.message
});

}

}



async function updateAssignment(req,res){

try{

const assignment=await WorkerAssignment.findById(
req.params.id
);

if(!assignment){

return res.status(404).json({
success:false,
message:"Assignment not found"
});

}

const oldStatus=assignment.status;

const{
status,
notes,
completedDate
}=req.body;


if(status!==undefined){

assignment.status=status;

}


if(notes!==undefined){

assignment.notes=notes;

}


if(completedDate!==undefined){

assignment.completedDate=completedDate;

}


await assignment.save();


if(
status&&
status!==oldStatus&&
(
status==="COMPLETED"||
status==="CANCELLED"
)
){

const worker=
await Worker.findById(
assignment.worker
);


if(worker&&worker.activeWorkload>0){

worker.activeWorkload-=1;

if(worker.activeWorkload===0){

worker.availability="AVAILABLE";

}

await worker.save();

}

}

const updatedAssignment=
await WorkerAssignment.findById(
assignment._id
)
.populate(
"worker",
"workerId name phone specialization"
)
.populate(
"customOrder",
"orderNo jewelryType status"
);


return res.status(200).json({
success:true,
message:"Assignment updated successfully",
data:updatedAssignment
});


}catch(error){

console.error("Update assignment error:",error);

return res.status(500).json({
success:false,
message:"Failed to update assignment",
error:error.message
});

}

}



module.exports={
createAssignment,
getAssignments,
getAssignmentByOrder,
updateAssignment
};