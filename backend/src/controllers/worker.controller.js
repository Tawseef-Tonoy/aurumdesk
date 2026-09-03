const Worker=require("../models/worker.model");


async function generateWorkerId(){

let workerId;
let exists=true;


while(exists){

const suffix=
Math.random()
.toString(36)
.slice(2,7)
.toUpperCase();


workerId=
`WRK-${suffix}`;


exists=
await Worker.exists({
workerId
});

}


return workerId;

}



async function createWorker(req,res){

try{


const{
name,
phone,
specialization,
availability,
notes
}=req.body;



if(
!name||
!phone||
!specialization
){

return res.status(400).json({

success:false,

message:
"Name, phone and specialization are required"

});

}



const worker=
await Worker.create({

workerId:
await generateWorkerId(),

name,

phone,

specialization,

availability,

notes

});



return res.status(201).json({

success:true,

message:
"Worker created successfully",

data:worker

});



}catch(error){

console.error(
"Create worker error:",
error
);


return res.status(500).json({

success:false,

message:
"Failed to create worker",

error:error.message

});

}

}



async function getWorkers(req,res){

try{


const workers=
await Worker.find()
.sort({
createdAt:-1
});



return res.status(200).json({

success:true,

count:
workers.length,

data:workers

});


}catch(error){

console.error(
"Get workers error:",
error
);


return res.status(500).json({

success:false,

message:
"Failed to retrieve workers",

error:error.message

});

}

}



async function getWorkerById(req,res){

try{


const worker=
await Worker.findById(
req.params.id
);



if(!worker){

return res.status(404).json({

success:false,

message:
"Worker not found"

});

}



return res.status(200).json({

success:true,

data:worker

});


}catch(error){

console.error(
"Get worker error:",
error
);


return res.status(500).json({

success:false,

message:
"Failed to retrieve worker",

error:error.message

});

}

}



async function updateWorker(req,res){

try{


const worker=
await Worker.findById(
req.params.id
);



if(!worker){

return res.status(404).json({

success:false,

message:
"Worker not found"

});

}



const allowedFields=[

"name",
"phone",
"specialization",
"availability",
"status",
"notes"

];



allowedFields.forEach(field=>{

if(req.body[field]!==undefined){

worker[field]=req.body[field];

}

});



await worker.save();



return res.status(200).json({

success:true,

message:
"Worker updated successfully",

data:worker

});


}catch(error){

console.error(
"Update worker error:",
error
);


return res.status(500).json({

success:false,

message:
"Failed to update worker",

error:error.message

});

}

}



module.exports={
createWorker,
getWorkers,
getWorkerById,
updateWorker
};