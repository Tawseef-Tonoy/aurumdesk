const mongoose=require("mongoose");


const workerAssignmentSchema=new mongoose.Schema({

customOrder:{
type:mongoose.Schema.Types.ObjectId,
ref:"CustomOrder",
required:true,
index:true
},

worker:{
type:mongoose.Schema.Types.ObjectId,
ref:"Worker",
required:true,
index:true
},

assignedDate:{
type:Date,
default:Date.now
},

deadline:{
type:Date,
required:true
},

instructions:{
type:String,
default:"",
trim:true
},

workerCharge:{
type:Number,
default:0,
min:0
},

status:{
type:String,
enum:[
"ASSIGNED",
"IN_PROGRESS",
"COMPLETED",
"CANCELLED"
],
default:"ASSIGNED"
},

completedDate:{
type:Date,
default:null
},

notes:{
type:String,
default:"",
trim:true
}

},{
timestamps:true
});


workerAssignmentSchema.index({
customOrder:1,
createdAt:-1
});


workerAssignmentSchema.index({
worker:1,
status:1
});


module.exports=
mongoose.model(
"WorkerAssignment",
workerAssignmentSchema
);