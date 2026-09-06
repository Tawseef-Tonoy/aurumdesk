const mongoose=require("mongoose");

const purchaseItemSchema=require(
"./purchaseItem.model"
);


const purchaseSchema=new mongoose.Schema({

purchaseNo:{
type:String,
required:true,
unique:true,
trim:true,
uppercase:true
},

supplier:{
type:mongoose.Schema.Types.ObjectId,
ref:"Supplier",
required:true
},

purchaseDate:{
type:Date,
default:Date.now,
required:true
},

items:{
type:[purchaseItemSchema],
validate:{
validator:function(value){
return Array.isArray(value)&&value.length>0;
},
message:"Purchase requires at least one item"
}
},

subtotal:{
type:Number,
required:true,
min:0
},

discount:{
type:Number,
default:0,
min:0
},

totalAmount:{
type:Number,
required:true,
min:0
},

paidAmount:{
type:Number,
default:0,
min:0
},

dueAmount:{
type:Number,
default:0,
min:0
},

paymentMethod:{
type:String,
enum:[
"CASH",
"BANK_TRANSFER",
"CARD",
"MOBILE_BANKING",
"DUE"
],
default:"CASH"
},

status:{
type:String,
enum:[
"DRAFT",
"CONFIRMED",
"CANCELLED"
],
default:"DRAFT"
},

createdBy:{
type:String,
default:"SYSTEM",
trim:true
},

confirmedBy:{
type:String,
default:"",
trim:true
},

confirmedAt:{
type:Date,
default:null
}

},{
timestamps:true
});


purchaseSchema.index({
supplier:1,
createdAt:-1
});


module.exports=mongoose.model(
"Purchase",
purchaseSchema
);