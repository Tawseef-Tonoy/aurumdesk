const mongoose=require("mongoose");


const reopenAuditSchema=new mongoose.Schema({

reopenedBy:{
type:String,
required:true,
trim:true
},

reason:{
type:String,
required:true,
trim:true
},

previousStatus:{
type:String,
required:true,
trim:true
},

reopenedAt:{
type:Date,
default:Date.now
}

},{
_id:false
});



const cashClosingSchema=new mongoose.Schema({

businessDate:{
type:Date,
required:true,
unique:true,
index:true
},


openingCash:{
type:Number,
default:0
},


cashSales:{
type:Number,
default:0
},


dueCollections:{
type:Number,
default:0
},


emiCollections:{
type:Number,
default:0
},


customOrderAdvances:{
type:Number,
default:0
},


otherCashIncome:{
type:Number,
default:0
},


supplierPayments:{
type:Number,
default:0
},


businessExpenses:{
type:Number,
default:0
},


refunds:{
type:Number,
default:0
},


cashDeposits:{
type:Number,
default:0
},


cashWithdrawals:{
type:Number,
default:0
},


totalCashInflow:{
type:Number,
default:0
},


totalCashOutflow:{
type:Number,
default:0
},


expectedClosingCash:{
type:Number,
default:0
},


actualClosingCash:{
type:Number,
default:0
},


cashDifference:{
type:Number,
default:0
},


differenceExplanation:{
type:String,
default:""
},



preparedBy:{
type:String,
default:""
},

preparedAt:{
type:Date,
default:null
},


submittedBy:{
type:String,
default:""
},

submittedAt:{
type:Date,
default:null
},


approvedBy:{
type:String,
default:""
},

approvedAt:{
type:Date,
default:null
},



status:{
type:String,
enum:[
"OPEN",
"PREPARED",
"SUBMITTED",
"APPROVED",
"REOPENED"
],
default:"OPEN"
},


reopenHistory:{
type:[reopenAuditSchema],
default:[]
}


},{
timestamps:true
});


module.exports=
mongoose.model(
"CashClosing",
cashClosingSchema
);