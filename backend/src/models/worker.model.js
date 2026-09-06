const mongoose=require("mongoose");


const workerSchema=new mongoose.Schema({

workerId:{
type:String,
required:true,
unique:true,
trim:true,
uppercase:true
},

name:{
type:String,
required:true,
trim:true
},

phone:{
type:String,
required:true,
trim:true
},

specialization:{
type:String,
required:true,
trim:true
},

availability:{
type:String,
enum:[
"AVAILABLE",
"BUSY",
"UNAVAILABLE"
],
default:"AVAILABLE"
},

activeWorkload:{
type:Number,
default:0,
min:0
},

status:{
type:String,
enum:[
"ACTIVE",
"INACTIVE"
],
default:"ACTIVE"
},

notes:{
type:String,
default:"",
trim:true
}

},{
timestamps:true
});


workerSchema.index({
name:1
});


workerSchema.index({
phone:1
});


module.exports=
mongoose.model(
"Worker",
workerSchema
);