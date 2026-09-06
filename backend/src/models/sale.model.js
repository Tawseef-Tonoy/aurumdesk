const mongoose=require("mongoose");

const saleSchema=new mongoose.Schema({

invoiceNumber:{
type:String,
required:true,
unique:true,
trim:true
},

customer:{
type:mongoose.Schema.Types.ObjectId,
ref:"Customer",
required:true
},

salesPerson:{
type:String,
required:true,
trim:true
},

items:[{

jewelryItem:{
type:mongoose.Schema.Types.ObjectId,
ref:"JewelryItem",
required:true
},

itemName:{
type:String,
required:true
},

quantity:{
type:Number,
required:true,
min:1
},

purity:{
type:String,
required:true
},

grossWeight:{
type:Number,
required:true
},

netGoldWeight:{
type:Number,
required:true
},

goldRate:{
type:Number,
required:true
},

goldValue:{
type:Number,
required:true
},

makingCharge:{
type:Number,
default:0
},

stoneCost:{
type:Number,
default:0
},

subtotal:{
type:Number,
required:true
}

}],


goldRateSnapshot:{
type:Number,
required:true
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

vat:{
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
"CARD",
"BANK",
"MOBILE_BANKING",
"DUE"
],
default:"CASH"
},

warrantyTerms:{
type:String,
default:""
},

returnExchangeTerms:{
type:String,
default:""
},

status:{
type:String,
enum:[
"DRAFT",
"CONFIRMED",
"PARTIALLY_PAID",
"FULLY_PAID",
"RETURNED",
"EXCHANGED",
"CANCELLED"
],
default:"DRAFT"
}

},{
timestamps:true
});

saleSchema.index({
customer:1,
status:1,
dueAmount:1,
createdAt:1
});

module.exports=mongoose.model("Sale",saleSchema);