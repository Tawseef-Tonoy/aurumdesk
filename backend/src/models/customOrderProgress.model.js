const mongoose=require("mongoose");


const customOrderProgressSchema=new mongoose.Schema({

customOrder:{
type:mongoose.Schema.Types.ObjectId,
ref:"CustomOrder",
required:true,
index:true
},

status:{
type:String,
enum:[
"BOOKED",
"DESIGN_APPROVED",
"IN_PRODUCTION",
"QUALITY_CHECK",
"READY",
"DELIVERED",
"CANCELLED"
],
required:true
},

note:{
type:String,
default:"",
trim:true
},

changedBy:{
type:String,
required:true,
trim:true
},

changedAt:{
type:Date,
default:Date.now
}

},{
timestamps:true
});


customOrderProgressSchema.index({
customOrder:1,
createdAt:-1
});


module.exports=
mongoose.model(
"CustomOrderProgress",
customOrderProgressSchema
);