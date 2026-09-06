const mongoose=require("mongoose");

const purchaseItemSchema=new mongoose.Schema({

jewelryItem:{
type:mongoose.Schema.Types.ObjectId,
ref:"JewelryItem",
required:true
},

itemName:{
type:String,
required:true,
trim:true
},

sku:{
type:String,
required:true,
trim:true,
uppercase:true
},

quantity:{
type:Number,
required:true,
min:1
},

purchasePrice:{
type:Number,
required:true,
min:0
},

subtotal:{
type:Number,
required:true,
min:0
}

},{
_id:true
});


module.exports=purchaseItemSchema;