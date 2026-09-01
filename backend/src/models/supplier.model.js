const mongoose=require("mongoose");

const supplierSchema=new mongoose.Schema({

supplierCode:{
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

email:{
type:String,
trim:true,
lowercase:true,
default:""
},

address:{
type:String,
trim:true,
default:""
},

supplierType:{
type:String,
enum:[
"WORKSHOP",
"SUPPLIER",
"OTHER"
],
default:"SUPPLIER"
},

status:{
type:String,
enum:[
"ACTIVE",
"INACTIVE"
],
default:"ACTIVE"
},

createdBy:{
type:String,
trim:true,
default:"SYSTEM"
}

},{
timestamps:true
});


module.exports=mongoose.model(
"Supplier",
supplierSchema
);